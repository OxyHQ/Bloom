import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || '@playwright/test');
const browser = await chromium.launch({ headless: true });
const base = process.argv[2] || 'http://127.0.0.1:6273';
try {
  for (const width of [390, 1440]) for (const theme of ['light', 'dark']) for (const touch of [false, true]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, hasTouch: touch });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/iframe.html?id=base-rating--input&viewMode=story&globals=theme:${theme}`);
    const group = page.getByRole('radiogroup', { name: 'Cleanliness', exact: true });
    const stars = group.getByRole('radio');
    await expect(stars.nth(3)).toHaveAttribute('aria-checked', 'false');
    // Aim at the SVG centre with real hit testing, without a preparatory hover
    // or retry. The first pointer arrival can replace the outline glyph.
    const box = await stars.nth(3).locator('svg').boundingBox(); assert(box);
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
    await expect(stars.nth(3)).toBeChecked();
    if (!touch) {
      await stars.nth(1).hover();
      await expect(stars.nth(3)).toBeChecked(); // preview never commits
      await page.mouse.move(0, 0);
      // A direct radio click also changes the selected value exactly once.
      await stars.nth(4).click();
      await expect(stars.nth(4)).toBeChecked();
    }
    await stars.nth(touch ? 3 : 4).focus();
    await page.keyboard.press('Home'); await expect(stars.nth(0)).toBeChecked();
    await page.keyboard.press('End'); await expect(stars.nth(4)).toBeChecked();
    await page.keyboard.press('ArrowLeft'); await expect(stars.nth(3)).toBeChecked();
    await page.keyboard.press('ArrowRight'); await expect(stars.nth(4)).toBeChecked();
    const disabled = page.getByRole('radiogroup', { name: 'Overall rating', exact: true }).last();
    const disabledBox = await disabled.getByRole('radio').nth(4).boundingBox(); assert(disabledBox);
    await page.mouse.click(disabledBox.x + disabledBox.width / 2, disabledBox.y + disabledBox.height / 2);
    await expect(disabled.getByRole('radio').nth(2)).toBeChecked();
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px ${theme} ${touch ? 'touch' : 'mouse'}: first icon press, preview, keyboard, disabled`);
    await page.close();
  }
} finally { await browser.close(); }
