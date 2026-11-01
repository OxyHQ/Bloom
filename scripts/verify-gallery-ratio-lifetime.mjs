/** Check an actual web opening against a delayed probe from an older one. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [390, 1000]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    const oldRoutes = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const NativeImage = window.Image;
      window.__oldProbeLoads = 0;
      // biome-ignore lint/complexity/useArrowFunction: React Native Web calls this with `new`.
      window.Image = function (...args) {
        const image = new NativeImage(...args);
        image.addEventListener('load', () => {
          if (image.src.includes('/gallery-ratio-old.svg')) window.__oldProbeLoads += 1;
        });
        return image;
      };
      window.Image.prototype = NativeImage.prototype;
    });
    await page.route('**/gallery-ratio-old.svg', (route) => {
      oldRoutes.push(route);
    });
    await page.route('**/gallery-ratio-current.svg', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="blue"/></svg>',
      }),
    );
    await page.goto(
      `${base}/iframe.html?id=base-zoomable-media-gallery--ratio-lifetime&viewMode=story`,
    );
    await page.getByTestId('ratio-open-old').click();
    await expect.poll(() => oldRoutes.length).toBeGreaterThan(0);
    await expect(page.getByRole('img', { name: 'old image' }).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('img', { name: 'old image' })).toHaveCount(0);
    await page.getByTestId('ratio-open-current').click();
    const image = page.getByRole('img', { name: 'current image' }).first();
    await expect(image).toBeVisible();
    await expect
      .poll(async () => {
        const box = await image.boundingBox();
        return box ? Math.round((box.width / box.height) * 100) : 0;
      })
      .toBe(100);
    const before = await image.boundingBox();
    const released = await Promise.allSettled(
      oldRoutes.map((route) =>
        route.fulfill({
          status: 200,
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><rect width="400" height="100" fill="red"/></svg>',
        }),
      ),
    );
    assert.ok(released.some((result) => result.status === 'fulfilled'));
    await expect.poll(() => page.evaluate(() => window.__oldProbeLoads)).toBeGreaterThan(0);
    await page.waitForTimeout(300);
    const after = await image.boundingBox();
    assert.ok(before && after);
    assert.ok(Math.abs(before.width - after.width) < 1);
    assert.ok(Math.abs(before.height - after.height) < 1);
    assert.deepEqual(errors, []);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('img', { name: 'current image' })).toHaveCount(0);
    console.log({
      width,
      before: { width: before.width, height: before.height },
      after: { width: after.width, height: after.height },
      oldProbeLoads: await page.evaluate(() => window.__oldProbeLoads),
      passed: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
