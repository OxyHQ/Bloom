/** Current-link semantics survive both anchor paths and destination changes. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`${base}/iframe.html?id=base-button--current-destination&viewMode=story`);
    const active = page.getByRole('link', { name: 'Active orders', exact: true });
    const archived = page.getByRole('link', { name: 'Archived orders', exact: true });
    await expect(active).toHaveAttribute('aria-current', 'page', { timeout: 120000 });
    await expect(archived).not.toHaveAttribute('aria-current');
    await expect(active).not.toHaveAttribute('aria-pressed');
    await archived.focus();
    await page.keyboard.press('Enter');
    await expect(archived).toHaveAttribute('aria-current', 'page');
    await expect(active).not.toHaveAttribute('aria-current');
    await active.click();
    await expect(active).toHaveAttribute('aria-current', 'page');
    await expect(archived).not.toHaveAttribute('aria-current');
    console.log({ width, currentLink: true, ordinaryLink: true, keyboard: true });
    await page.close();
  }
} finally {
  await browser.close();
}
