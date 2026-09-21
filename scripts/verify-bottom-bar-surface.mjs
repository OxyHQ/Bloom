/** The reserved bottom clearance belongs to the reading surface, not the page behind it. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const browser = await puppeteer.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  for (const mode of ['light', 'dark']) {
    const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6014');
    url.searchParams.set('id', `templates-social--${mode}-olive`);
    await page.goto(url.href, { waitUntil: 'networkidle0' });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForFunction(() => Math.abs(document.querySelector('[data-testid="content-panel-surface"]').getBoundingClientRect().bottom - innerHeight) < 1);
    const shot = await page.screenshot();
    const pixels = await page.evaluate(async data => {
      const img = new Image(); img.src = data; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const context = canvas.getContext('2d'); context.drawImage(img, 0, 0);
      const at = y => [...context.getImageData(1, y, 1, 1).data];
      return { content: at(300), inset: at(img.height - 2) };
    }, `data:image/png;base64,${Buffer.from(shot).toString('base64')}`);
    assert(pixels.content.every((channel, i) => Math.abs(channel - pixels.inset[i]) <= 2), JSON.stringify(pixels));
    console.log(`${mode}: ${JSON.stringify(pixels)}`);
  }
} finally { await browser.close(); }
