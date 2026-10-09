/** Real-pointer check of document footers and focus-controlled suggestions. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${process.argv[2] || 'http://localhost:6006'}/iframe.html?id=blocks-page-footer--document-composer&viewMode=story`);
  const footer = page.getByTestId('document-footer');
  await footer.waitFor({ timeout: 120000 });
  const measure = async () => {
    const column = await page.getByTestId('document-column').boundingBox();
    const bounds = await footer.boundingBox();
    assert.ok(Math.abs(bounds.x - column.x) < 1, 'Footer follows column position');
    assert.ok(Math.abs(bounds.width - column.width) < 1, 'Footer follows column width');
    assert.ok(Math.abs(bounds.y + bounds.height - page.viewportSize().height) < 1, 'Footer stays at viewport bottom');
  };
  await measure();
  const input = page.getByTestId('document-composer-input');
  assert.equal(await page.getByTestId('document-composer-bar').evaluate(el => getComputedStyle(el).borderRadius), '32px');
  assert.equal(await page.getByTestId('document-composer-bar').evaluate(el => getComputedStyle(el).minHeight), '64px');
  assert.equal(await input.evaluate(el => getComputedStyle(el).fontSize), '16px');
  assert.equal(await page.getByTestId('document-composer-mic').count(), 0);
  assert.equal(await page.getByTestId('document-composer-send').isDisabled(), true);
  await input.click();
  await page.getByRole('option', { name: 'First choice' }).click();
  assert.equal(await input.inputValue(), 'First choice', 'Pointer click survives focus-based suggestion visibility');
  assert.equal(await input.evaluate(el => el === document.activeElement), true, 'Selection keeps input focus');
  await page.getByRole('button', { name: 'Resize rail', exact: true }).click();
  assert.equal(await page.getByRole('option').count(), 0, 'Outside focus dismisses suggestions');
  await page.waitForTimeout(100);
  await measure();
  await page.getByRole('button', { name: 'Mirror layout', exact: true }).click();
  await page.waitForTimeout(100);
  await measure();
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(100);
  assert.ok(await page.evaluate(() => window.scrollY > 0), 'The document owns scrolling');
  await measure();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  await measure();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No mobile overflow');
  assert.deepEqual(errors, []);
  console.log('Document footer column alignment, resize, mirrored layout, scroll, mobile and real-pointer composer selection passed.');
} finally { await browser.close(); }
