/** Resize one mounted story through both boundaries; never navigate between sizes. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const browser = await puppeteer.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 900 });
  const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6014');
  url.searchParams.set('id', 'templates-social--light-olive'); url.searchParams.set('viewMode', 'story');
  await page.goto(url.href, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-testid="social-main"]');
  await page.evaluate(() => { window.__bloomContent = document.querySelector('[data-testid="social-main"]'); window.scrollTo(0, 180); });
  for (const width of [1100, 1099, 769, 768, 767, 701, 700, 699, 640, 500, 390, 700, 768]) {
    await page.setViewport({ width, height: 900 });
    await page.waitForFunction(framed => document.querySelector('[data-testid="social-content"] [data-bloom-panel]')?.getAttribute('data-bloom-panel') === (framed ? 'framed' : 'none'), {}, width >= 700);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const state = await page.evaluate(() => {
      const surface = document.querySelector('[data-testid="social-content"] [data-bloom-panel]');
      const rect = surface.getBoundingClientRect();
      return { nav: !!document.querySelector('[data-testid="social-navigation"]'), radius: parseFloat(getComputedStyle(surface).borderTopLeftRadius), width: rect.width, left: rect.left, overflow: document.documentElement.scrollWidth - innerWidth, sameContent: window.__bloomContent === document.querySelector('[data-testid="social-main"]'), scroll: scrollY, documentScroller: document.scrollingElement === document.documentElement };
    });
    assert.equal(state.nav, width >= 700);
    assert.equal(state.radius > 0, state.nav);
    assert.equal(state.overflow, 0);
    assert(state.sameContent && state.documentScroller && state.scroll > 0, JSON.stringify(state));
    if (!state.nav) { assert(Math.abs(state.width - width) <= 1, JSON.stringify(state)); assert(Math.abs(state.left) <= 1); }
    console.log(`${width}px: ${JSON.stringify(state)}`);
  }
} finally { await browser.close(); }
