/** Functional motion gate, not an FPS benchmark. Requires the new engine only. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const { PNG } = require('pngjs');
const output = '.local/avatar-authored-motion';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = {
  purpose:
    'Numeric upload/pose independence and rendered changes; no performance or full animation-parity claim.',
  cases: [],
};
try {
  const page = await browser.newPage(),
    errors = [],
    forbidden = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (/bloom-character|orbit-characters|preparation-worker|\.wasm(?:\?|$)/.test(r.url()))
      forbidden.push(r.url());
  });
  await page.setViewport({ width: 640, height: 320, deviceScaleFactor: 1 });
  await page.goto(`${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6006'}/iframe.html`);
  await page.bringToFront();
  await page.evaluate(async () => {
    document.body.replaceChildren();
    document.body.style.cssText = 'margin:0;background:#f5f5f2';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:640px;height:320px;display:block';
    document.body.append(canvas);
    const { AuthoredAvatarEngine } = await import(
      '/runtime/avatar/authored-engine.ts'
    );
    window.motionEngine = new AuthoredAvatarEngine(canvas, {
      count: 2,
      size: 320,
      preset: 'blue_beret',
    });
    await window.motionEngine.loaded;
    window.motionEngine.setPaused(true);
  });
  const render = async (index, clip, time) => {
    const before = await page.evaluate(() => window.motionEngine.stats().frames);
    await page.evaluate(
      ({ index, clip, time }) => window.motionEngine.setMotionFrame(index, clip, time),
      { index, clip, time },
    );
    await page.waitForFunction(
      (n) => window.motionEngine.stats().frames > n,
      { timeout: 20000 },
      before,
    );
    return page.evaluate(() => window.motionEngine.stats());
  };
  await render(0, 'idle', 0);
  await render(1, 'idle', 0);
  const start = PNG.sync.read(Buffer.from(await page.screenshot({ path: `${output}/start.png` })));
  const independent = await render(0, 'reaction', 0.7);
  const reacted = PNG.sync.read(
    Buffer.from(await page.screenshot({ path: `${output}/reaction.png` })),
  );
  let changedFirst = 0,
    changedSecond = 0;
  for (let y = 0; y < 320; y++)
    for (let x = 0; x < 640; x++) {
      const k = (y * 640 + x) * 4;
      if ([0, 1, 2, 3].some((c) => start.data[k + c] !== reacted.data[k + c])) {
        if (x < 320) changedFirst++;
        else changedSecond++;
      }
    }
  assert(changedFirst > 100, 'Selected avatar must visibly change');
  assert.equal(changedSecond, 0, 'Other avatar must retain its exact pixels');
  assert.equal(independent.contexts, 1);
  assert.equal(independent.drawCalls, 16);
  report.cases.push({
    name: 'independent-held-poses',
    changedFirst,
    changedSecond,
    stats: independent,
  });
  const numeric = await page.evaluate(async () => {
    const engine = window.motionEngine;
    const { AuthoredMotionSampler } = await import('/runtime/avatar/motion.ts');
    const { default: asset } = await import(
      '/runtime/avatar/assets/motion/blue_beret.json'
    );
    const inputs = [
      ['reaction', 0.7],
      ['idle', 0],
    ];
    let maxWorldError = 0,
      maxNormalError = 0,
      maxFieldError = 0,
      checkedParts = 0;
    for (const [index, [clip, time]] of inputs.entries()) {
      const sampler = new AuthoredMotionSampler(asset.clips[clip]),
        pose = sampler.createPose();
      sampler.sample(time, pose);
      for (const batch of engine.batches) {
        if (batch.part.source.activity) {
          if (batch.mesh.visible) throw Error('Inactive Computer part was drawn');
          continue;
        }
        const slot = batch.slots.indexOf(index);
        if (slot < 0) continue;
        const id = `${batch.part.source.fur ? 'fur' : 'mesh'}:${batch.part.source.id}`;
        const expected = pose.find((p) => p.id === id);
        if (!expected || !batch.part.motionTexture) throw Error('Missing motion upload ' + id);
        const matrix = batch.mesh.instanceMatrix.array;
        const texture = batch.part.motionTexture.image.data;
        for (let k = 0; k < 16; k++)
          maxWorldError = Math.max(
            maxWorldError,
            Math.abs(matrix[slot * 16 + k] - expected.world.elements[k]),
          );
        for (let k = 0; k < 12; k++)
          maxNormalError = Math.max(
            maxNormalError,
            Math.abs(
              texture[slot * batch.part.motionTexture.image.width * 4 + k] -
                expected.normalMatrix.elements[k],
            ),
          );
        for (let k = 0; k < 4; k++)
          for (const [key, offset] of [
            ['parameters', 12],
            ['signatureDeform', 16],
            ['colorRoughness', 20],
            ['paletteClosure', 24],
          ])
            maxFieldError = Math.max(
              maxFieldError,
              Math.abs(
                texture[slot * batch.part.motionTexture.image.width * 4 + offset + k] -
                  (expected.fields[key] ?? batch.part.source.fields[key])[k],
              ),
            );
        checkedParts++;
      }
    }
    return { checkedParts, maxWorldError, maxNormalError, maxFieldError };
  });
  assert.equal(numeric.checkedParts, 14);
  assert(numeric.maxWorldError < 1e-6);
  assert(numeric.maxNormalError < 5e-5);
  assert(numeric.maxFieldError < 1e-6);
  report.numeric = numeric;
  // Deliberate test signal, not a reconstructed character animation. Keep all
  // geometry still and vary material tracks to prove the GPU consumes them.
  await page.evaluate(async () => {
    const engine = window.motionEngine;
    const { AuthoredMotionSampler } = await import('/runtime/avatar/motion.ts');
    const asset = engine.assets.get('blue_beret:high');
    const original = asset.samplers.idle;
    const neutral = original.createPose();
    original.sample(0, neutral);
    const clip = {
      duration: 1,
      loop: false,
      times: [0, 1],
      parts: original.clip.parts.map((part, index) => {
        const constant = (channel) => ({
          value: ('value' in channel ? channel.value : channel.samples).slice(0, 3),
        });
        const rotation = part.rotation;
        const source = asset.parts.find(
          (p) => `${p.source.fur ? 'fur' : 'mesh'}:${p.source.id}` === part.id,
        ).source.fields;
        const color = source.colorRoughness;
        return {
          id: part.id,
          translation: constant(part.translation),
          scale: constant(part.scale),
          rotation: {
            value: ('value' in rotation ? rotation.value : rotation.samples).slice(0, 4),
          },
          fields: {
            ...Object.fromEntries(
              Object.entries(neutral[index].fields).map(([key, value]) => [key, { value }]),
            ),
            colorRoughness: { samples: [...color, 0.6, 0.05, 0.15, 0.12] },
            paletteClosure: { samples: [...source.paletteClosure, 0.1, 0.2, 0.3, 0.4] },
          },
        };
      }),
    };
    asset.samplers.idle = new AuthoredMotionSampler(clip);
    for (const state of engine.states) state.pose = undefined;
  });
  await render(0, 'idle', 0);
  await render(1, 'idle', 0);
  const materialStart = PNG.sync.read(Buffer.from(await page.screenshot()));
  await render(0, 'idle', 1);
  const materialChanged = PNG.sync.read(
    Buffer.from(await page.screenshot({ path: `${output}/material-channels.png` })),
  );
  let materialFirst = 0,
    materialSecond = 0;
  for (let y = 0; y < 320; y++)
    for (let x = 0; x < 640; x++) {
      const p = (y * 640 + x) * 4;
      if ([0, 1, 2, 3].some((c) => materialStart.data[p + c] !== materialChanged.data[p + c])) {
        if (x < 320) materialFirst++;
        else materialSecond++;
      }
    }
  assert(materialFirst > 1000, 'Animated material channels must change painted pixels');
  assert.equal(materialSecond, 0, 'Animated material channels must remain per instance');
  const materialUpload = await page.evaluate(() => {
    let maxError = 0,
      checked = 0;
    for (const batch of window.motionEngine.batches) {
      if (batch.part.source.activity) continue;
      const data = batch.part.motionTexture.image.data;
      const slot = batch.slots.indexOf(0);
      for (const [offset, values] of [
        [20, [0.6, 0.05, 0.15, 0.12]],
        [24, [0.1, 0.2, 0.3, 0.4]],
      ])
        for (let k = 0; k < 4; k++)
          maxError = Math.max(
            maxError,
            Math.abs(
              data[slot * batch.part.motionTexture.image.width * 4 + offset + k] - values[k],
            ),
          );
      checked++;
    }
    return { maxError, checked };
  });
  assert.equal(materialUpload.checked, 7);
  assert(materialUpload.maxError < 1e-6);
  report.materialChannels = {
    purpose: 'Synthetic upload and pixel independence check; not native motion parity',
    materialFirst,
    materialSecond,
    ...materialUpload,
  };
  const held = await page.evaluate(() => window.motionEngine.stats().frames);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(
    await page.evaluate(() => window.motionEngine.stats().frames),
    held,
    'Paused held poses must be quiescent',
  );
  await page.evaluate(() => window.motionEngine.dispose());
  assert.equal(await page.evaluate(() => window.motionEngine.stats().contexts), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(forbidden, []);
  report.errors = errors;
  report.forbiddenRequests = forbidden;
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ changedFirst, changedSecond, numeric }));
} finally {
  await browser.close();
}
