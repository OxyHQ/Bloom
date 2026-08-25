/**
 * Browser gate for the media flight layer's MOTION.
 *
 * Jest cannot see this class of bug and never will. Every reanimated animation
 * resolves synchronously under the test mock, so a mapper that runs once and
 * freezes at the opening frame and a mapper that animates correctly produce the
 * same tree — and the frozen one is the documented failure mode of this package
 * on web, where without the react-native-worklets babel plugin reanimated drives
 * a mapper off its DEPENDENCY ARRAY rather than off the reads it detects. It has
 * bitten Bloom three times (`BottomSheetBase`, `ConnectionDots`/`AnimatedCheck`,
 * the media gallery). `src/__tests__/animated-style-deps.test.ts` is the static
 * half; this is the half that watches it move.
 *
 * What it measures, and why in this currency:
 *
 *  - The flying surface's own `getBoundingClientRect`, sampled over time. Not a
 *    style, not a class: where the browser actually painted the box. A frozen
 *    mapper never leaves the origin rect, and a mapper wired to the wrong shared
 *    value jumps straight to the destination — this tells all three apart.
 *  - It asserts the surface ARRIVES on the destination anchor's rect, so a
 *    flight that animates prettily to the wrong place fails.
 *  - It runs headful on a real X display with
 *    `prefers-reduced-motion: no-preference`, because headless Chrome reports
 *    `reduce` and would skip the animation this exists to observe.
 *
 * Usage: start Storybook, then
 *   node scripts/verify-media-flight.mjs [--url http://localhost:6006]
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// puppeteer-core is not a Bloom dependency — this is a local verification tool,
// not part of the package. Resolve it from a sibling repo that already has it.
const PUPPETEER_PATHS = [
  '/home/nate/Oxy/Homiio/node_modules/puppeteer-core',
  'puppeteer-core',
];

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

// The packaged Chrome binary. The `chromium` wrapper on this machine SIGTRAPs,
// so the real Chrome build is the one to launch.
const CHROME = process.env.CHROME_PATH ?? '/opt/google/chrome/chrome';

const argUrl = process.argv.indexOf('--url');
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6006';
const STORY = 'overlays-mediaflight--fly-to-and-back';
/** Mounts the layer AND a button under it, with no flight ever started. */
const IDLE_STORY = 'overlays-mediaflight--click-through';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * The rect of the surface the LAYER is painting.
 *
 * Identified by where it lives rather than by a testID: everything inside
 * `#bloom-portal-root` belongs to a portaled surface, and in this story the only
 * portaled thing is the flight. Asking for the `<img>` in there is asking for
 * the picture the layer put on screen — which is the thing whose position is
 * under test, not a wrapper that might be positioned correctly around a child
 * that is not.
 */
async function flyingRect(page) {
  return page.evaluate(() => {
    const root = document.getElementById('bloom-portal-root');
    const img = root?.querySelector('img');
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  });
}

async function testIdRect(page, testId) {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  }, testId);
}

async function clickTestId(page, testId) {
  const r = await testIdRect(page, testId);
  if (!r) return false;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  return true;
}

const near = (a, b, tolerance = 4) => Math.abs(a - b) <= tolerance;

/**
 * Rect equality on ALL FOUR fields, which is the only axis-agnostic way to ask
 * "is it still where it started".
 *
 * Written this way because the first version of this script compared `x` and
 * `width` — and this story's flight grows straight DOWN, so both were 320 at
 * every moment and a perfectly animating surface read as frozen. A gate that
 * picks an axis is a gate that measures the story rather than the mechanism.
 */
const sameRect = (a, b, tolerance = 2) =>
  near(a.x, b.x, tolerance) &&
  near(a.y, b.y, tolerance) &&
  near(a.width, b.width, tolerance) &&
  near(a.height, b.height, tolerance);

const area = (r) => r.width * r.height;

function report(failures, condition, message) {
  if (!condition) failures.push(message);
}

/**
 * THE IDLE CASE, which no flight test can reach.
 *
 * `<MediaFlightLayer>` lives at an app's root for the whole life of the process,
 * so it is idle almost always. A full-viewport box emitted while idle swallows
 * every tap in the app — not just media taps — and the app renders perfectly
 * while being completely dead.
 *
 * The existing "does not steal the click" case in
 * `verify-overlay-stacking.mjs` cannot see this: it starts a flight first, so it
 * is blind to the state where there is none. Asked in the currency the symptom
 * arrives in — `document.elementFromPoint` — plus the structural question
 * underneath it, which is whether the layer put anything in the portal at all.
 */
async function checkIdle(page, failures) {
  await page.goto(`${BASE}/iframe.html?id=${IDLE_STORY}&viewMode=story`, {
    waitUntil: 'networkidle0',
  });
  await page.waitForSelector('[data-testid="top-action"]', { timeout: 20000 });

  const idle = await page.evaluate(() => {
    const button = document.querySelector('[data-testid="top-action"]');
    const r = button.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const portalRoot = document.getElementById('bloom-portal-root');
    const describe = (node) => {
      if (!node) return '<nothing>';
      const cs = getComputedStyle(node);
      return `${node.tagName.toLowerCase()} pos=${cs.position} z=${cs.zIndex} pe=${cs.pointerEvents}`;
    };
    return {
      buttonHasBox: r.width > 0 && r.height > 0,
      reachable: hit ? button.contains(hit) || button === hit : false,
      hit: describe(hit),
      portalChildren: portalRoot ? portalRoot.querySelectorAll('*').length : 0,
    };
  });

  // Vacuity floor: if the button had no box, "unreachable" would be true for a
  // reason that has nothing to do with the layer.
  report(failures, idle.buttonHasBox, 'idle: the button under test has no box');
  report(
    failures,
    idle.portalChildren === 0,
    `idle: the layer parked ${idle.portalChildren} element(s) in the portal with NO flight live`,
  );
  report(
    failures,
    idle.reachable,
    `idle: a control under the idle layer is not reachable — elementFromPoint returned ${idle.hit}`,
  );
}

async function main() {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    // Headful on the real X display: a genuinely foregrounded tab, so rAF runs
    // at full rate and the animation actually happens.
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });
  const failures = [];

  try {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ]);
    // The idle case first: it is the state the layer spends its life in, and it
    // loads its own story (one that mounts the layer and never flies anything).
    await checkIdle(page, failures);

    await page.goto(`${BASE}/iframe.html?id=${STORY}&viewMode=story`, {
      waitUntil: 'networkidle0',
    });
    await page.waitForSelector('[data-testid="flight-thumb"]', { timeout: 20000 });

    const thumb = await testIdRect(page, 'flight-thumb');
    report(failures, thumb !== null, 'the origin thumbnail has no box');

    // Vacuity floor: nothing is flying before the tap, so a later "it is at the
    // destination" cannot be a stale reading of something already there.
    report(failures, (await flyingRect(page)) === null, 'a surface was already flying before the tap');

    if (!(await clickTestId(page, 'flight-thumb'))) {
      failures.push('the origin thumbnail was not clickable');
      throw new Error('cannot continue');
    }

    // Sample DURING the flight. The web leg is a 300 ms timing curve, so a
    // sample around a third of the way in is well clear of both ends.
    await sleep(90);
    const midway = await flyingRect(page);
    await sleep(500);
    const landed = await flyingRect(page);

    report(failures, midway !== null, 'nothing was painted during the flight');
    report(failures, landed !== null, 'nothing was painted after the flight');

    if (midway && landed && thumb) {
      // Vacuity floor for the two assertions below: "midway is between them" is
      // vacuous if the two ends are the same place.
      report(
        failures,
        !sameRect(thumb, landed),
        `origin and destination are the same rect, so nothing here measures anything: ${JSON.stringify(thumb)}`,
      );
      // A FROZEN mapper sits on the origin rect forever. This is the assertion
      // the whole script exists for.
      report(
        failures,
        !sameRect(midway, thumb),
        `the surface never left the origin (frozen mapper): midway=${JSON.stringify(midway)} origin=${JSON.stringify(thumb)}`,
      );
      // …and a mapper reading the wrong value SNAPS. Midway must be between the
      // two, not already at the end.
      report(
        failures,
        !sameRect(midway, landed),
        `the surface snapped instead of animating: midway=${JSON.stringify(midway)} landed=${JSON.stringify(landed)}`,
      );
      report(
        failures,
        area(landed) > area(thumb),
        `the surface did not grow: origin ${JSON.stringify(thumb)}, landed ${JSON.stringify(landed)}`,
      );
    }

    // It arrives WHERE IT WAS SENT. A flight that animates beautifully to the
    // wrong rect passes every assertion above.
    const target = await page.evaluate(() => {
      // The dashed destination box is the only element with a dashed border.
      const all = [...document.querySelectorAll('div')];
      const box = all.find((el) => getComputedStyle(el).borderStyle === 'dashed');
      if (!box) return null;
      const r = box.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    });
    report(failures, target !== null, 'the destination box was not found');
    if (target && landed) {
      report(
        failures,
        near(landed.x, target.x) && near(landed.y, target.y) &&
          near(landed.width, target.width) && near(landed.height, target.height),
        `landed on the wrong rect: landed=${JSON.stringify(landed)} target=${JSON.stringify(target)}`,
      );
    }

    // Flying back releases the surface: the layer must not leave a picture
    // parked over the app forever.
    await clickTestId(page, 'flight-back');
    await sleep(900);
    report(failures, (await flyingRect(page)) === null, 'the surface was not released after flyBack');
  } finally {
    await browser.close();
  }

  for (const failure of failures) console.log(`FAIL  ${failure}`);
  if (failures.length === 0) {
    console.log('PASS  idle layer contributes no node and steals no click');
    console.log('PASS  media flight animates from the origin to the destination and releases');
  }
  process.exitCode = failures.length === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
