import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [390, 1440])
    for (const rtl of [false, true]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(`${base}/iframe.html?id=base-dialog--side-gutter&viewMode=story`);
      await expect(page.getByRole('button', { name: 'Open full side sheet' })).toBeVisible({
        timeout: 120000,
      });
      if (rtl)
        await page.evaluate(() => {
          document.documentElement.dir = 'rtl';
        });
      for (const mode of ['full', 'default']) {
        await page.getByRole('button', { name: `Open ${mode} side sheet`, exact: true }).click();
        const panel = page.getByTestId(`${mode}-side-panel`);
        await expect(panel).toBeVisible();
        const gutter = mode === 'full' ? 0 : 24;
        await expect
          .poll(async () => {
            const rect = await panel.boundingBox();
            return (
              Math.abs(rect.width - (width - gutter)) < 1 &&
              Math.abs(rect.x - (rtl ? 0 : gutter)) < 1
            );
          })
          .toBe(true);
        await page.getByRole('button', { name: `Close ${mode} sheet`, exact: true }).click();
        await expect(panel).toHaveCount(0);
      }
      console.log({ width, rtl, full: true, default: true });
      await page.close();
    }
} finally {
  await browser.close();
}
