/** Dismissing a child before its first focus frame must leave its opener focused. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const placement of ['center', 'end', 'bottom'])
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({
        viewport: { width: placement === 'bottom' ? 390 : 1440, height: 900 },
        reducedMotion,
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/iframe.html?id=base-dialog--rapid-nested-close&viewMode=story&args=placement:${placement}`,
      );
      const rootOpener = page.getByRole('button', { name: 'Open parent surface' });
      await rootOpener.waitFor({ timeout: 120000 });
      await rootOpener.focus();
      await page.keyboard.press('Enter');
      const parent = page.getByRole('dialog', { name: 'Parent surface' });
      const opener = parent.getByRole('button', { name: 'Open transient child' });
      await expect(opener).toBeFocused();
      for (let iteration = 1; iteration <= 3; iteration++) {
        await page.keyboard.press('Enter');
        await expect(page.getByTestId('transient-close-count')).toHaveText(String(iteration));
        await expect(page.getByRole('dialog', { name: 'Transient child' })).toHaveCount(0);
        await expect(opener).toBeFocused();
      }
      const keyboardOpener = parent.getByRole('button', { name: 'Open keyboard child' });
      for (let iteration = 4; iteration <= 6; iteration++) {
        // Pointer opening followed immediately by Escape, without waiting for autofocus.
        await keyboardOpener.click();
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('transient-close-count')).toHaveText(String(iteration));
        await expect(page.getByRole('dialog', { name: 'Transient child' })).toHaveCount(0);
        await expect(keyboardOpener).toBeFocused();
      }
      await page.keyboard.press('Escape');
      await expect(parent).toHaveCount(0);
      await expect(rootOpener).toBeFocused();
      assert.deepEqual(errors, []);
      console.log({ placement, reducedMotion, passed: true });
      await page.close();
    }
} finally {
  await browser.close();
}
