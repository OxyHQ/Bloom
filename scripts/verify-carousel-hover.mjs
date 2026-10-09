/** Actual media-query, pointer, keyboard and controlled-scroll checks. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const mode of ['light', 'dark']) for (const placement of ['overlay', 'header']) {
    for (const touch of [false, true]) for (const reducedMotion of ['reduce', 'no-preference']) {
      console.log({ mode, placement, touch, reducedMotion });
      const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, hasTouch: touch, isMobile: touch, reducedMotion });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/iframe.html?id=base-carousel--hover-arrows-${mode}&viewMode=story&args=arrowsPlacement:${placement}`);
      const carousel = page.getByTestId('hover-carousel');
      await carousel.waitFor({ timeout: 120000 });
      const wrappers = carousel.locator('[data-bloom-carousel-arrow]');
      const next = carousel.getByRole('button', { name: 'Next slide', exact: true });
      const track = carousel.locator('[data-bloom-carousel-track]');
      const opacity = () => wrappers.last().evaluate(el => getComputedStyle(el).opacity);
      assert.equal(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches), !touch);
      await expect.poll(opacity).toBe(touch ? '1' : '0');
      assert.equal(await wrappers.last().evaluate(el => getComputedStyle(el).transitionDuration), reducedMotion === 'reduce' ? '0s' : '0.15s');
      const always = page.getByTestId('always-carousel').getByRole('button', { name: 'Next slide', exact: true });
      assert.equal(await always.evaluate(el => getComputedStyle(el).opacity), '1', 'Default controls stay visible');
      if (!touch) {
        await carousel.hover();
        await expect.poll(opacity).toBe('1');
      }
      await expect(next).toBeEnabled();
      await next.click();
      await expect(page.getByTestId('hover-index')).toHaveText('1');
      await expect.poll(async () => track.evaluate(el => Math.abs(el.scrollLeft - el.clientWidth - 16) < 2)).toBe(true);
      await page.getByTestId('before-carousel').click();
      await page.mouse.move(950, 750);
      await expect.poll(opacity).toBe(touch ? '1' : '0');
      // Actual Tab moves from the preceding button into the carousel: arrows
      // reveal without a pointer, including when the track itself gets focus.
      await page.keyboard.press('Tab');
      await expect.poll(opacity).toBe('1');
      assert.equal(await carousel.evaluate(el => el.contains(document.activeElement)), true);
      await next.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('hover-index')).toHaveText('2');
      await expect(next).toBeDisabled();
      await carousel.getByRole('button', { name: 'Previous slide', exact: true }).click();
      await expect(page.getByTestId('hover-index')).toHaveText('1');
      await page.getByTestId('after-carousel').click();
      await expect(next).toHaveCount(0);
      await expect(wrappers).toHaveCount(0);
      assert.deepEqual(errors, []);
      await page.close();
    }
  }
  console.log('Hover/focus reveal, coarse-pointer fallback, reduced motion, light/dark, both placements and controlled navigation passed.');
} finally { await browser.close(); }
