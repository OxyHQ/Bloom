/** Real DOM semantics, responsive panel replacement and modal keyboard scope. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const base = process.argv[2] || 'http://localhost:6006';
try {
  for (const mode of ['light', 'dark']) for (const reducedMotion of ['reduce', 'no-preference']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion });
    const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
    console.log({ mode, reducedMotion });
    await page.goto(`${base}/iframe.html?id=base-dialog--responsive-accessibility&viewMode=story&globals=theme:${mode}`);
    const trigger = page.getByRole('button', { name: 'Open account settings', exact: true });
    await trigger.waitFor({ timeout: 120000 });
    console.log('opening'); await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Account settings', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleDescription('Review your account preferences.');
    await expect(dialog.getByRole('button', { name: 'Save preferences' })).toBeVisible();
    await expect(trigger).toHaveCount(0); // background is absent from the accessibility tree
    for (let n = 0; n < 5; n++) {
      await page.keyboard.press('Tab');
      assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
    }
    // Moving to desktop and back replaces the panel but retains one named modal.
    for (const width of [1100, 390]) {
      console.log('resize', width); await page.setViewportSize({ width, height: 844 });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveCSS('position', width === 390 ? 'absolute' : 'relative');
      await expect(page.getByRole('dialog')).toHaveCount(1);
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAccessibleDescription('Review your account preferences.');
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeVisible();
    console.log('opening'); await trigger.click();
    await dialog.getByRole('button', { name: 'Save preferences' }).click();
    await expect(dialog).toHaveCount(0);
    console.log('header test');
    // Navigation chrome belongs INSIDE the semantic panel, not its sibling.
    await page.goto(`${base}/iframe.html?id=base-dialog--header-accessibility&viewMode=story&globals=theme:${mode}`);
    console.log('opening'); await trigger.click();
    await expect(dialog).toBeVisible();
    const buttons = dialog.getByRole('button');
    assert.ok(await buttons.count() >= 2, 'Header dismissal and body actions belong to the dialog');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Bottom/center responsive modal names, descriptions, header inclusion, inert background, Tab and Escape passed in light/dark and both motion settings.');
} finally { await browser.close(); }
