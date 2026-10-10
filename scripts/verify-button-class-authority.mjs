/** The consumer owns component-layer recipes; Bloom keeps semantics and defaults. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const base = process.argv[2] || 'http://localhost:6006';
try {
  for (const mode of ['light', 'dark'])
    for (const reducedMotion of ['reduce', 'no-preference'])
      for (const touch of [false, true]) {
        const page = await browser.newPage({
          viewport: { width: touch ? 390 : 1200, height: 1000 },
          hasTouch: touch,
          isMobile: touch,
          reducedMotion,
        });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(
          `${base}/iframe.html?id=base-button--class-name-authority&viewMode=story&globals=theme:${mode}`,
        );
        const button = page.getByTestId('class-purchase');
        await button.waitFor({ timeout: 120000 });
        await page.mouse.move(0, 0);
        await expect(button).toHaveCSS('height', '52px');
        await expect(button).toHaveCSS('font-size', '16px');
        await expect(button).toHaveCSS('line-height', '20px');
        await expect(button).toHaveCSS('border-radius', '24px');
        await expect(button).toHaveCSS('background-color', 'rgb(84, 51, 235)');
        await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
        assert.equal(
          await button.evaluate(
            (el) => (getComputedStyle(el).boxShadow.match(/inset/g) || []).length,
          ),
          2,
        );
        await expect(button.locator('svg path').first()).toHaveCSS('fill', 'rgb(255, 255, 255)');
        const defaults = await page.getByTestId('class-default').evaluate((el) => {
          const c = getComputedStyle(el);
          return [
            c.height,
            c.fontSize,
            c.lineHeight,
            c.borderRadius,
            c.backgroundColor,
            c.boxShadow,
          ];
        });
        assert.deepEqual(
          defaults,
          await page.getByTestId('no-class-default').evaluate((el) => {
            const c = getComputedStyle(el);
            return [
              c.height,
              c.fontSize,
              c.lineHeight,
              c.borderRadius,
              c.backgroundColor,
              c.boxShadow,
            ];
          }),
        );
        await expect(page.getByTestId('class-secondary')).toHaveCSS(
          'background-color',
          mode === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(18, 18, 18)',
        );
        await expect(page.getByTestId('class-outline')).toHaveCSS('height', '44px');
        await expect(page.getByTestId('class-outline')).toHaveCSS('backdrop-filter', 'blur(10px)');
        await button.hover();
        await expect(button).toHaveCSS('background-color', 'rgb(69, 36, 219)');
        await page.mouse.down();
        await expect(button).toHaveCSS('background-color', 'rgb(50, 26, 188)');
        await expect(button).toHaveCSS(
          'transform',
          reducedMotion === 'reduce'
            ? 'matrix(1, 0, 0, 1, 0, 0)'
            : 'matrix(0.99, 0, 0, 0.99, 0, 0)',
        );
        await page.mouse.up();
        const child = await page
          .getByTestId('class-stateful')
          .locator('[data-testid^="loading-counter-"]')
          .elementHandle();
        const id = await child.getAttribute('data-testid');
        await page.getByTestId('class-toggle-loading').click();
        await expect(button).toHaveAttribute('aria-busy', 'true');
        await button.hover();
        await expect(button).toHaveCSS('background-color', 'rgb(84, 51, 235)');
        const blades = button
          .locator('span[aria-hidden="true"]')
          .last()
          .locator('div[style*="background-color"]');
        await expect(blades).toHaveCount(8);
        await expect(blades.last()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
        assert.ok(await child.evaluate((el) => el.isConnected));
        await page.getByTestId('class-toggle-loading').click();
        await expect(page.getByTestId(id)).toBeVisible();
        await page.getByTestId('class-toggle-disabled').click();
        await expect(button).toBeDisabled();
        await expect(button).toHaveCSS('background-color', 'rgb(238, 240, 241)');
        await expect(button).toHaveCSS('box-shadow', 'none');
        await expect(button.locator('svg path').first()).toHaveCSS('fill', 'rgb(136, 136, 136)');
        assert.deepEqual(errors, []);
        console.log({ mode, reducedMotion, touch, result: 'pass' });
        await page.close();
      }
} finally {
  await browser.close();
}
