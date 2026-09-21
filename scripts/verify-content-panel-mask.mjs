/** Validate painted viewport gutters and sticky header placement during document scroll. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const browser = await puppeteer.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true, args: ['--no-sandbox'] });
const failures = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', error => failures.push(error.message));
  await page.setViewport({ width: 1440, height: 900 });
  for (const mode of ['light', 'dark']) for (const gutter of [8, 16, 40, 72]) {
    const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6014');
    url.searchParams.set('id', `templates-social--${mode}-olive`);
    url.searchParams.set('args', `gutter:${gutter}`);
    await page.goto(url.href, { waitUntil: 'networkidle0' });
    for (const offset of [0, 360, 800]) {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), offset);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const png = await page.screenshot({ encoding: 'base64' });
      const result = await page.evaluate(async (png) => {
        const mask = document.querySelector('[data-testid="content-panel-bleed-mask"]').getBoundingClientRect();
        const title = document.querySelector('[data-testid="social-header-title-block"]');
        const titleRect = title.getBoundingClientRect();
        let header = title;
        while (header && getComputedStyle(header).position !== 'sticky') header = header.parentElement;
        const headerRect = header?.getBoundingClientRect();
        const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const x = Math.floor(mask.x + mask.width / 2);
        const samples = [1, innerHeight - 2].map(y => [...ctx.getImageData(x, y, 1, 1).data].slice(0, 3));
        ctx.fillStyle = getComputedStyle(document.querySelector('[data-testid="social-screen"]')).backgroundColor;
        ctx.fillRect(0, 0, 1, 1); const expected = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
        return { y: scrollY, maskTop: mask.top, maskBottom: mask.bottom, headerTop: headerRect?.top, headerLeft: headerRect?.left, headerRight: headerRect?.right, maskLeft: mask.left, maskRight: mask.right, titleTop: titleRect.top, titleBottom: titleRect.bottom, samples, expected };
      }, png);
      const paintMatches = result.samples.every(rgb => rgb.every((v, i) => Math.abs(v - result.expected[i]) <= 2));
      if (Math.abs(result.headerLeft - result.maskLeft) > 1 || Math.abs(result.headerRight - result.maskRight) > 1 || !paintMatches || result.titleTop < result.maskTop || result.titleBottom > result.maskBottom || (offset > 0 && Math.abs(result.headerTop - gutter) > 1)) failures.push(`${mode} gutter=${gutter} offset=${offset}: ${JSON.stringify(result)}`);
    }
    console.log(`${mode} gutter=${gutter}: checked top/bottom pixels, full-width header and insets at 0, 360, 800px`);
  }
} finally { await browser.close(); }
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
