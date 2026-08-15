/**
 * Browser gate for `disabled` on an `asChild` trigger — and a standing
 * demonstration that this browser cannot always see it.
 *
 * THE DEFECT. `floating/TriggerSlot.tsx`'s `cloneTrigger` merges the family's
 * open handler into the caller's element and COMPOSES it with the child's own
 * `onPress`. Compose unconditionally and a disabled trigger still opens, unless
 * something else stops it — so `disabled` becomes conditional on the TYPE of
 * element the caller passed. `cloneTrigger` therefore reads both the family's
 * `disabled` and the child's.
 *
 * WHY THIS SCRIPT EXISTS RATHER THAN A JEST SUITE ALONE, AND WHY IT ALSO
 * MEASURES ITS OWN BLIND SPOT. Both facts below were measured, each by
 * reverting `cloneTrigger` to the body it shipped with and re-running:
 *
 *  - `combobox-disabled` STAYS CLOSED against the broken code. Its child is a
 *    real `Pressable` carrying its own `disabled`, and react-native-web's
 *    `Pressable` swallows the press before the composed handler runs. The
 *    widget hides the missing guard and the browser reports a broken build as
 *    correct. Those rows are kept deliberately, marked `blind`: they are the
 *    executable form of "an instrument's blind spot is wherever it faithfully
 *    reproduces the thing that masks the defect".
 *  - `popover-forwarding-disabled` OPENS against the broken code. Its child
 *    forwards `onPress` and has no notion of `disabled`, so nothing masks it.
 *    That row is the gate.
 *
 * The jest suite (`src/__tests__/Combobox.test.tsx`) catches the same defect
 * for the opposite reason: its `Pressable` mock ignores `disabled`, so the
 * composed handler runs. The mock is the sharper tool there. Neither instrument
 * supersedes the other, which is the whole point of keeping both rows here.
 *
 * HOW EACH CASE AVOIDS CONCLUDING TOO MUCH:
 *
 *  - `page.mouse.click()` at real viewport coordinates — TRUSTED input routed
 *    through the browser's own hit testing. A synthetic `element.click()`
 *    bypasses hit testing and react-native-web's `Pressable` ignores it anyway.
 *  - "It did not open" is also what clicking empty space reports, so every case
 *    verifies its own precondition first: the trigger must exist, have a real
 *    box, and be what `elementFromPoint` returns at the coordinates about to be
 *    clicked. A case that cannot prove it hit the trigger reports UNPROVEN and
 *    fails — it never reports a pass it did not earn.
 *  - The enabled rows are the positive control, run through the IDENTICAL path.
 *    Without them a probe that silently stopped clicking would report every
 *    disabled case as correct.
 *  - A cold story compiles on first request, so the wrapper is POLLED for
 *    rather than waited on for a fixed time — otherwise a slow build reads as
 *    UNPROVEN. Bounded, so a story that never renders still fails.
 *
 * Headless is safe here, unlike `verify-overlay-stacking.mjs`: the assertion is
 * `aria-expanded` plus node count, which state drives, not an animated position
 * that `prefers-reduced-motion: reduce` would skip.
 *
 * Usage: start Storybook, then
 *   node scripts/verify-trigger-disabled.mjs [--url http://localhost:6006]
 *
 * Exits non-zero, naming each case, if a trigger opens when it must not, fails
 * to open when it must, or cannot be proven to have been pressed at all.
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

// The packaged Chrome binary. The `chromium` wrapper on this machine SIGTRAPs,
// so the real Chrome build is the one to launch.
const CHROME = process.env.CHROME_PATH ?? '/opt/google/chrome/chrome';

const argUrl = process.argv.indexOf('--url');
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6006';

/**
 * `testId` is the `testID` on the family's trigger, which `TriggerSlot` puts on
 * its wrapper `View`; the trigger itself is the descendant carrying
 * `aria-expanded`. `gatesGuard` marks the row that actually fails when
 * `cloneTrigger`'s guard is removed — everything else is a control or a
 * documented blind spot.
 */
const CASES = [
  {
    story: 'forms-combobox--basic',
    testId: 'combobox-basic',
    mustOpen: true,
    gatesGuard: false,
    note: 'control',
  },
  {
    story: 'forms-combobox--disabled',
    testId: 'combobox-disabled',
    mustOpen: false,
    gatesGuard: false,
    note: 'BLIND — a Pressable child masks a missing guard',
  },
  {
    story: 'forms-combobox--disabled',
    testId: 'combobox-disabled-selected',
    mustOpen: false,
    gatesGuard: false,
    note: 'BLIND — a Pressable child masks a missing guard',
  },
  {
    story: 'overlays-popover--as-child-disabled',
    testId: 'popover-forwarding-enabled',
    mustOpen: true,
    gatesGuard: false,
    note: 'control',
  },
  {
    story: 'overlays-popover--as-child-disabled',
    testId: 'popover-forwarding-disabled',
    mustOpen: false,
    gatesGuard: true,
    note: 'THE GATE — child forwards onPress and ignores disabled',
  },
];

/** Load one story, prove the trigger is pressable, press it, report what moved. */
async function probe(page, { story, testId }) {
  await page.goto(`${BASE}/iframe.html?id=${story}&viewMode=story`, { waitUntil: 'networkidle0' });
  try {
    await page.waitForSelector(`[data-testid="${testId}"]`, { timeout: 15000 });
  } catch {
    return { verdict: 'UNPROVEN', why: `[data-testid="${testId}"] never appeared in 15s` };
  }
  await new Promise((r) => setTimeout(r, 400));

  const target = await page.evaluate((tid) => {
    const wrapper = document.querySelector(`[data-testid="${tid}"]`);
    if (wrapper === null) return { error: `no [data-testid="${tid}"]` };
    const trigger =
      wrapper.querySelector('[aria-expanded]') ?? wrapper.querySelector('[role="button"]');
    if (trigger === null) return { error: 'wrapper has no trigger with aria-expanded/role=button' };
    const r = trigger.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return { error: `trigger box is ${r.width}x${r.height}` };
    const x = r.x + r.width / 2;
    const y = r.y + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      x,
      y,
      hitsTrigger: hit !== null && (trigger === hit || trigger.contains(hit)),
      hitTag: hit === null ? 'null' : hit.tagName.toLowerCase(),
      expandedBefore: trigger.getAttribute('aria-expanded'),
      nodesBefore: document.body.querySelectorAll('*').length,
    };
  }, testId);

  if (target.error !== undefined) return { verdict: 'UNPROVEN', why: target.error };
  if (!target.hitsTrigger) {
    return { verdict: 'UNPROVEN', why: `elementFromPoint gave <${target.hitTag}>, not the trigger` };
  }

  await page.mouse.click(target.x, target.y);
  await new Promise((r) => setTimeout(r, 800));

  const after = await page.evaluate((tid) => {
    const wrapper = document.querySelector(`[data-testid="${tid}"]`);
    const trigger =
      wrapper?.querySelector('[aria-expanded]') ?? wrapper?.querySelector('[role="button"]');
    return {
      expandedAfter: trigger?.getAttribute('aria-expanded') ?? null,
      nodesAfter: document.body.querySelectorAll('*').length,
    };
  }, testId);

  return {
    verdict: 'MEASURED',
    opened: after.nodesAfter > target.nodesBefore + 3 || after.expandedAfter === 'true',
    detail: `aria-expanded ${target.expandedBefore}->${after.expandedAfter}, nodes ${target.nodesBefore}->${after.nodesAfter}`,
  };
}

async function main() {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();
  let failed = 0;
  let ran = 0;
  let guardRowsMeasured = 0;

  try {
    for (const testCase of CASES) {
      const r = await probe(page, testCase);
      ran += 1;
      if (r.verdict === 'UNPROVEN') {
        failed += 1;
        console.log(`UNPROVEN  ${testCase.testId.padEnd(28)} ${r.why}`);
        continue;
      }
      if (testCase.gatesGuard) guardRowsMeasured += 1;
      const ok = r.opened === testCase.mustOpen;
      if (!ok) failed += 1;
      const want = testCase.mustOpen ? 'must OPEN' : 'must STAY CLOSED';
      const got = r.opened ? 'opened' : 'stayed closed';
      console.log(
        `${ok ? 'PASS' : 'FAIL'}      ${testCase.testId.padEnd(28)} ${want} — ${got}  (${r.detail})`,
      );
      console.log(`          ${testCase.note}`);
    }

    // Vacuity floors. A short run must not read as success, and the blind rows
    // pass whether or not the guard exists — so a run in which the GATING row
    // never got measured has verified nothing about the guard, however many
    // green lines it printed.
    if (ran !== CASES.length) {
      console.log(`FAIL      ran ${ran} of ${CASES.length} cases`);
      failed += 1;
    }
    if (guardRowsMeasured === 0) {
      console.log(
        'FAIL      no guard-gating case was measured — the passing rows above cannot detect a missing guard',
      );
      failed += 1;
    }

    console.log(`\n${ran - failed}/${CASES.length} cases as specified`);
    process.exitCode = failed === 0 ? 0 : 1;
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
