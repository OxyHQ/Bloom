/**
 * Browser gate for `SwipeRow` — the part jest structurally cannot see.
 *
 * WHY A BROWSER. The reanimated mock has no UI thread: `useAnimatedStyle`'s
 * mapper runs at RENDER, and a shared value written by a gesture worklet with
 * no accompanying render is invisible to it. So `src/__tests__/SwipeRow.test.tsx`
 * can pin the DECISIONS — the commit fraction, the tap slop, which side opens —
 * and cannot pin the one property the component exists for: that the row TRAVELS
 * with the finger and uncovers what is behind it. That is measured here, off
 * `getComputedStyle(...).transform` of the moving layer, under real pointer
 * events routed through the browser's own hit testing (`page.mouse.down/move`),
 * never a synthetic event or a handler called by hand.
 *
 * WHAT EACH CASE PROVES, AND HOW IT AVOIDS CONCLUDING TOO MUCH:
 *
 *  - `mounts` — under a COARSE pointer the row wraps itself in a swipe with no
 *    prop asked of the app (`useSwipeAvailable()`). The story forces nothing;
 *    the pointer type is emulated by the viewport, which is what Chrome reads
 *    `(pointer: coarse)` off.
 *  - `left` / `right` — the row moves the way it was dragged, and is CLAMPED to
 *    the pane's full width (an unclamped row would slide off its own list).
 *  - `diagonal` — the NEGATIVE control, and it is DIAGONAL on purpose. A drag
 *    straight down proves nothing (`changeX` is 0, so the row would sit still
 *    even with no vertical guard at all — measured); a drag that is mostly
 *    vertical with real sideways travel is the scroll that must NOT become a
 *    swipe. "It did not move" is also what a broken probe reports, which is why
 *    it runs beside two cases that DO move through the identical path.
 *  - `springs-back` — released under the commit fraction, the row returns to 0.
 *    Measured after the snap, so it also proves the snap runs at all.
 *
 * Every case verifies its own precondition: the row must exist, have a real
 * box, and be what `elementFromPoint` returns at the coordinates about to be
 * pressed. A case that cannot prove it grabbed the row reports UNPROVEN and
 * fails — it never reports a pass it did not earn.
 *
 * Usage: start Storybook, then
 *   CHROME_PATH=<chrome> node scripts/verify-swipe-row.mjs [--url http://localhost:6006]
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
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6006';

const STORY = 'blocks-mail-mail-list--inbox';
const ROW = 'inbox-mail-lunch';
/** Two actions on the right, one on the left, at the family's 76 per action. */
const RIGHT_FULL = 152;
const LEFT_FULL = 76;

/** The x of the moving layer's transform, in CSS pixels. */
async function travel(page) {
  return page.evaluate((row) => {
    const inner = document.querySelector(`[data-testid="${row}-swipe"] [data-bloom-mail-row]`);
    if (inner === null) return null;
    const matrix = getComputedStyle(inner.parentElement).transform;
    if (matrix === 'none') return 0;
    const parts = matrix.match(/matrix\(([^)]+)\)/);
    return parts === null ? null : Math.round(Number(parts[1].split(',')[4]));
  }, ROW);
}

/**
 * Press the row and move the pointer. Returns the travel at the end of the
 * drag, and again after the release has settled.
 */
async function drag(page, dx, dy) {
  const box = await page.evaluate((row) => {
    const el = document.querySelector(`[data-testid="${row}"]`);
    if (el === null) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 20) return null;
    const x = r.x + r.width / 2;
    const y = r.y + r.height / 2;
    // The precondition: the coordinates about to be pressed are ON the row.
    const hit = document.elementFromPoint(x, y);
    return { x, y, onRow: hit !== null && (hit === el || el.contains(hit)) };
  }, ROW);
  if (box === null) return { error: 'no row, or no box' };
  if (!box.onRow) return { error: 'the press coordinates are not on the row' };

  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(box.x + (dx * i) / steps, box.y + (dy * i) / steps);
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
  await new Promise((resolve) => setTimeout(resolve, 180));
  const during = await travel(page);
  await page.mouse.up();
  await new Promise((resolve) => setTimeout(resolve, 400));
  const after = await travel(page);
  return { during, after };
}

async function open(browser) {
  const page = await browser.newPage();
  // A COARSE pointer, which is the whole question `useSwipeAvailable()` asks.
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/iframe.html?id=${STORY}&viewMode=story`, { waitUntil: 'networkidle0' });
  await page.waitForSelector(`[data-testid="${ROW}"]`, { timeout: 20000 });
  await new Promise((resolve) => setTimeout(resolve, 400));
  return page;
}

const results = [];
const record = (name, ok, detail) => results.push({ name, ok, detail });

(async () => {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    let page = await open(browser);

    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    const wrapped = await page.evaluate(
      (row) => document.querySelector(`[data-testid="${row}-swipe"]`) !== null,
      ROW,
    );
    record(
      'mounts',
      coarse && wrapped,
      `pointer coarse=${coarse}, swipe wrapper=${wrapped} (no swipeEnabled prop in the story)`,
    );
    await page.close();

    page = await open(browser);
    const left = await drag(page, -120, 0);
    record(
      'left',
      left.error === undefined && left.during < -40 && left.during >= -RIGHT_FULL,
      JSON.stringify(left),
    );
    await page.close();

    page = await open(browser);
    const right = await drag(page, 200, 0);
    record(
      'right',
      right.error === undefined && right.during === LEFT_FULL,
      `clamped to the pane: ${JSON.stringify(right)}`,
    );
    await page.close();

    page = await open(browser);
    const diagonal = await drag(page, 45, 170);
    record(
      'diagonal (negative control)',
      diagonal.error === undefined && diagonal.during === 0,
      JSON.stringify(diagonal),
    );
    await page.close();

    page = await open(browser);
    // Past the tap slop, under 40% of the 152 pane: it must spring back.
    const short = await drag(page, -40, 0);
    record(
      'springs-back',
      short.error === undefined && short.during < 0 && short.after === 0,
      JSON.stringify(short),
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
