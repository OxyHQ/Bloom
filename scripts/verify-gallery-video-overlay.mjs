/** Real hit-testing verifies that interactive video status does not dismiss. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [390, 1000])
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        hasTouch: width === 390,
        reducedMotion,
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/iframe.html?id=base-zoomable-media-gallery--video-status&viewMode=story`,
      );
      const press = async (locator) => (width === 390 ? locator.tap() : locator.click());
      await expect(page.getByTestId('video-viewer-open')).toHaveText('false', { timeout: 120000 });
      await press(page.getByTestId('gallery-open-0'));
      await expect(page.getByRole('button', { name: 'Next item', exact: true })).toBeVisible();
      await expect(page.getByTestId('video-status-overlay')).toHaveCount(0);
      await press(page.getByRole('button', { name: 'Next item', exact: true }));
      await expect(page.getByTestId('video-status-overlay')).toContainText('story-clip: loading');
      await expect(page.getByTestId('video-status-overlay')).toContainText('story-clip: error');
      const retry = page.getByRole('button', { name: 'Retry video', exact: true });
      await press(retry);
      await expect(page.getByTestId('video-retry-count')).toHaveText('1');
      await expect(page.getByTestId('video-status-overlay')).toContainText('retrying');
      await expect(page.getByTestId('video-viewer-open')).toHaveText('true');
      await retry.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('video-retry-count')).toHaveText('2');
      await expect(page.getByTestId('video-viewer-open')).toHaveText('true');
      await press(page.getByRole('button', { name: 'Next item', exact: true }));
      await expect(page.getByTestId('video-status-overlay')).toHaveCount(0);
      await press(page.getByRole('button', { name: 'Previous item', exact: true }));
      await expect(retry).toBeVisible();
      await press(page.getByRole('button', { name: 'Return to inline video', exact: true }));
      await expect(page.getByTestId('video-viewer-open')).toHaveText('false');
      await expect(page.getByTestId('video-status-overlay')).toHaveCount(0);
      assert.deepEqual(errors, []);
      console.log({ width, reducedMotion, passed: true });
      await page.close();
    }
} finally {
  await browser.close();
}
