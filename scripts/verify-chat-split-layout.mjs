/**
 * ChatSplitLayout in a real browser: the pane widths and the compact switch.
 *
 * The panes are laid out by AppShellPanels from the MEASURED container, which
 * jsdom never has (every box is 0 wide, so every pane is "too narrow" and
 * collapses). `ChatScreen.test.tsx` pins what jsdom can see — which panes stay
 * mounted, hidden and inert — and this pins the geometry.
 *
 *   STORYBOOK_URL=http://localhost:6006 CHROME_PATH=… node scripts/verify-chat-split-layout.mjs
 */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
let puppeteer;
for (const name of ['puppeteer-core', '/home/nate/Oxy/Homiio/node_modules/puppeteer-core']) {
  try {
    puppeteer = require(name);
    break;
  } catch {}
}
if (!puppeteer) throw Error('Install puppeteer-core to run browser checks.');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
try {
  for (const [width, compact] of [
    [1400, false],
    [600, true],
  ]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewport({ width, height: 900 });
    await page.goto(
      `${base}/iframe.html?id=blocks-chat-chat-screen--split-layout-panes&viewMode=story`,
      { waitUntil: 'networkidle0' },
    );
    await page.waitForSelector('[data-testid="split-conversation"]');
    const pane = (id) =>
      page.$eval(`[data-testid="${id}"]`, (element) => ({
        width: Math.round(element.getBoundingClientRect().width),
        hidden: element.getAttribute('aria-hidden') === 'true',
        inert: element.hasAttribute('inert'),
      }));
    const list = await pane('split-list');
    const info = await pane('split-info');
    const conversation = await pane('split-conversation');
    if (compact) {
      // One pane: the conversation fills the row, the others stay mounted but
      // take no width and leave the accessibility tree and the tab order.
      assert.ok(conversation.width > 500, `conversation ${conversation.width}`);
      assert.deepEqual(list, { width: 0, hidden: true, inert: true });
      assert.deepEqual(info, { width: 0, hidden: true, inert: true });
    } else {
      assert.equal(list.width, 340);
      assert.equal(info.width, 380);
      assert.ok(conversation.width > 320, `conversation ${conversation.width}`);
      assert.equal(list.hidden || info.hidden || conversation.hidden, false);
      const grip = await page.$('[role="separator"][aria-label="Resize the conversation list"]');
      assert.ok(grip, 'the list grip is named');
    }
    assert.deepEqual(errors, []);
    console.log(
      `ok ${width}px: list ${list.width}, conversation ${conversation.width}, info ${info.width}`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
