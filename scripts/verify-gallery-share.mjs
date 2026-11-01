/** Verify the sharing contract and accessibility through the real web fork. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [390, 1000]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      hasTouch: width === 390,
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.__shareCalls = [];
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data) => window.__shareCalls.push(data.url),
      });
    });
    await page.goto(
      `${base}/iframe.html?id=base-zoomable-media-gallery--share-policy&viewMode=story`,
    );
    const press = (locator) => (width === 390 ? locator.tap() : locator.click());
    await press(page.getByTestId('gallery-open-0'));
    const share = page.getByRole('button', { name: 'Share media', exact: true });
    await expect(share).toBeVisible({ timeout: 120000 });
    await share.focus();
    await expect(share).toBeFocused();
    await page.keyboard.press('Enter');
    await expect
      .poll(() => page.evaluate(() => window.__shareCalls))
      .toEqual(['https://example.test/post/first']);
    const next = page.getByRole('button', { name: 'Next item', exact: true });
    await share.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('2 / 5', { exact: true })).toBeVisible();
    await expect(share).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Previous item', exact: true })).toBeFocused();
    await share.evaluate((button) => button.click());
    await expect
      .poll(() => page.evaluate(() => window.__shareCalls))
      .toEqual(['https://example.test/post/first']);
    await page.getByRole('button', { name: 'Previous item', exact: true }).focus();
    await share.evaluate((button) => button.click());
    const callsAfterDisabled = await page.evaluate(() => window.__shareCalls);
    assert.deepEqual(callsAfterDisabled, ['https://example.test/post/first']);
    await page
      .getByRole('button', { name: 'Go to item 3 of 5', exact: true })
      .evaluate((button) => button.click());
    await expect(page.getByText('3 / 5', { exact: true })).toBeVisible();
    await expect(share).toBeDisabled();
    await share.evaluate((button) => button.click());
    await expect
      .poll(() => page.evaluate(() => window.__shareCalls))
      .toEqual(['https://example.test/post/first']);
    await press(next);
    await expect(page.getByText('4 / 5', { exact: true })).toBeVisible();
    await expect(share).toBeDisabled();
    await share.evaluate((button) => button.click());
    await expect
      .poll(() => page.evaluate(() => window.__shareCalls))
      .toEqual(['https://example.test/post/first']);
    await press(next);
    await expect(page.getByText('5 / 5', { exact: true })).toBeVisible();
    await expect(share).toBeVisible();
    await press(share);
    await expect
      .poll(() => page.evaluate(() => window.__shareCalls))
      .toEqual(['https://example.test/post/first', 'https://example.test/legacy.jpg']);
    await page.keyboard.press('Escape');
    await expect(share).toHaveCount(0);
    assert.deepEqual(errors, []);
    await page.goto(
      `${base}/iframe.html?id=base-zoomable-media-gallery--share-focus-first&viewMode=story`,
    );
    await press(page.getByTestId('gallery-open-1'));
    await expect(share).toBeVisible({ timeout: 120000 });
    await share.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('1 / 2', { exact: true })).toBeVisible();
    await expect(share).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Next item', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(share).toHaveCount(0);
    await page.goto(
      `${base}/iframe.html?id=base-zoomable-media-gallery--share-policy&viewMode=story`,
    );
    await press(page.getByTestId('gallery-open-0'));
    await expect(share).toBeVisible({ timeout: 120000 });
    await share.focus();
    await page.getByTestId('bloom-media-gallery-pager').evaluate((pager) => {
      pager.scrollLeft = pager.clientWidth;
      pager.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await expect(page.getByText('2 / 5', { exact: true })).toBeVisible();
    await expect(share).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Previous item', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(share).toHaveCount(0);
    await press(page.getByTestId('gallery-open-0'));
    await expect(share).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous item', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(share).toHaveCount(0);
    await press(page.getByTestId('gallery-open-0'));
    await expect(share).toBeVisible();
    await share.focus();
    await page.getByTestId('bloom-media-gallery-pager').evaluate((pager) => {
      pager.scrollLeft = pager.clientWidth;
      pager.dispatchEvent(new Event('scroll', { bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await expect(share).toHaveCount(0);
    await press(page.getByTestId('gallery-open-0'));
    await expect(share).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next item', exact: true })).not.toBeFocused();
    await page.keyboard.press('Escape');
    await expect(share).toHaveCount(0);
    console.log({ width, passed: true });
    await page.close();
  }
} finally {
  await browser.close();
}
