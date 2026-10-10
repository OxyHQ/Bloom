/** Button recipes, boundary focus and stable arrow slots in a real browser. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const mode of ['light', 'dark'])
    for (const placement of ['overlay', 'header']) {
      for (const rtl of [false, true])
        for (const touch of [false, true]) {
          const page = await browser.newPage({
            viewport: { width: 1000, height: 950 },
            hasTouch: touch,
            isMobile: touch,
            reducedMotion: touch ? 'reduce' : 'no-preference',
          });
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.goto(
            `${base}/iframe.html?id=base-carousel--arrow-recipe-${mode}&viewMode=story&args=arrowsPlacement:${placement}&globals=theme:${mode}`,
          );
          const carousel = page.getByTestId('recipe-carousel');
          await carousel.waitFor({ timeout: 120000 });
          if (rtl)
            await page.evaluate(() => {
              document.documentElement.dir = 'rtl';
              document.documentElement.lang = 'ar';
            });
          const track = carousel.locator('[data-bloom-carousel-track]');
          const slots = carousel.locator('[data-bloom-carousel-arrow]');
          const previous = carousel.getByRole('button', { name: 'Previous slide', exact: true });
          const next = carousel.getByRole('button', { name: 'Next slide', exact: true });
          await expect(previous).toHaveCount(0);
          await expect
            .poll(() => slots.first().evaluate((el) => getComputedStyle(el).opacity))
            .toBe('0');
          const hidden = slots.first().locator('button');
          await expect(hidden).toBeDisabled();
          await carousel.hover();
          await expect
            .poll(() => next.evaluate((el) => getComputedStyle(el).backgroundColor))
            .toBe(mode === 'light' ? 'rgb(255, 255, 255)' : 'rgb(18, 18, 18)');
          const paint = await next.evaluate((el) => {
            const s = getComputedStyle(el);
            return {
              width: s.width,
              height: s.height,
              bg: s.backgroundColor,
              border: s.borderTopWidth,
              radius: s.borderRadius,
              shadow: s.boxShadow,
            };
          });
          assert.equal(paint.width, '40px');
          assert.equal(paint.height, '40px');
          assert.equal(paint.bg, mode === 'light' ? 'rgb(255, 255, 255)' : 'rgb(18, 18, 18)');
          assert.equal(paint.radius, '9999px');
          assert.notEqual(paint.shadow, 'none');
          const startBoxes = await slots.evaluateAll((nodes) =>
            nodes.map((n) => {
              const r = n.getBoundingClientRect();
              return { x: r.x, y: r.y, width: r.width, height: r.height };
            }),
          );
          await next.click();
          await expect(page.getByTestId('recipe-index')).toHaveText('1');
          await expect(previous).toHaveCount(1);
          await expect
            .poll(() =>
              track.evaluate((el) => Math.abs(Math.abs(el.scrollLeft) - el.clientWidth - 16) < 2),
            )
            .toBe(true);
          assert.deepEqual(
            await slots.evaluateAll((nodes) =>
              nodes.map((n) => {
                const r = n.getBoundingClientRect();
                return { x: r.x, y: r.y, width: r.width, height: r.height };
              }),
            ),
            startBoxes,
          );
          await next.focus();
          await page.keyboard.press('Enter');
          await expect(page.getByTestId('recipe-index')).toHaveText('2');
          await expect(next).toHaveCount(0);
          await expect(track).toBeFocused();
          await expect
            .poll(() => slots.last().evaluate((el) => getComputedStyle(el).opacity))
            .toBe('0');
          await page.keyboard.press('Tab');
          if (placement === 'overlay') {
            await expect(previous).toBeFocused();
            await page.keyboard.press('Tab');
          }
          await expect(page.getByTestId('recipe-after')).toBeFocused();
          await page.getByTestId('recipe-after').click();
          await expect(previous).toHaveCount(0);
          await next.focus();
          // A controlled update can arrive without a pointer moving focus away.
          await page
            .getByRole('button', { name: 'Last photo', exact: true })
            .evaluate((el) => el.click());
          await expect(next).toHaveCount(0);
          await expect(track).toBeFocused();
          await page.getByRole('button', { name: 'Resize gallery', exact: true }).click();
          await expect.poll(() => track.evaluate((el) => el.clientWidth)).toBe(280);
          await expect(next).toHaveCount(0);
          await previous.focus();
          await page
            .getByRole('button', { name: 'Single photo', exact: true })
            .evaluate((el) => el.click());
          await expect(track).toBeFocused();
          await expect(previous).toHaveCount(0);
          await expect(next).toHaveCount(0);
          assert.deepEqual(errors, []);
          console.log({ mode, placement, rtl, touch, passed: true });
          await page.close();
        }
    }
} finally {
  await browser.close();
}
