import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.BLOOM_VITE_URL || 'http://127.0.0.1:5181';
const output = resolve(process.env.BLOOM_VITE_OUTPUT || '.local/vite-guide-browser');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
const errors = [];
const fontResponses = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('response', (response) => {
  if (response.request().resourceType() === 'font' && response.url().includes('.woff2'))
    fontResponses.push({ path: new URL(response.url()).pathname, status: response.status() });
});
try {
  await page.goto(url);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByText('Count 1', { exact: true }).waitFor();
  const setup = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 16px Inter'),
      document.fonts.load('400 16px "JetBrains Mono"'),
      document.fonts.load('400 16px BlomusModernus'),
      document.fonts.load('700 16px BlomusModernus'),
    ]);
    const row = getComputedStyle(document.querySelector('[data-testid="utilities"]'));
    const text = getComputedStyle(document.querySelector('[data-testid="utility-text"]'));
    return {
      row: { direction: row.flexDirection, gap: row.gap, padding: row.padding },
      text: { size: text.fontSize, padding: text.padding, family: text.fontFamily },
      fonts: [...document.fonts].map((font) => ({ family: font.family, status: font.status })),
      adoptedSheets: document.adoptedStyleSheets.length,
    };
  });
  assert.deepEqual(setup.row, { direction: 'row', gap: '16px', padding: '16px' });
  assert.equal(setup.text.size, '24px');
  assert.equal(setup.text.padding, '16px');
  assert.equal(setup.fonts.length, 4);
  assert.ok(setup.fonts.every((font) => font.status === 'loaded'));
  assert.ok(setup.adoptedSheets > 0);
  await page.screenshot({ path: `${output}/desktop.png` });
  await page.mouse.move(550, 350);
  await page.mouse.wheel(0, 650);
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-bloom-screen-viewport="element"]')].some(
      (element) => element.scrollTop >= 640,
    ),
  );
  const scroll = await page.evaluate(() => ({
    document: window.scrollY,
    inner: document.querySelector('[data-bloom-screen-viewport="element"]').scrollTop,
  }));
  assert.equal(scroll.document, 0);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.evaluate(() =>
    document.querySelector('[data-bloom-screen-viewport="element"]').scrollTo(0, 0),
  );
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByText('Count 2', { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/compact.png` });
  assert.deepEqual(errors, []);
  assert.equal(fontResponses.length, 4);
  assert.ok(fontResponses.every((response) => response.status === 200));
  const report = { url, browser: browser.version(), setup, scroll, fontResponses, errors };
  writeFileSync(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
