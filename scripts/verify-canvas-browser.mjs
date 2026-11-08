import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE_JSON);
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox'],
});
const output = process.env.CANVAS_OUTPUT ?? '.local/issue-663/canvas-browser';
mkdirSync(output, { recursive: true });
const url =
  process.env.CANVAS_URL ??
  'http://localhost:6040/iframe.html?id=components-layout-canvas--persistent&viewMode=story';
const results = [];
try {
  for (const touch of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: touch,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page
      .getByRole('button', { name: 'Change room', exact: true })
      .waitFor({ timeout: 90000 });
    await page.getByRole('button', { name: 'Change room', exact: true }).click();
    const handle = page.getByTestId('fixture-panel-handle');
    await page.getByRole('button', { name: 'Peek', exact: true }).click();
    await page.waitForTimeout(600);
    const initial = await handle.boundingBox();
    assert(initial);
    assert.equal(initial.height, touch ? 44 : 24);
    assert.equal(await handle.getAttribute('aria-orientation'), 'vertical');
    await page.getByRole('button', { name: 'Acceptance: accept', exact: true }).click();
    await handle.focus();
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(600);
    const rejected = await handle.boundingBox();
    assert(Math.abs(rejected.y - initial.y) < 1, 'rejected snap drifted');
    assert.equal(await handle.getAttribute('aria-valuenow'), '0');
    await page.getByRole('button', { name: 'Acceptance: reject', exact: true }).click();
    await handle.focus();
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(150);
    assert.equal(
      await handle.getAttribute('aria-valuenow'),
      '0',
      'delayed prop applied prematurely',
    );
    await page.waitForTimeout(1000);
    assert.equal(await handle.getAttribute('aria-valuenow'), '1');
    const accepted = await handle.boundingBox();
    assert(accepted.y < initial.y - 20);
    await page.evaluate(() => {
      window.savedCanvasInput = document.querySelector('input');
    });
    await page.getByRole('button', { name: 'Change room', exact: true }).click();
    await page.setViewportSize({ width: 600, height: 844 });
    await page.waitForTimeout(300);
    assert.equal(await handle.isVisible(), false, '600px must enter lateral placement');
    assert(await page.evaluate(() => window.savedCanvasInput === document.querySelector('input')));
    await page.getByRole('button', { name: 'Toggle active', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Select object', exact: true }).count(), 0);
    assert(await page.getByTestId('fixture-canvas-viewport').evaluate((el) => el.inert));
    await page.evaluate(() => document.querySelector('input').focus());
    assert(await page.evaluate(() => document.activeElement !== document.querySelector('input')));
    await page.getByRole('button', { name: 'Toggle active', exact: true }).click();
    assert(await page.evaluate(() => window.savedCanvasInput === document.querySelector('input')));
    await page.screenshot({ path: `${output}/${touch ? 'touch' : 'fine'}.png` });
    assert.deepEqual(errors, []);
    results.push({
      touch,
      initial,
      rejected,
      accepted,
      inputRetained: true,
      lateralHandleHidden: true,
      inactiveFocusExcluded: true,
      errors,
    });
    await context.close();
  }
  writeFileSync(`${output}/result.json`, JSON.stringify(results, null, 2));
  console.log(
    'Canvas controlled rejection/delay, input identity, handle targets and inactive focus passed.',
  );
} finally {
  await browser.close();
}
