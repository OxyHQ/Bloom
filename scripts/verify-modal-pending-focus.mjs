/** Physical keyboard traversal while every modal action is unavailable. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const placement of ['center', 'end', 'bottom']) for (const reducedMotion of ['reduce', 'no-preference']) {
    const page = await browser.newPage({ viewport: { width: placement === 'bottom' ? 390 : 1440, height: 900 }, reducedMotion });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/iframe.html?id=base-dialog--pending-focus&viewMode=story&args=placement:${placement}`);
    const opener = page.getByRole('button', { name: 'Open pending focus' });
    await opener.waitFor({ timeout: 120000 });
    await opener.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Pending focus' });
    const cancel = dialog.getByRole('button', { name: 'Cancel request' });
    const submit = dialog.getByRole('button', { name: 'Start request' });
    await expect(dialog).toBeVisible();
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Tab'); await expect(submit).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(cancel).toBeDisabled(); await expect(submit).toBeDisabled();
    for (const key of ['Tab', 'Shift+Tab', 'Tab']) {
      await page.keyboard.press(key);
      await expect(dialog).toBeFocused();
      await expect(page.getByTestId('pending-boundary')).toHaveAttribute('inert', '');
    }
    await page.keyboard.press('Escape'); await expect(dialog).toBeVisible();
    await expect(cancel).toBeEnabled({ timeout: 10000 });
    // Reverse Tab from the fallback panel must go to the last available action.
    await page.keyboard.press('Shift+Tab'); await expect(submit).toBeFocused();
    await page.keyboard.press('Tab'); await expect(cancel).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
    assert.deepEqual(errors, []);
    console.log({ placement, reducedMotion, passed: true });
    await page.close();
  }
} finally { await browser.close(); }
