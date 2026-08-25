/**
 * Browser gate for overlay stacking.
 *
 * Jest cannot see this class of bug: the losing surface renders perfectly and
 * its styles are all correct — it is simply painted under another element, so
 * only a real hit test in a real browser distinguishes pass from fail.
 *
 * What this measures, and why it is measured this way:
 *
 *  - It drives the stories in `src/overlay/OverlayStacking.stories.tsx` with
 *    `page.mouse.click()` — TRUSTED input at real viewport coordinates, which
 *    the browser routes through its own hit testing. A synthetic
 *    `element.click()` would bypass hit testing entirely and pass against a
 *    surface buried under another one (and react-native-web's `Pressable`
 *    ignores it anyway, so a dead button would look wired).
 *  - The assertion is the story's `result` line, which only the TOP surface's
 *    button can write. Reading `zIndex` or bounding boxes would report a
 *    surface the user cannot actually touch as fine.
 *  - It runs headful against a real X display with
 *    `prefers-reduced-motion: no-preference`, because headless Chrome defaults
 *    to `reduce` and would skip the entrance animations these surfaces use.
 *
 * Usage: start Storybook, then
 *   node scripts/verify-overlay-stacking.mjs [--url http://localhost:6006]
 *
 * Exits non-zero, naming each failing case, if any surface opened second is not
 * the one that receives the press.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
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
  throw new Error(
    `Could not resolve puppeteer-core. Tried: ${PUPPETEER_PATHS.join(', ')}`,
  );
}

// The packaged Chrome binary. The `chromium` wrapper on this machine SIGTRAPs,
// so the real Chrome build is the one to launch.
const CHROME = process.env.CHROME_PATH ?? '/opt/google/chrome/chrome';

const argUrl = process.argv.indexOf('--url');
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6006';
const OUT = process.env.OVERLAY_SHOT_DIR ?? '/tmp/bloom-overlay-shots';

/**
 * The default choreography: open `open-first`, then `open-second` from inside
 * it. The press on `top-action` and the read of `result` are common to every
 * case and happen after these.
 */
const DEFAULT_STEPS = [
  { click: 'open-first', why: 'open-first not clickable' },
  { click: 'open-second', why: 'open-second not reachable inside the first surface' },
];

/**
 * Each case runs its `steps` (defaulting to the pair above), then presses
 * `top-action` — which lives in the surface opened LAST. `expect` is what the
 * story writes when that press lands.
 */
const CASES = [
  {
    id: 'overlays-overlay-stacking--dialog-over-sheet-story',
    name: 'dialog over sheet',
    expect: 'dialog',
  },
  {
    id: 'overlays-overlay-stacking--sheet-over-dialog-story',
    name: 'sheet over dialog',
    expect: 'sheet',
  },
  {
    id: 'overlays-overlay-stacking--dialog-over-dialog-story',
    name: 'dialog over dialog',
    expect: 'second',
  },
  {
    id: 'overlays-overlay-stacking--menu-over-dialog-story',
    name: 'menu over dialog',
    expect: 'menu',
  },
  {
    // The media-flight layer is the one surface here that must NOT receive the
    // press: it paints a picture of something the app is already showing, over
    // controls that stay live underneath it. Reading `pointer-events` off the
    // node would report a layer the user cannot actually click through as fine,
    // so the assertion is the same one every case above uses — the result line,
    // which only the covered button can write.
    id: 'overlays-mediaflight--click-through',
    name: 'media flight does not steal the click',
    steps: [{ click: 'open-first', why: 'open-first not clickable' }],
    expect: 'flight',
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Centre of a `testID`'d element, in viewport coordinates, or null. */
async function centreOf(page, testId) {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, testId);
}

/** Real, trusted click at the element's centre. Returns false if not present. */
async function clickTestId(page, testId) {
  const pt = await centreOf(page, testId);
  if (!pt) return false;
  await page.mouse.click(pt.x, pt.y);
  return true;
}

/**
 * Diagnosis for a failure: what the browser says is actually on top at the
 * target's centre, and the z-index of each positioned ancestor of both.
 */
async function describeOcclusion(page, testId) {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) return { error: `no element with testID ${id}` };
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const hit = document.elementFromPoint(cx, cy);

    const chain = (node) => {
      const out = [];
      let n = node;
      while (n && n !== document.documentElement) {
        const cs = getComputedStyle(n);
        if (cs.zIndex !== 'auto' || cs.position !== 'static') {
          out.push(
            `${n.tagName.toLowerCase()}${n.id ? `#${n.id}` : ''}` +
              `[pos=${cs.position} z=${cs.zIndex}]`,
          );
        }
        n = n.parentElement;
      }
      return out;
    };

    return {
      reachable: hit ? el.contains(hit) || el === hit : false,
      targetChain: chain(el),
      hitChain: hit ? chain(hit) : ['<nothing>'],
    };
  }, testId);
}

async function runCase(page, testCase) {
  await page.goto(
    `${BASE}/iframe.html?id=${testCase.id}&viewMode=story`,
    { waitUntil: 'networkidle0' },
  );
  await page.waitForSelector('[data-testid="open-first"]', { timeout: 20000 });

  for (const step of testCase.steps ?? DEFAULT_STEPS) {
    // eslint-disable-next-line no-await-in-loop
    if (!(await clickTestId(page, step.click))) {
      return {
        ...testCase,
        pass: false,
        reason: step.why,
        // eslint-disable-next-line no-await-in-loop
        occlusion: await describeOcclusion(page, step.click),
      };
    }
    // Entrance animation + mount of the surface this step opened.
    // eslint-disable-next-line no-await-in-loop
    await sleep(700);
  }

  const shot = path.join(OUT, `${testCase.name.replace(/\s+/g, '-')}.png`);
  await page.screenshot({ path: shot });

  const occlusion = await describeOcclusion(page, 'top-action');

  if (!(await clickTestId(page, 'top-action'))) {
    return {
      ...testCase,
      pass: false,
      reason: 'top-action has no box (the second surface never rendered)',
      occlusion,
      shot,
    };
  }
  await sleep(400);

  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="result"]');
    return el ? el.textContent : null;
  });

  const pass = result === `result: ${testCase.expect}`;
  return {
    ...testCase,
    pass,
    result,
    reason: pass
      ? undefined
      : `pressing the second surface's button did not reach it (result line still "${result}")`,
    occlusion,
    shot,
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const puppeteer = loadPuppeteer();

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    // Headful on the real X display: a genuinely foregrounded tab, so rAF and
    // CSS animations run at full rate.
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });

  try {
    const page = await browser.newPage();
    // Headless/CI Chrome reports `reduce`, which short-circuits the entrance
    // animations under test. Pin the value every real user gets.
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ]);

    const results = [];
    for (const testCase of CASES) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await runCase(page, testCase));
    }

    let failed = 0;
    for (const r of results) {
      if (r.pass) {
        console.log(`PASS  ${r.name} — result line reads "${r.result}"`);
      } else {
        failed += 1;
        console.log(`FAIL  ${r.name} — ${r.reason}`);
        if (r.occlusion) {
          console.log(`      reachable at centre: ${r.occlusion.reachable}`);
          console.log(`      target ancestors:    ${(r.occlusion.targetChain ?? []).join(' < ')}`);
          console.log(`      on top instead:      ${(r.occlusion.hitChain ?? []).join(' < ')}`);
        }
        if (r.shot) console.log(`      screenshot: ${r.shot}`);
      }
    }

    // Vacuity floor: an empty or short run must not read as success.
    if (results.length !== CASES.length) {
      console.log(`FAIL  ran ${results.length} of ${CASES.length} cases`);
      failed += 1;
    }

    console.log(`\n${results.length - failed}/${results.length} stacking cases pass`);
    process.exitCode = failed === 0 ? 0 : 1;
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
