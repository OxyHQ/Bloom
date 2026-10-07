/** Browser crowd gate: real pixels and WebGL contexts, including cold commands.
 * Requires Storybook and Bun. BLOOM_PLAYWRIGHT_MODULE may name an installation.
 * node scripts/verify-avatar-render-budget.mjs [http://localhost:6006]
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
const quotaWarnings = [],
  pageErrors = [];
let page;
try {
  page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.on('console', (message) => {
    // delete() deliberately loses its context. Only quota eviction is a failure.
    if (/too many active webgl contexts/i.test(message.text()))
      quotaWarnings.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/__bloom_render_budget.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><body></body></html>',
    }),
  );
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/__bloom_render_budget.html`,
  );
  await page.evaluate(async (recipes) => {
    window.gate = {
      contexts: new Set(),
      contextPeak: 0,
      quotaViolations: [],
      errors: [],
      ready: new Set(),
      controls: [],
      props: [],
      canvases: [],
      disposedCallbacks: [],
      started: performance.now(),
      longTasks: [],
    };
    gate.contextCount = () =>
      [...gate.contexts].filter((gl) => !gl.isContextLost()).length;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      const context = getContext.call(this, type, ...args);
      if (context && ['webgl', 'webgl2', 'experimental-webgl'].includes(type)) {
        gate.contexts.add(context);
        const count = gate.contextCount();
        gate.contextPeak = Math.max(gate.contextPeak, count);
        if (count > 1) gate.quotaViolations.push({ count, canvas: this.id });
      }
      return context;
    };
    new PerformanceObserver((list) =>
      gate.longTasks.push(...list.getEntries().map((e) => e.duration)),
    ).observe({ type: 'longtask' });
    gate.runtime = await import('/bloom-character/runtime.mjs');
    gate.grid = document.createElement('div');
    gate.grid.style.cssText =
      'display:grid;grid-template-columns:repeat(8,92px);gap:10px';
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
    for (let i = 0; i < 48; i++) {
      const canvas = document.createElement('canvas');
      canvas.id = `avatar-${i}`;
      canvas.style.cssText = 'width:88px;height:88px';
      gate.grid.append(canvas);
      const item =
        (i >= 24 && i < 40) || i >= 44
          ? structuredClone(recipes[i % recipes.length])
          : {
              config: {
                motion: 35,
                lookAt: 'wander',
                character: { preset: presets[i % presets.length] },
              },
            };
      const props = {
        ...item,
        portrait: i >= 40,
        interactive: i < 40,
        paused: i >= 40,
        reactionKey: 0,
        workingKey: 0,
        workingCycles: 3,
      };
      gate.canvases.push(canvas);
      gate.props.push(props);
      gate.controls.push(
        await gate.runtime.createAvatar(canvas, props, {
          onReady: () => gate.ready.add(i),
          onError: (error) => gate.errors.push(`${i}: ${String(error)}`),
        }),
      );
    }
    gate.painted = (canvas) => {
      const data = canvas
        .getContext('2d')
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let count = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 24) count++;
      return count;
    };
    gate.snapshot = () => ({
      ready: gate.ready.size,
      errors: gate.errors,
      contextPeak: gate.contextPeak,
      contexts: gate.contextCount(),
      quotaViolations: gate.quotaViolations,
      stats: gate.runtime.runtimeStats(),
      painted: gate.canvases.map(gate.painted),
      disposedCallbacks: gate.disposedCallbacks,
    });
  }, recipes);
  await page.waitForFunction(
    () => gate.ready.size === 48 || gate.errors.length,
    {},
    { timeout: 180000 },
  );
  const crowd = await page.evaluate(() => ({
    ...gate.snapshot(),
    elapsed: performance.now() - gate.started,
    longTasks: gate.longTasks.length,
    maxLongTask: Math.max(0, ...gate.longTasks),
  }));
  assert.deepEqual(crowd.errors, []);
  assert.equal(crowd.ready, 48);
  assert.ok(
    crowd.painted.every((count) => count > 100),
    'Every original, migrated and portrait canvas must contain pixels',
  );
  assert.ok(
    crowd.contextPeak === 1,
    'Actual browser contexts, not just bookkeeping, must stay at one',
  );
  assert.deepEqual(crowd.quotaViolations, []);
  assert.equal(crowd.stats.surface.contexts, 1);
  console.log('crowd', JSON.stringify(crowd));

  // Cold pointer input must promote a real still image and replay its reaction.
  const coldReaction = 0;
  await page.evaluate(() => {
    for (const i of [0, 24]) {
      gate.props[i] = { ...gate.props[i], paused: true };
      gate.controls[i].update(gate.props[i]);
    }
  });
  await page.waitForFunction(
    () => [0, 24].every((i) => gate.controls[i].diagnostics()?.suspended),
    {},
    { timeout: 30000 },
  );
  await page.evaluate((i) => {
    gate.props[i] = { ...gate.props[i], paused: false };
    gate.controls[i].update(gate.props[i]);
    // Input in this same task exercises replay before any renderer can start.
    gate.canvases[i].dispatchEvent(
      new PointerEvent('pointerdown', {
        button: 0,
        isPrimary: true,
        bubbles: true,
      }),
    );
  }, coldReaction);
  await page.waitForFunction(
    (i) =>
      gate.controls[i].diagnostics()?.lastReaction === 0 || gate.errors.length,
    coldReaction,
    { timeout: 60000 },
  );
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  assert.ok(
    await page.evaluate(
      (i) => gate.painted(gate.canvases[i]) > 100,
      coldReaction,
    ),
  );

  // A cold migrated avatar must retain an imperative work request while loading.
  const coldWork = 24;
  await page.evaluate((i) => {
    gate.props[i] = { ...gate.props[i], paused: false, workingKey: 1 };
    gate.controls[i].update(gate.props[i]);
  }, coldWork);
  await page.waitForFunction(
    (i) => {
      const d = gate.controls[i].diagnostics();
      return (
        (d?.activityMode &&
          d?.ready &&
          !d?.pending &&
          d?.lastActivityResult === 0) ||
        gate.errors.length
      );
    },
    coldWork,
    { timeout: 60000 },
  );
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  assert.ok(
    await page.evaluate((i) => gate.painted(gate.canvases[i]) > 100, coldWork),
  );
  console.log(
    'reactivation',
    JSON.stringify(
      await page.evaluate(
        ([reaction, work]) => ({
          reaction: gate.controls[reaction].diagnostics(),
          work: gate.controls[work].diagnostics(),
          contexts: gate.contextCount(),
        }),
        [coldReaction, coldWork],
      ),
    ),
  );

  // Real intersection changes must release all surfaces, preserving their 2D pixels.
  await page.mouse.move(1000, 800);
  await page.evaluate(() => {
    gate.grid.style.marginTop = `${innerHeight + 1000}px`;
    scrollTo(0, 0);
  });
  await page.waitForFunction(
    () =>
      gate.runtime.runtimeStats().budget.resident === 0 &&
      gate.contextCount() === 0,
    {},
    { timeout: 30000 },
  );
  assert.ok(
    (await page.evaluate(() => gate.canvases.map(gate.painted))).every(
      (count) => count > 100,
    ),
  );
  await page.evaluate(() => {
    gate.grid.style.marginTop = '0px';
  });
  await page.waitForFunction(
    () => gate.contextCount() > 0,
    {},
    { timeout: 30000 },
  );

  // Headless Chromium does not reliably background pages. Drive its visibility
  // input explicitly while retaining real observers, renderers and contexts.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(
    () =>
      gate.runtime.runtimeStats().budget.resident === 0 &&
      gate.contextCount() === 0,
    {},
    { timeout: 30000 },
  );
  assert.ok(
    (await page.evaluate(() => gate.canvases.map(gate.painted))).every(
      (count) => count > 100,
    ),
  );
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(
    () => gate.contextCount() > 0,
    {},
    { timeout: 30000 },
  );
  await page.evaluate(() => {
    gate.controls.forEach((control) => control.dispose());
    gate.grid.replaceChildren();
  });
  await page.waitForFunction(
    () => {
      const s = gate.runtime.runtimeStats();
      return (
        s.budget.registered === 0 &&
        s.budget.resident === 0 &&
        s.instances === 0 &&
        s.legacy.modules === 0 &&
        s.legacy.pending === 0 &&
        !s.legacy.worker &&
        gate.contextCount() === 0
      );
    },
    {},
    { timeout: 30000 },
  );

  // Cancel surfaces during initialization and queued warm-up; late callbacks or
  // leases must not resurrect removed canvases, even with unique appearances.
  await page.evaluate(async (recipes) => {
    for (let batch = 0; batch < 3; batch++) {
      const removals = [];
      for (let i = 0; i < 12; i++) {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:64px;height:64px';
        gate.grid.append(canvas);
        const item = structuredClone(recipes[i % recipes.length]);
        item.legacy.patch.bodyColor = `#${(0x234567 + batch * 100 + i).toString(16)}`;
        let removed = false;
        const late = (kind) => {
          if (removed) gate.disposedCallbacks.push(kind);
        };
        const control = await gate.runtime.createAvatar(
          canvas,
          { ...item, interactive: true },
          {
            onReady: () => late('ready'),
            onPaint: () => late('paint'),
            onCapabilities: () => late('capabilities'),
            onError: (error) => {
              late('error');
              gate.errors.push(String(error));
            },
          },
        );
        removals.push(() => {
          removed = true;
          control.dispose();
          canvas.remove();
        });
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => setTimeout(resolve, 10));
      removals.forEach((remove) => remove());
    }
  }, recipes);
  await page.waitForFunction(
    () => {
      const s = gate.runtime.runtimeStats();
      return (
        s.budget.registered === 0 &&
        s.budget.resident === 0 &&
        s.instances === 0 &&
        s.legacy.modules === 0 &&
        s.legacy.pending === 0 &&
        !s.legacy.worker &&
        gate.contextCount() === 0
      );
    },
    {},
    { timeout: 60000 },
  );
  await page.waitForTimeout(250);
  const final = await page.evaluate(() => ({
    ...gate.snapshot(),
    painted: undefined,
  }));
  assert.deepEqual(final.errors, []);
  assert.deepEqual(final.disposedCallbacks, []);
  assert.deepEqual(final.quotaViolations, []);
  assert.ok(final.contextPeak === 1);
  assert.equal(final.contexts, 0);
  assert.equal(final.stats.instances, 0);
  assert.equal(final.stats.active, 0);
  assert.equal(final.stats.scheduled, false);
  assert.equal(final.stats.budget.registered, 0);
  assert.equal(final.stats.budget.resident, 0);
  assert.ok(final.stats.budget.snapshots <= 64);
  const { preparationCache, ...releasedEngine } = final.stats.legacy;
  assert.equal(preparationCache.maximumBytes, 8 * 1024 * 1024);
  assert.ok(preparationCache.bytes <= preparationCache.maximumBytes);
  assert.ok(preparationCache.entries <= 16);
  assert.deepEqual(releasedEngine, {
    modules: 0,
    sharedModules: 1,
    characters: 0,
    preparationWaiters: 0,
    preparationActive: false,
    dispatchTimers: 0,
    pending: 0,
    worker: false,
  });
  assert.deepEqual(quotaWarnings, []);
  assert.deepEqual(pageErrors, []);
  console.log('release', JSON.stringify(final));
  console.log(
    'PASS: 48 mixed avatars, cold interaction/work, visibility and rapid disposal; one actual context.',
  );
} catch (error) {
  if (page && !page.isClosed()) {
    console.error(
      'failure-state',
      JSON.stringify(
        await page.evaluate(() => window.gate?.snapshot?.()).catch(() => null),
      ),
    );
  }
  console.error('quota-warnings', quotaWarnings, 'page-errors', pageErrors);
  throw error;
} finally {
  await browser.close();
}
