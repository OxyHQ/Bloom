import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || '@playwright/test');
const base = process.argv[2] || 'http://localhost:6273';
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [390, 1440]) {
    for (const touch of [false, true]) {
      const page = await browser.newPage({
        viewport: { width, height: 1100 },
        hasTouch: touch,
        reducedMotion: touch ? 'reduce' : 'no-preference',
      });
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${base}/iframe.html?id=base-toast--background-interaction&viewMode=story`, {
        waitUntil: 'domcontentloaded',
      });
      const show = page.getByRole('button', {
        name: 'Show error',
        exact: true,
      });
      await show.click(); // Real locator scrolls the long form into view.
      const row = page
        .locator('#bloom-portal-root [aria-live]')
        .filter({ hasText: 'Update failed' });
      await expect(row).toBeVisible();
      const apply = page.getByRole('button', {
        name: 'Apply change',
        exact: true,
      });
      await apply.scrollIntoViewIfNeeded();
      if (touch) {
        await row.getByText('Update failed', { exact: true }).tap();
      } else {
        await row.hover();
      }
      const other = page
        .locator('#bloom-portal-root [aria-live]')
        .filter({ hasText: 'Pending changes' });
      await expect
        .poll(async () => {
          const [front, back] = await Promise.all([row.boundingBox(), other.boundingBox()]);
          return Math.abs((front?.y ?? 0) - (back?.y ?? 0));
        })
        .toBeGreaterThan(40);
      const target = await apply.boundingBox();
      assert(target, 'background control is measured');
      // Mouse/touch coordinates model one immediate user gesture. Locator.click
      // retries until an intercepting layer disappears, masking the lost click.
      if (touch)
        await page.touchscreen.tap(target.x + target.width / 2, target.y + target.height / 2);
      else await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2);
      await expect(page.getByTestId('background-count')).toHaveText('1');
      await expect(row).toBeVisible();
      await row.getByRole('button', { name: 'Retry update', exact: true }).click();
      await expect(page.getByTestId('background-count')).toHaveText('2');
      await expect(row).toBeVisible();
      await row.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(row).toHaveCount(0);
      await apply.click();
      await expect(page.getByTestId('background-count')).toHaveText('3');
      assert.deepEqual(errors, [], 'no runtime errors');
      console.log(
        `PASS ${width}px ${touch ? 'touch/reduced' : 'mouse'}: scroll, first outside click, action and dismissal`,
      );
      await page.close();
    }
  }
} finally {
  await browser.close();
}
