import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const browser = await puppeteer.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6014');
  url.searchParams.set('id', 'blocks-page-header--reveal-after-content-heading');
  await page.goto(url.href, { waitUntil: 'networkidle0' });
  const offset = await page.$eval('[data-testid="content-heading"]', node => node.getBoundingClientRect().height);
  for (const [scroll, opacity] of [[0, 0], [offset, 0], [offset + 10, 0.5], [offset + 20, 1], [0, 0]]) {
    await page.evaluate(y => window.scrollTo(0, y), scroll);
    await page.waitForFunction(expected => {
      const title = document.querySelector('[data-testid="revealed-header-title-block"]');
      return title && Math.abs(Number(getComputedStyle(title).opacity) - expected) < 0.06;
    }, {}, opacity);
    const state = await page.$eval('[data-testid="revealed-header-title-block"]', node => ({ opacity: getComputedStyle(node).opacity, hidden: node.getAttribute('aria-hidden'), text: node.textContent }));
    assert.equal(state.hidden === 'true', opacity === 0);
    assert(state.text.includes('Library') && state.text.includes('Everything you have saved'));
    console.log(`${scroll}px: ${JSON.stringify(state)}`);
  }
} finally { await browser.close(); }
