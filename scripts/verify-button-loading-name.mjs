import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || '@playwright/test');
const browser = await chromium.launch({ headless: true });
const base = process.argv[2] || 'http://127.0.0.1:6273';
try {
  for (const width of [390, 1440]) for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 1100 } });
    page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/iframe.html?id=base-dialog--loading-button-names&viewMode=story&globals=theme:${theme}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Open pending dialog', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const labels = ['Remove variant', 'Publish draft', 'حذف المتغيّر', 'Save item'];
    const before = await Promise.all(labels.map(name => dialog.getByRole('button', { name, exact: true }).evaluate(el => ({ width: el.offsetWidth, height: el.offsetHeight }))));
    const rich = dialog.getByTestId('composed-action-name');
    const identity = await rich.getAttribute('data-identity');
    await dialog.getByRole('button', { name: 'Remove variant', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Cancel action', exact: true })).toBeDisabled();
    for (const [index, name] of labels.entries()) {
      const button = dialog.getByRole('button', { name, exact: true });
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute('aria-busy', 'true');
      const after = await button.evaluate(el => ({ width: el.offsetWidth, height: el.offsetHeight }));
      assert(after && before[index]);
      assert(Math.abs(after.width - before[index].width) < .5 && Math.abs(after.height - before[index].height) < .5, `${name}: loading changed geometry`);
    }
    await expect(dialog.getByRole('link', { name: 'Open destination', exact: true })).toBeDisabled();
    await expect(dialog.getByRole('link', { name: 'Supplied link', exact: true })).toBeDisabled();
    await expect(rich).toHaveAttribute('data-identity', identity);
    await expect(rich.locator('..')).toHaveCSS('opacity', '0');
    await dialog.getByRole('button', { name: 'Finish request', exact: true }).click();
    for (const name of labels) await expect(dialog.getByRole('button', { name, exact: true })).toBeEnabled();
    await expect(rich).toHaveAttribute('data-identity', identity);
    await expect(rich.locator('..')).toHaveCSS('opacity', '1');
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px ${theme}: dialog pending names, rich/Arabic/icon/link, geometry and identity`);
    await page.close();
  }
} finally { await browser.close(); }
