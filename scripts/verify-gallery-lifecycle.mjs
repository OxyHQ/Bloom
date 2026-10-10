/** Viewer ownership is observable through public callbacks, with real input. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const reducedMotion of ['reduce', 'no-preference']) for (const exit of ['escape', 'press', 'drag']) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, reducedMotion });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/iframe.html?id=base-zoomable-media-gallery--lifecycle&viewMode=story`);
    const events = page.getByTestId('gallery-lifecycle-events');
    await expect(events).toHaveText('[]', { timeout: 120000 });
    await page.getByTestId('gallery-open-0').click();
    await expect(events).toHaveText('[{"open":true,"callback":0}]');
    await expect(page.getByRole('button', { name: 'Next item', exact: true })).toBeVisible();
    if (exit === 'escape') await page.keyboard.press('Escape');
    else if (exit === 'press') await page.mouse.click(500, 450);
    else {
      await page.mouse.move(500, 350); await page.mouse.down();
      await page.mouse.move(500, 750, { steps: 15 }); await page.mouse.up();
    }
    await expect(events).toHaveText('[{"open":true,"callback":0},{"open":false,"callback":1}]');
    await expect(page.getByRole('button', { name: 'Close media viewer', exact: true })).toHaveCount(0);
    await page.getByTestId('gallery-open-1').click();
    await expect(page.getByRole('button', { name: 'Previous item', exact: true })).toBeVisible();
    await expect(events).toHaveText('[{"open":true,"callback":0},{"open":false,"callback":1},{"open":true,"callback":1}]');
    await page.keyboard.press('Escape');
    await expect(events).toHaveText('[{"open":true,"callback":0},{"open":false,"callback":1},{"open":true,"callback":1},{"open":false,"callback":2}]');
    assert.deepEqual(errors, []);
    console.log({ exit, reducedMotion, passed: true });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await page.goto(`${base}/iframe.html?id=base-zoomable-media-gallery--unmount-during-opening&viewMode=story`);
  const events = page.getByTestId('gallery-lifecycle-events');
  await expect(events).toHaveText('[]', { timeout: 120000 });
  await page.getByTestId('gallery-open-0').tap();
  await expect(events).toHaveText('[{"open":true,"callback":0},{"open":false,"callback":1}]');
  await expect(page.getByRole('button', { name: 'Close media viewer', exact: true })).toHaveCount(0);
  console.log({ unmountDuringOpen: true, touch: true, passed: true });
  await page.close();
} finally { await browser.close(); }
