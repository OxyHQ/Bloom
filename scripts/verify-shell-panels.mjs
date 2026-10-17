/**
 * Real-browser gate for AppShell panels (story `Blocks/AppShell → Panels`).
 *
 * At each width: the panels sit `gutter` (8) from the window's top, bottom and
 * END edge and from each other, the document never scrolls (the group is one
 * viewport tall), and below the group's `collapseBelow` exactly one panel
 * renders, full-bleed. At 1440 the divider is a real pointer target centred in
 * the gap: a drag and the arrow keys move the results' width within its range.
 *
 *   STORYBOOK_URL=http://localhost:6006 node scripts/verify-shell-panels.mjs
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const browser = await puppeteer.launch({
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: 'chrome' }),
  headless: true,
  args: ['--no-sandbox'],
});
const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6006');
url.searchParams.set('id', 'blocks-app-shell--panels');
url.searchParams.set('viewMode', 'story');

const frame = (page) =>
  page.evaluate(() => {
    const rect = (id) => {
      const el = document.querySelector(`[data-testid="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width };
    };
    return {
      innerWidth,
      innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      results: rect('panels-results'),
      map: rect('panels-map'),
      divider: rect('panels-results-divider'),
    };
  });

try {
  const page = await browser.newPage();
  for (const [width, height] of [
    [1920, 1000],
    [1440, 900],
    [1280, 800],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewport({ width, height });
    await page.goto(url.href, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-testid="panels"]');
    const m = await frame(page);
    assert.equal(m.scrollHeight, m.innerHeight, `${width}: the document scrolls`);
    assert.equal(m.scrollWidth, m.innerWidth, `${width}: sideways scroll`);
    if (m.map && m.results) {
      assert.equal(m.results.top, 8, `${width}: top gutter`);
      assert.equal(m.innerHeight - m.results.bottom, 8, `${width}: bottom gutter`);
      assert.equal(m.innerWidth - m.map.right, 8, `${width}: END gutter`);
      assert.equal(m.map.left - m.results.right, 8, `${width}: gap between panels`);
    } else {
      // Collapsed: one panel, full-bleed when compact.
      const only = m.results ?? m.map;
      assert.ok(only, `${width}: no panel rendered`);
      if (width < 1024) {
        assert.deepEqual(
          [only.left, only.top, only.right],
          [0, 0, m.innerWidth],
          `${width}: full-bleed`,
        );
      }
    }
    console.log(`PASS ${width}x${height}: ${m.map && m.results ? 'two panels' : 'one panel'}`);
  }

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url.href, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-testid="panels-results-divider"]');
  let m = await frame(page);
  const x = m.divider.left + m.divider.width / 2;
  const y = (m.divider.top + m.divider.bottom) / 2;
  assert.ok(Math.abs(x - (m.results.right + m.map.left) / 2) < 1, 'divider centred in the gap');
  const hit = await page.evaluate(
    (px, py) => {
      const handle = document.querySelector('[data-testid="panels-results-divider"]');
      const at = document.elementFromPoint(px, py);
      return at === handle || handle.contains(at);
    },
    x,
    y,
  );
  assert.ok(hit, 'the divider is the pointer target in the gap');
  const before = m.results.width;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 120, y, { steps: 8 });
  await page.mouse.up();
  m = await frame(page);
  assert.ok(
    Math.abs(m.results.width - (before - 120)) <= 1,
    `drag: ${before} → ${m.results.width}`,
  );
  assert.equal(m.map.left - m.results.right, 8, 'gap kept while dragging');
  await page.focus('[data-testid="panels-results-divider"]');
  for (let n = 0; n < 40; n++) await page.keyboard.press('ArrowLeft');
  assert.equal((await frame(page)).results.width, 360, 'minimum width');
  console.log('PASS divider: centred pointer target, drag −120, keyboard to the 360 minimum');
} finally {
  await browser.close();
}
