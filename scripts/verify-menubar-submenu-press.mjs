/**
 * Browser gate: a row in a MENUBAR menu's sub-menu is chosen by a real mouse
 * press, and the menu still closes on a press outside it.
 *
 * The menubar's panel is the one non-modal menu surface: it closes on an
 * outside `pointerdown` heard on the document. The sub-menu's flyout is a panel
 * in a portal of its own, so its rows are outside the bar's panel in the DOM; a
 * press on one used to close the whole menu on `pointerdown`, before the click
 * that chooses the row (View › Sort By › Size left Name checked). The fix joins
 * the flyout to the panel it flew out of (`floating/floating-tree.ts`).
 *
 * Real input only: `page.mouse` goes through CDP `Input.dispatchMouseEvent`,
 * so the browser hit-tests and sends pointerdown, mousedown, pointerup,
 * mouseup and click itself. `element.click()` would skip the pointerdown that
 * the bug lives in.
 *
 * Also by keyboard (Right into the sub-menu, Down, Return) and by touch (a tap
 * on the sub-trigger, then on its row).
 *
 * Mutation-verified: making `owns` in `floating-tree.ts` look at its own node
 * only fails the three mouse row cases and the tap; making it always true fails
 * the outside case.
 *
 * Usage: start Storybook, then
 *   node scripts/verify-menubar-submenu-press.mjs [--url http://localhost:6006]
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
const STORY = 'base-menubar--submenu-rows';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function centreOf(page, testId) {
  const box = await page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, testId);
  if (!box) throw new Error(`no visible [data-testid="${testId}"]`);
  return box;
}

const result = (page) =>
  page.evaluate(() => document.querySelector('[data-testid="result"]')?.textContent ?? '');

const isOpen = (page, testId) =>
  page.evaluate((id) => document.querySelector(`[data-testid="${id}"]`) !== null, testId);

/** Opens `menu`, hovers `trigger` to fly its sub-menu out, then clicks `row`. */
async function chooseFromSub(page, menu, trigger, row) {
  await page.goto(`${BASE}/iframe.html?id=${STORY}&viewMode=story`, { waitUntil: 'networkidle2' });
  await sleep(600);
  const m = await centreOf(page, menu);
  await page.mouse.click(m.x, m.y);
  await sleep(300);
  const t = await centreOf(page, trigger);
  await page.mouse.move(t.x - 20, t.y, { steps: 4 });
  await page.mouse.move(t.x, t.y, { steps: 4 });
  await sleep(400);
  const r = await centreOf(page, row);
  // Along the row first, as a hand does, so the flyout's hover intent is real.
  await page.mouse.move(t.x + 40, t.y, { steps: 6 });
  await page.mouse.move(r.x, r.y, { steps: 6 });
  await sleep(150);
  await page.mouse.click(r.x, r.y);
  await sleep(400);
}

const results = [];
function record(name, pass, detail) {
  results.push(pass);
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });
  try {
    const page = await browser.newPage();

    await chooseFromSub(page, 'menubar-view', 'menubar-sort', 'menubar-sort-size');
    let text = await result(page);
    record('View › Sort By › Size checks Size', text.includes('sort: size'), text);
    record(
      'choosing it closes the menu',
      !(await isOpen(page, 'menubar-sort-panel')) && !(await isOpen(page, 'menubar-sort')),
    );

    await chooseFromSub(page, 'menubar-view', 'menubar-sort', 'menubar-folders-first');
    text = await result(page);
    record('View › Sort By › Folders First toggles it', text.includes('folders first: true'), text);

    await chooseFromSub(page, 'menubar-file', 'menubar-tags', 'menubar-tag-red');
    text = await result(page);
    record('File › Tags › Red runs it', text.includes('tag: red'), text);

    // The keyboard: Right enters the sub-menu on its first row, Down, Return.
    await page.goto(`${BASE}/iframe.html?id=${STORY}&viewMode=story`, {
      waitUntil: 'networkidle2',
    });
    await sleep(600);
    {
      const m = await centreOf(page, 'menubar-view');
      await page.mouse.click(m.x, m.y);
      await sleep(300);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowRight');
      await sleep(300);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await sleep(400);
      text = await result(page);
      record('the keyboard chooses View › Sort By › Size', text.includes('sort: size'), text);
    }

    // Touch: a tap on the sub-trigger opens the flyout, a tap on its row runs it.
    const touch = await browser.newPage();
    await touch.emulate({
      viewport: { width: 1280, height: 900, hasTouch: true, isMobile: false },
      userAgent: await browser.userAgent(),
    });
    await touch.goto(`${BASE}/iframe.html?id=${STORY}&viewMode=story`, {
      waitUntil: 'networkidle2',
    });
    await sleep(600);
    {
      const m = await centreOf(touch, 'menubar-file');
      await touch.touchscreen.tap(m.x, m.y);
      await sleep(300);
      const t = await centreOf(touch, 'menubar-tags');
      await touch.touchscreen.tap(t.x, t.y);
      await sleep(400);
      const r = await centreOf(touch, 'menubar-tag-blue');
      await touch.touchscreen.tap(r.x, r.y);
      await sleep(400);
      text = await result(touch);
      record('a tap chooses File › Tags › Blue', text.includes('tag: blue'), text);
    }
    await touch.close();

    // A press outside both panels still closes the menu, sub-menu and all.
    await page.goto(`${BASE}/iframe.html?id=${STORY}&viewMode=story`, {
      waitUntil: 'networkidle2',
    });
    await sleep(600);
    const m = await centreOf(page, 'menubar-view');
    await page.mouse.click(m.x, m.y);
    await sleep(300);
    const t = await centreOf(page, 'menubar-sort');
    await page.mouse.move(t.x - 20, t.y, { steps: 4 });
    await page.mouse.move(t.x, t.y, { steps: 4 });
    await sleep(400);
    const flewOut = await isOpen(page, 'menubar-sort-panel');
    await page.mouse.click(1200, 860);
    await sleep(500);
    record(
      'a press outside closes the menu and its sub-menu',
      flewOut &&
        !(await isOpen(page, 'menubar-sort-panel')) &&
        !(await isOpen(page, 'menubar-sort')),
      flewOut ? '' : 'the sub-menu never flew out',
    );
  } finally {
    await browser.close();
  }
  const failed = results.filter((pass) => !pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed === 0 && results.length === 7 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
