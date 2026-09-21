/** Probe physical pixels at both mask edges, including fractional display scaling. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const puppeteer = createRequire(import.meta.url)(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const browser = await puppeteer.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  for (const mode of ['light', 'dark']) for (const scale of [1, 1.25, 1.5, 2]) for (const width of [1920, 1921]) {
    await page.setViewport({ width, height: 900, deviceScaleFactor: scale });
    const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6014');
    url.searchParams.set('id', `templates-social--${mode}-olive`);
    await page.goto(url.href, { waitUntil: 'networkidle0' });
    await page.evaluate(() => window.scrollTo(0, 360));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const shot = await page.screenshot();
    const error = await page.evaluate(async data => {
      const rect = document.querySelector('[data-testid="content-panel-surface"]').getBoundingClientRect();
      const img = new Image(); img.src = data; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
      const pixel = (x, y) => [...ctx.getImageData(x, y, 1, 1).data];
      const expected = pixel(1, 1);
      let delta = 0;
      for (const edge of [rect.left, rect.right]) for (const y of [2, innerHeight - 2]) for (let dx = -3; dx <= 3; dx++) {
        const actual = pixel(Math.floor(edge * devicePixelRatio) + dx, Math.floor(y * devicePixelRatio));
        delta = Math.max(delta, ...actual.map((v, i) => Math.abs(v - expected[i])));
      }
      return delta;
    }, `data:image/png;base64,${Buffer.from(shot).toString('base64')}`);
    assert(error <= 2, `${mode} ${width}px @${scale}: edge differs from gutter by ${error}`);
    console.log(`${mode} ${width}px @${scale}: maximum channel difference ${error}`);
  }
} finally { await browser.close(); }
