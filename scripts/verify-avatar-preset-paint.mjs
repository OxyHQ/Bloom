/** Preset paint survives native, migrated and authored body selection.
 * Checks native material RGB in the worker result as well as real rendering;
 * capabilities alone could advertise a color that is absent from the mesh.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 760 },
  });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/__preset-paint.html', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><body style="display:grid;grid-template-columns:repeat(6,150px);gap:12px;background:#ddd;font:12px sans-serif">',
    }),
  );
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/__preset-paint.html`,
  );
  await page.evaluate(async () => {
    const runtime = await import('/bloom-character/runtime.mjs');
    const { ORIGINAL_PRESETS } =
      await import('/bloom-character/character-recipe.mjs');
    const { authoredAssemblyRecords } =
      await import('/bloom-character/authored-parts.mjs');
    const module = await (
      await import('/bloom-character/orbit-characters.mjs')
    ).default({ locateFile: (file) => '/bloom-character/' + file });
    const rgb = (bytes) => {
      const info = authoredAssemblyRecords(bytes),
        view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return [0, 1, 2].map((k) =>
        view.getFloat32(info.body.start + 28 + k * 4, true),
      );
    };
    window.gate = {
      runtime,
      cases: [],
      controls: [],
      canvases: [],
      errors: [],
      requests: new Map(),
      materials: [],
      index: 0,
    };
    for (const preset of ORIGINAL_PRESETS) {
      const source = module.orbitPrepareAssembly(
        module.presetAppearance(preset),
        0,
        'paint-original:' + preset,
        false,
      );
      if (!source.bytes || source.error)
        throw Error(source.error || 'missing source');
      const expected = rgb(source.bytes);
      for (const shape of ['circle', 'cloud', 'todd'])
        gate.cases.push({ preset, shape, expected });
    }
    gate.cases.push(
      {
        preset: 'gus',
        shape: 'cloud',
        color: 'blue',
        expected: [71 / 255, 120 / 255, 1],
      },
      {
        preset: 'gus',
        shape: 'todd',
        bodyColor: '#123456',
        expected: [18 / 255, 52 / 255, 86 / 255],
      },
    );
    const NativeWorker = Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        this.addEventListener('message', ({ data }) => {
          const index = gate.requests.get(data.id);
          if (index !== undefined && data.bytes)
            gate.materials[index] = rgb(data.bytes);
        });
      }
      postMessage(data, ...args) {
        gate.requests.set(data.id, gate.index);
        return super.postMessage(data, ...args);
      }
    };
    gate.create = async (index) => {
      gate.index = index;
      const row = gate.cases[index],
        div = document.createElement('div'),
        canvas = document.createElement('canvas');
      div.textContent = `${row.preset} / ${row.shape}`;
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
                  ...(row.color ? { color: row.color } : {}),
                },
                ...(row.bodyColor ? { bodyColor: row.bodyColor } : {}),
              },
            },
            paused: true,
          },
          {
            onError: (error) =>
              gate.errors.push({ index, error: String(error) }),
          },
        ),
      );
    };
  });
  const count = await page.evaluate(() => gate.cases.length);
  for (let index = 0; index < count; index++) {
    await page.evaluate((index) => gate.create(index), index);
    await page.waitForFunction(
      (index) =>
        gate.errors.some((e) => e.index === index) ||
        (gate.controls[index].diagnostics().ready &&
          !gate.controls[index].diagnostics().pending),
      index,
      { timeout: 90000 },
    );
  }
  await page.screenshot({
    path: '/tmp/bloom-preset-paint.png',
    fullPage: true,
  });
  const result = await page.evaluate(() => ({
    cases: gate.cases,
    materials: gate.materials,
    errors: gate.errors,
    pixels: gate.canvases.map((canvas) => {
      const data = canvas
        .getContext('2d')
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let count = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 100) count++;
      return count;
    }),
  }));
  fs.writeFileSync(
    '/tmp/bloom-preset-paint.json',
    JSON.stringify(result, null, 2),
  );
  assert.deepEqual(result.errors, []);
  assert.deepEqual(pageErrors, []);
  for (let index = 0; index < count; index++) {
    const label = `${result.cases[index].preset}/${result.cases[index].shape}`;
    assert.equal(
      result.materials[index]?.length,
      3,
      `${label} captured actual prepared material`,
    );
    for (let component = 0; component < 3; component++)
      assert.ok(
        Math.abs(
          result.materials[index][component] -
            result.cases[index].expected[component],
        ) < 1e-6,
        `${label} RGB component ${component} matches original material`,
      );
    assert.ok(result.pixels[index] > 300, `${label} actually rendered`);
  }
  await page.evaluate(() =>
    gate.controls.forEach((control) => control.dispose()),
  );
  await page.waitForFunction(
    () => {
      const s = gate.runtime.runtimeStats();
      return !s.legacy.characters && !s.surface.surfaces && !s.scheduled;
    },
    null,
    { timeout: 30000 },
  );
  console.log(
    `PASS ${count} original preset paints across native/migrated/authored bodies, actual material RGB, pixels and cleanup`,
  );
} finally {
  await browser.close();
}
