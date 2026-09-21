/**
 * Browser gate for `SignaturePad` — the part jest structurally cannot see.
 *
 * WHY A BROWSER. A signature is INK ON A SURFACE. react-native-svg renders to a
 * native view on one platform and to a `<path>` on the other, and jsdom paints
 * neither, so `src/__tests__/ProofOfDelivery.test.tsx` can pin the geometry
 * (`signaturePath` is pure and every boundary is reachable) and cannot pin the
 * one property the component exists for: that moving a pointer across the pad
 * lays ink down. That is measured here, off the emitted `<path d>`, under real
 * pointer events routed through the browser's own hit testing
 * (`page.mouse.down/move/up`), never a synthetic event or a handler called by
 * hand.
 *
 * WHAT EACH CASE PROVES, AND HOW IT AVOIDS CONCLUDING TOO MUCH:
 *
 *  - `draws` — a dragged pointer leaves a path whose data is PROPORTIONAL to
 *    the movement: it must contain a quadratic (the midpoint smoothing) and
 *    span most of the distance dragged. "A path exists" is not enough — the
 *    baseline is a `<line>`, and a zero-length `d` is still an element.
 *  - `inside-the-pad` — the coordinates the path records are the PAD's, not the
 *    page's. Every point must land inside the pad's own box. This is the one
 *    case that would catch `locationX` being measured against the wrong node,
 *    which is invisible until the page is scrolled or the pad is inset.
 *  - `two-strokes` — releasing and drawing again appends a SECOND path rather
 *    than joining the two, so a signature with a lifted pen is not one
 *    continuous line across the gap.
 *  - `tap` — a press with no movement still leaves a dot. This is the case the
 *    2px sample threshold could silently eat.
 *  - `clear` — the control removes the ink and the pad goes back to saying it
 *    is unsigned.
 *  - `disabled` (the NEGATIVE control) — the identical drag on a disabled pad
 *    leaves nothing. It runs beside four cases that DO draw through the same
 *    path, so "nothing happened" cannot be a broken probe reporting a pass.
 *
 * Every case verifies its own precondition: the pad must exist, have a real
 * box, and be what `elementFromPoint` returns at the coordinates about to be
 * pressed. A case that cannot prove it grabbed the pad reports UNPROVEN and
 * fails — it never reports a pass it did not earn.
 *
 * Usage: start Storybook, then
 *   CHROME_PATH=<chrome> node scripts/verify-signature-pad.mjs [--url http://localhost:6115]
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

const STORY = 'blocks-fulfilment-proofofdelivery--signature';
const DISABLED_STORY = 'blocks-fulfilment-proofofdelivery--disabled';
const PAD = 'pad-pad';
const DISABLED_PAD = 'pod-signature-pad';

/** The pad's box, and a proof that the coordinates about to be pressed are on it. */
async function padBox(page, pad) {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (el === null) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 80 || r.height < 60) return null;
    const x = r.x + r.width * 0.25;
    const y = r.y + r.height * 0.5;
    const hit = document.elementFromPoint(x, y);
    return {
      left: r.x,
      top: r.y,
      width: r.width,
      height: r.height,
      x,
      y,
      onPad: hit !== null && (hit === el || el.contains(hit)),
    };
  }, pad);
}

/** Every ink path inside the pad, as its `d` — the baseline is a `<line>`, not a path. */
async function ink(page, pad) {
  return page.evaluate(
    (id) =>
      Array.from(document.querySelectorAll(`[data-testid="${id}"] path`))
        .map((node) => node.getAttribute('d') ?? '')
        .filter((d) => d !== ''),
    pad,
  );
}

/** Every coordinate pair in a `d`, as numbers. */
function pointsOf(d) {
  const out = [];
  for (const match of d.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)) {
    out.push([Number(match[1]), Number(match[2])]);
  }
  return out;
}

async function drag(page, box, dx, dy, steps = 16) {
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(box.x + (dx * i) / steps, box.y + (dy * i) / steps);
    await new Promise((resolve) => setTimeout(resolve, 12));
  }
  await new Promise((resolve) => setTimeout(resolve, 60));
  await page.mouse.up();
  await new Promise((resolve) => setTimeout(resolve, 120));
}

async function open(browser, story) {
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 900 });
  await page.goto(`${BASE}/iframe.html?id=${story}&viewMode=story`, { waitUntil: 'networkidle0' });
  await new Promise((resolve) => setTimeout(resolve, 600));
  return page;
}

const results = [];
const record = (name, ok, detail) => results.push({ name, ok, detail });

(async () => {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    // --- draws, inside-the-pad -------------------------------------------
    let page = await open(browser, STORY);
    let box = await padBox(page, PAD);
    if (box === null || !box.onPad) {
      record('draws', false, `UNPROVEN: ${box === null ? 'no pad, or no box' : 'the press coordinates are not on the pad'}`);
      record('inside-the-pad', false, 'UNPROVEN: could not grab the pad');
    } else {
      const travel = Math.round(box.width * 0.5);
      await drag(page, box, travel, -40);
      const paths = await ink(page, PAD);
      const d = paths[0] ?? '';
      const points = pointsOf(d);
      const xs = points.map(([x]) => x);
      const span = xs.length > 0 ? Math.max(...xs) - Math.min(...xs) : 0;
      record(
        'draws',
        paths.length === 1 && d.includes('Q') && span > travel * 0.6,
        `${paths.length} path(s), ${points.length} points, x span ${Math.round(span)} of ${travel} dragged, smoothed=${d.includes('Q')}`,
      );
      const outside = points.filter(
        ([x, y]) => x < -1 || y < -1 || x > box.width + 1 || y > box.height + 1,
      );
      record(
        'inside-the-pad',
        points.length > 0 && outside.length === 0,
        `${points.length} points, ${outside.length} outside the ${Math.round(box.width)}×${Math.round(box.height)} pad`,
      );
    }
    await page.close();

    // --- two-strokes, clear ----------------------------------------------
    page = await open(browser, STORY);
    box = await padBox(page, PAD);
    if (box === null || !box.onPad) {
      record('two-strokes', false, 'UNPROVEN: could not grab the pad');
      record('clear', false, 'UNPROVEN: could not grab the pad');
    } else {
      await drag(page, box, 80, -30);
      await drag(page, { ...box, x: box.x + 140 }, 60, 30);
      const paths = await ink(page, PAD);
      record('two-strokes', paths.length === 2, `${paths.length} path(s) after two drags`);

      const cleared = await page.evaluate(() => {
        const button = document.querySelector('[data-testid="pad-clear"]');
        if (button === null) return 'no clear control';
        button.click();
        return 'clicked';
      });
      // POLLED, not slept. A single read after a fixed wait raced React's
      // commit on a cold page and reported a FALSE FAIL — a script that can
      // report a failure it did not earn is as useless as one that reports a
      // pass it did not earn.
      const label = await page
        .waitForFunction(
          (id) =>
            document.querySelector(`[data-testid="${id}"]`)?.getAttribute('aria-label') ===
            'Signature'
              ? 'Signature'
              : false,
          { timeout: 5000 },
          PAD,
        )
        .then((handle) => handle.jsonValue())
        .catch(async () =>
          page.evaluate(
            (id) =>
              document.querySelector(`[data-testid="${id}"]`)?.getAttribute('aria-label') ?? null,
            PAD,
          ),
        );
      const after = await ink(page, PAD);
      record(
        'clear',
        cleared === 'clicked' && after.length === 0 && label === 'Signature',
        `${cleared}, ${after.length} path(s) left, pad says "${label}"`,
      );
    }
    await page.close();

    // --- tap --------------------------------------------------------------
    page = await open(browser, STORY);
    box = await padBox(page, PAD);
    if (box === null || !box.onPad) {
      record('tap', false, 'UNPROVEN: could not grab the pad');
    } else {
      await page.mouse.move(box.x, box.y);
      await page.mouse.down();
      await new Promise((resolve) => setTimeout(resolve, 80));
      await page.mouse.up();
      await new Promise((resolve) => setTimeout(resolve, 200));
      const paths = await ink(page, PAD);
      record(
        'tap leaves a dot',
        paths.length === 1 && paths[0].includes('l0 0'),
        `${paths.length} path(s): ${JSON.stringify(paths[0] ?? null)}`,
      );
    }
    await page.close();

    // --- disabled (the negative control) ----------------------------------
    page = await open(browser, DISABLED_STORY);
    box = await padBox(page, DISABLED_PAD);
    if (box === null || !box.onPad) {
      record('disabled (negative control)', false, 'UNPROVEN: could not grab the disabled pad');
    } else {
      await drag(page, box, Math.round(box.width * 0.5), -40);
      const paths = await ink(page, DISABLED_PAD);
      record(
        'disabled (negative control)',
        paths.length === 0,
        `${paths.length} path(s) after the identical drag`,
      );
    }
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
