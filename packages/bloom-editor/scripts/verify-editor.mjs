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

async function open(story = 'playground') {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: 1000, height: 800 });
  await page.goto(`${BASE}/iframe.html?id=editor-blockeditor--${story}&viewMode=story`, {
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

// Formatting a selection: the bubble's marks and link.
{
  const page = await open();
  const quote = () =>
    page.evaluate(() => {
      const s = globalThis.__bloomEditorStore;
      const b = Object.values(s.doc.blocks).find((x) => x.type === 'quote');
      return b.text;
    });
  const bubbleButton = async (label) => {
    await page.waitForSelector(`[aria-label="Formatting"] [aria-label="${label}"]`, {
      timeout: 2000,
    });
    await (await page.$(`[aria-label="Formatting"] [aria-label="${label}"]`)).click();
    await sleep(250);
  };
  await clickInto(page, 'Simple things should be simple.');
  await press(page, 'Home');
  for (let i = 0; i < 6; i += 1) await press(page, 'ArrowRight', 'Shift');
  await bubbleButton('Bold');
  let text = await quote();
  await check(
    page,
    text[0]?.text === 'Simple' && text[0]?.bold === true,
    `Bold marks the selection (${JSON.stringify(text)})`,
  );

  await press(page, 'End');
  await press(page, 'ArrowLeft');
  for (let i = 0; i < 6; i += 1) await press(page, 'ArrowLeft', 'Shift');
  await bubbleButton('Link');
  await page.waitForSelector('[aria-label="Formatting"] input', { timeout: 2000 });
  await type(page, 'example.com');
  await press(page, 'Enter');
  await sleep(250);
  text = await quote();
  const linked = text.find((s) => s.link);
  await check(
    page,
    linked?.text === 'simple' && linked?.link === 'https://example.com',
    `Link links the selection (${JSON.stringify(text)})`,
  );
  await check(page, !(await page.$('[aria-label="Formatting"] input')), 'the link field closes');

  // The selection is back in the editor: the same word, now a link.
  await bubbleButton('Remove link');
  text = await quote();
  await check(page, !text.some((s) => s.link), `Remove link unlinks it (${JSON.stringify(text)})`);
  await page.close();
}

// A link under the caret: its popover follows it or removes it.
{
  const page = await open();
  await clickInto(page, 'Write with bold, links and more. Type / for commands.');
  // Put the caret inside "links".
  await press(page, 'Home');
  for (let i = 0; i < 'Write with bold, li'.length; i += 1) await press(page, 'ArrowRight');
  await page.waitForSelector('[aria-label="Open"]', { timeout: 2000 });
  await (await page.$('[aria-label="Open"]')).click();
  await sleep(200);
  const opened = await page.evaluate(() => globalThis.__bloomOpened ?? []);
  await check(
    page,
    opened.includes('https://example.com/docs'),
    `Open follows the link (${opened})`,
  );
  await (await page.$('[aria-label="Remove link"]')).click();
  await sleep(250);
  const linked = await page.evaluate(() =>
    Object.values(globalThis.__bloomEditorStore.doc.blocks).some((b) =>
      (b.text || []).some((s) => s.link),
    ),
  );
  await check(page, !linked, 'Remove link unlinks it');
  await page.close();
}

// Pasting lines makes a block of each, Markdown prefixes included.
{
  const page = await open();
  await clickInto(page, 'Second');
  await press(page, 'End');
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData('text/plain', ' half\n# Heading\n- item\nlast');
    document.activeElement.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
  });
  await sleep(400);
  const doc = await outline(page);
  const at = doc.indexOf('numbered_list_item:Second half');
  await check(
    page,
    at >= 0 &&
      doc[at + 1] === 'heading_1:Heading' &&
      doc[at + 2] === 'bulleted_list_item:item' &&
      doc[at + 3] === 'numbered_list_item:last',
    'a pasted block of lines becomes blocks',
  );
  await page.close();
}

// Selected blocks copy and cut as Markdown.
{
  const page = await open();
  await clickInto(page, 'Simple things should be simple.');
  await press(page, 'Escape');
  const clip = (kind) =>
    page.evaluate((k) => {
      const data = new DataTransfer();
      document.dispatchEvent(
        new ClipboardEvent(k, { clipboardData: data, bubbles: true, cancelable: true }),
      );
      return data.getData('text/plain');
    }, kind);
  const copied = await clip('copy');
  await check(
    page,
    copied.trim() === '> Simple things should be simple.',
    `copy gives Markdown (${copied})`,
  );
  await clip('cut');
  await sleep(200);
  await check(
    page,
    !(await outline(page)).some((l) => l.includes('Simple things')),
    'cut removes the selected block',
  );
  await page.close();
}

// A toggle heading folds what is written under it.
{
  const page = await open();
  await clickInto(page, 'Callouts stand out.');
  await press(page, 'End');
  await press(page, 'Enter');
  await type(page, '/toggle heading');
  await press(page, 'Enter');
  await type(page, 'Folding');
  await press(page, 'Enter');
  await type(page, 'Tucked away');
  const doc = await outline(page);
  await check(
    page,
    doc.includes('heading_1:Folding') && doc.includes('  paragraph:Tucked away'),
    'Return writes inside the toggle heading',
  );
  const chevrons = await page.$$('[aria-expanded="true"]');
  await chevrons[chevrons.length - 1].click();
  await sleep(200);
  const visible = await page.evaluate(() =>
    [...document.querySelectorAll('[contenteditable]')].some((e) =>
      e.innerText.includes('Tucked away'),
    ),
  );
  await check(page, !visible, 'collapsing it hides its content');
  await page.close();
}

// Menus hang over the blocks below them and take the mouse.
{
  const page = await open();
  await clickInto(page, 'First');
  await press(page, 'End');
  await press(page, 'Enter');
  await type(page, '/quo');
  const item = await page.waitForSelector('[role="menuitem"]', { timeout: 2000 });
  await item.click();
  await sleep(250);
  await check(page, (await outline(page)).includes('quote:'), 'clicking a slash item picks it');
  await page.close();
}

// The touch toolbar: shown while a block has the keyboard, acting on it.
{
  const page = await open('with-toolbar');
  const bar = '[role="toolbar"][aria-label="Formatting"]';
  await check(page, !(await page.$(bar)), 'no toolbar before editing');
  await clickInto(page, 'Second');
  await page.waitForSelector(bar, { timeout: 2000 });
  const tap = async (label) => {
    await (await page.$(`${bar} [aria-label="${label}"]`)).click();
    await sleep(250);
  };
  await tap('Block options');
  const options = await page.$$eval('[role="menuitem"]', (els) => els.map((e) => e.innerText));
  await check(page, options.includes('Duplicate'), 'the toolbar opens the block menu');
  await press(page, 'Escape');
  await page.mouse.click(5, 5);
  await sleep(200);
  await clickInto(page, 'Second');
  await page.waitForSelector(bar, { timeout: 2000 });
  await tap('Indent');
  let doc = await outline(page);
  await check(page, doc.includes('  numbered_list_item:Second'), 'Indent nests the block');
  await tap('Undo');
  doc = await outline(page);
  await check(page, doc.includes('numbered_list_item:Second'), 'Undo takes it back');
  await press(page, 'End');
  await tap('Mention');
  await type(page, 'ben');
  await sleep(200);
  const menu = await page.$$eval('[role="menuitem"]', (els) => els.map((e) => e.innerText));
  await check(
    page,
    menu.some((label) => label.includes('Ben Ito')),
    'the mention button starts a mention',
  );
  await page.close();
}

// Mentions: typing @ opens the menu, matches narrow as you type, Return inserts.
{
  const page = await open();
  await clickInto(page, 'First');
  await press(page, 'End');
  await type(page, ' with @an');
  await sleep(200);
  const menu = await page.$$eval('[role="menuitem"]', (els) => els.map((e) => e.innerText));
  await check(
    page,
    menu.some((label) => label.includes('Ana Ruiz')),
    'the mention menu lists matches',
  );
  await press(page, 'Enter');
  await sleep(200);
  const mention = await page.evaluate(() => {
    const s = globalThis.__bloomEditorStore;
    for (const b of Object.values(s.doc.blocks)) {
      const seg = (b.text || []).find((x) => x.mention);
      if (seg) return { text: seg.text, mention: seg.mention };
    }
    return null;
  });
  await check(
    page,
    mention?.mention?.attributes?.kind === 'user' &&
      mention?.mention?.attributes?.id === 'Ana Ruiz',
    `Return inserts the mention with its attributes (${JSON.stringify(mention)})`,
  );
  await check(page, !(await page.$('[role="menu"]')), 'the mention menu closes');
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

// EditorSurface: two notes the app lays out side by side over one store.
{
  const page = await open('surface');
  await clickInto(page, 'One');
  await press(page, 'End');
  await press(page, 'Enter');
  await type(page, 'Two');
  let doc = await outline(page);
  await check(
    page,
    JSON.stringify(doc) ===
      JSON.stringify([
        'note:',
        '  heading_2:Left note',
        '  paragraph:One',
        '  paragraph:Two',
        'note:',
        '  paragraph:Right note',
      ]),
    'Return in a note writes inside that note',
  );

  await page.click('[aria-label="Add to note 2"]');
  await sleep(200);
  await type(page, 'Added');
  doc = await outline(page);
  await check(
    page,
    doc.slice(-3).join('|') === 'note:|  paragraph:Right note|  paragraph:Added',
    'appendChild adds to the end of the note, with the caret in it',
  );

  await type(page, ' /');
  await check(page, await page.$('[role="menu"]'), 'the slash menu opens inside a note');
  await press(page, 'Escape');

  for (let i = 0; i < 4; i += 1) await press(page, 'z', 'Control');
  doc = await outline(page);
  await check(
    page,
    !doc.some((line) => line.includes('Added')) && !doc.includes('  paragraph:Two'),
    'undo walks back across both notes',
  );
  await page.close();
}

await browser.close();
assert.deepEqual(errors, [], 'no page errors');
console.log('verify-editor: all assertions passed');
