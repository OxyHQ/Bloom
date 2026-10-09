/** Shallow native eyes remain visible on the original Todd body; headwear clears final face.
 * Run with Storybook available; BLOOM_PLAYWRIGHT_MODULE may name Playwright.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const eyes = [
  'swept_lids',
  'oval',
  'sparkle_capsules',
  'highlight_capsules',
  'dots',
  'double_highlights',
  'round_inset',
  'crescent_inset',
  'sleepy_lids',
];
const cases = eyes.map((eyes) => ({
  preset: 'blue_beret',
  selections: { shape: 'todd', eyes, accessory: 'none', eyewear: 'none' },
}));
cases.push(
  {
    preset: 'blue_beret',
    selections: {
      shape: 'todd',
      eyes: 'oval',
      accessory: 'felipe_beret',
      eyewear: 'none',
    },
  },
  { preset: 'blue_spectacles', selections: { shape: 'todd' } },
  {
    preset: 'blue_beret',
    selections: { shape: 'todd', eyes: 'cyclops', accessory: 'felipe_beret' },
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
  await page.route('**/__todd-visibility.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><body style="display:grid;grid-template-columns:repeat(4,240px);gap:12px;background:#ececec;font:13px sans-serif">',
    }),
  );
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/__todd-visibility.html`,
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
        let painted = 0;
        const eyes = [0, 0];
        for (let y = 0; y < canvas.height; y++)
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            if (data[i + 3] <= 100) continue;
            painted++;
            if (
              y < canvas.height * 0.15 ||
              y > canvas.height * 0.6 ||
              x < canvas.width * 0.16 ||
              x > canvas.width * 0.84
            )
              continue;
            if (Math.max(data[i], data[i + 1], data[i + 2]) < 90)
              eyes[x < canvas.width * 0.5 ? 0 : 1]++;
          }
        return { painted, eyes };
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
    path: '/tmp/bloom-todd-visibility.png',
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
  fs.writeFileSync(
    '/tmp/bloom-todd-visibility.json',
    JSON.stringify({ cases, result: withFrames }, null, 2),
  );
  for (let index = 0; index < 9; index++)
    for (let side = 0; side < 2; side++)
      assert.ok(
        withFrames.pixels[index].eyes[side] >= 20,
        `${eyes[index]} side${side}: actual dark eye pixels remain visible outside Todd's blue body`,
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
    '/tmp/bloom-todd-visibility.json',
    JSON.stringify({ cases, result: withFrames }, null, 2),
  );
  console.log(
    `PASS nine native eye styles on Todd, three headwear combinations, actual visible eye pixels and cleanup`,
  );
} finally {
  await browser.close();
}
