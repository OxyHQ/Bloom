/** Real pointer/keyboard gate: device emulation must not leave touch mail rows highlighted.
 * Start Storybook, then BLOOM_STORYBOOK_URL=http://localhost:6109
 * BLOOM_CDP_URL=http://127.0.0.1:9224 node scripts/verify-mail-row-focus.mjs.
 * puppeteer-core may be supplied by PUPPETEER_PATH; it is not a package dependency.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const candidates = [
  process.env.PUPPETEER_PATH,
  'puppeteer-core',
  '/home/nate/Oxy/Homiio/node_modules/puppeteer-core',
].filter(Boolean);
let puppeteer;
for (const candidate of candidates) {
  try {
    puppeteer = require(candidate);
    break;
  } catch {
    /* optional local tool */
  }
}
if (!puppeteer) throw new Error('Provide puppeteer-core through PUPPETEER_PATH.');
const browser = await puppeteer.connect({
  browserURL: process.env.BLOOM_CDP_URL ?? 'http://127.0.0.1:9224',
});
const base = process.env.BLOOM_STORYBOOK_URL ?? 'http://localhost:6006';
const cases = [
  { width: 1280, height: 800, hasTouch: true, isMobile: false },
  { width: 412, height: 915, hasTouch: true, isMobile: true },
  { width: 1440, height: 900, hasTouch: false, isMobile: false },
];
try {
  for (const viewport of cases) {
    const page = await browser.newPage();
    try {
      await page.setViewport(viewport);
      await page.goto(`${base}/iframe.html?id=blocks-mail-mail-list--attachments&viewMode=story`, {
        waitUntil: 'domcontentloaded',
      });
      const row = '[data-testid="attachments-comfortable-avatar"]';
      await page.waitForSelector(row);
      const read = () =>
        page.$eval(row, (e) => ({
          fill: getComputedStyle(e).backgroundColor,
          rail: getComputedStyle(e.querySelector('[data-bloom-mail-rail]')).display,
          focus: e.matches(':focus-within'),
          keyboard: e.matches(':has(:focus-visible)'),
        }));
      const before = await read();
      const point = await page.$eval(`${row} [data-bloom-mail-focusable]`, (e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      if (viewport.hasTouch) {
        await page.touchscreen.tap(point.x, point.y);
        await new Promise((resolve) => setTimeout(resolve, 180));
        const tapped = await read();
        assert.equal(tapped.fill, before.fill, 'touch focus must not persist row paint');
        assert.equal(tapped.rail, 'none', 'touch must keep metadata');
        assert.equal(tapped.keyboard, false);
      } else {
        await page.mouse.move(point.x, point.y);
        await new Promise((resolve) => setTimeout(resolve, 180));
        assert.notEqual((await read()).fill, before.fill, 'real hover still highlights');
        assert.equal((await read()).rail, 'flex');
        await page.mouse.move(1, 1);
      }
      await page.evaluate(() => {
        document.activeElement?.blur();
      });
      await page.keyboard.press('Tab');
      for (let tries = 0; tries < 20 && !(await read()).keyboard; tries++)
        await page.keyboard.press('Tab');
      assert.equal((await read()).rail, 'flex', 'keyboard focus reveals actions on every device');
      assert.notEqual((await read()).fill, before.fill, 'keyboard focus remains visible');
      await page.evaluate(() => {
        document.activeElement?.blur();
      });
      await new Promise((resolve) => setTimeout(resolve, 180));
      assert.equal((await read()).fill, before.fill, 'blur restores the resting surface');
      const selected = await page.$eval(
        '[data-testid="attachments-comfortable-selection"]',
        (e) => getComputedStyle(e).backgroundColor,
      );
      assert.notEqual(selected, before.fill, 'selection retains its independent paint');
      console.log(
        JSON.stringify({
          ...viewport,
          touchRestores: true,
          keyboardActions: true,
          selectedPaint: true,
        }),
      );
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.disconnect();
}
