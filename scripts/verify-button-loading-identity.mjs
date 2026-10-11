/** Stable state/DOM and measured button geometry across both loading edges. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const base = process.argv[2] || 'http://localhost:6006';
try {
  for (const mode of ['light', 'dark'])
    for (const width of [390, 1200])
      for (const reducedMotion of ['reduce', 'no-preference']) {
        console.log({ mode, width, reducedMotion });
        const page = await browser.newPage({ viewport: { width, height: 850 }, reducedMotion });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(
          `${base}/iframe.html?id=base-button--loading-identity&viewMode=story&globals=theme:${mode}`,
        );
        await page.getByTestId('toggle-loading').waitFor({ timeout: 120000 });
        const ids = ['loading-content', 'loading-wide', 'loading-icon', 'loading-link'];
        const before = [];
        for (const id of ids) {
          const button = page.getByTestId(id);
          const counters = button.locator('[data-testid^="loading-counter-"]');
          before.push({
            id,
            box: await button.boundingBox(),
            names: await counters.evaluateAll((els) =>
              els.map((el) => el.getAttribute('data-testid')),
            ),
          });
        }
        await page.evaluate(() => {
          globalThis.loadingCounterNodes = [
            ...document.querySelectorAll('[data-testid^="loading-counter-"]'),
          ];
        });
        for (const loading of [true, false, true, false]) {
          await page.getByTestId('toggle-loading').click();
          for (const old of before) {
            const button = page.getByTestId(old.id);
            if (loading) await expect(button).toHaveAttribute('aria-busy', 'true');
            else await expect(button).not.toHaveAttribute('aria-busy', 'true');
            const box = await button.boundingBox();
            assert.ok(box && old.box);
            assert.ok(
              Math.abs(box.width - old.box.width) < 0.5 &&
                Math.abs(box.height - old.box.height) < 0.5,
              `${old.id} dimensions changed during loading`,
            );
            assert.deepEqual(
              await button
                .locator('[data-testid^="loading-counter-"]')
                .evaluateAll((els) => els.map((el) => el.getAttribute('data-testid'))),
              old.names,
            );
            if (old.id !== 'loading-link')
              await expect(button.locator(':scope > span').first()).toHaveCSS(
                'opacity',
                loading ? '0' : '1',
              );
          }
          assert.equal(
            await page.evaluate(() =>
              globalThis.loadingCounterNodes.every(
                (node) =>
                  node.isConnected &&
                  document.querySelector(`[data-testid="${node.getAttribute('data-testid')}"]`) ===
                    node,
              ),
            ),
            true,
          );
        }
        assert.deepEqual(errors, []);
        await page.close();
      }
  console.log(
    'Child identity/state and dimensions persist for label, full-width custom layout, icon-only and asChild through repeated loading in both themes, widths and motion modes.',
  );
} finally {
  await browser.close();
}
