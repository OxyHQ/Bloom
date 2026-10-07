/** Single-eye geometry in the original engine: actual white/iris/pupil pixels,
 * independent body presets, Work/React motion and shared context cleanup. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const migrated = JSON.parse(
  execFileSync(
    'bun',
    [
      '-e',
      "import {FOLD_CONFIG} from './src/agent-avatar/model'; import {legacyRecipe} from './src/agent-avatar/legacy-recipe'; const config={...FOLD_CONFIG,foldShape:'cloud',character:{preset:'bloom',selections:{eyes:'cyclops'}}}; console.log(JSON.stringify({config,legacy:legacyRecipe(config)}));",
    ],
    { cwd: new URL('..', import.meta.url), encoding: 'utf8' },
  ),
);
const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
      viewport: { width: 1100, height: 1100 },
    }),
    browserErrors = [];
  page.on('pageerror', (e) => browserErrors.push(e.message));
  page.on('console', (m) => {
    if (/GL_INVALID|GL ERROR|too many active webgl/i.test(m.text()))
      browserErrors.push(m.text());
  });
  await page.route('**/__cyclops-gate.html', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: '<body style="background:#4d97ff;display:grid;grid-template-columns:repeat(3,340px);gap:12px">',
    }),
  );
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/__cyclops-gate.html`,
  );
  await page.evaluate(async (migrated) => {
    const runtime = await import('/bloom-character/runtime.mjs');
    const characters = [
      {
        preset: 'clippo',
        selections: { shape: 'circle', eyes: 'cyclops', color: 'lime' },
      },
      { preset: 'lime_frog', selections: { eyes: 'cyclops' } },
      { preset: 'clippo', selections: { eyes: 'cyclops' } },
      {
        preset: 'purple_heart',
        selections: { eyes: 'cyclops', eyewear: 'none', accessory: 'none' },
      },
      {
        preset: 'clippo',
        selections: { shape: 'rounded_triangle', eyes: 'cyclops' },
      },
      { preset: 'blue_beret', selections: { eyes: 'cyclops' } },
      {
        preset: 'lime_frog',
        selections: { shape: 'rounded_head_two_ears', eyes: 'cyclops' },
      },
      migrated.config.character,
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
        ...(i === characters.length - 1 ? migrated : { config: { character } }),
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
          teal = 0,
          dark = 0,
          hash = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 32) {
            painted++;
            if (
              data[i + 1] > data[i] * 1.3 &&
              data[i + 2] > data[i] * 1.15 &&
              data[i + 1] > data[i + 2] * 0.85
            )
              teal++;
            if (Math.max(data[i], data[i + 1], data[i + 2]) < 70) dark++;
            if (Math.min(data[i], data[i + 1], data[i + 2]) > 180) white++;
            if (data[i] > data[i + 2] * 1.4 && data[i] > data[i + 1] * 1.4)
              red++;
            if (data[i + 2] > data[i] * 1.4 && data[i + 2] > data[i + 1] * 1.2)
              blue++;
          }
          hash =
            (Math.imul(hash, 31) + data[i] + data[i + 1] + data[i + 2]) | 0;
        }
        return { painted, white, red, blue, teal, dark, hash };
      });
  }, migrated);
  await page.waitForFunction(
    () =>
      gate.errors.length ||
      gate.controls.every(
        (c) => c.diagnostics()?.ready && !c.diagnostics()?.pending,
      ),
    {},
    { timeout: 180000 },
  );
  await page.screenshot({ path: '/tmp/bloom-cyclops-smoke.png' });
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  const initial = await page.evaluate(() => ({
    pixels: gate.pixels(),
    caps: gate.caps,
    stats: gate.runtime.runtimeStats(),
  }));
  await page.screenshot({ path: '/tmp/bloom-cyclops-gate.png' });
  for (const [i, p] of initial.pixels.entries())
    assert.ok(p.painted > 700, `case ${i} paints actual geometry`);
  for (const [i, p] of initial.pixels.entries()) {
    assert.ok(p.white > 50, `case ${i} paints one large sclera`);
    assert.ok(p.teal > 15, `case ${i} paints a teal iris`);
    assert.ok(p.dark > 10, `case ${i} paints its pupil`);
    assert.equal(initial.caps[i].selected.eyes, 'cyclops');
  }
  assert.equal(initial.caps[6].selected.shape, 'rounded_head_two_ears');
  assert.equal(initial.caps[6].selected.color, 'lime');
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
  await page.screenshot({ path: '/tmp/bloom-cyclops-work.png' });
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
    '/tmp/bloom-cyclops-gate.json',
    JSON.stringify({ initial, motion, work, browserErrors }, null, 2),
  );
  console.log(
    'PASS single eye on original and migrated shapes, colored iris, React/Work motion, one context and full disposal',
  );
} finally {
  await browser.close();
}
