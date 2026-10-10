/** Actual pointer, scroll and geometry checks for overlay carousel controls. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const direction of ['ltr', 'rtl']) {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 700 },
      reducedMotion: 'reduce',
    });
    await page.addInitScript((dir) => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.dir = dir;
      });
    }, direction);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${process.argv[2] || 'http://localhost:6006'}/iframe.html?id=base-carousel--overlay-arrows&viewMode=story`,
    );
    const carousel = page.getByTestId('overlay-carousel');
    await carousel.waitFor({ timeout: 120000 });
    const track = carousel.locator('[data-bloom-carousel-track]');
    const previous = carousel.getByRole('button', { name: 'Previous slide', exact: true });
    const next = carousel.getByRole('button', { name: 'Next slide', exact: true });
    await page.waitForTimeout(150);
    const bounds = await track.boundingBox();
    const outer = await carousel.boundingBox();
    assert.equal(outer.height, bounds.height, 'Overlay controls add no header row');
    for (const control of [previous, next]) {
      const box = await control.boundingBox();
      assert.equal(box.width, 44);
      assert.equal(box.height, 44);
      assert.ok(
        Math.abs(box.y + box.height / 2 - bounds.y - bounds.height / 2) < 1,
        'Arrow is vertically centered on track',
      );
    }
    const previousBox = await previous.boundingBox();
    const nextBox = await next.boundingBox();
    assert.equal(previousBox.x < nextBox.x, direction === 'ltr', 'Arrows follow logical edges');
    assert.equal(await previous.isDisabled(), true, 'Previous is disabled at logical start');
    assert.equal(await next.isDisabled(), false);
    await track.evaluate((el) => {
      const scroll = el.scroll.bind(el);
      el.scroll = (options) => {
        el.dataset.requestedScrollBehavior = options.behavior;
        scroll(options);
      };
    });
    await next.click();
    assert.equal(
      await track.getAttribute('data-requested-scroll-behavior'),
      'auto',
      'Reduced motion disables programmatic animation',
    );
    await page.waitForTimeout(150);
    const firstScroll = await track.evaluate((el) => el.scrollLeft);
    assert.ok(
      direction === 'ltr' ? firstScroll > 0 : firstScroll < 0,
      'Next moves towards the next logical slide',
    );
    assert.equal(await previous.isDisabled(), false);
    for (let i = 0; i < 8 && !(await next.isDisabled()); i++) {
      await next.click();
      await page.waitForTimeout(100);
    }
    assert.equal(await next.isDisabled(), true, 'Next disables at logical end');
    await previous.click();
    await page.waitForTimeout(100);
    assert.equal(await next.isDisabled(), false, 'Previous returns from end');
    // The empty overlay area must not intercept the slide's own button.
    const visible = carousel.getByRole('button', { name: 'Choose category 3', exact: true });
    await visible.click();
    assert.equal(await page.getByTestId('overlay-selected').textContent(), '3');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    assert.equal(await previous.count(), 0, 'Consumer breakpoint hides controls on mobile');
    assert.equal(await carousel.getByTestId('overlay-carousel-overlay-arrows').count(), 0);
    assert.equal(
      (await carousel.boundingBox()).height,
      (await track.boundingBox()).height,
      'No empty controls row on mobile',
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    'Carousel overlay geometry, real-pointer navigation, RTL endpoints, reduced motion and responsive controls passed.',
  );
} finally {
  await browser.close();
}
