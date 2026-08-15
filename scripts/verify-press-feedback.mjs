/**
 * Browser gate for the press feedback of the seven control families.
 *
 * Jest cannot see either half of what this measures.
 *
 *  - For the three RAW-DOM forks (`Button.web`, `Fab.web`,
 *    `FrostedIconButton.web`) the held state is a `:active` rule in an adopted
 *    stylesheet. Jest asserts the CSS TEXT; only a browser resolves it. A
 *    `background-color: var(--x-press-bg)` whose custom property never arrives
 *    is invalid at computed-value time and paints the control TRANSPARENT — a
 *    real, silent, jest-invisible failure of exactly this shape.
 *  - For the four react-native-web controls (`Chip`, `Tabs`, `Checkbox`,
 *    `Radio`) the held state is JS, and jest sees the style OBJECT rather than
 *    what react-native-web's atomic sheet finally computes.
 *
 * Two assertions per case, and each one is load-bearing:
 *
 *  1. `transform` is `none` — NOT `scale(1)`. A neutral scale means the
 *     mechanism is still wired and merely parked, which is how a removed
 *     affordance comes back.
 *  2. The pressed background DIFFERS from the unpressed one. Without this,
 *     "no scale" is trivially satisfiable by removing the feedback entirely.
 *
 * Three readings are taken, not two: mouse parked AWAY, mouse hovering, and
 * mouse held down. A press on web is always also a hover, so a family whose
 * hover already moves the background (`FrostedIconButton`) would otherwise let a
 * dead `:active` rule pass as a working press.
 *
 * It runs HEADFUL against the real X display, and deliberately passes no
 * `--force-prefers-reduced-motion`: measured in this Chromium, the
 * `no-preference` value FORCES reduce ON, which would suppress the very
 * transitions being read through.
 *
 * Usage: start Storybook, then
 *   node scripts/verify-press-feedback.mjs [--url http://localhost:6006]
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

/**
 * `click` is where the press is delivered; `measure` is what paints the held
 * state. They differ for the two controls whose feedback is on an inner node:
 * `Checkbox` reacts on its BOX and `Radio` on its INDICATOR, while the element
 * that owns the gesture is the whole row.
 *
 * `index` picks among several matches on one page.
 */
const CASES = [
  // ── raw-DOM forks: the press is a `:active` rule ───────────────────────────
  {
    name: 'Button / primary (filled brand)',
    story: 'components-button--primary',
    click: 'button.bloom-btn',
    measure: 'button.bloom-btn',
  },
  {
    name: 'Button / secondary (outline, unfilled)',
    story: 'components-button--secondary',
    click: 'button.bloom-btn',
    measure: 'button.bloom-btn',
  },
  {
    name: 'Button / ghost (unfilled)',
    story: 'components-button--ghost',
    click: 'button.bloom-btn',
    measure: 'button.bloom-btn',
  },
  {
    name: 'Button / text (unfilled, compact)',
    story: 'components-button--text-only',
    click: 'button.bloom-btn',
    measure: 'button.bloom-btn',
  },
  {
    name: 'Button / inverse (white fill — the case bg-primary/90 cannot express)',
    story: 'components-button--inverse',
    click: 'button.bloom-btn',
    measure: 'button.bloom-btn',
  },
  {
    name: 'Fab / tertiary fill',
    story: 'components-fab--default',
    click: 'button.bloom-fab',
    measure: 'button.bloom-fab',
  },
  {
    name: 'FrostedIconButton / frosted over media',
    story: 'components-frostediconbutton--over-image',
    click: 'button.bloom-frosted-icon-btn',
    measure: 'button.bloom-frosted-icon-btn',
  },
  {
    name: 'FrostedIconButton / active (solid on-state)',
    story: 'components-frostediconbutton--active',
    click: 'button.bloom-frosted-icon-btn[data-active="true"]',
    measure: 'button.bloom-frosted-icon-btn[data-active="true"]',
  },
  // ── react-native-web controls: the press is JS state ──────────────────────
  {
    name: 'Chip / subtle tint',
    stateful: true,
    story: 'data-display-chip--selectable',
    click: '[data-bloom-chip]',
    measure: '[data-bloom-chip]',
  },
  {
    name: 'Tabs / unselected trigger',
    stateful: true,
    story: 'components-tabs--basic',
    click: '[role="tab"]',
    measure: '[role="tab"]',
    index: 1,
  },
  {
    name: 'Tabs / selected trigger',
    stateful: true,
    story: 'components-tabs--variants',
    click: '[role="tab"][aria-selected="true"]',
    measure: '[role="tab"][aria-selected="true"]',
    index: 1,
  },
  {
    name: 'Checkbox / unchecked box',
    stateful: true,
    story: 'forms-checkbox--basic',
    click: '[data-bloom-checkbox]',
    measure: '[data-bloom-checkbox] > *',
  },
  {
    name: 'Checkbox / checked box',
    stateful: true,
    story: 'forms-checkbox--indeterminate',
    click: '[data-bloom-checkbox]',
    measure: '[data-bloom-checkbox] > *',
  },
  {
    name: 'Radio / unselected indicator',
    stateful: true,
    story: 'forms-radio--group',
    click: '[role="radio"][aria-checked="false"]',
    measure: '[role="radio"][aria-checked="false"] > *',
  },
  {
    name: 'Radio / selected indicator',
    stateful: true,
    story: 'forms-radio--group',
    click: '[role="radio"][aria-checked="true"]',
    measure: '[role="radio"][aria-checked="true"] > *',
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Whether two readings paint the same face. */
const samePaint = (a, b) => a.background === b.background && a.borderColor === b.borderColor;

/**
 * Read repeatedly until the paint differs from `from`, or the deadline passes.
 *
 * Returns the LAST reading either way, so a control that never moves still
 * produces a real measurement for the failure message to quote.
 */
async function settle(page, spec, from) {
  const deadline = Date.now() + 2000;
  let latest = await read(page, spec);
  while (Date.now() < deadline && !latest.error && samePaint(latest, from)) {
    await sleep(60);
    latest = await read(page, spec);
  }
  // One more frame past the change, so a value read mid-transition is not the
  // one asserted on.
  await sleep(250);
  return read(page, spec);
}

/** Read the measured element's computed paint, or an error describing the miss. */
async function read(page, spec) {
  return page.evaluate(
    ({ selector, index }) => {
      const el = document.querySelectorAll(selector)[index ?? 0];
      if (!el) return { error: `no element matching ${selector}[${index ?? 0}]` };
      const cs = getComputedStyle(el);
      return {
        background: cs.backgroundColor,
        borderColor: cs.borderTopColor,
        boxShadow: cs.boxShadow,
        transform: cs.transform,
      };
    },
    { selector: spec.measure, index: spec.index },
  );
}

/** Viewport centre of the element the press is delivered to. */
async function centreOf(page, spec) {
  return page.evaluate(
    ({ selector, index }) => {
      const el = document.querySelectorAll(selector)[index ?? 0];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
    { selector: spec.click, index: spec.index },
  );
}

async function main() {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    // Headful on the real X display: a genuinely foregrounded tab, so the
    // transitions these controls paint through actually run.
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const failures = [];
  const rows = [];

  try {
    const page = await browser.newPage();
    for (const spec of CASES) {
      await page.goto(`${BASE}/iframe.html?id=${spec.story}&viewMode=story`, {
        waitUntil: 'networkidle0',
      });
      await page.waitForSelector(spec.click, { timeout: 10_000 }).catch(() => {});
      // Park the pointer well clear of everything, so the first reading is a
      // true rest and not an accidental hover.
      await page.mouse.move(1270, 890);
      await sleep(250);
      const rest = await read(page, spec);

      const point = await centreOf(page, spec);
      if (!point) {
        failures.push(`${spec.name}: could not locate a pressable ${spec.click}`);
        continue;
      }
      await page.mouse.move(point.x, point.y);
      await sleep(300);
      const hovered = await read(page, spec);

      await page.mouse.down();
      // POLL rather than sleep a fixed span. A single timed read is flaky in
      // both directions here — the transitions are 120-160ms, but a press
      // delivered immediately after a navigation can take a beat to land, and a
      // fixed 350ms read reported two Button variants as unresponsive on one run
      // and responsive on the next. Polling until the paint MOVES, with a
      // deadline, keeps the assertion honest: it still fails when nothing ever
      // changes, and it no longer fails when everything did.
      const held = await settle(page, spec, hovered);
      await page.mouse.up();
      await sleep(300);
      const released = await read(page, spec);
      await page.mouse.move(1270, 890);

      for (const [label, value] of [
        ['rest', rest],
        ['hover', hovered],
        ['held', held],
      ]) {
        if (value.error) failures.push(`${spec.name} (${label}): ${value.error}`);
      }
      if (rest.error || hovered.error || held.error) continue;

      rows.push({ name: spec.name, rest, hovered, held, released });

      // 1. No transform anywhere in the interaction — and `none`, not `scale(1)`.
      for (const [label, value] of [
        ['rest', rest],
        ['hover', hovered],
        ['held', held],
      ]) {
        if (value.transform !== 'none') {
          failures.push(
            `${spec.name}: transform at ${label} is "${value.transform}", expected "none"` +
              (value.transform === 'matrix(1, 0, 0, 1, 0, 0)'
                ? ' — a neutral scale means the mechanism is still wired'
                : ''),
          );
        }
      }

      // 2. The held paint DIFFERS from both the unpressed readings. Against
      //    HOVER as well as rest, because a press is always also a hover: a
      //    family whose hover already moved the colour would otherwise let a
      //    dead `:active` rule pass.
      const paint = (r) => `${r.background}|${r.borderColor}`;
      if (samePaint(held, rest)) {
        failures.push(`${spec.name}: held paint is identical to rest (${paint(held)})`);
      }
      if (samePaint(held, hovered)) {
        failures.push(
          `${spec.name}: held paint is identical to HOVER (${paint(held)}) — the press adds nothing`,
        );
      }
      // 3. …and it goes back. A press that latches is a different bug wearing
      //    the same green. Only checkable where the control is not a TOGGLE: a
      //    stateful story answers the click by changing what it renders, so the
      //    released reading is legitimately a different colour and comparing it
      //    would assert the toggle did not work.
      if (!spec.stateful && !samePaint(released, hovered)) {
        failures.push(
          `${spec.name}: after release the paint is ${paint(released)}, ` +
            `expected the hover value ${paint(hovered)} — the press latched`,
        );
      }
    }
  } finally {
    await browser.close();
  }

  for (const row of rows) {
    console.log(`\n${row.name}`);
    for (const [label, r] of [['rest ', row.rest], ['hover', row.hovered], ['held ', row.held]]) {
      console.log(
        `  ${label}  bg=${r.background} border=${r.borderColor} ` +
          `shadow=${r.boxShadow} transform=${r.transform}`,
      );
    }
  }

  // Vacuity floor: a run that located nothing would report no failures.
  if (rows.length !== CASES.length) {
    failures.push(`measured ${rows.length} of ${CASES.length} cases`);
  }

  console.log('');
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL  ${failure}`);
    console.error(`\n${failures.length} failure(s) across ${CASES.length} cases.`);
    process.exit(1);
  }
  console.log(`OK — all ${CASES.length} cases: no transform, and a real paint delta on press.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
