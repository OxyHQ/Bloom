import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const output = process.env.BLOOM_ANCHOR_OUTPUT || '/tmp/bloom-virtual-anchor';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox'],
});
const report = { cases: [], errors: [] };
try {
  for (const width of [320, 390, 1024]) {
    const page = await browser.newPage({ viewport: { width, height: 700 } });
    page.on('pageerror', (error) => report.errors.push(error.message));
    await page.goto(
      `${process.argv[2] || 'http://localhost:6135'}/iframe.html?id=base-popover--virtual-selection&viewMode=story`,
    );
    await page
      .getByRole('button', { name: 'Format selection', exact: true })
      .click({ timeout: 120000 });
    const panel = page.getByTestId('selection-panel');
    await panel.waitFor();
    await page.waitForTimeout(300);
    const before = await panel.boundingBox();
    assert.ok(before.x >= 0 && before.x + before.width <= width + 1, 'panel fits viewport');
    const anchorBefore = await page.getByTestId('selection-anchor').boundingBox();
    await page.getByTestId('selection-scroller').evaluate((n) => {
      n.scrollTop = 35;
    });
    await page.waitForTimeout(300);
    const after = await panel.boundingBox();
    const anchorAfter = await page.getByTestId('selection-anchor').boundingBox();
    assert.ok(
      Math.abs(after.y - before.y - (anchorAfter.y - anchorBefore.y)) <= 2,
      'panel follows nested scroll',
    );
    const field = page.getByRole('textbox', { name: 'Link', exact: true });
    await field.focus();
    await field.fill('https://example.test');
    await page.setViewportSize({ width: width === 320 ? 390 : 320, height: 700 });
    await page.waitForTimeout(300);
    assert.equal(await field.inputValue(), 'https://example.test');
    assert.equal(await field.evaluate((n) => n === document.activeElement), true);
    const resized = await panel.boundingBox();
    assert.ok(resized.x >= 0 && resized.x + resized.width <= page.viewportSize().width + 1);
    await page.screenshot({ path: join(output, `selection-${width}.png`) });
    report.cases.push({ width, before, after, anchorBefore, anchorAfter, resized });
    await page.getByRole('button', { name: 'Bold', exact: true }).focus();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    assert.equal(await panel.isVisible(), false);
    await page.close();
  }
  assert.deepEqual(report.errors, []);
} finally {
  writeFileSync(join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
console.log(JSON.stringify({ cases: report.cases.length, errors: report.errors }));
