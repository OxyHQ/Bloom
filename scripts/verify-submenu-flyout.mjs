/**
 * Browser gate for the WEB sub-menu flyout (`floating/menu-sub-flyout.tsx`).
 *
 * Everything here is invisible to jest: whether the panel is a separate portaled
 * surface at all, where it lands relative to its row, whether a real diagonal
 * pointer path keeps it open, and which of two open surfaces Escape closes.
 *
 * Real input only — `page.mouse.move()`/`click()` and `page.keyboard.press()` go
 * through the browser's own hit testing and focus model. A synthetic
 * `element.dispatchEvent` would pass against a panel nothing can reach.
 *
 * Mutation-verified: `side="right"` → `"bottom"` fails the two geometry cases,
 * `CLOSE_DELAY_MS` → 0 fails the diagonal case, and dropping
 * `stopImmediatePropagation` fails the innermost-Escape case. Each mutation is
 * caught by exactly the case that measures it, and by no other.
 *
 * Usage: start Storybook, then
 *   node scripts/verify-submenu-flyout.mjs [--url http://localhost:6006]
 */
import { mkdirSync } from 'node:fs';
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
const OUT = '/tmp/bloom-submenu-shots';

const STORY = 'overlays-dropdownmenu--submenu';
const EDGE_STORY = 'overlays-dropdownmenu--submenu-with-no-room-to-the-right';


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function boxOf(page, testId) {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    return { x: r.x, y: r.y, width: r.width, height: r.height, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
  }, testId);
}

const centre = (b) => ({ x: b.left + b.width / 2, y: b.top + b.height / 2 });

async function openMenu(page, storyId) {
  await page.goto(`${BASE}/iframe.html?id=${storyId}&viewMode=story`, {
    waitUntil: 'networkidle2',
  });
  await sleep(900);
  // The trigger is the story's Button; click its text.
  const trigger = await page.evaluateHandle(() => {
    const root = document.querySelector('#storybook-root');
    return Array.from(root.querySelectorAll('*')).find(
      (el) => el.textContent.trim() === 'Share' && el.children.length === 0,
    );
  });
  const box = await trigger.asElement()?.boundingBox();
  if (!box) throw new Error('no Share trigger');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(400);
}

/** Every check below runs unconditionally, so a short run means something threw. */
const EXPECTED_CASES = 17;

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });

  try {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ]);

    // ---------------------------------------------------------------- case 1
    // Hovering the sub-trigger opens a panel that is NOT under it.
    await openMenu(page, STORY);
    const closed = await boxOf(page, 'submenu-item-email');
    record('sub-panel is closed before any hover', closed === null, closed ? 'it was already open' : '');

    const trig = await boxOf(page, 'submenu-trigger');
    if (!trig) throw new Error('no submenu-trigger');
    const t = centre(trig);
    await page.mouse.move(t.x, t.y);
    await sleep(400);

    const panelItem = await boxOf(page, 'submenu-item-email');
    record('hovering the row opens the sub-panel', panelItem !== null);

    if (panelItem) {
      record(
        'the panel is BESIDE the row, not under it',
        panelItem.left >= trig.right,
        `panel.left=${panelItem.left.toFixed(1)} row.right=${trig.right.toFixed(1)}`,
      );
      record(
        'the panel starts level with the row it flew out of',
        Math.abs(panelItem.top - trig.top) < 24,
        `panel.top=${panelItem.top.toFixed(1)} row.top=${trig.top.toFixed(1)}`,
      );
    }

    await page.screenshot({ path: `${OUT}/flyout-open.png` });

    // ---------------------------------------------------------------- case 2
    // A DIAGONAL path from the row's left edge to the panel's last item, which
    // leaves both surfaces on the way. A close-on-leave with no delay dismisses
    // here; a grace delay survives it.
    const target = await boxOf(page, 'submenu-item-messages');
    if (target) {
      const from = { x: trig.left + 6, y: trig.top + trig.height / 2 };
      const to = centre(target);
      await page.mouse.move(from.x, from.y);
      await sleep(120);
      const steps = 12;
      for (let i = 1; i <= steps; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await page.mouse.move(
          from.x + ((to.x - from.x) * i) / steps,
          from.y + ((to.y - from.y) * i) / steps,
        );
        // eslint-disable-next-line no-await-in-loop
        await sleep(18);
      }
      await sleep(150);
      const survived = await boxOf(page, 'submenu-item-messages');
      record('a diagonal pointer path to the panel does not dismiss it', survived !== null);
      await page.screenshot({ path: `${OUT}/flyout-after-diagonal.png` });
    } else {
      record('a diagonal pointer path to the panel does not dismiss it', false, 'panel never opened');
    }

    // ---------------------------------------------------------------- case 3
    // Leaving BOTH surfaces really does close it (the negative control for the
    // delay: a panel that never closes would pass case 2 for the wrong reason).
    await page.mouse.move(20, 860);
    await sleep(700);
    const afterLeave = await boxOf(page, 'submenu-item-email');
    record('leaving both surfaces closes the sub-panel', afterLeave === null);

    // ---------------------------------------------------------------- case 4
    // Escape closes the INNER panel first, leaving the root menu open.
    await page.mouse.move(t.x, t.y);
    await sleep(400);
    const reopened = await boxOf(page, 'submenu-item-email');
    record('the sub-panel reopens on hover', reopened !== null);

    await page.keyboard.press('Escape');
    await sleep(300);
    const subAfterEsc = await boxOf(page, 'submenu-item-email');
    const rootAfterEsc = await boxOf(page, 'plain-item');
    record('Escape closes the sub-panel', subAfterEsc === null);
    record(
      'Escape leaves the ROOT menu open (innermost first)',
      rootAfterEsc !== null,
      rootAfterEsc ? '' : 'both surfaces closed on one press',
    );

    await page.keyboard.press('Escape');
    await sleep(300);
    const rootAfterSecondEsc = await boxOf(page, 'plain-item');
    record('a second Escape closes the root menu', rootAfterSecondEsc === null);

    // ---------------------------------------------------------------- case 5
    // Keyboard: Right opens and enters, Left leaves.
    await openMenu(page, STORY);
    const trig2 = await boxOf(page, 'submenu-trigger');
    const t2 = centre(trig2);
    // Focus the row without opening on hover: click it, which toggles it open,
    // then close with Left so focus is on the row and the panel is shut.
    await page.mouse.click(t2.x, t2.y);
    await sleep(300);
    await page.keyboard.press('ArrowLeft');
    await sleep(300);
    // Park the pointer away so hover plays no part in what follows.
    await page.mouse.move(20, 860);
    await sleep(500);
    const beforeRight = await boxOf(page, 'submenu-item-email');
    record('keyboard case starts with the sub-panel closed', beforeRight === null);

    await page.keyboard.press('ArrowRight');
    await sleep(350);
    const afterRight = await boxOf(page, 'submenu-item-email');
    record('ArrowRight opens the sub-panel', afterRight !== null);

    const focusedIn = await page.evaluate(() => {
      const active = document.activeElement;
      const first = document.querySelector('[data-testid="submenu-item-email"]');
      return Boolean(active && first && (active === first || first.contains(active) || active.contains(first)));
    });
    record('ArrowRight moves focus INTO the panel', focusedIn);

    await page.keyboard.press('ArrowLeft');
    await sleep(350);
    const afterLeft = await boxOf(page, 'submenu-item-email');
    record('ArrowLeft closes the sub-panel', afterLeft === null);

    // ---------------------------------------------------------------- case 6
    // With no room to the right, the panel flips to the LEFT of its row.
    await openMenu(page, EDGE_STORY);
    const edgeTrig = await boxOf(page, 'submenu-trigger');
    if (edgeTrig) {
      const e = centre(edgeTrig);
      await page.mouse.move(e.x, e.y);
      await sleep(450);
      const edgePanel = await boxOf(page, 'submenu-item-email');
      record('the panel opens near the window edge', edgePanel !== null);
      if (edgePanel) {
        const viewport = await page.evaluate(() => window.innerWidth);
        // Vacuity floor: assert the row really had no room on the right, or
        // "it did not overflow" is what a panel that never moved also reports.
        record(
          'the row genuinely has no room to its right',
          edgeTrig.right + 4 + 128 > viewport - 8,
          `row.right=${edgeTrig.right.toFixed(1)} viewport=${viewport}`,
        );
        record(
          'it flips to the LEFT of the row rather than running off-screen',
          edgePanel.right <= edgeTrig.left + 1 && edgePanel.right <= viewport,
          `panel.right=${edgePanel.right.toFixed(1)} row.left=${edgeTrig.left.toFixed(1)} viewport=${viewport}`,
        );
      }
      await page.screenshot({ path: `${OUT}/flyout-edge.png` });
    } else {
      record('the panel opens near the window edge', false, 'no trigger');
    }

    let failed = results.filter((r) => !r.pass).length;
    // Vacuity floor: a run that bailed early must not read as success.
    if (results.length < EXPECTED_CASES) {
      console.log(`FAIL  ran ${results.length} of ${EXPECTED_CASES} checks`);
      failed += 1;
    }
    console.log(`\n${results.length - failed}/${results.length} submenu checks pass`);
    console.log(`screenshots in ${OUT}`);
    process.exitCode = failed === 0 ? 0 : 1;
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
