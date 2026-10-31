import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [390, 1280]) {
    for (const mode of ['light', 'dark']) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        deviceScaleFactor: 1,
      });
      await page.goto(
        `${base}/iframe.html?id=foundations-color-roles-in-context--first-direction&globals=theme:${mode}`,
        { waitUntil: 'domcontentloaded', timeout: 120000 },
      );
      const meter = page.getByRole('progressbar', { name: 'Website refresh' });
      await meter.waitFor({ timeout: 120000 });
      await meter.scrollIntoViewIfNeeded();
      const samples = await meter.evaluate((node) =>
        [node, node.firstElementChild].map((element, index) => {
          const rect = element.getBoundingClientRect();
          return {
            x: Math.floor(rect.x + rect.width * (index ? 0.5 : 0.9)),
            y: Math.floor(rect.y + rect.height / 2),
            rgb: getComputedStyle(element)
              .backgroundColor.match(/[\d.]+/g)
              .slice(0, 3)
              .map(Number),
          };
        }),
      );
      // Capture the whole viewport: clipping at the meter changes backdrop input.
      const screenshot = await page.screenshot();
      const pixels = await page.evaluate(
        async ({ png, samples }) => {
          const image = new Image();
          image.src = `data:image/png;base64,${png}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0);
          return samples.map(({ x, y }) => [...context.getImageData(x, y, 1, 1).data].slice(0, 3));
        },
        { png: screenshot.toString('base64'), samples },
      );
      for (let i = 0; i < samples.length; i++) {
        assert.ok(
          pixels[i].every((value, channel) => Math.abs(value - samples[i].rgb[channel]) <= 2),
          `${width}/${mode}: meter ${i ? 'fill' : 'track'} is obscured: ${pixels[i]} vs ${samples[i].rgb}`,
        );
      }
      console.log({ width, mode, painted: true });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
