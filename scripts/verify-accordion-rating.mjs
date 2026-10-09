/** Real layout, keyboard/AX containment, live motion preferences and class cascade. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const base = process.argv[2] || 'http://localhost:6006';
try {
  for (const mode of ['light', 'dark']) for (const reducedMotion of ['reduce', 'no-preference']) {
    const page = await browser.newPage({ viewport: { width: 800, height: 1200 }, reducedMotion });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const goto = async id => {
      await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${mode}`);
      await page.locator('#storybook-root > *').first().waitFor({ timeout: 120000 });
    };
    await goto('base-accordion--single');
    const original = page.getByRole('button').first();
    await expect(original).toHaveCSS('padding', '12px 4px');
    await expect(original).toHaveCSS('font-size', '15px');
    assert.equal((await original.boundingBox()).height, 41);
    await goto('base-accordion--authored-surface');
    const trigger = page.getByRole('button', { name: 'Details', exact: true });
    await trigger.waitFor();
    const root = page.getByTestId('authored-accordion');
    const panel = page.locator('.bloom-demo-accordion-panel');
    const input = page.getByRole('textbox', { name: 'Expanded input' });
    assert.equal(await trigger.getAttribute('aria-controls'), await panel.getAttribute('id'));
    assert.equal(await panel.getAttribute('aria-labelledby'), await trigger.getAttribute('id'));
    await expect(input).toHaveCount(0);
    assert.equal(await panel.locator('input').count(), 1, 'collapsed children remain mounted');
    await expect(panel).toHaveAttribute('inert', '');
    await trigger.focus(); await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'More', exact: true })).toBeFocused();
    await expect(root).toHaveCSS('gap', '8px'); await expect(root).toHaveCSS('width', '360px');
    await expect(trigger).toHaveCSS('padding', '16px 0px'); await expect(trigger).toHaveCSS('font-size', '18px');
    await expect(trigger).toHaveCSS('line-height', '20px');
    await expect(trigger.locator('..')).toHaveCSS('border-bottom-color', 'rgb(84, 51, 235)');
    await expect(panel).toHaveCSS('background-color', 'rgb(238, 240, 241)');
    await expect(panel.locator('.bloom-accordion-body')).toHaveCSS('padding', '0px 0px 16px');
    const frames = await trigger.evaluate(async button => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      const samples = []; button.click();
      for (let i = 0; i < 24; i++) { await new Promise(requestAnimationFrame); if (button.getAttribute('aria-expanded') === 'true') samples.push(panel.getBoundingClientRect().height); }
      return samples;
    });
    const full = await panel.locator('.bloom-accordion-body').evaluate(node => node.getBoundingClientRect().height);
    assert.ok(full > 900); assert.ok(Math.abs(frames.at(-1) - full) < 1);
    if (reducedMotion === 'no-preference') assert.ok(frames.some(value => value > 0 && value < full - 1), 'normal timing must animate intermediate frames');
    else assert.ok(frames.every(value => Math.abs(value - full) < 1), 'reduced motion must settle at the first rendered frame');
    await expect(page.getByRole('region', { name: 'Details', exact: true })).toHaveCount(1);
    await input.fill('Retained edit'); await input.focus();
    await page.getByTestId('collapse-external').evaluate(button => button.click());
    await expect(trigger).toBeFocused(); await expect(input).toHaveCount(0);
    await trigger.click(); await expect(input).toHaveValue('Retained edit');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(async () => panel.evaluate(node => node.getBoundingClientRect().height)).toBe(full);
    await trigger.click(); await expect(panel).toHaveCSS('max-height', '0px');
    assert.ok(!(await page.locator('body').ariaSnapshot()).includes('Expanded input'));
    await goto('base-accordion--style-overrides');
    const styled = page.getByRole('button', { name: 'Style overrides', exact: true });
    await expect(styled).toHaveCSS('padding', '16px 0px');
    await expect(styled.locator('[data-testid="accordion-trigger-label"]')).toHaveCSS('line-height', '20px');
    await expect(styled.locator('..').locator('..')).toHaveCSS('padding-left', '12px');
    await goto('base-rating--authored-summary');
    const stars = page.getByTestId('summary-stars'); await stars.waitFor();
    assert.equal(await stars.innerText(), '');
    await expect(stars).toHaveAttribute('aria-label', /4.5/);
    const sizes = await stars.locator('svg').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
    assert.ok(sizes.length >= 5 && sizes.every(size => size === 20));
    const row = page.getByTestId('summary-rating'); const track = page.getByTestId('summary-rating-bar'); const fill = page.getByTestId('summary-rating-fill');
    await expect(row).toHaveCSS('gap', '8px'); await expect(track).toHaveCSS('height', '8px');
    await expect(row.locator('.bloom-rating-label')).toHaveCSS('font-size', '10px');
    await expect(row.locator('.bloom-rating-label')).toHaveCSS('font-weight', '600');
    await expect(fill).toHaveCSS('background-color', mode === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(18, 18, 18)');
    assert.equal(await track.getAttribute('aria-valuenow'), '0.75');
    const geometry = await row.evaluate(node => {
      const track = node.querySelector('.bloom-meter-track').getBoundingClientRect(), fill = node.querySelector('.bloom-meter-fill').getBoundingClientRect();
      return { fraction: fill.width / track.width };
    });
    assert.ok(Math.abs(geometry.fraction - .75) < .001);
    await expect(page.getByTestId('default-rating')).toHaveCSS('gap', '12px');
    await expect(page.getByTestId('default-rating-bar')).toHaveCSS('height', '4px');
    await expect(page.getByTestId('default-rating-bar')).toHaveCSS('width', '96px');
    await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    const rtl = await track.evaluate(node => {
      const track = node.getBoundingClientRect(), fill = node.firstElementChild.getBoundingClientRect();
      return { end: Math.abs(track.right - fill.right), fraction: fill.width / track.width };
    });
    assert.ok(rtl.end < 1 && Math.abs(rtl.fraction - .75) < .001, 'RTL must preserve the value and fill from the logical start');
    assert.deepEqual(errors, []); await page.close();
    console.log({ mode, reducedMotion, result: 'passed' });
  }
} finally { await browser.close(); }
