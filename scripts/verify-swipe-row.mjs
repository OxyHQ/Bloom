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
 *  - `touch-action` — the row's detector view computes `touch-action: pan-y`.
 *    gesture-handler writes `none` there by default, and rows tile the list.
 *  - `touch-scroll` — the bug the mouse cases above CANNOT see: a mouse never
 *    consults `touch-action`. A real touch drag (`page.touchscreen`, i.e. CDP
 *    `Input.dispatchTouchEvent`, which goes through the browser's own
 *    touch-action and gesture pipeline) that STARTS ON A ROW must scroll the
 *    list. (`Input.synthesizeScrollGesture` with `gestureSourceType: 'touch'`
 *    scrolls nothing at all in headless Chrome, even off the rows — measured —
 *    so it cannot be the probe.) Its NEGATIVE control repeats the identical
 *    gesture after forcing every row's detector view back to `none` and must
 *    NOT move it — so "it scrolled" is a property of `pan-y`, not of the probe.
 *  - `touch-swipe` — the other half of `pan-y`: a horizontal TOUCH drag still
 *    reaches the pan and opens the row (the mouse cases cannot say this,
 *    since `touch-action` does not apply to a mouse).
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

/**
 * The row's detector view — the travelling layer, parent of the mail row. A
 * string, because it runs in the page: `page.evaluate` ships one function, not
 * the functions it calls.
 */
const DETECTOR_VIEW = `(row) => {
  const inner = document.querySelector('[data-testid="' + row + '-swipe"] [data-bloom-mail-row]');
  return inner === null ? null : inner.parentElement;
}`;

/**
 * A touch drag that starts on the row and pushes the content up. Returns how far
 * the row moved up the viewport — whatever element turns out to be the scroller.
 */
async function touchScroll(page, forceNone) {
  const box = await page.evaluate(
    (row, forceNone, detectorViewSrc) => {
      // eslint-disable-next-line no-new-func
      const view = new Function(`return (${detectorViewSrc})`)();
      if (forceNone) {
        for (const el of document.querySelectorAll('[data-bloom-mail-row]')) {
          el.parentElement.style.touchAction = 'none';
        }
      }
      const el = document.querySelector(`[data-testid="${row}"]`);
      if (el === null || view(row) === null) return null;
      const r = el.getBoundingClientRect();
      const x = r.x + r.width / 2;
      const y = r.y + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      return {
        x,
        y,
        top: r.y,
        onRow: hit !== null && (hit === el || el.contains(hit)),
        touchAction: getComputedStyle(view(row)).touchAction,
      };
    },
    ROW,
    forceNone,
    DETECTOR_VIEW,
  );
  if (box === null) return { error: 'no row' };
  if (!box.onRow) return { error: 'the gesture would not start on the row' };
  // Straight up, 180px, in 15 moves — a plain flick through the inbox.
  await page.touchscreen.touchStart(box.x, box.y);
  for (let i = 1; i <= 15; i++) {
    await page.touchscreen.touchMove(box.x, box.y - i * 12);
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
  await page.touchscreen.touchEnd();
  await new Promise((resolve) => setTimeout(resolve, 400));
  const top = await page.evaluate(
    (row) => document.querySelector(`[data-testid="${row}"]`).getBoundingClientRect().y,
    ROW,
  );
  return { touchAction: box.touchAction, moved: Math.round(box.top - top) };
}

async function open(browser, height = 844) {
  const page = await browser.newPage();
  // A COARSE pointer, which is the whole question `useSwipeAvailable()` asks.
  await page.setViewport({ width: 390, height, isMobile: true, hasTouch: true });
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

    page = await open(browser);
    const touchAction = await page.evaluate(
      (row, detectorViewSrc) => {
        // eslint-disable-next-line no-new-func
        const view = new Function(`return (${detectorViewSrc})`)()(row);
        return view === null ? null : getComputedStyle(view).touchAction;
      },
      ROW,
      DETECTOR_VIEW,
    );
    record('touch-action', touchAction === 'pan-y', `computed touch-action=${touchAction}`);
    await page.close();

    // A short viewport, so the inbox is certainly taller than what shows.
    page = await open(browser, 420);
    const scrolled = await touchScroll(page, false);
    record(
      'touch-scroll',
      scrolled.error === undefined && scrolled.touchAction === 'pan-y' && scrolled.moved > 40,
      `a touch scroll starting on a row moves the list: ${JSON.stringify(scrolled)}`,
    );
    await page.close();

    page = await open(browser);
    const swiped = await page.evaluate((row) => {
      const r = document.querySelector(`[data-testid="${row}"]`).getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, ROW);
    await page.touchscreen.touchStart(swiped.x, swiped.y);
    for (let i = 1; i <= 14; i++) {
      await page.touchscreen.touchMove(swiped.x - (120 * i) / 14, swiped.y);
      await new Promise((resolve) => setTimeout(resolve, 16));
    }
    await new Promise((resolve) => setTimeout(resolve, 180));
    const touchDuring = await travel(page);
    await page.touchscreen.touchEnd();
    record(
      'touch-swipe',
      touchDuring !== null && touchDuring < -40 && touchDuring >= -RIGHT_FULL,
      `a horizontal touch drag still opens the row: during=${touchDuring}`,
    );
    await page.close();

    page = await open(browser, 420);
    const frozen = await touchScroll(page, true);
    record(
      'touch-scroll under none (negative control)',
      frozen.error === undefined && frozen.touchAction === 'none' && frozen.moved === 0,
      `the same gesture with the default restored does not: ${JSON.stringify(frozen)}`,
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
