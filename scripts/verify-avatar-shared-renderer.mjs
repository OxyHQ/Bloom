/** Shared renderer crowd gate: 24/48 independently animated, mixed characters.
 * Requires Storybook and Bun. BLOOM_PLAYWRIGHT_MODULE may name an installation.
 * node scripts/verify-avatar-shared-renderer.mjs [http://localhost:6006]
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const recipes = JSON.parse(
  execFileSync(
    'bun',
    [
      '-e',
      `
import { FOLD_CONFIG, FOLD_SHAPES, DEFAULT_CONFIG, SHAPES } from './src/agent-avatar/model';
import { legacyRecipe } from './src/agent-avatar/legacy-recipe';
const configs = [...FOLD_SHAPES.map(foldShape => ({...FOLD_CONFIG, foldShape})),
 ...SHAPES.map(shape => ({...DEFAULT_CONFIG, shape}))];
console.log(JSON.stringify(configs.map(config => ({config, legacy:legacyRecipe(config)}))
 .filter(item => item.legacy.points)));
`,
    ],
    { cwd: new URL('..', import.meta.url), encoding: 'utf8' },
  ),
);
assert.equal(recipes.length, 8, 'Exercise every custom contour');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const count of [24, 48]) {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 800 },
      deviceScaleFactor: 2,
    });
    const failures = [];
    page.on('pageerror', (e) => failures.push(e.message));
    page.on('console', (m) => {
      if (
        /too many active webgl contexts|GL_INVALID|GL ERROR|GLES shader compilation failed/i.test(
          m.text(),
        )
      )
        failures.push(m.text());
    });
    await page.route('**/__bloom_shared.html', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><body>',
      }),
    );
    await page.goto(
      `${process.argv[2] || 'http://localhost:6006'}/__bloom_shared.html`,
    );
    await page.evaluate(
      async ({ count, recipes }) => {
        window.gate = {
          errors: [],
          ready: new Set(),
          controls: [],
          canvases: [],
          props: [],
          paints: [],
          contexts: new Set(),
          peak: 0,
        };
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          const result = get.call(this, type, ...args);
          if (result && /webgl/.test(type)) {
            gate.contexts.add(result);
            gate.peak = Math.max(
              gate.peak,
              [...gate.contexts].filter((c) => !c.isContextLost()).length,
            );
          }
          return result;
        };
        gate.runtime = await import('/bloom-character/runtime.mjs');
        gate.grid = document.createElement('div');
        gate.grid.style.cssText =
          'display:grid;grid-template-columns:repeat(8,64px);gap:8px';
        document.body.append(gate.grid);
        const presets = [
          'blue_beret',
          'alfred',
          'purple_heart',
          'lime_frog',
          'coral_monocle',
          'gus',
          'blue_spectacles',
          'lime_headphones',
        ];
        for (let i = 0; i < count; i++) {
          const canvas = document.createElement('canvas');
          canvas.id = `avatar-${i}`;
          canvas.style.cssText = 'width:64px;height:64px';
          gate.grid.append(canvas);
          const item =
            i % 2
              ? structuredClone(recipes[(i >> 1) % recipes.length])
              : {
                  config: {
                    motion: 35,
                    lookAt: 'wander',
                    character: { preset: presets[(i >> 1) % presets.length] },
                  },
                };
          const props = {
            ...item,
            interactive: true,
            paused: false,
            workingKey: 0,
            reactionKey: 0,
            workingCycles: 3,
          };
          gate.canvases.push(canvas);
          gate.props.push(props);
          gate.paints.push(0);
          gate.controls.push(
            await gate.runtime.createAvatar(canvas, props, {
              onReady: () => gate.ready.add(i),
              onPaint: () => gate.paints[i]++,
              onError: (e) => gate.errors.push(`${i}: ${e}`),
            }),
          );
        }
        gate.sample = document.createElement('canvas');
        gate.sample.width = gate.sample.height = 32;
        gate.sampleContext = gate.sample.getContext('2d', {
          willReadFrequently: true,
        });
        gate.hashes = () =>
          gate.canvases.map((canvas) => {
            const ctx = gate.sampleContext;
            ctx.clearRect(0, 0, 32, 32);
            ctx.drawImage(canvas, 0, 0, 32, 32);
            const bytes = ctx.getImageData(0, 0, 32, 32).data;
            let hash = 0,
              painted = 0;
            for (let i = 0; i < bytes.length; i++) {
              hash = (Math.imul(hash, 31) + bytes[i]) | 0;
              if (i % 4 === 3 && bytes[i] > 24) painted++;
            }
            return { hash, painted };
          });
      },
      { count, recipes },
    );
    await page.waitForFunction(
      (count) =>
        gate.errors.length ||
        (gate.ready.size === count &&
          gate.runtime.runtimeStats().instances === count &&
          gate.controls.every(
            (c) => c.diagnostics()?.ready && !c.diagnostics()?.pending,
          )),
      count,
      { timeout: 240000 },
    );
    assert.deepEqual(await page.evaluate(() => gate.errors), []);
    const metrics = await page.evaluate(async () => {
      const before = gate.paints.slice(),
        hashes = gate.canvases.map(() => new Set());
      const intervals = [],
        renderTimes = [];
      let last = performance.now(),
        running = true;
      function frame(time) {
        intervals.push(time - last);
        last = time;
        renderTimes.push(gate.runtime.runtimeStats().renderMilliseconds);
        if (running) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      const started = performance.now();
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 250));
        gate.hashes().forEach((value, index) => hashes[index].add(value.hash));
      }
      running = false;
      const elapsed = performance.now() - started;
      const percentile = (values, p) =>
        values.sort((a, b) => a - b)[
          Math.min(values.length - 1, Math.floor(values.length * p))
        ];
      return {
        elapsed,
        changed: hashes.map((s) => s.size),
        painted: gate.hashes().map((v) => v.painted),
        paintHz: gate.paints.map((n, i) => ((n - before[i]) * 1000) / elapsed),
        rafMilliseconds: {
          p50: percentile(intervals, 0.5),
          p95: percentile(intervals, 0.95),
        },
        renderMilliseconds: {
          p50: percentile(renderTimes, 0.5),
          p95: percentile(renderTimes, 0.95),
        },
        jsHeapBytes: performance.memory?.usedJSHeapSize,
        stats: gate.runtime.runtimeStats(),
        peakContexts: gate.peak,
        errors: gate.errors,
      };
    });
    console.log(`motion-${count}`, JSON.stringify(metrics));
    assert.deepEqual(metrics.errors, []);
    assert.equal(metrics.peakContexts, 1);
    assert.equal(metrics.stats.surface.contexts, 1);
    assert.equal(metrics.stats.instances, count);
    assert.equal(metrics.stats.legacy.sharedModules, 1);
    assert.ok(
      metrics.changed.every((n) => n > 1),
      'Every avatar must visibly change, not merely contain an initial frame',
    );
    assert.ok(metrics.painted.every((n) => n > 50));
    await page.locator('#avatar-0').click();
    await page.waitForFunction(
      () =>
        gate.controls[0].diagnostics()?.lastReaction === 0 ||
        gate.errors.length,
      {},
      { timeout: 30000 },
    );
    await page.evaluate(() => {
      gate.props[1] = { ...gate.props[1], workingKey: 1 };
      gate.controls[1].update(gate.props[1]);
    });
    await page.waitForFunction(
      () => {
        const d = gate.controls[1].diagnostics();
        return (
          gate.errors.length ||
          (d?.activityMode &&
            d?.ready &&
            !d?.pending &&
            d?.lastActivityResult === 0)
        );
      },
      {},
      { timeout: 60000 },
    );
    assert.deepEqual(await page.evaluate(() => gate.errors), []);
    // Removing one lease must not lose the shared context or stop its neighbours.
    await page.evaluate(() => {
      gate.controls[0].dispose();
      gate.canvases[0].remove();
      gate.beforeRemoval = gate.paints.slice();
    });
    await page.waitForFunction(
      () => gate.paints.slice(1).every((n, i) => n > gate.beforeRemoval[i + 1]),
      {},
      { timeout: 60000 },
    );
    await page.evaluate(() => {
      gate.controls.forEach((c) => c.dispose());
      gate.grid.remove();
    });
    await page.waitForFunction(
      () => {
        const s = gate.runtime.runtimeStats();
        return (
          !s.instances &&
          !s.surface.contexts &&
          !s.legacy.characters &&
          !s.legacy.pending &&
          !s.legacy.worker
        );
      },
      {},
      { timeout: 60000 },
    );
    assert.deepEqual(failures, []);
    assert.deepEqual(await page.evaluate(() => gate.errors), []);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(
  'PASS: 24/48 mixed avatars animate with one context, react/work, and release cleanly.',
);
