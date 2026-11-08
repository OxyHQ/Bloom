import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const out = resolve(process.env.BLOOM_HOST_OUTPUT || '.local/fixed-host-browser');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const states = [];
try {
  await page.goto(process.env.BLOOM_HOST_URL || 'http://127.0.0.1:5186');
  const input = page.getByRole('textbox', { name: 'Draft' });
  await input.fill('retained draft');
  await input.evaluate((el) => (window.__draft = el));
  async function snapshot(label) {
    const state = await page.evaluate(() => {
      const viewport = document.querySelector('[data-bloom-screen-viewport]');
      const host = document.querySelector('[data-testid="host"]');
      const rect = viewport.getBoundingClientRect();
      return {
        kind: viewport.getAttribute('data-bloom-screen-viewport'),
        y: viewport.scrollTop,
        windowY: window.scrollY,
        height: rect.height,
        hostHeight: host.getBoundingClientRect().height,
        sameInput: window.__draft === document.querySelector('input'),
        draft: document.querySelector('input').value,
      };
    });
    assert.equal(state.sameInput, true);
    assert.equal(state.draft, 'retained draft');
    states.push({ label, ...state });
    return state;
  }
  for (const embedded of [false, true]) {
    if (embedded) {
      await page.getByRole('button', { name: 'Toggle embedded', exact: true }).click();
    }
    const before = await snapshot(`${embedded ? 'embedded' : 'root'} fixed`);
    assert.equal(before.kind, 'element');
    assert.ok(before.height <= before.hostHeight);
    await page
      .locator('[data-bloom-screen-viewport="element"]')
      .evaluate((el) => el.scrollTo(0, 0));
    const rect = await page.locator('[data-bloom-screen-viewport="element"]').boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + Math.min(200, rect.height / 2));
    await page.mouse.wheel(0, 650);
    await page.waitForFunction(
      () => document.querySelector('[data-bloom-screen-viewport="element"]').scrollTop >= 640,
    );
    const fixed = await snapshot('wheel fixed');
    assert.equal(fixed.windowY, 0);
    await page.getByRole('button', { name: 'Toggle flow', exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector('[data-bloom-screen-viewport="document"]'),
    );
    const doc = await snapshot('document handoff');
    assert.equal(doc.kind, 'document');
    assert.ok(Math.abs(doc.windowY - fixed.y) < 2);
    await page.mouse.move(550, 400);
    await page.mouse.wheel(0, 200);
    await page.waitForFunction((y) => window.scrollY >= y + 190, doc.windowY);
    const moved = await snapshot('wheel document');
    await page.getByRole('button', { name: 'Toggle flow', exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector('[data-bloom-screen-viewport="element"]'),
    );
    const returned = await snapshot('fixed handoff');
    assert.ok(Math.abs(returned.y - moved.windowY) < 2);
    assert.equal(returned.windowY, 0);
    await page.screenshot({ path: `${out}/${embedded ? 'embedded' : 'root'}.png` });
  }
  assert.deepEqual(errors, []);
  const report = { browser: browser.version(), states, errors };
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
