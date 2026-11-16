/** Real geometry and input protection for sidebar tree rows composed through ListItem. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox'],
  headless: true,
});
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewport({ width: 1000, height: 950 });
    await page.goto(`${base}/iframe.html?id=blocks-sidebar--workspace&globals=theme:${theme}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('[data-testid="sidebar-tree-item-notes"]');
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="sidebar-tree-item-notes"]').getBoundingClientRect()
          .width > 100,
    );
    const row = await page.$('[data-testid="sidebar-tree-item-notes"]');
    const point = await row.evaluate((node) => {
      const r = node.getBoundingClientRect();
      return { x: r.left + 22, y: r.top + r.height / 2 };
    });
    await page.mouse.click(point.x, point.y);
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="sidebar-tree-item-notes"]')
          .getAttribute('data-active') === 'true',
    );
    const trigger = await row.$('[data-bloom-list-link]');
    await trigger.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    const focus = await trigger.evaluate((node) => ({
      active: document.activeElement === node,
      visible: node.matches(':focus-visible'),
      outline: getComputedStyle(node).outlineWidth,
    }));
    assert.deepEqual(focus, { active: true, visible: true, outline: '2px' });
    assert.equal(
      await page.$eval('[data-testid="sidebar-tree-row-notes"]', (node) =>
        node.getAttribute('draggable'),
      ),
      'true',
    );
    const order = () =>
      page.$$eval('[data-testid^="sidebar-tree-row-"]', (nodes) =>
        nodes.map((node) => node.getAttribute('data-testid')),
      );
    const before = await order();
    await page.keyboard.down('Alt');
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Alt');
    await page.waitForFunction(
      (before) =>
        [...document.querySelectorAll('[data-testid^="sidebar-tree-row-"]')]
          .map((node) => node.getAttribute('data-testid'))
          .join() !== before.join(),
      {},
      before,
    );
    assert.notDeepEqual(await order(), before);
    for (const width of [390, 1100]) {
      await page.setViewport({ width, height: 950 });
      const widths = await page.$$eval(
        '[data-testid^="sidebar-tree-item-"]:not([data-testid$="-swipe"])',
        (nodes) => nodes.map((node) => node.getBoundingClientRect().width),
      );
      assert(
        widths.every((value) => value > 100),
        'Row layout reaches the parent-facing swipe host at every viewport',
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      `PASS sidebar tree ${theme}: visible shared rows, icon hit testing, keyboard focus and reordering, responsive widths`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
