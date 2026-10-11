/** Browser geometry, hit testing, motion and keyboard semantics for the capsule. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const base = process.argv[2] || 'http://localhost:6006';
try {
  for (const direction of ['ltr', 'rtl'])
    for (const mode of ['light', 'dark'])
      for (const reducedMotion of ['reduce', 'no-preference'])
        for (const touch of [false, true]) {
          console.log({ direction, mode, reducedMotion, touch });
          const page = await browser.newPage({
            viewport: { width: 800, height: 800 },
            hasTouch: touch,
            isMobile: touch,
            reducedMotion,
          });
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.goto(
            `${base}/iframe.html?id=base-stepper--outline&viewMode=story&globals=theme:${mode}`,
          );
          await page.evaluate((direction) => (document.documentElement.dir = direction), direction);
          const root = page.getByTestId('outline-stepper');
          await root.waitFor({ timeout: 120000 });
          const value = page.getByTestId('outline-stepper-value');
          const plus = page.getByTestId('outline-stepper-increment');
          const minus = page.getByTestId('outline-stepper-decrement');
          await expect(root).toHaveCSS('height', '40px');
          await expect(root).toHaveCSS('border-top-width', '1px');
          assert.ok(Math.abs((await root.boundingBox()).width - 102.8) < 0.1);
          assert.ok(Math.abs((await value.boundingBox()).width - 44.8) < 0.1);
          await expect(page.getByTestId('compact-stepper')).toHaveCSS('height', '36px');
          assert.ok(
            Math.abs((await page.getByTestId('compact-stepper-value').boundingBox()).width - 39.2) <
              0.1,
          );
          await expect(value.locator('div').last()).toHaveCSS('font-size', '14px');
          await expect(value.locator('div').last()).toHaveCSS('line-height', '18px');
          await expect(plus).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
          await expect(plus).toHaveCSS('background-image', 'none');
          await expect(plus.locator('svg')).toHaveAttribute('width', '20');
          const resting = await plus.boundingBox();
          assert.ok(resting && Math.abs(resting.width - 20) < 1);
          // Click above the 20px visual glyph: its expanded target still increments.
          await page.mouse.click(resting.x + resting.width / 2, resting.y - 8);
          await expect(value).toHaveAttribute('aria-valuenow', '3');
          await plus.hover();
          if (!touch && reducedMotion === 'no-preference')
            await expect(plus).toHaveCSS('transform', 'matrix(1.1, 0, 0, 1.1, 0, 0)');
          else await expect(plus).toHaveCSS('transform', 'none');
          await page.mouse.down();
          if (reducedMotion === 'no-preference')
            await expect(plus).toHaveCSS('transform', 'matrix(0.95, 0, 0, 0.95, 0, 0)');
          else await expect(plus).toHaveCSS('transform', 'none');
          await page.mouse.up();
          await value.focus();
          await page.keyboard.press('End');
          await expect(value).toHaveAttribute('aria-valuenow', '10');
          await expect(plus).toBeDisabled();
          await page.keyboard.press('Home');
          await expect(value).toHaveAttribute('aria-valuenow', '1');
          await expect(minus).toBeDisabled();
          await page.keyboard.press('ArrowUp');
          await expect(value).toHaveAttribute('aria-valuenow', '2');
          const remove = page.getByTestId('remove-stepper-decrement');
          await expect(remove).toHaveAttribute('tabindex', '0');
          await remove.focus();
          await page.keyboard.press('Enter');
          await expect(page.getByTestId('remove-count')).toHaveText('1');
          await expect(page.getByTestId('disabled-stepper-increment')).toBeDisabled();
          await expect(page.getByTestId('separate-stepper')).toHaveCSS('border-top-width', '0px');
          assert.deepEqual(errors, []);
          await page.close();
        }
  console.log(
    'Outlined Stepper geometry, expanded hit areas, hover/press/reduced motion, light/dark, coarse pointer, bounds, keyboard and removal passed.',
  );
} finally {
  await browser.close();
}
