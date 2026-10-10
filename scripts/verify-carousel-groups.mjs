/** Group navigation against actual fractional scroll geometry and controlled callbacks. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const base = process.argv[2] || 'http://localhost:6006';
try {
  for (const direction of ['ltr', 'rtl'])
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({
        viewport: { width: 1100, height: 1000 },
        reducedMotion,
      });
      await page.addInitScript(
        (dir) =>
          document.addEventListener('DOMContentLoaded', () => {
            document.documentElement.dir = dir;
          }),
        direction,
      );
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${base}/iframe.html?id=base-carousel--grouped-navigation&viewMode=story`);
      const root = page.getByTestId('grouped-carousel');
      await root.waitFor({ timeout: 120000 });
      const track = root.locator('[data-bloom-carousel-track]');
      const index = page.getByTestId('grouped-index');
      const events = async () => JSON.parse(await page.getByTestId('grouped-events').textContent());
      const aligned = async (child) =>
        expect
          .poll(
            () =>
              track.evaluate(
                (node, { child, direction }) => {
                  const slides = [...node.querySelectorAll('[data-bloom-carousel-item]')];
                  const parent = slides[0].parentElement.getBoundingClientRect();
                  const rect = slides[child].getBoundingClientRect();
                  const desired = Math.min(
                    node.scrollWidth - node.clientWidth,
                    Math.max(
                      0,
                      direction === 'rtl' ? parent.right - rect.right : rect.left - parent.left,
                    ),
                  );
                  return Math.abs(
                    (direction === 'rtl' ? -node.scrollLeft : node.scrollLeft) - desired,
                  );
                },
                { child, direction },
              ),
            { timeout: 10000 },
          )
          .toBeLessThan(1.1);
      await aligned(0);
      assert.deepEqual(await events(), []);
      await root.getByRole('button', { name: 'Next slide', exact: true }).click();
      await expect(index).toHaveText('3');
      await aligned(3);
      assert.deepEqual(await events(), [3]);
      await root.getByRole('button', { name: 'Next slide', exact: true }).click();
      await expect(index).toHaveText('7');
      await aligned(7);
      assert.deepEqual(await events(), [3, 7]);
      await expect(root.getByRole('button', { name: 'Next slide', exact: true })).toBeDisabled();
      await root.getByRole('button', { name: 'Previous slide', exact: true }).click();
      await expect(index).toHaveText('3');
      await aligned(3);
      await root.getByRole('button', { name: 'Go to slide 2', exact: true }).click();
      await expect(index).toHaveText('1');
      await aligned(1);
      await track.focus();
      await page.keyboard.press(direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      await expect(index).toHaveText('3');
      await aligned(3);
      await root.getByRole('button', { name: 'Go to slide 2', exact: true }).click();
      await aligned(1);
      const bounds = await track.boundingBox();
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.mouse.wheel(direction === 'rtl' ? -194.75 : 194.75, 0);
      await expect(index).toHaveText('2');
      await aligned(2);
      const before = await events();
      await page.getByRole('button', { name: 'Change group size', exact: true }).click();
      await aligned(2);
      assert.deepEqual(await events(), before);
      await track.focus();
      await page.keyboard.press(direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      await expect(index).toHaveText('4');
      await aligned(4);
      await page.setViewportSize({ width: 390, height: 1000 });
      await expect(root.getByRole('button', { name: /^Go to slide/ })).toHaveCount(8);
      await aligned(4);
      assert.deepEqual(await events(), [...before, 4]);
      await track.focus();
      await page.keyboard.press(direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      await expect(index).toHaveText('6');
      await aligned(6);
      await page.keyboard.press(direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      await expect(index).toHaveText('7');
      await aligned(7);
      const beforeShrink = await events();
      await page.getByRole('button', { name: 'Remove final card', exact: true }).click();
      await expect(root.locator('[data-bloom-carousel-item]')).toHaveCount(7);
      await expect(root.getByRole('button', { name: /^Go to slide/ })).toHaveCount(7);
      await aligned(6);
      assert.deepEqual(await events(), beforeShrink);
      await page.getByRole('button', { name: 'Toggle looping', exact: true }).click();
      await root.getByRole('button', { name: 'Next slide', exact: true }).click();
      await expect(index).toHaveText('0');
      await aligned(0);
      await root.getByRole('button', { name: 'Previous slide', exact: true }).click();
      await expect(index).toHaveText('6');
      await aligned(6);
      await root.getByRole('button', { name: 'Next slide', exact: true }).click();
      await expect(index).toHaveText('0');
      await aligned(0);
      await page.getByRole('button', { name: 'Toggle accepting requests', exact: true }).click();
      const prior = await events();
      await root.getByRole('button', { name: 'Next slide', exact: true }).click();
      await expect.poll(events).toEqual([...prior, 2]);
      await aligned(0);
      await expect(index).toHaveText('0');
      assert.deepEqual(errors, []);
      console.log(`PASS ${direction} ${reducedMotion}`);
      await page.close();
    }
} finally {
  await browser.close();
}
