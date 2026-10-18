/** The announced web slider must be the same element that receives keyboard focus. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`${process.env.STORYBOOK_URL ?? 'http://localhost:6007'}/iframe.html?id=base-slider--matrix&viewMode=story`);
  const slider = page.getByRole('slider', { name: 'Volume', exact: true });
  await slider.waitFor();
  assert.equal(await slider.count(), 1);
  await slider.press('End');
  assert.equal(await slider.getAttribute('aria-valuenow'), '100');
  assert.equal(await slider.evaluate(node => node === document.activeElement), true);
  await slider.press('Home');
  assert.equal(await slider.getAttribute('aria-valuenow'), '0');
  await slider.press('ArrowRight');
  assert.equal(await slider.getAttribute('aria-valuenow'), '1');
  assert.equal(await page.getByRole('slider', { name: 'Locked', exact: true }).getAttribute('tabindex'), '-1');
  console.log('PASS slider: accessible role, focus and keyboard value share the actual thumb');
} finally { await browser.close(); }
