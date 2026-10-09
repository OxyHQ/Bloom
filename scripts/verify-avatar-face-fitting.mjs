/** Real original-engine eye/eyewear fitting, including one-piece sunglasses.
 * Run with Storybook available; BLOOM_PLAYWRIGHT_MODULE may name Playwright.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const eyewear = [
  'monocle',
  'tall_oval_frames',
  'separate_trapezoid_lenses',
  'classic_sunglasses',
  'round_sunglasses',
];
const cases = eyewear.map((id) => ({
  preset: 'blue_beret',
  selections: {
    shape: 'circle',
    eyes: 'cyclops',
    accessory: 'none',
    eyewear: id,
  },
}));
cases.push(
  {
    preset: 'lime_frog',
    selections: {
      eyes: 'todd',
      accessory: 'none',
      eyewear: 'tall_oval_frames',
    },
  },
  {
    preset: 'lime_frog',
    selections: { eyes: 'todd', accessory: 'none', eyewear: 'monocle' },
  },
  {
    preset: 'clippo',
    selections: {
      eyes: 'todd',
      accessory: 'none',
      eyewear: 'tall_oval_frames',
    },
  },
  {
    preset: 'blue_beret',
    selections: {
      shape: 'circle',
      eyes: 'todd',
      accessory: 'none',
      eyewear: 'tall_oval_frames',
    },
  },
  {
    preset: 'blue_beret',
    selections: {
      shape: 'circle',
      eyes: 'clippo',
      accessory: 'none',
      eyewear: 'tall_oval_frames',
    },
  },
  {
    preset: 'lime_frog',
    selections: {
      eyes: 'swept_lids',
      accessory: 'headphones',
      eyewear: 'round_sunglasses',
    },
  },
  {
    preset: 'clippo',
    selections: { eyes: 'cyclops', accessory: 'bow', eyewear: 'monocle' },
  },
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
    viewport: { width: 1040, height: 860 },
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/GL_INVALID|GL ERROR|too many active webgl/i.test(message.text()))
      errors.push(message.text());
  });
  await page.route('**/__face-fitting.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><body style="display:grid;grid-template-columns:repeat(4,240px);gap:12px;background:#ececec;font:13px sans-serif">',
    }),
  );
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/__face-fitting.html`,
  );
  await page.evaluate(async (cases) => {
    const runtime = await import('/bloom-character/runtime.mjs');
    window.gate = {
      runtime,
      controls: [],
      props: [],
      canvases: [],
      errors: [],
    };
    for (const [index, character] of cases.entries()) {
      const div = document.createElement('div');
      div.textContent = `${index}: ${character.preset} / ${character.selections.eyes} / ${character.selections.eyewear}`;
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:240px;height:220px;display:block';
      div.append(canvas);
      document.body.append(div);
      const props = { config: { character }, paused: true, interactive: true };
      gate.props.push(props);
      gate.canvases.push(canvas);
      gate.controls.push(
        await runtime.createAvatar(canvas, props, {
          onError: (error) => gate.errors.push({ index, error: String(error) }),
        }),
      );
    }
    gate.pixels = () =>
      gate.canvases.map((canvas) => {
        const data = canvas
          .getContext('2d')
          .getImageData(0, 0, canvas.width, canvas.height).data;
        let painted = 0,
          dark = 0;
        for (let i = 0; i < data.length; i += 4)
          if (data[i + 3] > 100) {
            painted++;
            if (Math.max(data[i], data[i + 1], data[i + 2]) < 90) dark++;
          }
        return { painted, dark };
      });
  }, cases);
  const ready = () =>
    page.waitForFunction(
      () =>
        gate.errors.length ||
        gate.controls.every(
          (control) =>
            control.diagnostics().ready && !control.diagnostics().pending,
        ),
      null,
      { timeout: 180000 },
    );
  await ready();
  await page.screenshot({
    path: '/tmp/bloom-face-fitting.png',
    fullPage: true,
  });
  const withFrames = await page.evaluate(() => ({
    pixels: gate.pixels(),
    errors: gate.errors,
  }));
  assert.deepEqual(withFrames.errors, []);
  assert.ok(
    withFrames.pixels.every((value) => value.painted > 1000),
    'every combination paints the body',
  );
  await page.evaluate(() =>
    gate.controls.forEach((control, index) => {
      const props = gate.props[index];
      control.update({
        ...props,
        config: {
          character: {
            ...props.config.character,
            selections: {
              ...props.config.character.selections,
              eyewear: 'none',
            },
          },
        },
      });
    }),
  );
  await ready();
  const withoutFrames = await page.evaluate(() => ({
    pixels: gate.pixels(),
    errors: gate.errors,
  }));
  assert.deepEqual(withoutFrames.errors, []);
  for (let index = 0; index < cases.length; index++)
    assert.ok(
      withFrames.pixels[index].dark > withoutFrames.pixels[index].dark + 10,
      `case ${index} paints real dark frame/lens pixels, not merely an enabled selection`,
    );
  await page.evaluate(() =>
    gate.controls.forEach((control) => control.dispose()),
  );
  await page.waitForFunction(
    () => {
      const stats = gate.runtime.runtimeStats();
      return (
        stats.legacy.characters === 0 &&
        stats.surface.surfaces === 0 &&
        !stats.scheduled
      );
    },
    null,
    { timeout: 30000 },
  );
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    '/tmp/bloom-face-fitting.json',
    JSON.stringify({ cases, withFrames, withoutFrames }, null, 2),
  );
  console.log(
    `PASS ${cases.length} real eye/eyewear combinations, visible frame pixels, and cleanup`,
  );
} finally {
  await browser.close();
}
