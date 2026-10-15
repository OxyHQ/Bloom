// Drives the BlockEditor story in a real Chrome and asserts Notion-style
// editing end to end: typing, Return, Backspace, Tab, markdown and slash
// shortcuts, checkboxes, toggles, the block menu, drag and drop, and undo.
//
// Jest cannot see any of this: it is the browser's editing surface, focus and
// pointer hit-testing that are under test.
//
//   bun run storybook:build                      # from the repo root
//   bunx http-server storybook-static -p 6107     # or any static server
//   CHROME_PATH=… node packages/bloom-editor/scripts/verify-editor.mjs
//
// Env: STORYBOOK_URL (default http://127.0.0.1:6107), CHROME_PATH,
// BLOOM_PUPPETEER_MODULE (default puppeteer-core).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const BASE = process.env.STORYBOOK_URL || 'http://127.0.0.1:6107';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox'],
});
const errors = [];

async function open() {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: 1000, height: 800 });
  await page.goto(`${BASE}/iframe.html?id=editor-blockeditor--playground&viewMode=story`, {
    waitUntil: 'networkidle0',
  });
  await sleep(800);
  return page;
}

/** The document as `type:text` lines, children indented. */
const outline = (page) =>
  page.evaluate(() => {
    const s = globalThis.__bloomEditorStore;
    const out = [];
    const visit = (ids, d) =>
      ids.forEach((id) => {
        const b = s.doc.blocks[id];
        const flag = b.type !== 'todo' ? '' : b.props.checked ? '[x]' : '[ ]';
        out.push(`${'  '.repeat(d)}${b.type}${flag}:${(b.text || []).map((x) => x.text).join('')}`);
        visit(b.children, d + 1);
      });
    visit(s.doc.root, 0);
    return out;
  });

/** Assert, printing the document when the assertion fails. */
async function check(page, condition, message) {
  if (!condition) {
    console.error(`FAILED: ${message}\n  ${(await outline(page)).join('\n  ')}`);
    if (process.env.SCREENSHOT_DIR)
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/failed.png` });
  }
  assert.ok(condition, message);
}

async function input(page, text) {
  for (const h of await page.$$('[contenteditable="true"]')) {
    if ((await h.evaluate((e) => e.innerText.trim())) === text) return h;
  }
  throw new Error(`no block "${text}"`);
}

const row = (page, text) =>
  page.evaluateHandle(
    (t) =>
      [...document.querySelectorAll('[id^="bloom-block-"]')].find(
        (el) => el.querySelector('[contenteditable]')?.innerText.trim() === t,
      ),
    text,
  );

/**
 * Click into a block's text and wait as a person would before typing:
 * ProseMirror restores its own selection 20ms after it gains focus if the
 * DOM differs, so a key sent inside that window is undone.
 */
async function clickInto(page, text) {
  await (await input(page, text)).click();
  await sleep(100);
}

async function type(page, text) {
  await page.keyboard.type(text, { delay: 25 });
  await sleep(120);
}

async function press(page, key, modifier) {
  if (modifier) await page.keyboard.down(modifier);
  await page.keyboard.press(key);
  if (modifier) await page.keyboard.up(modifier);
  await sleep(150);
}

// Typing, Return, lists, markdown, slash, undo.
{
  const page = await open();
  await clickInto(page, 'Real-time collaboration');
  await press(page, 'End');
  await press(page, 'Enter');
  await type(page, 'Write docs');
  await press(page, 'Enter');
  await press(page, 'Enter'); // an empty to-do leaves the list
  await type(page, '# Section');
  await press(page, 'Enter');
  await type(page, '/quo');
  await check(page, await page.$('[role="menu"]'), 'the slash menu opens');
  await press(page, 'Enter');
  await type(page, 'Quoted');
  let doc = await outline(page);
  await check(page, doc.includes('todo[ ]:Write docs'), 'Return continues a to-do list');
  await check(page, doc.includes('heading_1:Section'), '"# " makes a heading');
  await check(page, doc.includes('quote:Quoted'), '/quote turns the block into a quote');
  await check(page, !doc.some((line) => line.includes('\n')), 'no stray line breaks');

  await press(page, 'z', 'Control');
  doc = await outline(page);
  await check(page, doc.includes('quote:'), 'undo removes the typed word as one step');

  await clickInto(page, 'First');
  await press(page, 'End');
  await press(page, 'Enter');
  await type(page, 'Third');
  await press(page, 'Tab');
  // ProseMirror treats a caret jump to the document start within 200ms of a
  // focus (with no click) as the browser resetting the selection, and undoes
  // it; Tab re-mounts the nested block, so wait as a person would before Home.
  await sleep(300);
  doc = await outline(page);
  await check(
    page,
    doc.includes('  numbered_list_item:Third'),
    'Tab nests under the previous item',
  );
  await press(page, 'Home');
  await press(page, 'Backspace');
  doc = await outline(page);
  if (!doc.includes('  paragraph:Third')) console.log(doc.join('\n'));
  await check(
    page,
    doc.includes('  paragraph:Third'),
    'Backspace at the start reverts to a paragraph',
  );
  await page.close();
}

// Checkboxes, toggles, merging, the block menu, drag and drop, undo.
{
  const page = await open();
  const boxes = await page.$$('[role="checkbox"]');
  await boxes[1].click();
  await sleep(150);
  await check(
    page,
    (await outline(page)).includes('todo[x]:Real-time collaboration'),
    'a checkbox checks',
  );

  await (await page.$('[aria-expanded="true"]')).click();
  await sleep(200);
  const nestedVisible = await page.evaluate(() =>
    [...document.querySelectorAll('[contenteditable]')].some((e) =>
      e.innerText.includes('Nested inside'),
    ),
  );
  await check(page, nestedVisible === false, 'a closed toggle hides its children');

  await clickInto(page, 'Second');
  await press(page, 'Home');
  await press(page, 'Backspace');
  await press(page, 'Backspace');
  await check(
    page,
    (await outline(page)).includes('numbered_list_item:FirstSecond'),
    'Backspace merges into the previous block',
  );

  const quote = await row(page, 'Simple things should be simple.');
  await quote.hover();
  await sleep(150);
  await (await quote.$('[aria-label="Block options"]')).click();
  await sleep(250);
  const items = await page.$$eval('[role="menuitem"]', (els) => els.map((e) => e.innerText));
  await check(
    page,
    items.includes('Duplicate') && items.includes('Heading 1'),
    'the block menu lists actions and types',
  );
  await press(page, 'Escape');

  const callout = await row(page, 'Callouts stand out.');
  await callout.hover();
  await sleep(150);
  const grip = await (await callout.$('[aria-label="Block options"]')).boundingBox();
  const top = await (await row(page, 'Project plan')).boundingBox();
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + 10, grip.y - 20, { steps: 4 });
  await page.mouse.move(top.x + 100, top.y + 4, { steps: 8 });
  await sleep(100);
  await page.mouse.up();
  await sleep(250);
  await check(
    page,
    (await outline(page))[0] === 'callout:Callouts stand out.',
    'drag and drop moves a block above another',
  );

  await clickInto(page, 'Project plan');
  for (let i = 0; i < 6; i += 1) await press(page, 'z', 'Control');
  const doc = await outline(page);
  await check(page, doc[0] === 'heading_1:Project plan', 'undo walks every step back');
  assert.ok(doc.includes('numbered_list_item:Second'));
  await page.close();
}

await browser.close();
assert.deepEqual(errors, [], 'no page errors');
console.log('verify-editor: all assertions passed');
