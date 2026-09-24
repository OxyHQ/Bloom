/**
 * Browser gate for the WEB keyboard contracts of `Select`, `Tabs`,
 * `SegmentedControl` and the anchored menus (ARIA select-only combobox, tabs,
 * radio group, menu button — `DropdownMenu` here, whose rows and keys
 * `ContextMenu` and `Menubar` share).
 *
 * WHY A BROWSER. Three things here are invisible to jest, and each is the whole
 * behaviour:
 *
 *  - WHAT TAB REACHES. jsdom has no sequential focus navigation, so "one tab
 *    stop per group" can only be asserted as attribute values there; here a real
 *    Tab press either lands on the chosen option and then LEAVES the group, or
 *    it does not.
 *  - A `role="button"` Pressable renders as a real `<button>`, which the BROWSER
 *    activates on Enter (keydown) and Space (keyup). react-native-web leaves
 *    those keys to it, so whether Enter opens the select depends on browser
 *    behaviour the jest suite has to imitate.
 *  - Escape ORDER between a Select's list and the Dialog around it, and between
 *    a sub-menu flyout and its menu — listener registration order on real
 *    nodes, with real bubbling.
 *
 * Real input only: `page.keyboard.press()` goes through the browser's own focus
 * model and default actions. Focus is placed with a real Tab from the top of
 * the story wherever the case is about reachability.
 *
 * Mutation-verified, each re-run against the broken code: putting the escape
 * stack's listener back on `document` fails the in-dialog Escape case; dropping
 * `useRovingTabIndex` from `Tabs` fails "the next Tab LEAVES the strip"; dropping
 * the menu panel's initial focus fails every menu open case after it.
 *
 * Usage: start Storybook, then
 *   node scripts/verify-web-keyboard.mjs [--url http://localhost:6006]
 * `CHROME_PATH` overrides the browser binary.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Every check below runs unconditionally, so a short run means something threw. */
const EXPECTED_CASES = 50;

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function story(page, id) {
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#storybook-root *', { timeout: 20000 });
  await sleep(600);
  // Start sequential focus navigation from the top of the document.
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.focus();
  });
}

async function key(page, name, settle = 250) {
  await page.keyboard.press(name);
  await sleep(settle);
}

/** What holds focus: role, accessible name (label or text), selection state. */
function focused(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { role: null, name: null };
    return {
      role: el.getAttribute('role'),
      name: el.getAttribute('aria-label') ?? el.textContent.trim(),
      selected: el.getAttribute('aria-selected') ?? el.getAttribute('aria-checked'),
      expanded: el.getAttribute('aria-expanded'),
    };
  });
}

const show = (f) => `${f.role}:${f.name}${f.selected ? ` [${f.selected}]` : ''}`;

function triggerState(page, testId) {
  return page.evaluate((id) => {
    const t = document.querySelector(`[data-testid="${id}"] [aria-haspopup]`);
    return {
      expanded: t?.getAttribute('aria-expanded') ?? null,
      focused: document.activeElement === t,
      text: t?.textContent.trim() ?? null,
    };
  }, testId);
}

async function selectCases(page) {
  // OpenList: Banana chosen, Cherry disabled. The first Tab reaches its trigger.
  await story(page, 'base-select--open-list');
  await key(page, 'Tab');
  let t = await triggerState(page, 'select-open');
  record('select: Tab reaches the trigger', t.focused, JSON.stringify(t));

  await key(page, 'Enter');
  let f = await focused(page);
  record('select: Enter opens the list with focus on the chosen option', f.name === 'Banana' && (await triggerState(page, 'select-open')).expanded === 'true', show(f));

  await key(page, 'ArrowDown');
  f = await focused(page);
  record('select: ArrowDown skips the disabled option', f.name === 'Durian', show(f));

  await key(page, 'End');
  f = await focused(page);
  record('select: End jumps to the last option', f.name === 'Elderberry', show(f));

  await key(page, 'ArrowDown');
  f = await focused(page);
  record('select: ArrowDown stops at the end (no wrap)', f.name === 'Elderberry', show(f));

  await key(page, 'Home');
  f = await focused(page);
  record('select: Home jumps to the first option', f.name === 'Apple', show(f));

  await key(page, 'Space', 400);
  t = await triggerState(page, 'select-open');
  record(
    'select: Space chooses, closes, and returns focus to the trigger',
    t.expanded === 'false' && t.focused && t.text.includes('Apple'),
    JSON.stringify(t),
  );

  await key(page, 'ArrowDown', 400);
  f = await focused(page);
  record('select: ArrowDown on the closed trigger opens into the chosen option', f.name === 'Apple', show(f));

  await key(page, 'ArrowDown');
  await key(page, 'Enter', 400);
  t = await triggerState(page, 'select-open');
  record('select: Enter chooses the focused option', t.expanded === 'false' && t.focused && t.text.includes('Banana'), JSON.stringify(t));

  await key(page, 'Space', 400);
  f = await focused(page);
  record('select: Space opens the list with focus on the chosen option', f.name === 'Banana', show(f));

  await key(page, 'Escape', 400);
  t = await triggerState(page, 'select-open');
  record('select: Escape closes and returns focus to the trigger', t.expanded === 'false' && t.focused && t.text.includes('Banana'), JSON.stringify(t));

  await key(page, 'Enter');
  await key(page, 'Tab', 400);
  t = await triggerState(page, 'select-open');
  record('select: Tab closes the list and returns focus to the trigger', t.expanded === 'false' && t.focused, JSON.stringify(t));

  // A pointer open leaves focus on the trigger; an arrow then moves it in.
  const box = await page.evaluate(() => {
    const r = document.querySelector('[data-testid="select-open"] [aria-haspopup]').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(box.x, box.y);
  await sleep(400);
  t = await triggerState(page, 'select-open');
  record('select: a pointer open leaves focus on the trigger', t.expanded === 'true' && t.focused, JSON.stringify(t));
  await key(page, 'ArrowDown');
  f = await focused(page);
  record('select: ArrowDown moves focus from the trigger into the open list', f.name === 'Banana', show(f));
  await key(page, 'Escape', 400);

  // Inside a Dialog: Escape closes the list, not the dialog.
  await story(page, 'base-select--in-dialog');
  await page.focus('[data-testid="dialog-select"] [aria-haspopup]');
  await key(page, 'Enter');
  f = await focused(page);
  record('select in dialog: Enter opens the list into focus', f.name === 'Banana', show(f));
  await key(page, 'Escape', 500);
  t = await triggerState(page, 'dialog-select');
  const dialogAfterOne = await page.evaluate(() => document.querySelector('[data-testid="dialog-state"]')?.textContent);
  record(
    'select in dialog: Escape closes the list and NOT the dialog',
    t.expanded === 'false' && t.focused && dialogAfterOne === 'Dialog open',
    `${JSON.stringify(t)} ${dialogAfterOne}`,
  );
  await key(page, 'Escape', 600);
  const dialogAfterTwo = await page.evaluate(() => document.querySelector('[data-testid="dialog-state"]')?.textContent);
  record('select in dialog: a second Escape closes the dialog (control)', dialogAfterTwo === 'Dialog closed', dialogAfterTwo);
}

async function tabsCases(page) {
  await story(page, 'base-tabs--basic');
  const list = await page.evaluate(() => {
    const l = document.querySelector('[role="tablist"]');
    return l ? { name: l.getAttribute('aria-label'), tabs: l.querySelectorAll('[role="tab"]').length } : null;
  });
  record('tabs: a named tablist owns the tabs', list?.name === 'Profile sections' && list.tabs === 3, JSON.stringify(list));

  await key(page, 'Tab');
  let f = await focused(page);
  record('tabs: Tab lands on the selected tab', f.role === 'tab' && f.name === 'Posts', show(f));

  await key(page, 'ArrowRight');
  f = await focused(page);
  const panel = await page.evaluate(() => document.querySelector('[data-testid="tabs-panel"]')?.textContent);
  record('tabs: ArrowRight moves focus and selects', f.name === 'Replies' && f.selected === 'true' && /replied/.test(panel ?? ''), `${show(f)} / ${panel}`);

  await key(page, 'End');
  f = await focused(page);
  record('tabs: End jumps to the last tab', f.name === 'Media' && f.selected === 'true', show(f));

  await key(page, 'ArrowRight');
  f = await focused(page);
  record('tabs: ArrowRight wraps to the first tab', f.name === 'Posts', show(f));

  await key(page, 'Tab');
  f = await focused(page);
  record('tabs: the next Tab LEAVES the strip (one tab stop)', f.role !== 'tab', show(f));

  await page.keyboard.down('Shift');
  await key(page, 'Tab');
  await page.keyboard.up('Shift');
  f = await focused(page);
  record('tabs: Shift+Tab returns to the selected tab', f.role === 'tab' && f.name === 'Posts', show(f));
}

async function segmentedCases(page) {
  await story(page, 'base-segmented-control--radio');
  await key(page, 'Tab');
  let f = await focused(page);
  record('segmented radio: Tab lands on the checked segment', f.role === 'radio' && f.name === 'System' && f.selected === 'true', show(f));

  await key(page, 'ArrowLeft');
  f = await focused(page);
  record('segmented radio: ArrowLeft moves and checks', f.name === 'Dark' && f.selected === 'true', show(f));

  await key(page, 'ArrowDown');
  await key(page, 'ArrowDown');
  f = await focused(page);
  record('segmented radio: ArrowDown moves and wraps', f.name === 'Light' && f.selected === 'true', show(f));

  await key(page, 'Tab');
  f = await focused(page);
  record('segmented radio: the next Tab LEAVES the group (one tab stop)', f.role !== 'radio', show(f));

  // Space on a segment that is focused but not chosen.
  await page.evaluate(() => {
    const dark = Array.from(document.querySelectorAll('[role="radio"]')).find((el) => el.textContent.trim() === 'Dark');
    dark.focus();
  });
  await key(page, 'Space');
  f = await focused(page);
  record('segmented radio: Space checks the focused segment', f.name === 'Dark' && f.selected === 'true', show(f));

  await story(page, 'base-segmented-control--tabs');
  await key(page, 'Tab');
  await key(page, 'ArrowRight');
  f = await focused(page);
  record('segmented tabs: ArrowRight moves and selects', f.role === 'tab' && f.name === 'Replies' && f.selected === 'true', show(f));
}

/** Is focus on a menu trigger (the element carrying `aria-haspopup="menu"`), and is its menu shut? */
function onMenuTrigger(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    return {
      trigger: el?.getAttribute('aria-haspopup') === 'menu',
      expanded: el?.getAttribute('aria-expanded') ?? null,
      name: el?.getAttribute('aria-label') ?? el?.textContent.trim() ?? null,
    };
  });
}

async function menuCases(page) {
  await story(page, 'base-dropdown--basic');
  await key(page, 'Tab');
  let t = await onMenuTrigger(page);
  record('menu: Tab reaches the trigger', t.trigger && t.expanded === 'false', JSON.stringify(t));

  await key(page, 'Enter');
  let f = await focused(page);
  record('menu: Enter opens with focus on the first row', f.role === 'menuitem' && f.name === 'Profile', show(f));

  await key(page, 'ArrowDown');
  await key(page, 'ArrowDown');
  f = await focused(page);
  record('menu: ArrowDown skips the disabled row', f.name === 'Sign out', show(f));

  await key(page, 'ArrowDown');
  f = await focused(page);
  record('menu: ArrowDown wraps to the first row', f.name === 'Profile', show(f));

  await key(page, 'End');
  f = await focused(page);
  const endName = f.name;
  await key(page, 'Home');
  f = await focused(page);
  record('menu: End and Home jump to the ends', endName === 'Sign out' && f.name === 'Profile', `${endName} / ${show(f)}`);

  await key(page, 'Escape', 400);
  t = await onMenuTrigger(page);
  record('menu: Escape closes and returns focus to the trigger', t.trigger && t.expanded === 'false', JSON.stringify(t));

  await key(page, 'ArrowUp', 400);
  f = await focused(page);
  record('menu: ArrowUp on the trigger opens with focus on the last row', f.name === 'Sign out', show(f));

  await key(page, 'Tab', 400);
  t = await onMenuTrigger(page);
  record('menu: Tab closes and returns focus to the trigger', t.trigger && t.expanded === 'false', JSON.stringify(t));

  await key(page, 'Space', 400);
  f = await focused(page);
  record('menu: Space opens with focus on the first row', f.name === 'Profile', show(f));

  await key(page, 'Enter', 400);
  t = await onMenuTrigger(page);
  record('menu: Enter activates a row, closes, and returns focus', t.trigger && t.expanded === 'false', JSON.stringify(t));

  // Checkbox and radio rows.
  await story(page, 'base-dropdown--selection');
  const status = () => page.evaluate(() => document.querySelector('#storybook-root').textContent.match(/grid: \w+ · ruler: \w+ · sort: \w+/)?.[0]);
  await key(page, 'Tab');
  await key(page, 'Enter');
  f = await focused(page);
  record('menu selection: Enter opens onto the first checkbox row', f.role === 'checkbox' && f.name === 'Grid', show(f));
  await key(page, 'Space');
  f = await focused(page);
  record('menu selection: Space toggles a keepOpen checkbox row and keeps the menu open', f.name === 'Grid' && f.selected === 'false' && /grid: false/.test(await status()), `${show(f)} / ${await status()}`);
  await key(page, 'ArrowDown');
  await key(page, 'Enter');
  f = await focused(page);
  record('menu selection: Enter toggles too', f.name === 'Ruler' && f.selected === 'true' && /ruler: true/.test(await status()), `${show(f)} / ${await status()}`);
  await key(page, 'End');
  await key(page, 'Space', 400);
  t = await onMenuTrigger(page);
  const after = await status();
  record('menu selection: Space selects a radio row, closes, and returns focus', t.trigger && t.expanded === 'false' && /sort: name/.test(after), `${JSON.stringify(t)} / ${after}`);

  // Sub-menu keys still work with the menu keys around them.
  await story(page, 'base-dropdown--submenu');
  await key(page, 'Tab');
  await key(page, 'Enter');
  await key(page, 'ArrowDown');
  f = await focused(page);
  record('submenu: ArrowDown reaches the sub trigger', f.name === 'Send to…', show(f));
  await key(page, 'ArrowRight', 400);
  f = await focused(page);
  record('submenu: ArrowRight enters the flyout on its first row', f.name === 'Email', show(f));
  await key(page, 'ArrowDown');
  await key(page, 'ArrowDown');
  f = await focused(page);
  record('submenu: arrows move and wrap inside the flyout', f.name === 'Email', show(f));
  await key(page, 'ArrowLeft', 400);
  f = await focused(page);
  record('submenu: ArrowLeft leaves the flyout onto its trigger', f.name === 'Send to…' && f.expanded === 'false', `${show(f)} expanded=${f.expanded}`);
  await key(page, 'ArrowRight', 400);
  await key(page, 'Escape', 400);
  f = await focused(page);
  record('submenu: Escape closes only the flyout', f.name === 'Send to…' && f.expanded === 'false', `${show(f)} expanded=${f.expanded}`);
  await key(page, 'Escape', 400);
  t = await onMenuTrigger(page);
  record('submenu: a second Escape closes the menu onto its trigger', t.trigger && t.expanded === 'false', JSON.stringify(t));
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
    page.on('pageerror', (error) => console.log(`pageerror: ${error.message}`));
    await selectCases(page);
    await tabsCases(page);
    await segmentedCases(page);
    await menuCases(page);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed (expected ${EXPECTED_CASES} cases)`);
  if (failed.length > 0 || results.length !== EXPECTED_CASES) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
