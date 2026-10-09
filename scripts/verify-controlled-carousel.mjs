/** A real gallery owner: thumbnail requests, user scrolling, resize and replacement. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const direction of ['ltr', 'rtl']) {
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, reducedMotion });
      await page.addInitScript(dir => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.dir = dir; }); }, direction);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${process.argv[2] || 'http://localhost:6006'}/iframe.html?id=base-carousel--controlled&viewMode=story`);
      const carousel = page.getByTestId('controlled-carousel');
      await carousel.waitFor({ timeout: 120000 });
      const track = carousel.locator('[data-bloom-carousel-track]');
      const events = async () => JSON.parse(await page.getByTestId('controlled-events').textContent());
      const aligned = async index => {
        await page.waitForFunction(({ index, direction }) => {
          const track = document.querySelector('[data-testid="controlled-carousel"] [data-bloom-carousel-track]');
          const slide = document.querySelector(`[data-testid="controlled-slide-${index}"]`);
          if (!track || !slide) return false;
          const a = track.getBoundingClientRect(), b = slide.getBoundingClientRect();
          return Math.abs(direction === 'rtl' ? a.right - b.right : a.left - b.left) < 1;
        }, { index, direction }, { timeout: 10000 }).catch(async error => {
          console.error({ index, direction, reducedMotion, state: await carousel.evaluate(el => ({
            scroll: el.querySelector('[data-bloom-carousel-track]').scrollLeft,
            slides: [...el.querySelectorAll('[data-bloom-carousel-item]')].map(item => ({ text: item.textContent, x: item.getBoundingClientRect().x, width: item.getBoundingClientRect().width })),
          })), events: await events() });
          throw error;
        });
      };
      await aligned(1);
      assert.deepEqual(await events(), [], 'Initial controlled positioning does not echo');
      await page.getByRole('button', { name: 'Thumbnail 4', exact: true }).click();
      await aligned(3);
      await page.waitForTimeout(250);
      assert.deepEqual(await events(), [], 'Animated intermediate positions do not overwrite thumbnail selection');
      await carousel.getByRole('button', { name: 'Previous slide', exact: true }).click();
      await aligned(2);
      assert.deepEqual(await events(), [2], 'Arrow requests selected child once');
      const bounds = await track.boundingBox();
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.mouse.wheel(direction === 'rtl' ? 456 : -456, 0);
      await aligned(1);
      await page.waitForFunction(() => document.querySelector('[data-testid="controlled-index"]').textContent === '1');
      assert.deepEqual(await events(), [2, 1], 'A real horizontal wheel updates the owner once after settling');
      await page.getByRole('button', { name: 'Resize gallery', exact: true }).click();
      await aligned(1);
      assert.deepEqual(await events(), [2, 1], 'Resize retains the selection without a change event');
      await page.getByRole('button', { name: 'Reverse images', exact: true }).click();
      await aligned(1);
      assert.deepEqual(await events(), [2, 1], 'Reordering same-width keyed slides retains the child index');
      await page.getByRole('button', { name: 'Thumbnail 4', exact: true }).click();
      await aligned(3);
      await page.getByRole('button', { name: 'Remove last image', exact: true }).click();
      await aligned(2);
      assert.deepEqual(await events(), [2, 1], 'List shrink clamps the requested child without echo');
      await page.getByRole('button', { name: 'Replace gallery', exact: true }).click();
      await aligned(0);
      assert.deepEqual(await events(), [2, 1], 'Replacement keys and a reset index use fresh measurements');
      await page.getByRole('button', { name: 'Toggle accepting requests', exact: true }).click();
      await carousel.getByRole('button', { name: 'Next slide', exact: true }).click();
      await page.waitForTimeout(250);
      await aligned(0);
      assert.deepEqual(await events(), [2, 1, 1], 'A rejected arrow request does not move the controlled gallery');
      assert.deepEqual(errors, []);
      await page.close();
    }
  }
  console.log('Controlled carousel thumbnail/arrow/wheel ownership, RTL, motion, resize and list replacement passed.');
} finally { await browser.close(); }
