/** Real browser composition: owned radio keyboard, natural height, focus and portaled Select lifecycle. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const base = process.argv[2] || 'http://localhost:6006';
try {
  for (const rtl of [false, true])
    for (const mode of ['light', 'dark'])
      for (const reducedMotion of ['no-preference', 'reduce']) {
        const page = await browser.newPage({
          viewport: { width: rtl ? 390 : 1100, height: 900 },
          reducedMotion,
        });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          if (
            message.type() === 'error' &&
            /collapsable|non-boolean/.test(message.text())
          )
            errors.push(message.text());
        });
        await page.addInitScript((rtl) => {
          const setDirection = () => {
            if (document.documentElement)
              document.documentElement.dir = rtl ? 'rtl' : 'ltr';
          };
          setDirection();
          document.addEventListener('DOMContentLoaded', setDirection, {
            once: true,
          });
        }, rtl);
        await page.goto(
          `${base}/iframe.html?id=base-collapsible--composed-options&viewMode=story&globals=theme:${mode}`,
        );
        const once = page.getByRole('radio', {
          name: 'One delivery',
          exact: true,
        });
        const repeat = page.getByRole('radio', {
          name: 'Repeat delivery',
          exact: true,
        });
        const panel = page.getByTestId('plan-body');
        await once.waitFor({ timeout: 120000 });
        await expect(panel).toHaveAttribute('inert', '');
        await expect(
          page.getByRole('textbox', { name: 'Delivery note' }),
        ).toHaveCount(0);
        await once.focus();
        await page.keyboard.press('Tab');
        await expect(page.getByTestId('close-plan')).toBeFocused();
        await once.focus();
        await page.evaluate(() => {
          const panel = document.querySelector('[data-testid="plan-body"]');
          window.__collapseFrames = [];
          const end = performance.now() + 600;
          function sample() {
            window.__collapseFrames.push(panel.getBoundingClientRect().height);
            if (performance.now() < end) requestAnimationFrame(sample);
          }
          requestAnimationFrame(sample);
        });
        await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
        await expect(repeat).toBeFocused();
        await expect(repeat).toHaveAttribute('aria-checked', 'true');
        await expect
          .poll(() =>
            panel.evaluate((node) =>
              Math.abs(
                node.getBoundingClientRect().height -
                  node.firstElementChild.getBoundingClientRect().height,
              ),
            ),
          )
          .toBeLessThan(1);
        const full = await panel.evaluate(
          (node) => node.firstElementChild.getBoundingClientRect().height,
        );
        const samples = await page.evaluate(() => window.__collapseFrames);
        if (reducedMotion === 'no-preference')
          assert.ok(
            samples.some((value) => value > 0 && value < full - 1),
            'normal reveal renders intermediate height',
          );
        else
          assert.ok(
            samples.every((value) => value === 0 || Math.abs(value - full) < 1),
            'reduced reveal has no intermediate height',
          );
        assert.equal(await panel.getAttribute('role'), null);
        assert.equal(await panel.getAttribute('aria-labelledby'), null);
        await expect(panel.locator('.bloom-collapsible-content')).toHaveCSS(
          'padding',
          '12px',
        );
        const input = page.getByRole('textbox', { name: 'Delivery note' });
        await input.fill('Retained note');
        await input.press('ArrowDown');
        await expect(page.getByTestId('selected-plan')).toHaveText('repeat');
        await page
          .getByRole('button', { name: 'Resize content', exact: true })
          .click();
        await expect
          .poll(() =>
            panel.evaluate((node) => node.getBoundingClientRect().height),
          )
          .toBeGreaterThan(1200);
        await page.setViewportSize({ width: rtl ? 600 : 390, height: 900 });
        await expect
          .poll(() =>
            panel.evaluate((node) =>
              Math.abs(
                node.getBoundingClientRect().height -
                  node.firstElementChild.getBoundingClientRect().height,
              ),
            ),
          )
          .toBeLessThan(1);
        await input.focus();
        await page.getByTestId('close-plan').evaluate((node) => node.click());
        await expect(repeat).toBeFocused();
        await expect(input).toHaveCount(0);
        await repeat.press('Space');
        await expect(input).toHaveValue('Retained note');
        const select = page.getByRole('button', {
          name: 'Delivery frequency',
          exact: true,
        });
        await select.focus();
        await select.press('ArrowDown');
        const menu = page.getByRole('menu', { name: 'Delivery frequency' });
        await expect(menu).toBeVisible();
        await page
          .getByRole('radio', { name: 'Every week', exact: true })
          .click();
        await expect(select).toHaveText('Every week');
        await expect(menu).toHaveCount(0);
        await select.focus();
        await select.press('ArrowDown');
        await expect(menu).toBeVisible();
        await expect
          .poll(() =>
            menu.evaluate((node) => node.contains(document.activeElement)),
          )
          .toBe(true);
        await page.getByTestId('close-plan').evaluate((node) => node.click());
        await expect(menu).toHaveCount(0);
        await expect(repeat).toBeFocused();
        await repeat.press('Space');
        await expect(select).toHaveText('Every week');
        await expect(menu).toHaveCount(0);
        await page.getByTestId('outside').focus();
        await page.getByTestId('close-plan').evaluate((node) => node.click());
        await expect(page.getByTestId('outside')).toBeFocused();
        await repeat.click();
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.getByTestId('close-plan').evaluate((node) => node.click());
        await expect(panel).toHaveCSS('max-height', '0px');
        assert.ok(
          !(await page.locator('body').ariaSnapshot()).includes(
            'Delivery note',
          ),
        );
        assert.deepEqual(errors, []);
        console.log(
          `PASS ${mode} ${rtl ? 'RTL narrow' : 'LTR wide'} ${reducedMotion}`,
        );
        await page.close();
      }
} finally {
  await browser.close();
}
