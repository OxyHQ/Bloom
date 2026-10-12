/** Compare held semantic poses with original PNGs recorded at the exact native timestamp. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const { PNG } = require('pngjs');
const presets = (process.env.AVATAR_REVIEW_PRESETS || 'lime_frog').split(',');
const output = process.env.AVATAR_REVIEW_OUTPUT || '.local/avatar-observation-validation';
// Pin measured shortfalls exactly; a new, larger OR improved boundary difference
// requires review. These thresholded edges are not a claim of pixel identity.
const knownBoundaryDifferences = {
  'lime_frog/reaction/3': { maxY: -1 },
  'coral_monocle/idle/0': { maxX: -1 },
  'coral_monocle/reaction/0': { maxX: -1 },
  'blue_spectacles/idle/0': { maxX: -1 },
  'blue_spectacles/reaction/0': { maxX: -1 },
};
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = {
  limitation: 'Synchronized captured keyframe pixels only; not full animation/controller parity.',
  cases: [],
};
try {
  const page = await browser.newPage();
  const errors = [],
    forbidden = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (/bloom-character|\.wasm(?:\?|$)|orbit-characters|preparation-worker/.test(request.url()))
      forbidden.push(request.url());
  });
  await page.setViewport({ width: 640, height: 480, deviceScaleFactor: 1 });
  await page.goto('http://localhost:6006/iframe.html');
  for (const preset of presets)
    for (const name of ['idle', 'reaction']) {
      const data = JSON.parse(
        await readFile(`.local/avatar-motion-review/${preset}/${name}.json`, 'utf8'),
      );
      await page.evaluate(
        async ({ preset, name }) => {
          window.review?.engine.dispose();
          document.body.replaceChildren();
          document.body.style.cssText = 'margin:0;background:#f5f5f2';
          const canvas = document.createElement('canvas');
          canvas.style.cssText = 'width:320px;height:320px;display:block';
          document.body.append(canvas);
          const { createObservationReview, loadObservationReview } = await import(
            '/runtime/avatar/observation-review.ts'
          );
          window.review = createObservationReview(
            canvas,
            await loadObservationReview(preset, name),
          );
          await window.review.engine.loaded;
        },
        { preset, name },
      );
      for (const point of data.checkpoints) {
        const before = await page.evaluate(() => window.review.engine.stats().frames);
        await page.evaluate((time) => window.review.seek(time), point.time);
        await page.waitForFunction((n) => window.review.engine.stats().frames > n, {}, before);
        const actualBytes = Buffer.from(await (await page.$('canvas')).screenshot());
        await writeFile(`${output}/${preset}-${name}-${point.requested}s.png`, actualBytes);
        const original = PNG.sync.read(await readFile(point.image.slice(1))),
          actual = PNG.sync.read(actualBytes);
        assert.equal(actual.width, original.width);
        assert.equal(actual.height, original.height);
        let sum = 0,
          pixels = 0,
          max = 0;
        const bounds = [original, actual].map((image) => ({
          minX: image.width,
          minY: image.height,
          maxX: -1,
          maxY: -1,
        }));
        const composite = (image, index, channel) =>
          (image.data[index + channel] * image.data[index + 3]) / 255 +
          [245, 245, 242][channel] * (1 - image.data[index + 3] / 255);
        for (let p = 0; p < actual.width * actual.height; p++) {
          const k = p * 4;
          const active = [original, actual].map((image, index) => {
            const ink = [245, 245, 242].some(
              (bg, channel) => Math.abs(composite(image, k, channel) - bg) > 20,
            );
            if (ink) {
              bounds[index].minX = Math.min(bounds[index].minX, p % actual.width);
              bounds[index].maxX = Math.max(bounds[index].maxX, p % actual.width);
              bounds[index].minY = Math.min(bounds[index].minY, Math.floor(p / actual.width));
              bounds[index].maxY = Math.max(bounds[index].maxY, Math.floor(p / actual.width));
            }
            return ink;
          });
          if (active.some(Boolean)) {
            pixels++;
            for (let c = 0; c < 3; c++) {
              const error = Math.abs(composite(original, k, c) - composite(actual, k, c));
              sum += error;
              max = Math.max(max, error);
            }
          }
        }
        const result = {
          preset,
          name,
          time: point.time,
          meanForegroundError: sum / (pixels * 3),
          max,
          bounds,
        };
        report.cases.push(result);
        console.log(JSON.stringify(result));
        await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
        const boundaryDifference = Object.fromEntries(
          Object.keys(bounds[0])
            .filter((key) => bounds[0][key] !== bounds[1][key])
            .map((key) => [key, bounds[1][key] - bounds[0][key]]),
        );
        assert.deepEqual(
          boundaryDifference,
          knownBoundaryDifferences[`${preset}/${name}/${point.requested}`] ?? {},
          'Only the exactly recorded silhouette-bound shortfalls are accepted',
        );
        assert(
          result.meanForegroundError < 1,
          'Mean observed-pose foreground difference below one 8-bit level',
        );
      }
      const held = await page.evaluate(() => window.review.engine.stats().frames);
      await new Promise((resolve) => setTimeout(resolve, 150));
      assert.equal(
        await page.evaluate(() => window.review.engine.stats().frames),
        held,
        'Held observation submits no continuous frames',
      );
    }
  await page.evaluate(() => window.review.engine.dispose());
  assert.equal(await page.evaluate(() => window.review.engine.stats().contexts), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(forbidden, []);
  report.errors = errors;
  report.forbiddenRequests = forbidden;
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
