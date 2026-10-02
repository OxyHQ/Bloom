/** Real-runtime error gate: inject an invalid GL command during an original
 * Character draw; a failed shared batch must publish no image and release its
 * renderer while the unaffected avatar keeps moving.
 * node scripts/verify-avatar-runtime-errors.mjs [http://localhost:6006]
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const p = await b.newPage();
    await p.route('**/__errors.html', (r) =>
      r.fulfill({ contentType: 'text/html', body: '<!doctype html><body>' }),
    );
    await p.goto(`${process.argv[2] || 'http://localhost:6006'}/__errors.html`);
    await p.evaluate(async () => {
      window.gate = {
        errors: [],
        ready: new Set(),
        paints: [0, 0],
        controls: [],
        armed: false,
      };
      const draw = WebGL2RenderingContext.prototype.drawElements,
        bind = WebGL2RenderingContext.prototype.bindBuffer;
      WebGL2RenderingContext.prototype.drawElements = function (...args) {
        if (gate.armed) {
          gate.armed = false;
          gate.injected = true;
          gate.before = [...gate.paints];
          bind.call(this, 0xdead, null);
        }
        return draw.apply(this, args);
      };
      gate.runtime = await import('/bloom-character/runtime.mjs');
      for (let i = 0; i < 2; i++) {
        const c = document.createElement('canvas');
        c.style = 'width:64px;height:64px';
        document.body.append(c);
        gate.controls.push(
          await gate.runtime.createAvatar(
            c,
            {
              config: {
                motion: 35,
                lookAt: 'wander',
                character: { preset: i ? 'alfred' : 'blue_beret' },
              },
              paused: false,
            },
            {
              onReady: () => gate.ready.add(i),
              onPaint: () => gate.paints[i]++,
              onError: (e) =>
                gate.errors.push({
                  i,
                  error: String(e),
                  paints: [...gate.paints],
                }),
            },
          ),
        );
      }
    });
    await p.waitForFunction(
      () =>
        gate.ready.size === 2 &&
        gate.runtime.runtimeStats().legacy.pending === 0,
      undefined,
      { timeout: 60000 },
    );
    await p.evaluate(() => (gate.armed = true));
    await p.waitForFunction(() => gate.errors.length, undefined, {
      timeout: 15000,
    });
    const failed = await p.evaluate(() => ({
      errors: gate.errors,
      before: gate.before,
      paints: gate.paints,
      stats: gate.runtime.runtimeStats(),
    }));
    assert.match(failed.errors[0].error, /0x500/);
    assert.deepEqual(
      failed.errors[0].paints,
      failed.before,
      'Failed shared batch must publish no new image',
    );
    await p.waitForTimeout(600);
    const later = await p.evaluate(() => ({
      paints: gate.paints,
      errors: gate.errors,
      stats: gate.runtime.runtimeStats(),
    }));
    for (const err of failed.errors)
      assert.equal(
        later.paints[err.i],
        failed.before[err.i],
        'Failed native controller must stop rendering',
      );
    for (let i = 0; i < 2; i++)
      if (!failed.errors.some((e) => e.i === i))
        assert(
          later.paints[i] > failed.before[i],
          'Unaffected character must keep animating',
        );
    await p.evaluate(() => gate.controls.forEach((c) => c.dispose()));
    await p.waitForFunction(
      () =>
        gate.runtime.runtimeStats().instances === 0 &&
        gate.runtime.runtimeStats().legacy.pending === 0 &&
        gate.runtime.runtimeStats().legacy.dispatchTimers === 0,
      undefined,
      { timeout: 30000 },
    );
    const cleanup = await p.evaluate(() => gate.runtime.runtimeStats());
    assert.equal(cleanup.surface.contexts, 0);
    assert.equal(cleanup.legacy.characters, 0);
    assert.equal(cleanup.legacy.preparationWaiters, 0);
    assert.equal(cleanup.legacy.preparationActive, false);
    console.log(JSON.stringify({ failed, later, cleanup }, null, 2));
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
