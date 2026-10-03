/** Real original-engine pixels, independent Clippo parts, color identity and controllers. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
      viewport: { width: 1100, height: 760 },
    }),
    browserErrors = [];
  page.on('pageerror', (e) => browserErrors.push(e.message));
  page.on('console', (m) => {
    if (/GL_INVALID|GL ERROR|too many active webgl/i.test(m.text()))
      browserErrors.push(m.text());
  });
  await page.route('**/__clippo-gate.html', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: '<body style="background:#4d97ff;display:grid;grid-template-columns:repeat(3,340px);gap:12px">',
    }),
  );
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/__clippo-gate.html`,
  );
  await page.evaluate(async () => {
    const runtime = await import('/bloom-character/runtime.mjs');
    const characters = [
      { preset: 'clippo' },
      { preset: 'clippo', bodyColor: '#c73838' },
      { preset: 'clippo', bodyColor: '#285cdc' },
      {
        preset: 'clippo',
        selections: { eyes: 'todd', accessory: 'felipe_beret' },
      },
      { preset: 'clippo', selections: { shape: 'circle' } },
      {
        preset: 'clippo',
        selections: {
          eyes: 'oval',
          eyewear: 'tall_oval_frames',
          accessory: 'beret',
        },
      },
    ];
    window.gate = {
      runtime,
      controls: [],
      props: [],
      canvases: [],
      errors: [],
      caps: [],
    };
    for (const [i, character] of characters.entries()) {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:340px;height:340px';
      document.body.append(canvas);
      gate.canvases.push(canvas);
      const props = {
        config: { character },
        paused: true,
        interactive: true,
        workingKey: 0,
        reactionKey: 0,
        workingCycles: 1,
      };
      gate.props.push(props);
      gate.controls.push(
        await runtime.createAvatar(canvas, props, {
          onError: (e) => gate.errors.push(`${i}:${e}`),
          onCapabilities: (c) => (gate.caps[i] = c),
        }),
      );
    }
    gate.pixels = () =>
      gate.canvases.map((canvas) => {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(canvas, 0, 0, 128, 128);
        const data = ctx.getImageData(0, 0, 128, 128).data;
        let painted = 0,
          white = 0,
          red = 0,
          blue = 0,
          hash = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 32) {
            painted++;
            if (Math.min(data[i], data[i + 1], data[i + 2]) > 180) white++;
            if (data[i] > data[i + 2] * 1.4 && data[i] > data[i + 1] * 1.4)
              red++;
            if (data[i + 2] > data[i] * 1.4 && data[i + 2] > data[i + 1] * 1.2)
              blue++;
          }
          hash =
            (Math.imul(hash, 31) + data[i] + data[i + 1] + data[i + 2]) | 0;
        }
        return { painted, white, red, blue, hash };
      });
  });
  await page.waitForFunction(
    () =>
      gate.errors.length ||
      gate.controls.every(
        (c) => c.diagnostics()?.ready && !c.diagnostics()?.pending,
      ),
    {},
    { timeout: 180000 },
  );
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  const initial = await page.evaluate(() => ({
    pixels: gate.pixels(),
    caps: gate.caps,
    stats: gate.runtime.runtimeStats(),
  }));
  await page.screenshot({ path: '/tmp/bloom-clippo-gate.png' });
  for (const [i, p] of initial.pixels.entries())
    assert.ok(p.painted > 700, `case ${i} paints actual geometry`);
  for (const i of [0, 1, 2, 3, 4])
    assert.ok(initial.pixels[i].white > 50, `case ${i} paints bulging whites`);
  assert.ok(
    initial.pixels[1].red > 500,
    'red Clippo retains separate material',
  );
  assert.ok(
    initial.pixels[2].blue > 500,
    'blue Clippo retains separate material',
  );
  assert.equal(initial.caps[3].selected.eyes, 'todd');
  assert.equal(initial.caps[3].selected.accessory, 'felipe_beret');
  assert.equal(initial.caps[4].selected.shape, 'circle');
  assert.equal(initial.caps[4].selected.eyes, 'clippo');
  assert.ok(initial.stats.surface.contexts <= 1);
  await page.evaluate(() => {
    gate.props[0] = { ...gate.props[0], paused: false, reactionKey: 1 };
    gate.controls[0].update(gate.props[0]);
  });
  await page.waitForFunction(
    () =>
      gate.errors.length || gate.controls[0].diagnostics()?.lastReaction === 0,
    {},
    { timeout: 60000 },
  );
  assert.equal(
    await page.evaluate(() => gate.runtime.runtimeStats().surface.contexts),
    1,
  );
  const motion = [];
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(140);
    motion.push(await page.evaluate(() => gate.pixels()[0]));
  }
  assert.ok(
    new Set(motion.map((p) => p.hash)).size > 3,
    'native reaction changes rendered 3D pose',
  );
  await page.evaluate(() => {
    gate.props[0] = { ...gate.props[0], workingKey: 1 };
    gate.controls[0].update(gate.props[0]);
  });
  await page.waitForFunction(
    () =>
      gate.errors.length ||
      (gate.controls[0].diagnostics()?.lastActivityResult === 0 &&
        gate.controls[0].diagnostics()?.activityMode),
    {},
    { timeout: 60000 },
  );
  const work = [];
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(220);
    work.push(await page.evaluate(() => gate.pixels()[0]));
  }
  assert.ok(
    new Set(work.map((p) => p.hash)).size > 3,
    'native Work changes rendered 3D scene',
  );
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  assert.deepEqual(browserErrors, []);
  await page.screenshot({ path: '/tmp/bloom-clippo-work.png' });
  await page.evaluate(() => gate.controls.forEach((c) => c.dispose()));
  await page.waitForFunction(
    () => {
      const s = gate.runtime.runtimeStats();
      return (
        !s.instances &&
        !s.surface.contexts &&
        !s.legacy.characters &&
        !s.legacy.pending
      );
    },
    {},
    { timeout: 60000 },
  );
  fs.writeFileSync(
    '/tmp/bloom-clippo-gate.json',
    JSON.stringify({ initial, motion, work, browserErrors }, null, 2),
  );
  console.log(
    'PASS Clippo native geometry, independent eyes/shape, original accessories, separate colors, React/Work motion, one context and full disposal',
  );
} finally {
  await browser.close();
}
