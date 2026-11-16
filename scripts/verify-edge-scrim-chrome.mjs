/** Raster gate for real header/footer hosts: opaque chrome, smooth external tail. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const { PNG } = require('pngjs');
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const output = process.env.SCRIM_OUTPUT ?? '.local/edge-scrim-chrome';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
const results = [];
try {
  for (const width of [390, 1280])
    for (const theme of ['light', 'dark']) {
      for (const specimen of [
        {
          story: 'templates-project-board--ticket-detail',
          owner: 'ticket-detail-header',
          edge: 'top',
        },
        { story: 'blocks-page-footer--wrapped-actions', owner: 'message-footer', edge: 'bottom' },
      ]) {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setViewport({
          width,
          height: 640,
          deviceScaleFactor: 1,
          hasTouch: width === 390,
          isMobile: width === 390,
        });
        await page.goto(`${base}/iframe.html?id=${specimen.story}&globals=theme:${theme}`, {
          waitUntil: 'domcontentloaded',
        });
        const selector = `[data-testid="${specimen.owner}"]`;
        await page.waitForSelector(selector, { timeout: 60000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(
          (selector) => {
            const owner = document.querySelector(selector);
            const screen =
              owner.closest('[data-bloom-screen]') ?? owner.parentElement.parentElement;
            const candidates = [...screen.querySelectorAll('div')].filter(
              (node) =>
                ['auto', 'scroll'].includes(getComputedStyle(node).overflowY) &&
                node.scrollHeight > node.clientHeight + 80,
            );
            if (!candidates.length) return false;
            candidates[0].scrollTop = Math.min(
              250,
              (candidates[0].scrollHeight - candidates[0].clientHeight) / 2,
            );
            return candidates[0].scrollTop > 40;
          },
          {},
          selector,
        );
        await page.waitForFunction(
          (id) => {
            const scrim = document.querySelector(`[data-testid="${id}-scrim"]`);
            return scrim && Number(getComputedStyle(scrim).opacity) === 1;
          },
          {},
          specimen.owner,
        );
        await new Promise((resolve) => setTimeout(resolve, 700));
        const geometry = await page.evaluate((id) => {
          const owner = document.querySelector(`[data-testid="${id}"]`);
          const svg = document.querySelector(`[data-testid="${id}-scrim-gradient"]`);
          return {
            owner: owner.getBoundingClientRect().toJSON(),
            gradient: svg.getBoundingClientRect().toJSON(),
            stops: [...svg.querySelectorAll('stop')].map((node) => ({
              offset: Number(node.getAttribute('offset')),
              opacity: Number(node.getAttribute('stop-opacity')),
            })),
          };
        }, specimen.owner);
        const name = `${specimen.edge}-${width}-${theme}`;
        await page.screenshot({ path: `${output}/${name}.png` });
        const shots = [];
        // Change only the diagnostic backing of the existing gradient. The
        // actual chrome, clipping and compositing ancestors remain in place.
        for (const color of ['rgb(255, 0, 255)', 'rgb(0, 255, 255)']) {
          await page.$eval(
            `[data-testid="${specimen.owner}-scrim-gradient"]`,
            (node, color) => {
              node.style.backgroundColor = color;
            },
            color,
          );
          shots.push(PNG.sync.read(Buffer.from(await page.screenshot())));
        }
        const rowDelta = (y) => {
          const values = [];
          for (
            let x = Math.ceil(geometry.gradient.left + geometry.gradient.width * 0.15);
            x < geometry.gradient.right - geometry.gradient.width * 0.15;
            x++
          ) {
            const index = (Math.floor(y) * shots[0].width + x) * 4;
            values.push(
              Math.max(
                ...[0, 1, 2].map((channel) =>
                  Math.abs(shots[0].data[index + channel] - shots[1].data[index + channel]),
                ),
              ),
            );
          }
          values.sort((a, b) => a - b);
          return values[Math.floor(values.length * 0.8)];
        };
        const chrome = [];
        for (let y = Math.ceil(geometry.owner.top) + 2; y < geometry.owner.bottom - 2; y++)
          chrome.push(rowDelta(y));
        assert.equal(
          Math.max(...chrome),
          0,
          `${name}: underlying paint must not leak through measured chrome`,
        );
        const tail = geometry.gradient.height - geometry.owner.height;
        assert(tail > 10, `${name}: real external tail exists`);
        const tailDelta = [0.05, 0.3, 0.6, 0.9].map((t) =>
          rowDelta(
            specimen.edge === 'top'
              ? geometry.owner.bottom + tail * t
              : geometry.owner.top - tail * t,
          ),
        );
        assert(
          tailDelta[0] < 12 && tailDelta[3] > 150,
          `${name}: tail starts continuously opaque and ends transparent (${tailDelta})`,
        );
        for (let i = 1; i < tailDelta.length; i++)
          assert(
            tailDelta[i] > tailDelta[i - 1],
            `${name}: fade progresses smoothly outside chrome`,
          );
        assert.deepEqual(errors, []);
        results.push({ name, geometry, maxChromeLeak: Math.max(...chrome), tailDelta });
        await page.close();
        console.log(`PASS ${name}`);
      }
    }
  await writeFile(`${output}/report.json`, JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
