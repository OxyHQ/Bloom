/** Eight distinct meshes/material sets in one context; also checks count-change GPU buffer lifetime. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const { PNG } = require('pngjs');
const output = '.local/avatar-mixed-catalog';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage(),
    errors = [],
    forbidden = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (request) => {
    if (/bloom-character|orbit-characters|\.wasm(?:\?|$)/.test(request.url()))
      forbidden.push(request.url());
  });
  await page.setViewport({ width: 1280, height: 640, deviceScaleFactor: 1 });
  await page.goto('http://localhost:6006/iframe.html');
  await page.evaluate(async () => {
    document.body.replaceChildren();
    document.body.style.cssText = 'margin:0;background:#f5f5f2';
    const proto = WebGL2RenderingContext.prototype;
    const create = proto.createBuffer,
      remove = proto.deleteBuffer;
    const live = new Set();
    window.liveBuffers = live;
    proto.createBuffer = function (...args) {
      const b = create.apply(this, args);
      if (b) live.add(b);
      return b;
    };
    proto.deleteBuffer = function (b) {
      live.delete(b);
      return remove.call(this, b);
    };
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:1280px;height:640px';
    document.body.append(canvas);
    const { AuthoredAvatarEngine } = await import(
      '/runtime/avatar/authored-engine.ts'
    );
    const { AVATAR_PRESETS } = await import('/runtime/avatar/catalog.ts');
    window.presets = AVATAR_PRESETS;
    window.engine = new AuthoredAvatarEngine(canvas, { count: 8, size: 320 });
    await window.engine.loaded;
    await window.engine.setPresets(AVATAR_PRESETS);
  });
  const settle = () =>
    page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await settle();
  const canvas = await page.$('canvas');
  const picture = PNG.sync.read(
    Buffer.from(await canvas.screenshot({ path: `${output}/eight.png` })),
  );
  const presets = await page.evaluate(() => window.presets);
  const comparisons = [];
  for (const [i, preset] of presets.entries()) {
    const original = PNG.sync.read(
      await readFile(`runtime/avatar/assets/${preset}/reference.png`),
    );
    let error = 0,
      foreground = 0,
      maxError = 0;
    const bounds = Array.from({ length: 2 }, () => ({ minX: 320, minY: 320, maxX: 0, maxY: 0 }));
    for (let y = 0; y < 320; y++)
      for (let x = 0; x < 320; x++) {
        const at = (y * 320 + x) * 4,
          other = ((Math.floor(i / 4) * 320 + y) * picture.width + (i % 4) * 320 + x) * 4;
        const aa = Array.from(original.data.subarray(at, at + 3)),
          bb = Array.from(picture.data.subarray(other, other + 3));
        const mask = [aa, bb].map((rgb, k) => {
          const active = rgb.some((v, c) => Math.abs(v - [245, 245, 242][c]) > 20);
          if (active) {
            bounds[k].minX = Math.min(bounds[k].minX, x);
            bounds[k].maxX = Math.max(bounds[k].maxX, x);
            bounds[k].minY = Math.min(bounds[k].minY, y);
            bounds[k].maxY = Math.max(bounds[k].maxY, y);
          }
          return active;
        });
        if (mask.some(Boolean)) {
          foreground++;
          for (let c = 0; c < 3; c++) {
            const d = Math.abs(aa[c] - bb[c]);
            error += d;
            maxError = Math.max(maxError, d);
          }
        }
      }
    const result = {
      preset,
      foregroundMeanAbsoluteChannelError: error / (foreground * 3),
      maxError,
      bounds,
    };
    comparisons.push(result);
    console.log(JSON.stringify(result));
    assert.deepEqual(bounds[0], bounds[1], `${preset}: fixed silhouette survives batching`);
    assert(
      result.foregroundMeanAbsoluteChannelError < 1,
      `${preset}: mixed scene mean foreground error <1/255`,
    );
  }
  const initial = await page.evaluate(() => ({
    stats: window.engine.stats(),
    buffers: window.liveBuffers.size,
  }));
  // All eight material/geometry families remain present, so increasing count must not grow per-part buffers or draw count.
  let warmed;
  for (const count of [24, 48, 8, 24, 8]) {
    await page.evaluate(async (count) => {
      const canvas = document.querySelector('canvas');
      canvas.style.width = '896px';
      canvas.style.height = `${Math.ceil(count / 8) * 112}px`;
      await window.engine.setSize(112);
      window.engine.setCount(count);
      await window.engine.setPresets(window.presets);
    }, count);
    await settle();
    const current = await page.evaluate(() => ({
      stats: window.engine.stats(),
      buffers: window.liveBuffers.size,
    }));
    assert.equal(current.stats.drawCalls, initial.stats.drawCalls, `draw count for ${count}`);
    warmed ??= current;
    assert.equal(current.buffers, warmed.buffers, `live GPU buffers for ${count}`);
    assert.deepEqual(current.stats.resources, warmed.stats.resources, `GPU resources for ${count}`);
  }
  // Last request wins even when assets load asynchronously; selection targets only its own cell.
  await page.evaluate(async () => {
    await Promise.all([window.engine.setPreset(0, 'alfred'), window.engine.setPreset(0, 'gus')]);
    window.engine.point(3 * 112 + 80, 56);
    window.engine.setColor(3, '#cc6688');
  });
  await settle();
  const changed = await page.evaluate(() => window.engine.stats());
  assert.equal(changed.states[0].preset, 'gus');
  assert(changed.states[3].gaze.target[0] > 0.5);
  assert(changed.states.every((s, i) => i === 3 || s.gaze.target.every((v) => v === 0.5)));
  assert(changed.states[3].pigment.some((v) => v !== 1));
  assert(changed.states.every((s, i) => i === 3 || s.pigment.every((v) => v === 1)));
  await page.evaluate(() => window.engine.dispose());
  const cleanup = await page.evaluate(() => ({
    stats: window.engine.stats(),
    buffers: window.liveBuffers.size,
  }));
  assert.equal(cleanup.buffers, 0, 'dispose releases every GL buffer');
  assert.deepEqual(cleanup.stats.resources, { geometries: 0, textures: 0, programs: 0 });
  assert.deepEqual(errors, []);
  assert.deepEqual(forbidden, []);
  await writeFile(
    `${output}/report.json`,
    JSON.stringify({ comparisons, initial, warmed, cleanup, errors, forbidden }, null, 2),
  );
  console.log(
    'PASS: eight reference comparisons, bounded mixed-crowd draws/buffers, independent selection, async replacement, complete disposal.',
  );
} finally {
  await browser.close();
}
