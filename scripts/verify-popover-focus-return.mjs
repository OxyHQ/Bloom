/** Real nested portal focus, keyboard dismissal and deliberate transfers. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    for (const conditional of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion });
      await page.goto(`${base}/iframe.html?id=base-popover--nested-focus-return&viewMode=story`);
      await page.getByRole('button', { name: 'Open parent', exact: true }).click({ timeout: 120000 });
      const parent = page.getByRole('dialog', { name: 'Parent dialog', exact: true });
      await expect(parent).toBeVisible();
      if (conditional) await page.getByRole('button', { name: 'Conditional content', exact: true }).click();
      const trigger = page.getByRole('button', { name: 'Filter', exact: true });
      const panel = page.getByRole('dialog', { name: 'Filter options', exact: true });
      for (const close of ['Escape', 'Apply', 'transfer']) {
        await trigger.focus(); await page.keyboard.press('Enter');
        await expect(panel).toBeVisible();
        const apply = page.getByRole('button', { name: 'Apply', exact: true });
        await apply.focus(); await expect(apply).toBeFocused();
        if (close === 'Escape') await page.keyboard.press('Escape');
        else await page.getByRole('button', { name: close === 'Apply' ? 'Apply' : 'Move focus outside', exact: true }).click();
        await expect(panel).toHaveCount(0);
        await expect(parent).toBeVisible();
        await expect(close === 'transfer' ? page.getByRole('button', { name: 'Outside control', exact: true }) : trigger).toBeFocused();
      }
      await trigger.click(); await expect(panel).toBeVisible();
      // First outside pointer dismisses the backdrop. The subsequent deliberate
      // click must retain focus after the exit/return-focus timers have settled.
      const outside = page.getByRole('button', { name: 'Outside control', exact: true });
      const box = await outside.boundingBox();
      await page.mouse.click(box.x + box.width - 10, box.y + box.height / 2);
      await expect(panel).toHaveCount(0);
      await outside.click(); await expect(outside).toBeFocused();
      console.log({ reducedMotion, conditional, escape: true, action: true, externalFocus: true });
      await page.close();
    }
  }
} finally { await browser.close(); }
