import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const colorScheme of ['light', 'dark'])
    for (const placement of ['end', 'bottom']) {
      const page = await browser.newPage({
        colorScheme,
        viewport: { width: placement === 'bottom' ? 390 : 1440, height: 900 },
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/iframe.html?id=theme-colorscope--exact-tokens&viewMode=story&args=placement:${placement}`,
      );
      const inside = page.getByTestId('inside-scope');
      await inside.waitFor({ timeout: 120000 });
      const mount = await inside.getAttribute('data-mount');
      const outside = await page.getByTestId('outside-scope').getAttribute('data-color');
      const documentStyle = await page.evaluate(() =>
        document.documentElement.getAttribute('style'),
      );
      await page.getByRole('textbox', { name: 'inside-scope draft' }).fill('survives updates');
      await page.getByRole('button', { name: 'Toggle exact scope' }).click();
      await expect(inside).toHaveCSS('background-color', 'rgb(84, 51, 235)');
      await expect(inside).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(inside).toHaveAttribute('data-color', '#5433eb');
      await expect(inside).toHaveAttribute('data-mode', 'dark');
      await page.getByRole('button', { name: 'Toggle scoped portal' }).click();
      const portal = page.getByTestId('portal-scope');
      await expect(portal).toHaveCSS('background-color', 'rgb(84, 51, 235)');
      await expect(portal).toHaveCSS('color', 'rgb(255, 255, 255)');
      await page.getByRole('textbox', { name: 'portal-scope draft' }).fill('portal retained');
      const portalMount = await portal.getAttribute('data-mount');
      const sheetOpener = page.getByRole('button', { name: 'Open scoped sheet' });
      await sheetOpener.click();
      const sheet = page.getByRole('dialog', { name: 'Scoped sheet', exact: true });
      await expect(page.getByTestId('sheet-scope')).toHaveCSS(
        'background-color',
        'rgb(84, 51, 235)',
      );
      const nestedOpener = sheet.getByRole('button', { name: 'Open nested scope' });
      await nestedOpener.click();
      await expect(page.getByTestId('nested-scope')).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(page.getByTestId('nested-scope')).toHaveAttribute('data-mode', 'dark');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: 'Nested scope', exact: true })).toHaveCount(0);
      await expect(nestedOpener).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);
      await expect(sheetOpener).toBeFocused();
      await page.getByRole('button', { name: 'Switch scoped mode' }).click();
      await expect(portal).toHaveCSS('background-color', 'rgb(196, 107, 18)');
      await expect(portal).toHaveAttribute('data-mode', 'light');
      await page.getByRole('button', { name: 'Toggle exact scope' }).click();
      await expect(inside).toHaveAttribute('data-color', outside);
      await expect(portal).toHaveAttribute('data-color', outside);
      await expect(inside).toHaveAttribute('data-mount', mount);
      await expect(portal).toHaveAttribute('data-mount', portalMount);
      await expect(page.getByRole('textbox', { name: 'inside-scope draft' })).toHaveValue(
        'survives updates',
      );
      await expect(page.getByRole('textbox', { name: 'portal-scope draft' })).toHaveValue(
        'portal retained',
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.getAttribute('style')),
        documentStyle,
      );
      assert.deepEqual(errors, []);
      console.log({ colorScheme, placement, passed: true });
      await page.close();
    }
} finally {
  await browser.close();
}
