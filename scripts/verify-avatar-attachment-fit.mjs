/** Requires the original-engine Storybook assets and Playwright. Checks native
 * fitted geometry, inert legacy spacing, animation after fitting and resource release. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
      viewport: { width: 1100, height: 1000 },
    }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/__fit.html', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: '<body style="display:grid;grid-template-columns:repeat(4,250px);gap:8px;background:#eee">',
    }),
  );
  await page.goto(`${process.argv[2] || 'http://localhost:6006'}/__fit.html`);
  await page.evaluate(async () => {
    const runtime = await import('/bloom-character/runtime.mjs');
    const { authoredAssemblyRecords, authoredEyeRecords, hasAuthoredLabel } =
      await import('/bloom-character/authored-parts.mjs');
    window.gate = {
      runtime,
      controls: [],
      props: [],
      canvases: [],
      errors: [],
      assemblies: [],
      requests: new Map(),
    };
    const NativeWorker = Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        this.addEventListener('message', ({ data }) => {
          const request = gate.requests.get(data.id);
          if (data.bytes && request?.authoredParts) {
            const info = authoredAssemblyRecords(data.bytes),
              eyes = authoredEyeRecords(info);
            const center = (sign) => {
              const parts = eyes.filter(
                (p) => Math.sign(p.bounds.min[0] + p.bounds.max[0]) === sign,
              );
              return (
                parts.reduce(
                  (n, p) => n + (p.bounds.min[0] + p.bounds.max[0]) / 2,
                  0,
                ) / parts.length
              );
            };
            gate.assemblies.push({
              parts: request.authoredParts,
              spacing: request.eyeSpacing ?? 1,
              gap: center(1) - center(-1),
              body: info.body.bounds,
              frameWidths: info.records
                .filter((p) =>
                  hasAuthoredLabel(info.bytes, p, 'tall_oval_frames'),
                )
                .map((p) => p.bounds.max[0] - p.bounds.min[0]),
            });
          }
        });
      }
      postMessage(data, ...args) {
        gate.requests.set(data.id, data);
        return super.postMessage(data, ...args);
      }
    };
    const configs = [
      'headphones',
      'bow',
      'beanie',
      'hat',
      'beret',
      'felipe_beret',
      'orb',
      'three_lobe',
      'crown',
    ].map((accessory) => ({ preset: 'clippo', selections: { accessory } }));
    configs.push(
      ...[0.6, 1, 1.4].map((eyeSpacing) => ({
        preset: 'clippo',
        eyeSpacing,
        selections: { eyewear: 'tall_oval_frames' },
      })),
    );
    for (const character of configs) {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:240px;height:240px';
      document.body.append(canvas);
      const props = {
        config: { character },
        paused: true,
        interactive: true,
        workingKey: 0,
        reactionKey: 0,
        workingCycles: 1,
      };
      gate.props.push(props);
      gate.canvases.push(canvas);
      gate.controls.push(
        await runtime.createAvatar(canvas, props, {
          onError: (e) => gate.errors.push(String(e)),
        }),
      );
    }
    gate.hash = (index) => {
      const canvas = gate.canvases[index],
        c = document.createElement('canvas');
      c.width = c.height = 64;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(canvas, 0, 0, 64, 64);
      let n = 0,
        painted = 0,
        panel = 0;
      const pixels = ctx.getImageData(0, 0, 64, 64).data;
      for (let i = 0; i < pixels.length; i += 4) {
        n = (Math.imul(n, 31) + pixels[i] + pixels[i + 1] + pixels[i + 2]) | 0;
        if (pixels[i + 3] > 32) {
          painted++;
          if (
            (pixels[i + 2] > pixels[i] + 25 &&
              pixels[i + 2] > pixels[i + 1] + 15) ||
            (pixels[i] > pixels[i + 1] + 25 &&
              pixels[i + 2] > pixels[i + 1] + 25)
          )
            panel++;
        }
      }
      return { hash: n, painted, panel };
    };
  });
  await page.waitForFunction(
    () =>
      gate.errors.length ||
      gate.controls.every(
        (c) => c.diagnostics()?.ready && !c.diagnostics()?.pending,
      ),
    {},
    { timeout: 240000 },
  );
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  const initial = await page.evaluate(() => ({
    assemblies: gate.assemblies,
    pixels: gate.controls.map((_, i) => gate.hash(i)),
  }));
  for (const p of initial.pixels) assert.ok(p.painted > 100);
  const framed = initial.assemblies.filter(
    (a) => a.parts.eyewear === 'tall_oval_frames',
  );
  assert.ok(framed.length > 0, 'worker prepares the framed face');
  for (const sample of framed) {
    assert.equal(
      sample.spacing,
      1,
      'historical spacing does not reach preparation',
    );
    assert.equal(sample.frameWidths.length, 2);
    assert.ok(sample.gap > 0, 'shape retains distinct eye anchors');
  }
  for (const index of [9, 11])
    assert.deepEqual(
      initial.pixels[index],
      initial.pixels[10],
      'Historical spacing values produce identical painted eyes and frames',
    );
  await page.screenshot({ path: '/tmp/bloom-attachment-fit-gate.png' });
  for (const index of [0, 5, 11]) {
    await page.evaluate((index) => {
      gate.props[index] = {
        ...gate.props[index],
        paused: false,
        workingKey: 1,
      };
      gate.controls[index].update(gate.props[index]);
    }, index);
    await page.waitForFunction(
      (i) =>
        gate.errors.length ||
        gate.controls[i].diagnostics()?.lastActivityResult === 0,
      index,
      { timeout: 60000 },
    );
    const hashes = [];
    for (let j = 0; j < 6; j++) {
      await page.waitForTimeout(180);
      hashes.push(await page.evaluate((i) => gate.hash(i).hash, index));
    }
    assert.ok(
      new Set(hashes).size > 2,
      'fitted attachments retain native Work motion',
    );
    await page.waitForFunction(
      (i) => gate.errors.length || gate.hash(i).panel > 6,
      index,
      { timeout: 30000 },
    );
    await page.screenshot({
      path: `/tmp/bloom-attachment-fit-work-${index}.png`,
    });
    await page.evaluate((index) => {
      gate.props[index] = { ...gate.props[index], reactionKey: 1 };
      gate.controls[index].update(gate.props[index]);
    }, index);
    await page.waitForFunction(
      (i) =>
        gate.errors.length ||
        gate.controls[i].diagnostics()?.lastReaction === 0,
      index,
      { timeout: 60000 },
    );
    await page.screenshot({
      path: `/tmp/bloom-attachment-fit-motion-${index}.png`,
    });
    await page.evaluate((index) => {
      gate.props[index] = { ...gate.props[index], paused: true };
      gate.controls[index].update(gate.props[index]);
    }, index);
  }
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  assert.deepEqual(errors, []);
  await page.evaluate(() => gate.controls.forEach((c) => c.dispose()));
  await page.waitForFunction(
    () => {
      const s = gate.runtime.runtimeStats();
      return (
        !s.instances &&
        !s.surface.contexts &&
        !s.legacy.pending &&
        !s.legacy.characters
      );
    },
    {},
    { timeout: 60000 },
  );
  fs.writeFileSync(
    '/tmp/bloom-attachment-fit-gate.json',
    JSON.stringify(initial, null, 2),
  );
  console.log(
    'PASS: nine fitted accessories, identical geometry for legacy spacing values, native Work/React, no errors and full cleanup.',
  );
} finally {
  await browser.close();
}
