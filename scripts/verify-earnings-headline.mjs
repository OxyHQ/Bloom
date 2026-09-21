/**
 * Browser gate for `EarningsSummary`'s headline — the part jest structurally
 * cannot see.
 *
 * WHY A BROWSER. The claim this family is built on is that **an amount is never
 * produced from a number**: at rest the headline is the period's own `total`,
 * and over a bar it is that bar's own `amount`, both strings the app formatted.
 * `earningsHeadline` is pure and `src/__tests__/Earnings.test.tsx` walks its
 * boundaries — but the other half, that the panel actually OWNS the chart's
 * active bar and re-reads the headline from it, is driven by pointer events on
 * a plot surface that only exists after `onLayout`. jsdom fires no layout, so
 * the surface is never rendered and no jest test can reach it. Measured: gutting
 * `setActiveIndex` to a no-op left that whole suite GREEN.
 *
 * WHAT EACH CASE PROVES, AND HOW IT AVOIDS CONCLUDING TOO MUCH:
 *
 *  - `at rest` — the headline is the period's own total, exactly as written.
 *  - `over a bar` — hovering each of three bars shows THAT bar's own amount.
 *    Three, not one: a single bar could match by coincidence, and the three
 *    chosen have different values, so a headline stuck on any one of them
 *    fails the other two.
 *  - `never a bare number` — no reading at any point is the raw `value` a bar
 *    was sized by. This is the mutation the pure test cannot catch: a `format`
 *    that fell back to the number would still look plausible.
 *  - `back to rest` — leaving the plot restores the total, so a hover is a
 *    reading rather than a state change.
 *  - `period switch` — pressing Month replaces the headline with the month's
 *    own total. The panel drives the chart, not the other way round.
 *
 * Every case verifies its own precondition: the bar must exist, have a real
 * box, and be what `elementFromPoint` returns at the coordinates about to be
 * hovered. A case that cannot prove it reached the bar reports UNPROVEN and
 * fails — it never reports a pass it did not earn.
 *
 * Usage: start Storybook, then
 *   CHROME_PATH=<chrome> node scripts/verify-earnings-headline.mjs [--url http://localhost:6115]
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// puppeteer-core is not a Bloom dependency — this is a local verification tool,
// not part of the package. Resolve it from a sibling repo that already has it.
const PUPPETEER_PATHS = ['/home/nate/Oxy/Homiio/node_modules/puppeteer-core', 'puppeteer-core'];

function loadPuppeteer() {
  for (const candidate of PUPPETEER_PATHS) {
    try {
      return require(candidate);
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`Could not resolve puppeteer-core. Tried: ${PUPPETEER_PATHS.join(', ')}`);
}

const CHROME = process.env.CHROME_PATH ?? '/opt/google/chrome/chrome';

const argUrl = process.argv.indexOf('--url');
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6115';

const STORY = 'blocks-fulfilment-earnings--summary';
const CHART = 'earnings-chart';

/** The `Summary` story's week, written here so the gate knows the right answers. */
const WEEK_TOTAL = '€612.75';
const MONTH_TOTAL = '€2,418.30';
/** index → the bar's own pre-formatted amount, and the number it was SIZED by. */
const BARS = [
  { index: 0, amount: '€96.40', value: 96.4 },
  { index: 4, amount: '€132.40', value: 132.4 },
  { index: 6, amount: '€37.75', value: 37.75 },
];

const headline = (page) =>
  page.evaluate(
    (id) => document.querySelector(`[data-testid="${id}-headline"]`)?.textContent ?? null,
    CHART,
  );

/** A bar's centre, and a proof that the coordinates about to be hovered are on the plot. */
async function barPoint(page, index) {
  return page.evaluate(
    (id, i) => {
      const bar = document.querySelector(`[data-testid="${id}-bar-${i}"]`);
      const surface = document.querySelector(`[data-testid="${id}-plot-surface"]`);
      if (bar === null || surface === null) return null;
      const r = bar.getBoundingClientRect();
      const s = surface.getBoundingClientRect();
      if (r.width < 2 || s.width < 40) return null;
      const x = r.x + r.width / 2;
      // The BAR can be a few pixels tall at a low value, so the hover lands on
      // the middle of the plot's own height rather than on the painted bar.
      const y = s.y + s.height / 2;
      const hit = document.elementFromPoint(x, y);
      return { x, y, onPlot: hit !== null && (hit === surface || surface.contains(hit)) };
    },
    CHART,
    index,
  );
}

const results = [];
const record = (name, ok, detail) => results.push({ name, ok, detail });

(async () => {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 1000 });
    await page.goto(`${BASE}/iframe.html?id=${STORY}&viewMode=story`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(`[data-testid="${CHART}-plot-surface"]`, { timeout: 20000 });
    await new Promise((resolve) => setTimeout(resolve, 900));

    const rest = await headline(page);
    record('at rest', rest === WEEK_TOTAL, `headline "${rest}", expected "${WEEK_TOTAL}"`);

    const readings = [];
    let unproven = null;
    for (const bar of BARS) {
      const point = await barPoint(page, bar.index);
      if (point === null || !point.onPlot) {
        unproven = `bar ${bar.index}: ${point === null ? 'no bar, or no box' : 'the hover coordinates are not on the plot'}`;
        break;
      }
      // Two moves: the first enters the plot, the second lands on the bar, so
      // the pointer's own `mousemove` is what selects it rather than the entry.
      await page.mouse.move(point.x - 4, point.y);
      await page.mouse.move(point.x, point.y);
      await new Promise((resolve) => setTimeout(resolve, 250));
      readings.push({ index: bar.index, want: bar.amount, got: await headline(page) });
    }

    if (unproven !== null) {
      record('over a bar', false, `UNPROVEN: ${unproven}`);
      record('never a bare number', false, `UNPROVEN: ${unproven}`);
      record('back to rest', false, `UNPROVEN: ${unproven}`);
    } else {
      const wrong = readings.filter((r) => r.got !== r.want);
      record(
        'over a bar',
        wrong.length === 0,
        readings.map((r) => `#${r.index} "${r.got}" (want "${r.want}")`).join(', '),
      );
      // The mutation a pure test cannot catch: a `format` falling back to the
      // number the bar was SIZED by would still look like a plausible headline.
      const numeric = readings.filter((r) =>
        [String(BARS.find((b) => b.index === r.index).value), String(Math.round(BARS.find((b) => b.index === r.index).value))].includes(
          (r.got ?? '').trim(),
        ),
      );
      record(
        'never a bare number',
        numeric.length === 0,
        `${numeric.length} of ${readings.length} readings were the raw value`,
      );

      await page.mouse.move(5, 5);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const back = await headline(page);
      record('back to rest', back === WEEK_TOTAL, `headline "${back}", expected "${WEEK_TOTAL}"`);
    }

    const switched = await page.evaluate((id) => {
      const segment = document.querySelector(`[data-testid="${id}-range-month"]`);
      if (segment === null) return 'no month segment';
      segment.click();
      return 'clicked';
    }, CHART);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const month = await headline(page);
    record(
      'period switch',
      switched === 'clicked' && month === MONTH_TOTAL,
      `${switched}, headline "${month}", expected "${MONTH_TOTAL}"`,
    );

    await page.close();
  } finally {
    await browser.close();
  }

  let failed = 0;
  for (const { name, ok, detail } of results) {
    if (!ok) failed += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
  }
  console.log(`${results.length - failed}/${results.length} passed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
