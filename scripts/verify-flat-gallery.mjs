/** Pixel and real-input verification of flat controls and the themed media viewer. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const { PNG } = require('pngjs');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const pixel = (png, x, y) => [...png.data.subarray((Math.floor(y) * png.width + Math.floor(x)) * 4, (Math.floor(y) * png.width + Math.floor(x)) * 4 + 4)];
try {
  const buttonPage = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await buttonPage.goto(`${base}/iframe.html?id=base-button--flat&viewMode=story`);
  const flat = buttonPage.getByTestId('flat-button');
  await flat.waitFor({ timeout: 120000 });
  await buttonPage.waitForTimeout(200);
  const box = await flat.boundingBox();
  const png = PNG.sync.read(await buttonPage.screenshot());
  assert.deepEqual(pixel(png, box.x + 5, box.y + box.height / 2), [84, 51, 235, 255], 'The painted fill is the exact brand colour');
  const paint = await flat.evaluate(el => ({ before: getComputedStyle(el, '::before').content, after: getComputedStyle(el, '::after').content, shadow: getComputedStyle(el).boxShadow }));
  assert.equal(paint.before, 'none'); assert.equal(paint.after, 'none'); assert.equal(paint.shadow, 'none');
  assert.notEqual(await buttonPage.getByTestId('surface-button').evaluate(el => getComputedStyle(el, '::after').content), 'none', 'Default material remains present');
  assert.equal(await buttonPage.getByTestId('flat-disabled').isDisabled(), true);
  await flat.focus();
  assert.notEqual(await flat.evaluate(el => getComputedStyle(el).outlineStyle), 'none', 'Keyboard focus is retained');
  await buttonPage.close();

  for (const mode of ['light', 'dark']) {
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, reducedMotion });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/iframe.html?id=base-zoomable-media-gallery--page-${mode}&viewMode=story`);
      await page.getByTestId('gallery-open-0').waitFor({ timeout: 120000 });
      await page.getByTestId('gallery-open-0').click();
      const next = page.getByRole('button', { name: 'Next item', exact: true });
      await expect(next).toBeVisible();
      await expect(page.getByTestId('gallery-events')).toHaveText('[0]');
      await page.waitForTimeout(400);
      await page.evaluate(() => { document.body.style.background = '#ff0000'; });
      const first = PNG.sync.read(await page.screenshot());
      const corner = pixel(first, 5, 5);
      assert.ok(mode === 'light' ? corner.slice(0, 3).every(v => v > 200) : corner.slice(0, 3).every(v => v < 65), 'Backdrop follows the theme');
      await page.evaluate(() => { document.body.style.background = '#00ff00'; });
      const second = PNG.sync.read(await page.screenshot());
      assert.deepEqual(pixel(second, 5, 5), corner, 'The page backdrop is opaque');
      const iconFill = await next.locator('svg').getAttribute('fill');
      assert.ok(iconFill && iconFill !== '#fff', 'Navigation uses the theme foreground');
      await next.click();
      await expect(page.getByTestId('gallery-index')).toHaveText('1');
      await expect(page.getByTestId('gallery-events')).toHaveText('[0,1]');
      await page.keyboard.press('ArrowRight');
      await expect(page.getByTestId('gallery-index')).toHaveText('2');
      await page.getByRole('button', { name: 'Go to item 2 of 3', exact: true }).click();
      await expect(page.getByTestId('gallery-index')).toHaveText('1');
      await page.waitForTimeout(400);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Close media viewer', exact: true })).toHaveCount(0);
      await expect(page.getByTestId('gallery-events')).toHaveText('[0,1,2,1]');
      await page.getByTestId('gallery-open-1').click();
      await expect(page.getByRole('button', { name: 'Previous item', exact: true })).toBeVisible();
      await expect(page.getByTestId('gallery-events')).toHaveText('[0,1,2,1,1]');
      assert.deepEqual(errors, []);
      await page.close();
    }
  }
  console.log('Flat fill pixels, default material, keyboard focus, themed opaque viewer, pointer/keyboard paging and index synchronization passed.');
} finally { await browser.close(); }
