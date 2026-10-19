// Drives the BlockEditor story in a real Chrome and asserts Notion-style
// editing end to end: typing, Return, Backspace, Tab, markdown and slash
// shortcuts, checkboxes, toggles, the block menu, drag and drop, undo, and
// the collaboration surface (range decorations, format actions, confirming
// removals).
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

// Notion parity: colour, ⌘K, HTML paste, block selection, code, block links, equations.
const SELECTED = 'rgba(35, 131, 226, 0.14)';
const selectedRows = (page) =>
  page.$$eval(
    '[id^="bloom-block-"]',
    (els, bg) =>
      els
        .filter((el) => getComputedStyle(el).backgroundColor === bg)
        .map((el) => el.querySelector('[contenteditable]')?.innerText.trim() ?? ''),
    SELECTED,
  );
const textOf = (page, needle) =>
  page.evaluate((t) => {
    const s = globalThis.__bloomEditorStore;
    return Object.values(s.doc.blocks).find((b) =>
      (b.text || [])
        .map((x) => x.text)
        .join('')
        .includes(t),
    );
  }, needle);

{
  const page = await open();
  // Text colour from the format bar, kept through typing, drawn when not editing.
  await clickInto(page, 'Real-time collaboration');
  await press(page, 'Home');
  await page.keyboard.down('Shift');
  await press(page, 'End');
  await page.keyboard.up('Shift');
  await sleep(150);
  await page.click('[aria-label="Text color"]');
  await sleep(150);
  await page.click('[aria-label="Color: Red"]');
  await sleep(150);
  let todo = await textOf(page, 'Real-time');
  await check(
    page,
    todo.text.every((x) => x.color === 'red'),
    'the format bar colours the selection',
  );
  await press(page, 'End');
  await type(page, '!');
  todo = await textOf(page, 'Real-time');
  await check(
    page,
    todo.text.length === 1 && todo.text[0].color === 'red' && todo.text[0].text.endsWith('!'),
    `a colour survives typing (${JSON.stringify(todo.text)})`,
  );
  await clickInto(page, 'Project plan');
  const drawn = await page.evaluate(() =>
    [...document.querySelectorAll('[id^="bloom-block-"] span, [id^="bloom-block-"] div')].some(
      (el) =>
        !el.closest('[contenteditable]') &&
        el.textContent === 'Real-time collaboration!' &&
        getComputedStyle(el).color === 'rgb(212, 76, 71)',
    ),
  );
  await check(page, drawn, 'a coloured block shows its colour while not being edited');

  // ⌘K / Ctrl-K links the selection.
  await press(page, 'Home');
  await page.keyboard.down('Shift');
  await press(page, 'End');
  await page.keyboard.up('Shift');
  await press(page, 'k', 'Control');
  await check(
    page,
    await page.$('[aria-label="Link"][placeholder]'),
    'Ctrl-K opens the link field',
  );
  await type(page, 'example.org');
  await press(page, 'Enter');
  await sleep(200);
  const heading = await textOf(page, 'Project plan');
  await check(
    page,
    heading.text[0]?.link === 'https://example.org',
    `the link field links the selection (${JSON.stringify(heading.text)})`,
  );

  // HTML paste makes blocks.
  await clickInto(page, 'Callouts stand out.');
  await press(page, 'End');
  await page.evaluate(() => {
    const target = document.activeElement;
    const data = new DataTransfer();
    data.setData(
      'text/html',
      '<h2>Pasted</h2><ul><li><input type="checkbox" checked> done</li><li>item <b>bold</b></li></ul><pre><code class="language-python">print(1)</code></pre>',
    );
    data.setData('text/plain', 'Pasted');
    target.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
  });
  await sleep(300);
  let doc = await outline(page);
  const at = doc.indexOf('callout:Callouts stand out.Pasted');
  await check(
    page,
    at >= 0 &&
      doc[at + 1] === 'todo[x]:done' &&
      doc[at + 2] === 'bulleted_list_item:item bold' &&
      doc[at + 3] === 'code:print(1)',
    'pasted HTML becomes blocks',
  );
  for (let i = 0; i < 1; i += 1) await press(page, 'z', 'Control');
  doc = await outline(page);
  await check(
    page,
    doc.includes('callout:Callouts stand out.') && !doc.includes('todo[x]:done'),
    'one undo takes the paste back',
  );

  // Block selection: Escape, Shift-arrows, Tab, Shift-Tab, Backspace.
  await clickInto(page, 'Second');
  await press(page, 'Escape');
  await press(page, 'ArrowUp', 'Shift');
  await check(
    page,
    JSON.stringify(await selectedRows(page)) === JSON.stringify(['First', 'Second']),
    `Shift-↑ extends the block selection (${await selectedRows(page)})`,
  );
  await press(page, 'Tab');
  doc = await outline(page);
  await check(
    page,
    doc.includes('  numbered_list_item:First') && doc.includes('  numbered_list_item:Second'),
    'Tab nests every selected block',
  );
  await press(page, 'Tab', 'Shift');
  doc = await outline(page);
  await check(
    page,
    doc.includes('numbered_list_item:First') && doc.includes('numbered_list_item:Second'),
    'Shift-Tab takes them out again',
  );
  await press(page, 'Backspace');
  doc = await outline(page);
  await check(
    page,
    !doc.some((l) => l.includes('First') || l.includes('Second')),
    'Backspace deletes the selected blocks',
  );
  await press(page, 'z', 'Control');
  doc = await outline(page);
  await check(page, doc.includes('numbered_list_item:First'), 'undo brings them back');

  // Shift-click from the block being edited.
  await clickInto(page, 'Ship the editor');
  await page.keyboard.down('Shift');
  await (await input(page, 'First')).click();
  await page.keyboard.up('Shift');
  await sleep(200);
  let rows = await selectedRows(page);
  await check(
    page,
    rows[0] === 'Ship the editor' && rows[rows.length - 1] === 'First',
    `Shift-click selects the blocks between (${rows})`,
  );

  // Dragging out of one block's text into another.
  const from = await (await input(page, 'Ship the editor')).boundingBox();
  const to = await (await input(page, 'Second')).boundingBox();
  await page.mouse.move(from.x + 20, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 60, from.y + from.height / 2, { steps: 3 });
  await page.mouse.move(to.x + 20, to.y + to.height / 2, { steps: 10 });
  await page.mouse.up();
  await sleep(200);
  rows = await selectedRows(page);
  await check(
    page,
    rows[0] === 'Ship the editor' && rows[rows.length - 1] === 'Second',
    `a drag across blocks selects them (${rows})`,
  );
  await press(page, 'Escape');

  // Code: highlighted while not edited, a language menu.
  const highlighted = await page.evaluate(() =>
    [...document.querySelectorAll('[id^="bloom-block-"] span, [id^="bloom-block-"] div')].some(
      (el) =>
        !el.closest('[contenteditable]') &&
        el.textContent === 'const' &&
        getComputedStyle(el).color === 'rgb(144, 101, 176)',
    ),
  );
  await check(page, highlighted, 'a code block is highlighted while not being edited');
  const code = await row(page, 'const answer = "42";');
  await code.hover();
  await sleep(150);
  await (await code.$('[aria-label="Language: JavaScript"]')).click();
  await sleep(250);
  const python = await page.evaluateHandle(() =>
    [...document.querySelectorAll('[role="menuitem"]')].find((e) => e.innerText === 'Python'),
  );
  await python.click();
  await sleep(200);
  const codeBlock = await textOf(page, 'const answer');
  await check(page, codeBlock.props.language === 'python', 'the language menu sets the language');

  // Copy link to block.
  const quote = await row(page, 'Simple things should be simple.');
  await quote.hover();
  await sleep(150);
  await (await quote.$('[aria-label="Block options"]')).click();
  await sleep(250);
  const copy = await page.evaluateHandle(() =>
    [...document.querySelectorAll('[role="menuitem"]')].find(
      (e) => e.innerText === 'Copy link to block',
    ),
  );
  await copy.click();
  await sleep(150);
  const opened = await page.evaluate(() => globalThis.__bloomOpened ?? []);
  await check(
    page,
    opened.some((o) => o.startsWith('block:')),
    'the block menu copies a link to the block',
  );

  // Inline equations.
  await clickInto(page, 'Simple things should be simple.');
  await press(page, 'End');
  await type(page, ' $$x^2$$');
  const eq = await textOf(page, 'Simple things');
  await check(
    page,
    eq.text.some(
      (x) => x.mention?.attributes?.kind === 'equation' && x.mention.attributes.latex === 'x^2',
    ),
    `$$…$$ makes an inline equation (${JSON.stringify(eq.text)})`,
  );
  await page.close();
}

// Collaboration: text-range decorations (drawn over the text while it is not
// being edited, measured on the input while it is), format actions, and
// confirming before blocks are removed.
{
  const page = await open();
  const HIGHLIGHT = 'rgb(255, 230, 150)';
  const CARET = 'rgb(200, 0, 0)';
  const quoteId = await page.evaluate(
    () =>
      Object.values(globalThis.__bloomEditorStore.doc.blocks).find((b) => b.type === 'quote').id,
  );
  await page.evaluate((id) => {
    globalThis.__bloomDecorations.set(
      new Map([
        [
          id,
          {
            ranges: [
              { start: 0, end: 6, background: 'rgb(255, 230, 150)' },
              { start: 13, end: 13, caret: { color: 'rgb(200, 0, 0)', label: 'Ana' } },
            ],
          },
        ],
      ]),
    );
  }, quoteId);
  await sleep(200);

  /** Where the input draws characters `from`–`to` of the quote's text. */
  const inputBox = (from, to) =>
    page.evaluate(
      (id, a, b) => {
        const surface = document
          .getElementById(`bloom-block-${id}`)
          .querySelector('[contenteditable]');
        const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode();
        const range = document.createRange();
        range.setStart(node, a);
        range.setEnd(node, b);
        const r = range.getClientRects()[0];
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      },
      quoteId,
      from,
      to,
    );
  /** Boxes painted `color` in the quote's row, outside its input. */
  const painted = (color, prop) =>
    page.evaluate(
      (id, c, p) =>
        [...document.getElementById(`bloom-block-${id}`).querySelectorAll('span, div')]
          .filter((el) => !el.closest('[contenteditable]') && getComputedStyle(el)[p] === c)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { text: el.textContent, x: r.left, y: r.top, width: r.width, height: r.height };
          }),
      quoteId,
      color,
      prop,
    );
  const near = (a, b) => Math.abs(a - b) <= 1.5;

  // Not being edited: drawn with the text, exactly where the input draws it.
  let marks = await painted(HIGHLIGHT, 'backgroundColor');
  let expected = await inputBox(0, 6);
  await check(
    page,
    marks.length === 1 &&
      marks[0].text === 'Simple' &&
      near(marks[0].x, expected.x) &&
      near(marks[0].width, expected.width),
    `a highlight is drawn behind its text while not editing (${JSON.stringify(marks)} vs ${JSON.stringify(expected)})`,
  );
  let carets = await painted(CARET, 'borderLeftColor');
  let at = await inputBox(13, 13);
  await check(
    page,
    carets.length === 1 && near(carets[0].x + 1, at.x) && carets[0].text.includes('Ana'),
    `a caret is drawn at its offset with its name (${JSON.stringify(carets)} vs ${JSON.stringify(at)})`,
  );
  const flag = await page.evaluate(() =>
    [...document.querySelectorAll('[id^="bloom-block-"] span')].some((el) => {
      const box = el.getBoundingClientRect();
      return (
        el.textContent === 'Ana' &&
        getComputedStyle(el).backgroundColor === 'rgb(200, 0, 0)' &&
        box.width > 10 &&
        box.height < 20
      );
    }),
  );
  await check(page, flag, 'the caret’s name is on a flag of its colour, on one line');
  if (process.env.SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/ranges-drawn.png` });
  }

  // Being edited (web): measured on the input and drawn over it.
  await clickInto(page, 'Simple things should be simple.');
  await sleep(150);
  marks = await painted(HIGHLIGHT, 'backgroundColor');
  expected = await inputBox(0, 6);
  await check(
    page,
    marks.length === 1 &&
      marks[0].text === '' &&
      near(marks[0].x, expected.x) &&
      near(marks[0].y, expected.y) &&
      near(marks[0].width, expected.width) &&
      near(marks[0].height, expected.height),
    `a highlight is measured on the input while editing (${JSON.stringify(marks)} vs ${JSON.stringify(expected)})`,
  );
  if (process.env.SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/ranges-measured.png` });
  }
  carets = await painted(CARET, 'backgroundColor');
  at = await inputBox(13, 13);
  const caretBar = carets.find((c) => c.width <= 3);
  await check(
    page,
    caretBar !== undefined && near(caretBar.x + 1, at.x) && near(caretBar.y, at.y),
    `a caret is measured on the input while editing (${JSON.stringify(carets)} vs ${JSON.stringify(at)})`,
  );
  // Typing before it moves the text; the app's offsets are where they were.
  await press(page, 'Home');
  await type(page, 'So ');
  marks = await painted(HIGHLIGHT, 'backgroundColor');
  expected = await inputBox(0, 6);
  await check(
    page,
    marks.length === 1 && near(marks[0].x, expected.x) && near(marks[0].width, expected.width),
    `the measured highlight follows the input's text as it changes (${JSON.stringify(marks)} vs ${JSON.stringify(expected)})`,
  );
  await press(page, 'z', 'Control');

  // A format action receives the selected text's block and offsets.
  await press(page, 'Home');
  for (let i = 0; i < 6; i += 1) await press(page, 'ArrowRight', 'Shift');
  await page.waitForSelector('[aria-label="Formatting"] [aria-label="Comment"]', {
    timeout: 2000,
  });
  await (await page.$('[aria-label="Formatting"] [aria-label="Comment"]')).click();
  await sleep(150);
  const opened = await page.evaluate(() => globalThis.__bloomOpened ?? []);
  await check(
    page,
    opened.includes(`comment:${quoteId}:0-6`),
    `the format action gets the selection (${opened})`,
  );

  // Removing selected blocks asks first; a no keeps them.
  await page.evaluate(() => {
    globalThis.__bloomConfirm = false;
  });
  await clickInto(page, 'Simple things should be simple.');
  await press(page, 'Escape');
  await press(page, 'Backspace');
  let doc = await outline(page);
  await check(
    page,
    doc.includes('quote:Simple things should be simple.'),
    'Backspace on selected blocks keeps them when the app says no',
  );
  await page.evaluate(() => {
    globalThis.__bloomConfirm = true;
  });
  await press(page, 'Backspace');
  doc = await outline(page);
  await check(
    page,
    !doc.some((l) => l.includes('Simple things')),
    'Backspace removes them when the app agrees',
  );
  const asked = await page.evaluate(
    () => (globalThis.__bloomOpened ?? []).filter((o) => o.startsWith('confirm:')).length,
  );
  await check(page, asked === 2, `the app is asked each time (${asked})`);
  await page.close();
}

await browser.close();
assert.deepEqual(errors, [], 'no page errors');
console.log('verify-editor: all assertions passed');
