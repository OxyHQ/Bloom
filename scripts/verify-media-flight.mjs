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
/** Flies a warm poster and a cold one, so paint latency can be timed. */
const PAINT_STORY = 'overlays-mediaflight--paint-latency';

/**
 * How long a WARM flight may take to put pixels on screen after `flyTo`
 * resolves, in ms. Measured at 1–5 ms; the ceiling is generous because the
 * property is "a frame or two", not a number.
 */
const WARM_PAINT_BUDGET_MS = 150;

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

/**
 * `flyTo` RESOLVES ON COMMIT — SO COMMIT HAD BETTER BE A FRAME.
 *
 * The promise deliberately does not wait for a decode: waiting would put the
 * decode in front of the user's tap. That trade is only sound if a surface whose
 * poster is already in the image cache paints essentially immediately. Measured:
 * warm 1–5 ms, cold (same file, cache-busted) 514–898 ms. So the transition
 * stands or falls on the poster being WARM, and this is the assertion that keeps
 * Bloom's half of that true — no re-fetch, no fade, `transition={0}`.
 *
 * The consuming app that prompted this turned out to have a WARM poster already
 * (it paints the still itself with expo-image rather than relying on
 * expo-video's absent `poster` attribute), and the ~350 ms "hole" it reported
 * was an artifact of counting `requestVideoFrameCallback` — which fires only for
 * decoded VIDEO, so a flight covered by its poster reads as a gap. A CDP
 * screencast over the same transition showed zero black frames. The numbers
 * above are still the reason the contract is safe; they are just not a bug that
 * was happening. Written down because "the gate that caught nothing" and "the
 * gate that had nothing to catch" are worth telling apart later.
 *
 * THE COLD LEG IS THE CONTROL, and it is throttled rather than left to the
 * network. "Warm is fast" is also what a harness that always reports zero says;
 * the control proves the same instrument can produce a large number. Throttling
 * makes that deterministic instead of a bet on how close the CDN is.
 */
async function checkPaintLatency(page, failures) {
  const timeOne = async (testId, beforeClick) => {
    await page.goto(`${BASE}/iframe.html?id=${PAINT_STORY}&viewMode=story`, {
      waitUntil: 'networkidle0',
    });
    await page.waitForSelector(`[data-testid="${testId}"]`, { timeout: 20000 });
    await page.evaluate(() => {
      delete window.__flightResolvedAt;
    });
    const at = await page.evaluate((id) => {
      const box = document.querySelector(`[data-testid="${id}"]`).getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    }, testId);
    // Any throttling is applied HERE, after the story has loaded: applied
    // before, it throttles the page load itself and the navigation times out
    // long before anything is measured.
    if (beforeClick) await beforeClick();
    await page.mouse.click(at.x, at.y);
    return page.evaluate(async () => {
      const started = performance.now();
      for (;;) {
        const img = document.querySelector('#bloom-portal-root img');
        const resolvedAt = window.__flightResolvedAt;
        // Decoded is not the same as VISIBLE. A fade-in leaves the element
        // complete with pixels while the user still sees nothing, so opacity is
        // part of the question — without it this gate would pass a surface that
        // takes half a second to become perceptible, which is the very hole it
        // is here to measure.
        const visible = img !== null && Number(getComputedStyle(img).opacity) > 0.99;
        if (img && img.complete && img.naturalWidth > 0 && visible && resolvedAt !== undefined) {
          return Math.round(performance.now() - resolvedAt);
        }
        if (performance.now() - started > 20000) return -1;
        await new Promise((frame) => requestAnimationFrame(frame));
      }
    });
  };

  const warm = [];
  for (let i = 0; i < 3; i += 1) warm.push(await timeOne('fly-warm'));
  const worstWarm = Math.max(...warm);
  report(
    failures,
    warm.every((ms) => ms >= 0),
    `paint: a warm flight never painted at all (samples ${warm.join(', ')})`,
  );
  report(
    failures,
    worstWarm <= WARM_PAINT_BUDGET_MS,
    `paint: a warm flight took ${worstWarm} ms to present after flyTo resolved ` +
      `(budget ${WARM_PAINT_BUDGET_MS} ms, samples ${warm.join(', ')}) — the poster is being ` +
      're-fetched or faded in, which is the whole gap the transition exists to cover',
  );

  // The control: same measurement, a poster the page never requested, on a
  // deliberately slow link so the number cannot come out small by luck.
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  const cold = await timeOne('fly-cold', () =>
    // LATENCY only, throughput untouched. Throttling bandwidth as well made a
    // full-size photo take longer than the poll budget and the control reported
    // "never painted", which is a broken instrument wearing the costume of a
    // dramatic result. One round trip is all the discrimination this needs.
    cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 400,
      downloadThroughput: -1,
      uploadThroughput: -1,
    }),
  );
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  await cdp.detach();

  report(
    failures,
    cold >= 0,
    `paint: the control never painted at all (${cold}) — the instrument is broken, not the code`,
  );
  report(
    failures,
    cold > worstWarm,
    `paint: the control did not discriminate — a throttled COLD poster measured ${cold} ms ` +
      `against a warm ${worstWarm} ms, so this harness cannot tell the two apart and the ` +
      'warm assertion above proves nothing',
  );
  console.log(`      paint latency after flyTo resolve: warm ${warm.join('/')} ms, cold(throttled) ${cold} ms`);
}

/**
 * THE DEGRADED PATH: `flyTo` WITH NO ORIGIN RECT.
 *
 * `MediaFlightOptions.from` is what the surface flies FROM. Without it the store
 * sets `from = rect`, so the box interpolates from the destination to itself:
 * it APPEARS AT FULL DESTINATION SIZE INSTANTLY and does not move.
 *
 * That is the documented degradation — better than flying in from a corner when
 * the origin could not be measured — but it is also exactly what a user reports
 * as "the video appeared full-screen and just sat there". So it is pinned here
 * rather than left in a doc comment: no test that PASSES `from` can reach this
 * state, which is why the motion phase above was blind to it.
 *
 * If this ever starts failing because the surface animates, the contract
 * changed and somebody should have said so.
 */
async function checkNoOriginJumps(page, failures) {
  await page.goto(`${BASE}/iframe.html?id=${STORY}&viewMode=story`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-testid="flight-nofrom"]', { timeout: 20000 });

  const target = await page.evaluate(() => {
    const box = [...document.querySelectorAll('div')]
      .find((el) => getComputedStyle(el).borderStyle === 'dashed')
      ?.getBoundingClientRect();
    return box ? { x: box.left, y: box.top, width: box.width, height: box.height } : null;
  });
  report(failures, target !== null, 'no-origin: the destination box was not found');

  if (!(await clickTestId(page, 'flight-nofrom'))) {
    failures.push('no-origin: the trigger was not clickable');
    return;
  }

  await sleep(80);
  const early = await flyingRect(page);
  await sleep(500);
  const late = await flyingRect(page);

  report(failures, early !== null, 'no-origin: nothing was painted at all');
  if (early && late && target) {
    // It arrives full-size on the FIRST sample and never moves: both samples
    // equal the destination. Asserted on both so "it jumped" is distinguished
    // from "it happened to be measured after a fast animation finished".
    report(
      failures,
      sameRect(early, target, 4) && sameRect(late, target, 4),
      `no-origin: expected an instant jump to the destination, got early=${JSON.stringify(early)} late=${JSON.stringify(late)} target=${JSON.stringify(target)}`,
    );
  }
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
    await checkPaintLatency(page, failures);
    await checkNoOriginJumps(page, failures);

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
    console.log('PASS  a warm flight presents pixels within a frame or two of flyTo resolving');
    console.log('PASS  a flight with NO origin rect jumps to the destination (documented degradation)');
    console.log('PASS  media flight animates from the origin to the destination and releases');
  }
  process.exitCode = failures.length === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
