/** Screen owns route chrome and reuses one document/column scroll owner. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${process.env.STORYBOOK_URL ?? 'http://localhost:6007'}/iframe.html?id=foundations-screen--declarative-host&viewMode=story`);
  await page.getByTestId('declarative-content').waitFor();
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.screenContentProbe = document.querySelector('[data-testid="declarative-content"]'); });
  const read = () => page.evaluate(() => {
    const content = document.querySelector('[data-testid="declarative-content"]');
    const viewport = document.querySelector('[data-bloom-screen-viewport]');
    const header = document.querySelector('[data-testid="declarative-screen-header"]');
    const footer = document.querySelector('[data-testid="declarative-screen-bottom"]');
    const nested = [...viewport.querySelectorAll('*')].filter((node) => ['auto', 'scroll'].includes(getComputedStyle(node).overflowY));
    return { retained: content === window.screenContentProbe, kind: viewport.dataset.bloomScreenViewport,
      viewport: viewport.getBoundingClientRect().toJSON(), header: header.getBoundingClientRect().toJSON(), footer: footer.getBoundingClientRect().toJSON(),
      contentTop: content.getBoundingClientRect().top, top: viewport.scrollTop, documentTop: scrollY, nested: nested.length };
  });
  const before = await read();
  assert.equal(before.kind, 'element');
  const elementBar = page.locator('[data-bloom-scrollbar-owner="element"][data-bloom-scrollbar-axis="vertical"]');
  assert.equal(await elementBar.count(), 1);
  const thumb = elementBar.locator('[data-bloom-scrollbar-thumb]');
  const thumbBox = await thumb.boundingBox();
  assert.ok(thumbBox && thumbBox.height > 0);
  await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2 + 80, {steps: 5});
  await page.mouse.up();
  assert.ok((await read()).top > 0, 'custom scrollbar drags the existing Screen viewport');
  assert.equal(before.nested, 0);
  assert.ok(Math.abs(before.header.top - before.viewport.top) <= 1);
  assert.ok(before.contentTop >= before.header.bottom - 1);
  assert.ok(Math.abs(before.viewport.bottom - before.footer.bottom) <= 1);
  await page.locator('[data-bloom-screen-viewport]').evaluate((node) => { node.scrollTop = 300; });
  await page.waitForTimeout(100);
  const scrolled = await read();
  assert.ok(scrolled.top >= 299);
  assert.ok(scrolled.contentTop < scrolled.header.bottom, "content scrolls behind header in the full panel owner");
  assert.equal(scrolled.header.y, before.header.y);
  assert.equal(scrolled.footer.y, before.footer.y);
  await page.getByTestId('declarative-toggle').click();
  await page.waitForTimeout(200);
  assert.equal((await read()).kind, 'document');
  assert.equal(await page.locator('[data-bloom-scrollbar-owner="document"][data-bloom-scrollbar-axis="vertical"]').count(), 1);
  await page.evaluate(() => scrollTo(0, 300));
  await page.waitForTimeout(100);
  assert.ok((await read()).documentTop >= 299);
  assert.ok((await read()).retained);
  await page.evaluate(() => scrollTo(0, 0));
  await page.getByTestId('declarative-toggle').click();
  await page.waitForTimeout(200);
  assert.equal((await read()).kind, 'element');
  assert.ok((await read()).retained);
  assert.deepEqual(errors, []);
  console.log('PASS declarative Screen: header/footer, sole scroll owner, retained document/column content');
} finally { await browser.close(); }
