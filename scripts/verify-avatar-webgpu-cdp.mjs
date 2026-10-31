/** Opt-in physical-browser fidelity gate. Connects to an existing debug page;
 * never launches/closes a browser. Run only after that page's timing window. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { startWebGPUPresentationFixture } from './fixtures/avatar/presentation/webgpu-fixture.mjs';
const require = createRequire(import.meta.url),
  puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const sourceRevision = process.env.AVATAR_SOURCE_REVISION;
if (!sourceRevision) throw Error('AVATAR_SOURCE_REVISION must identify the served engine checkout');
const browser = await puppeteer.connect({
  defaultViewport: null,
  browserURL: process.env.AVATAR_CDP_URL || 'http://localhost:9340',
  protocolTimeout: 180000,
});
const output = process.env.AVATAR_WEBGPU_GATE_OUTPUT || '.local/avatar-webgpu-fidelity';
const report = { sourceRevision, cases: [], errors: [] };
let page;
try {
  const pages = await browser.pages();
  page = pages.find((candidate) =>
    candidate.url().includes(process.env.AVATAR_CDP_PAGE || 'native-benchmark.html'),
  );
  if (!page)
    throw Error('No matching existing benchmark page; this gate will not navigate another page');
  for (const cssSize of [64, 96, 112, 320]) {
    await page.evaluate(startWebGPUPresentationFixture, {
      mode: 'webgpu',
      count: 10,
      cssSize,
      kind: 'mixed',
      engineRoot: process.env.AVATAR_ENGINE_ROOT || '/runtime',
      sourceRevision,
    });
    for (const [kind, time] of [
      ['idle', 0.5],
      ['reaction', 0.35],
      ['work', 1.5],
    ]) {
      const result = await page.evaluate((options) => __avatarWebGPUFixture.captureHeld(options), {
        kind,
        time,
        images: process.env.AVATAR_CAPTURE_ALL_IMAGES === '1' ? 'all' : true,
      });
      const sourcePixels = cssSize === 64 ? 64 : cssSize === 320 ? 512 : 192;
      assert.equal(
        result.sourceTile,
        sourcePixels,
        'Unexpected source backing; do not compare altered quality',
      );
      assert(
        result.cells.every((cell) => cell.width === cssSize * 2 && cell.height === cssSize * 2),
        'Expected DPR2-capped outputs; preserve physical viewport with defaultViewport:null',
      );
      report.cases.push(result);
      console.log(
        JSON.stringify({
          cssSize,
          kind,
          sourceTile: result.sourceTile,
          output: result.cells.map((cell) => cell.width),
          changed: result.cells.reduce((sum, cell) => sum + cell.rgba.changed, 0),
          pngChanged: result.cells.reduce((sum, cell) => sum + cell.png.changed, 0),
          submittedPNGChanged: result.cells.reduce(
            (sum, cell) => sum + (cell.submittedPNG?.changed ?? Infinity),
            0,
          ),
          errors: result.errors,
        }),
      );
    }
    await page.evaluate(() => __avatarWebGPUFixture.dispose());
  }
} catch (error) {
  report.errors.push(String(error));
} finally {
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
  if (page) await page.evaluate(() => globalThis.__avatarWebGPUFixture?.dispose()).catch(() => {});
  await browser.disconnect();
}
assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
assert.equal(report.cases.length, 12, 'All dimensions and animation states must be measured');
assert(
  report.cases.every(
    (test) =>
      !test.errors.length &&
      test.cells.every((cell) => !cell.png.changed && cell.submittedPNG?.changed === 0),
  ),
  'WebGPU presentation must preserve exact decoded PNG both immediately after submit and after presentation; raw Canvas2D interop is reported separately',
);
