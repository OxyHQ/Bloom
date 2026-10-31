import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || '@playwright/test');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const story of ['bounded', 'class-padding']) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/iframe.html?id=composition-workspace-scroll-probe--${story}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    const draft = page.getByTestId('draft');
    await draft.waitFor({ timeout: 120000 });
    const rects = await page.evaluate(() => {
      const header = document.querySelector('[data-testid="header"]');
      const body = document.querySelector('[data-testid="body"]');
      const end = document.querySelector('[data-testid="end"]');
      const content = end.parentElement;
      const clearance = content.parentElement;
      const box = (node) => {
        const r = node.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      };
      return {
        header: box(header),
        body: box(body),
        end: box(end),
        content: box(content),
        hostPadding: getComputedStyle(body).paddingTop,
        contentPadding: getComputedStyle(content).paddingTop,
        clearance: getComputedStyle(clearance).paddingTop,
      };
    });
    assert.equal(rects.header.height, 64);
    assert.equal(rects.body.height, 400);
    assert.equal(rects.hostPadding, '8px');
    assert.equal(rects.contentPadding, '16px');
    assert.equal(rects.clearance, '64px');
    assert.ok(rects.content.top >= rects.header.bottom + 8);
    assert.ok(rects.end.bottom <= rects.body.bottom - 8);
    assert.ok(rects.end.bottom > rects.body.bottom - 64, 'flex-1 content aligns at bottom');
    await draft.fill('unsent');
    await page.getByTestId('toggle').click();
    assert.equal(await draft.inputValue(), 'unsent');
    assert.deepEqual(errors, []);
    console.log({ story, passed: true, rects });
    await page.close();
  }
} finally {
  await browser.close();
}
