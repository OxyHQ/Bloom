/** Verify real AppShell geometry, accessible icon destinations and user bubbles. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${process.argv[2] || 'http://localhost:6006'}/iframe.html?id=blocks-app-shell--icon-only-rail&viewMode=story`);
  const turn = page.getByTestId('wide-bubble');
  await turn.waitFor({ timeout: 120000 });
  for (const width of [1200, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const dir of ['ltr', 'rtl']) {
      await page.evaluate(value => { document.documentElement.dir = value; }, dir);
      await page.waitForTimeout(150);
      const destination = page.getByTestId('sidebar-item-home');
      assert.equal(await destination.getAttribute('aria-label'), 'Home');
      assert.equal(await destination.getAttribute('title'), 'Home');
      assert.equal(await destination.getAttribute('aria-current'), 'page');
      assert.equal(await destination.innerText(), '');
      const rail = await page.getByTestId('icon-rail-shell-navigation').boundingBox();
      assert.equal(rail.width, 68, 'Shell reserves the configured natural rail width');
      const column = await turn.boundingBox();
      const bubble = await page.getByTestId('wide-bubble-bubble').boundingBox();
      assert.ok(bubble.width <= column.width - 112 + 1, 'Bubble callback uses actual column width');
      assert.ok(Math.abs(dir === 'ltr' ? bubble.x + bubble.width - column.x - column.width : bubble.x - column.x) < 1, `Bubble follows logical end: ${JSON.stringify({dir,width,column,bubble})}`);
      assert.equal(await page.getByTestId('wide-bubble-bubble').evaluate(el => getComputedStyle(el).borderRadius), '24px');
      const fill = await page.getByTestId('sidebar-item-home-indicator').evaluate(el => getComputedStyle(el).backgroundColor);
      assert.equal(fill, 'rgba(0, 0, 0, 0)', 'Icon-only selection has no filled indicator');
      await destination.focus();
      assert.equal(await destination.evaluate(el => document.activeElement === el), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
  }
  assert.deepEqual(errors, []);
  console.log('Icon-only rail68px, accessible labels/tooltips/focus, unfilled selection and responsive RTL user bubbles passed.');
} finally { await browser.close(); }
