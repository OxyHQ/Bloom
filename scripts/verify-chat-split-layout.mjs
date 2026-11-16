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
    await page.goto(`${base}/iframe.html?id=blocks-chat-chat-screen--full-screen&viewMode=story`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('[data-testid="split-conversation"]');
    const pane = async (id) => {
      await page.waitForFunction(() =>
        ['split-list', 'split-conversation', 'split-info'].every((name) => {
          const element = document.querySelector(`[data-testid="${name}"]`);
          return (
            element?.getAttribute('aria-hidden') !== 'true' ||
            Math.round(element.getBoundingClientRect().width) === 0
          );
        }),
      );
      return page.$eval(`[data-testid="${id}"]`, (element) => ({
        width: Math.round(element.getBoundingClientRect().width),
        hidden: element.getAttribute('aria-hidden') === 'true',
        inert: element.hasAttribute('inert'),
      }));
    };
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="split-conversation"]')?.getBoundingClientRect()
          .width > 500,
    );
    const host = await page.$eval('[data-testid="split"]', (element) => ({
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    }));
    assert(
      host.width >= width - 32 && host.height >= 836,
      `The workspace follows the real shell viewport: ${JSON.stringify(host)}`,
    );
    const list = await pane('split-list');
    const conversation = await pane('split-conversation');
    if (compact) {
      assert.ok(conversation.width > 500, `conversation ${conversation.width}`);
      assert.deepEqual(list, { width: 0, hidden: true, inert: true });
    } else {
      assert.equal(list.width, 340);
      assert.equal(list.hidden || conversation.hidden, false);
    }

    // The real identity opens the info pane. Desktop keeps the three regions;
    // compact keeps the hidden list and conversation mounted but inert.
    await page.click('[data-testid="split-conversation"] [aria-label="Ana Restrepo"]');
    await page.waitForFunction(
      () =>
        Math.round(
          document.querySelector('[data-testid="split-info"]')?.getBoundingClientRect().width ?? 0,
        ) ===
        (innerWidth < 800
          ? Math.round(
              document.querySelector('[data-testid="split"]').getBoundingClientRect().width,
            )
          : 380),
    );
    const info = await pane('split-info');
    if (compact) {
      assert.ok(info.width > 500, `info ${info.width}`);
      assert.deepEqual(await pane('split-list'), { width: 0, hidden: true, inert: true });
      assert.deepEqual(await pane('split-conversation'), { width: 0, hidden: true, inert: true });
    } else {
      assert.equal(info.width, 380);
      assert.ok((await pane('split-conversation')).width > 320);
      assert.equal(info.hidden, false);
      const grip = await page.$('[role="separator"][aria-label="Resize the conversation list"]');
      assert.ok(grip, 'the list grip is named');
      const box = await grip.boundingBox();
      assert.ok(box);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, { steps: 8 });
      await page.mouse.up();
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="split-list"]')?.getBoundingClientRect().width > 360,
      );
      assert.equal((await pane('split-info')).width, 380, 'resizing the list preserves info width');
    }
    await page.click('[data-testid="split-info"] [aria-label="Close"]');
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="split-conversation"]')?.getBoundingClientRect()
          .width > 500,
    );
    if (compact) {
      await page.click('[data-testid="split-conversation"] [aria-label="Back"]');
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="split-list"]')?.getBoundingClientRect().width > 500,
      );
      assert.deepEqual(await pane('split-conversation'), { width: 0, hidden: true, inert: true });
      await page.click('[data-testid="split-list"] [aria-label="Teodor Ilić, last seen recently"]');
      await page.waitForSelector('[data-testid="split-conversation"] [aria-label="Teodor Ilić"]');
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="split-conversation"]')?.getBoundingClientRect()
            .width > 500,
      );
      assert.deepEqual(await pane('split-list'), { width: 0, hidden: true, inert: true });
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
