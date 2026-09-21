/** Read painted pixels: geometry alone cannot detect a sibling mask over the Fab. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const browser = await puppeteer.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  for (const mode of ['light', 'dark']) {
    const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6014');
    url.searchParams.set('id', `templates-social--${mode}-olive`);
    url.searchParams.set('viewMode', 'story');
    await page.goto(url.href, { waitUntil: 'networkidle0' });
    await page.click('[aria-label="Collapse sidebar"]');
    await new Promise(resolve => setTimeout(resolve, 450));
    for (const offset of [0, 360, 700]) {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), offset);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const png = await page.screenshot({ encoding: 'base64' });
      const pixels = await page.evaluate(async png => {
        const rect = document.querySelector('[aria-label="New post"]').getBoundingClientRect();
        const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const y = Math.floor(rect.top + rect.height / 2);
        return [rect.left + 3, rect.right - 3, rect.left - 3].map(x => [...ctx.getImageData(Math.floor(x), y, 1, 1).data].slice(0, 3));
      }, png);
      assert(pixels[0].every((value, index) => Math.abs(value - pixels[1][index]) <= 3), `${mode} scroll=${offset}: Fab edge obscured ${JSON.stringify(pixels)}`);
      assert(pixels[0].some((value, index) => Math.abs(value - pixels[2][index]) > 20), `${mode} scroll=${offset}: Fab must remain distinct from its backdrop`);
      console.log(`${mode} scroll=${offset}: both painted Fab edges visible`);
    }
  }
} finally { await browser.close(); }
