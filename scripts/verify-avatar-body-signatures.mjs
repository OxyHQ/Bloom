/** Original native signature identity, independent from eye/accessory edits.
 * Scratch instrumentation reads the pinned controller enum; pixels alone would
 * accept the wrong animation. Original generated files stay untouched. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
      viewport: { width: 1250, height: 300 },
    }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const source = fs.readFileSync(
    new URL('../assets/character-runtime/controller-mode.mjs', import.meta.url),
    'utf8',
  );
  assert.ok(
    source.includes('const result = operation();'),
    'instrument exact synchronous scope',
  );
  await page.route('**/controller-mode.mjs', (r) =>
    r.fulfill({
      contentType: 'application/javascript',
      body: source.replace(
        'const result = operation();',
        `const prior=new Uint8Array(memory.buffer,impl+1176,44).slice(); const result = operation();
 globalThis.__signatureTrace ??= []; globalThis.__signatureTrace.push({identity,result,kind:new DataView(memory.buffer).getUint32(impl+1176,true),profile:new DataView(memory.buffer).getUint32(impl+1216,true),priorKind:new DataView(prior.buffer).getUint32(0,true),priorProfile:new DataView(prior.buffer).getUint32(40,true),at:performance.now()});`,
      ),
    }),
  );
  await page.route('**/__signatures.html', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: '<body style="display:flex;background:#eee">',
    }),
  );
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/__signatures.html`,
  );
  await page.evaluate(async () => {
    const runtime = await import('/bloom-character/runtime.mjs');
    window.gate = {
      runtime,
      controls: [],
      props: [],
      errors: [],
      canvases: [],
    };
    const characters = [
      { preset: 'lime_frog' },
      {
        preset: 'lime_frog',
        selections: { eyes: 'cyclops', accessory: 'none' },
      },
      { preset: 'purple_heart', selections: { eyes: 'oval', eyewear: 'none' } },
      { preset: 'clippo' },
      { preset: 'blue_beret', selections: { shape: 'heart', eyes: 'todd' } },
    ];
    for (const character of characters) {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:240px;height:240px';
      document.body.append(canvas);
      const props = {
        config: { character },
        paused: true,
        interactive: true,
        reactionKey: 0,
        workingKey: 0,
      };
      gate.canvases.push(canvas);
      gate.props.push(props);
      gate.controls.push(
        await runtime.createAvatar(canvas, props, {
          onError: (e) => gate.errors.push(String(e)),
        }),
      );
    }
    gate.pixels = () =>
      gate.canvases.map((canvas) => {
        const sample = document.createElement('canvas');
        sample.width = sample.height = 32;
        const ctx = sample.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(canvas, 0, 0, 32, 32);
        const p = ctx.getImageData(0, 0, 32, 32).data;
        let hash = 0,
          painted = 0;
        for (let i = 0; i < p.length; i++) {
          hash = (Math.imul(hash, 31) + p[i]) | 0;
          if (i % 4 === 3 && p[i] > 32) painted++;
        }
        return { hash, painted };
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
  const before = await page.evaluate(() => gate.pixels());
  assert.ok(before.every((p) => p.painted > 25));
  await page.evaluate(() => {
    window.__signatureTrace = [];
  });
  for (let index = 0; index < 5; index++) {
    await page.evaluate((index) => {
      gate.props[index] = {
        ...gate.props[index],
        paused: false,
        reactionKey: 1,
      };
      gate.controls[index].update(gate.props[index]);
    }, index);
    await page.waitForFunction(
      (count) =>
        gate.errors.length ||
        __signatureTrace.filter((t) => t.result === 0 && t.kind === 2).length >=
          count,
      index + 1,
      { timeout: 60000 },
    );
  }
  const profiles = await page.evaluate(() =>
    __signatureTrace
      .filter((t) => t.result === 0 && t.kind === 2)
      .slice(0, 5)
      .map((t) => t.profile),
  );
  assert.deepEqual(
    profiles,
    [4, 4, 3, 4, 3],
    'actual original native profile follows body, never Wave0',
  );
  await page.waitForFunction(
    (before) => gate.pixels().every((p, i) => p.hash !== before[i].hash),
    before,
    { timeout: 15000 },
  );
  await page.screenshot({ path: '/tmp/bloom-body-signatures.png' });
  await page.waitForTimeout(5000);
  // Real pointer event hit testing, using the edited Todd/Cyclops body.
  await page.evaluate(() => {
    window.__signatureTrace = [];
  });
  await page
    .locator('canvas')
    .nth(1)
    .click({ position: { x: 120, y: 120 } });
  await page.waitForFunction(
    () =>
      __signatureTrace.some(
        (t) => t.result === 0 && t.kind === 2 && t.profile === 4,
      ),
    {},
    { timeout: 15000 },
  );
  const tap = await page.evaluate(() => ({
    trace: __signatureTrace,
    diagnostics: gate.controls[1].diagnostics(),
  }));
  assert.equal(tap.diagnostics.lastReactionKind, 2);
  assert.equal(tap.diagnostics.lastReaction, 0);
  assert.equal(
    tap.diagnostics.queuedReaction,
    false,
    'one physical tap starts one signature',
  );
  assert.ok(
    !tap.trace.some((t) => t.kind === 1),
    'pointer path never starts generic Wave',
  );
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  assert.deepEqual(errors, []);
  await page.evaluate(() => gate.controls.forEach((c) => c.dispose()));
  await page.waitForFunction(
    () => {
      const s = gate.runtime.runtimeStats();
      return (
        s.instances === 0 &&
        s.surface.contexts === 0 &&
        s.surface.surfaces === 0 &&
        s.legacy.characters === 0 &&
        !s.legacy.worker &&
        !s.scheduled
      );
    },
    {},
    { timeout: 30000 },
  );
  const result = {
    profiles,
    tap,
    after: await page.evaluate(() => gate.runtime.runtimeStats()),
  };
  fs.writeFileSync(
    '/tmp/bloom-body-signatures.json',
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
