/** Real prepared geometry and pixels for shape-owned faces across eye styles. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const full = process.argv.includes('--full');
try {
  const page = await browser.newPage({
      viewport: { width: 1100, height: 900 },
    }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/__shape-faces.html', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: '<body style="background:#ddd;display:grid;grid-template-columns:repeat(6,150px);gap:12px;font:12px sans-serif">',
    }),
  );
  await page.goto(
    (process.argv[2] || 'http://localhost:6006') + '/__shape-faces.html',
  );
  await page.evaluate(async (full) => {
    const runtime = await import('/bloom-character/runtime.mjs');
    const { authoredAssemblyRecords, authoredEyeRecords } =
      await import('/bloom-character/authored-parts.mjs');
    const rows = [
      'circle',
      'todd',
      'cloud',
      'slender',
      'clippo',
      'rounded_cube',
    ].flatMap((shape) =>
      ['oval', 'todd', 'clippo', 'cyclops'].map((eyes) => ({
        shape,
        eyes,
        preset: 'blue_beret',
      })),
    );
    rows.push(
      ...['lime_frog', 'purple_heart'].map((preset) => ({
        shape: 'circle',
        eyes: 'oval',
        preset,
      })),
      {
        shape: 'six_lobed_flower',
        eyes: 'dots',
        preset: 'blue_beret',
      },
    );
    if (!full)
      rows.splice(
        0,
        rows.length,
        { shape: 'circle', eyes: 'oval', preset: 'blue_beret' },
        { shape: 'todd', eyes: 'todd', preset: 'lime_frog' },
        { shape: 'cloud', eyes: 'clippo', preset: 'blue_beret' },
        { shape: 'slender', eyes: 'todd', preset: 'blue_beret' },
        { shape: 'clippo', eyes: 'cyclops', preset: 'clippo' },
        {
          shape: 'rounded_cube',
          eyes: 'sleepy_lids',
          preset: 'blue_spectacles',
        },
        {
          shape: 'six_lobed_flower',
          eyes: 'dots',
          preset: 'blue_beret',
        },
      );
    const middle = (b) => b.min.map((v, k) => (v + b.max[k]) / 2);
    const union = (parts) => ({
      min: [0, 1, 2].map((k) => Math.min(...parts.map((p) => p.bounds.min[k]))),
      max: [0, 1, 2].map((k) => Math.max(...parts.map((p) => p.bounds.max[k]))),
    });
    window.gate = {
      runtime,
      rows,
      controls: [],
      canvases: [],
      errors: [],
      geometry: [],
      index: 0,
      requests: new Map(),
    };
    const NativeWorker = Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        this.addEventListener('message', ({ data }) => {
          if (!data.bytes) return;
          const index = gate.requests.get(data.id);
          if (index === undefined) return;
          const info = authoredAssemblyRecords(data.bytes),
            eyes = authoredEyeRecords(info);
          gate.geometry[index] =
            gate.rows[index].eyes === 'cyclops'
              ? [middle(union(eyes))]
              : [-1, 1].map((sign) =>
                  middle(
                    union(
                      eyes.filter(
                        (p) => Math.sign(middle(p.bounds)[0]) === sign,
                      ),
                    ),
                  ),
                );
        });
      }
      postMessage(data, ...args) {
        gate.requests.set(data.id, gate.index);
        return super.postMessage(data, ...args);
      }
    };
    gate.create = async (index) => {
      gate.index = index;
      const row = rows[index],
        div = document.createElement('div'),
        canvas = document.createElement('canvas');
      div.textContent = row.shape + ' / ' + row.eyes;
      canvas.style.cssText = 'width:150px;height:150px;display:block';
      div.append(canvas);
      document.body.append(div);
      gate.canvases.push(canvas);
      gate.controls.push(
        await runtime.createAvatar(
          canvas,
          {
            config: {
              character: {
                preset: row.preset,
                selections: {
                  shape: row.shape,
                  eyes: row.eyes,
                  color: 'blue',
                  eyewear: 'none',
                  accessory: 'none',
                },
              },
            },
            paused: true,
          },
          { onError: (e) => gate.errors.push({ index, error: String(e) }) },
        ),
      );
    };
  }, full);
  const count = await page.evaluate(() => gate.rows.length);
  for (let index = 0; index < count; index++) {
    console.log('Preparing', index);
    await page.evaluate((i) => gate.create(i), index);
    await page.waitForFunction(
      (i) =>
        gate.errors.some((e) => e.index === i) ||
        (gate.controls[i].diagnostics().ready &&
          !gate.controls[i].diagnostics().pending),
      index,
      { timeout: 90000 },
    );
    console.log('Painted', index);
    await page.evaluate((i) => gate.controls[i].dispose(), index);
    await page.waitForFunction(
      () =>
        gate.runtime.runtimeStats().legacy.characters === 0 &&
        gate.runtime.runtimeStats().surface.contexts === 0,
    );
  }
  await page.screenshot({ path: '/tmp/bloom-shape-faces.png', fullPage: true });
  const result = await page.evaluate(() => ({
    errors: gate.errors,
    rows: gate.rows,
    geometry: gate.geometry,
    pixels: gate.canvases.map((c) => {
      const p = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let alpha = 0,
        face = 0;
      for (let i = 0; i < p.length; i += 4)
        if (p[i + 3] > 200) {
          alpha++;
          if (
            (p[i] > 170 && p[i + 1] > 170 && p[i + 2] > 170) ||
            (Math.max(p[i], p[i + 1], p[i + 2]) < 100 && p[i + 2] < p[i] * 1.5)
          )
            face++;
        }
      return { alpha, face };
    }),
  }));
  fs.writeFileSync(
    '/tmp/bloom-shape-faces.json',
    JSON.stringify(result, null, 2),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(result.errors, []);
  for (const [i, p] of result.pixels.entries()) {
    assert.ok(p.alpha > 500, 'body painted ' + i);
    assert.ok(p.face > 5, 'visible eye pixels ' + i);
  }
  if (full)
    for (let shape = 0; shape < 6; shape++)
      for (let style = 1; style < 3; style++)
        for (let side = 0; side < 2; side++)
          for (let k = 0; k < 2; k++)
            assert.ok(
              Math.abs(
                result.geometry[shape * 4][side][k] -
                  result.geometry[shape * 4 + style][side][k],
              ) < 0.005,
              'shape-owned centers ' + shape + '/' + style,
            );
  if (full && result.geometry[24] && result.geometry[25])
    for (const i of [24, 25])
      for (let side = 0; side < 2; side++)
        for (let k = 0; k < 2; k++)
          assert.ok(
            Math.abs(
              result.geometry[0][side][k] - result.geometry[i][side][k],
            ) < 0.005,
            'seed-invariant circle anchors',
          );
  await page.evaluate(() => gate.controls.forEach((c) => c.dispose()));
  await page.waitForFunction(
    () =>
      gate.runtime.runtimeStats().legacy.characters === 0 &&
      gate.runtime.runtimeStats().surface.contexts === 0,
  );
  console.log(
    `PASS${count} actual faces: painted eye pixels and cleanup${full ? ', fixed centers across styles and seeds' : ''}`,
  );
} finally {
  await browser.close();
}
