/** Real pointer/keyboard ownership through nested panel headers, including RTL. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const reports = [];
const test = (id) => page.getByTestId(`reorder-${id}`);
async function order() {
  return page
    .locator(
      '[data-testid="reorder-main"], [data-testid="reorder-first"], [data-testid="reorder-second"]',
    )
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-testid')));
}
async function waitOrder(expected) {
  await page.waitForFunction(
    (ids) =>
      JSON.stringify(
        [
          ...document.querySelectorAll(
            '[data-testid="reorder-main"], [data-testid="reorder-first"], [data-testid="reorder-second"]',
          ),
        ].map((node) => node.getAttribute('data-testid')),
      ) === JSON.stringify(ids),
    expected,
  );
}
try {
  for (const direction of ['ltr', 'rtl']) {
    const url = new URL(
      '/iframe.html?id=blocks-panel-groups--reorder-nested-groups&viewMode=story',
      process.env.STORYBOOK_URL ?? 'http://localhost:6014',
    );
    await page.goto(url.href);
    const grip = test('first-reorder');
    await grip.waitFor({ state: 'visible' });
    await page.evaluate((dir) => {
      document.documentElement.dir = dir;
    }, direction);
    await page.waitForFunction(
      (dir) =>
        document.querySelector('[data-testid="reorder-first"]') &&
        getComputedStyle(document.querySelector('[data-testid="reorder-first"]')).direction === dir,
      direction,
    );
    await grip.evaluate((node) => {
      window.__reorderGrip = node;
    });
    const owner = await grip.evaluate((node) => ({
      declared: node.dataset.bloomPanelReorderOwner,
      nearest: node.closest('[data-bloom-panel-group]')?.getAttribute('data-bloom-panel-group'),
    }));
    assert.ok(
      owner.declared && owner.declared !== owner.nearest,
      'grip is genuinely forwarded across a group boundary',
    );
    assert.equal(await test('main').locator('[data-bloom-panel-reorder]').count(), 0);
    const from = await grip.boundingBox();
    const to = await test('second').boundingBox();
    assert.ok(from && to);
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      to.x + to.width / 2 + (direction === 'rtl' ? -30 : 30),
      from.y + from.height / 2,
      { steps: 20 },
    );
    await page.mouse.up();
    await waitOrder(['reorder-main', 'reorder-second', 'reorder-first']);
    assert.ok(
      await grip.evaluate((node) => node === window.__reorderGrip),
      'pointer preserves the handle node',
    );
    await grip.focus();
    await grip.press(direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
    await waitOrder(['reorder-main', 'reorder-first', 'reorder-second']);
    assert.ok(
      await grip.evaluate(
        (node) => node === window.__reorderGrip && node === document.activeElement,
      ),
      'keyboard preserves node and focus',
    );
    await grip.press('ArrowDown');
    assert.deepEqual(
      await order(),
      ['reorder-main', 'reorder-first', 'reorder-second'],
      'inner vertical axis cannot steal outer handle',
    );
    await grip.press('End');
    await waitOrder(['reorder-main', 'reorder-second', 'reorder-first']);
    await grip.press('Home');
    await waitOrder(['reorder-main', 'reorder-first', 'reorder-second']);
    reports.push({ direction, owner, pointer: true, keyboard: true, focus: true, fixedMain: true });
  }
  assert.deepEqual(errors, []);
  const artifacts = process.env.ARTIFACT_DIR ?? '.local/panel-reorder-owner';
  await mkdir(artifacts, { recursive: true });
  await writeFile(`${artifacts}/report.json`, JSON.stringify(reports, null, 2));
  console.log(JSON.stringify(reports, null, 2));
} finally {
  await browser.close();
}
