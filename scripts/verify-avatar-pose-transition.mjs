/** Native pose continuity gate; uses original GL geometry and controller. */
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
    p.on('pageerror', (e) => console.error(e));
    await p.route('**/__pose.html', (r) =>
      r.fulfill({ contentType: 'text/html', body: '<!doctype html><body>' }),
    );
    await p.goto('http://localhost:6006/__pose.html');
    const result = await p.evaluate(async () => {
      const { acquireSharedSurface } =
        await import('/bloom-character/shared-surface.mjs');
      const { getCharacterEngine, acquireCharacterPreparation } =
        await import('/bloom-character/legacy-engine.mjs');
      const m = await getCharacterEngine();
      const release = await acquireCharacterPreparation();
      const s = acquireSharedSurface(document.body);
      s.canvas.width = s.canvas.height = 128;
      const c = s.create(m, 128, 128, { activities: true });
      c.applyActivity({
        command: 3,
        sequence: 0n,
        episodeId: 0n,
        episodeHighWater: 0n,
        activity: 0,
        outcome: 0,
        entry: 1,
      });
      m.controllerMode(c, false);
      c.restore(m.presetAppearance('blue_beret'));
      c.setActive(true);
      c.setReducedMotion(false);
      c.setQuality(1);
      const out = document.createElement('canvas');
      out.width = out.height = 128;
      document.body.append(out);
      const ctx = out.getContext('2d', { willReadFrequently: true });
      const frames = [];
      let phase = 'initial';
      const ptr = c.$$.ptr;
      let cacheBefore;
      async function render(n) {
        for (let i = 0; i < n; i++) {
          const result = s.render(
            () => c.render(performance.now() / 1000),
            () => !c.preparationStats().pending,
          );
          if (result) {
            s.copy(ctx);
            let painted = 0;
            const a = ctx.getImageData(0, 0, 128, 128).data;
            for (let j = 3; j < a.length; j += 4) if (a[j] > 24) painted++;
            frames.push({ phase, painted, ...s.transitionStats() });
          }
          await new Promise((r) => setTimeout(r, 20));
        }
      }
      await render(100);
      cacheBefore = c.characterCacheStats();
      c.playReaction(2);
      phase = 'react';
      await render(20);
      const start = s.beginTransition(180);
      m.controllerMode(c, true);
      const work = c.applyActivity({
        command: 1,
        sequence: 1n,
        episodeId: 1n,
        episodeHighWater: 0n,
        activity: 1,
        outcome: 0,
        entry: 0,
      });
      phase = 'work';
      await render(120);
      const error = c.renderError(),
        stats = s.transitionStats(),
        prep = c.preparationStats(),
        samePointer = c.$$.ptr === ptr,
        cacheAfter = c.characterCacheStats();
      c.delete();
      s.release();
      release();
      return {
        start,
        work,
        frames,
        error,
        stats,
        prep,
        samePointer,
        cacheBefore,
        cacheAfter,
      };
    });
    assert.equal(result.start, true);
    assert.equal(result.work, 0);
    assert.equal(result.error, '');
    assert.equal(result.samePointer, true);
    assert.equal(result.stats.unsupported, 0);
    assert(result.stats.draws >= 7);
    assert(result.stats.cameras > 0);
    assert.equal(result.prep.failed, false);
    assert.equal(result.cacheAfter.compiled, result.cacheBefore.compiled);
    const i = result.frames.findIndex((x) => x.phase === 'work');
    assert(i > 0);
    assert(
      Math.abs(result.frames[i].painted - result.frames[i - 1].painted) <
        Math.max(12, result.frames[i - 1].painted * 0.02),
    );
    assert(result.frames.slice(i).every((x) => x.painted > 100));
    console.log(
      JSON.stringify(
        { ...result, frames: result.frames.length },
        (_, v) => (typeof v === 'bigint' ? String(v) : v),
        2,
      ),
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
