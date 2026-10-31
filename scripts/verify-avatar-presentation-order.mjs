/** Deferred CPU frames cannot overwrite newer direct frames or survive hiding. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const errors = [];
try {
  const page = await browser.newPage();
  if (process.env.AVATAR_DISABLE_DELIVERY_GUARD === '1') {
    const cdp = await page.createCDPSession();
    await cdp.send('Fetch.enable', {
      patterns: [{ urlPattern: '*runtime/avatar-pool.ts*', requestStage: 'Response' }],
    });
    cdp.on('Fetch.requestPaused', async (event) => {
      const response = await cdp.send('Fetch.getResponseBody', { requestId: event.requestId });
      const original = response.base64Encoded
        ? Buffer.from(response.body, 'base64').toString()
        : response.body;
      const changed = original.replace('sequence >= entry.delivered &&', 'true &&');
      if (changed === original)
        errors.push('Negative control failed to remove delivered sequence guard');
      await cdp.send('Fetch.fulfillRequest', {
        requestId: event.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }],
        body: Buffer.from(changed).toString('base64'),
      });
    });
  }
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewport({ width: 640, height: 480, deviceScaleFactor: 2 });
  await page.goto(`${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007'}/iframe.html`);
  const result = await page.evaluate(async () => {
    document.body.replaceChildren();
    document.body.style.height = '2000px';
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: undefined });
    const observed = [],
      NativeObserver = IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback, options) {
        super(callback, options);
        this.targets = new Set();
        this.callback = callback;
        observed.push(this);
      }
      observe(target) {
        this.targets.add(target);
        super.observe(target);
      }
      unobserve(target) {
        this.targets.delete(target);
        super.unobserve(target);
      }
    };
    const poolURL = '/runtime/avatar-pool.ts',
      source = await (await fetch(poolURL)).text();
    const engineURL = new URL(
      source.match(/from\s+["']([^"']*authored-engine[^"']*)["']/)[1],
      location.href,
    ).href;
    const { AuthoredAvatarEngine } = await import(engineURL);
    let engine;
    const originalPause = AuthoredAvatarEngine.prototype.setInstancePaused;
    AuthoredAvatarEngine.prototype.setInstancePaused = function (...args) {
      engine = this;
      return originalPause.apply(this, args);
    };
    const { attachEditorAvatar, editorPoolDiagnostics } = await import(poolURL);
    const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
    const { resolveCompleteEditorRecipe } = await import('/runtime/avatar/recipe.ts');
    const props = { character: resolveAvatarCharacter({ preset: 'blue_beret' }), reduced: false },
      recipe = resolveCompleteEditorRecipe(props);
    const canvases = [],
      slots = [];
    let ready = 0,
      failures = 0;
    const stats = () => editorPoolDiagnostics()[0];
    const wait = async (predicate, label) => {
      const started = performance.now();
      while (!predicate()) {
        if (performance.now() - started > 20000) throw Error(`Timed out: ${label}`);
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    };
    await Promise.all(
      Array.from({ length: 4 }, async (_, index) => {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'display:inline-block;width:64px;height:64px';
        document.body.append(canvas);
        canvases[index] = canvas;
        slots[index] = await attachEditorAvatar(
          canvas,
          props,
          recipe,
          () => ready++,
          () => failures++,
        );
      }),
    );
    await wait(() => ready === 4 && stats().presentation.pboFrames > 0, 'initial PBO frame');
    AuthoredAvatarEngine.prototype.setInstancePaused = originalPause;
    const visibility = (visible) => {
      for (const canvas of canvases.slice(1))
        canvas.style.transform = visible ? '' : 'translateY(1000px)';
      for (const observer of observed) {
        const changes = canvases
          .slice(1)
          .filter((canvas) => observer.targets.has(canvas))
          .map((target) => ({ target, isIntersecting: visible }));
        if (changes.length) observer.callback(changes, observer);
      }
    };
    const originalFence = WebGL2RenderingContext.prototype.fenceSync,
      originalWait = WebGL2RenderingContext.prototype.clientWaitSync;
    let arm = false,
      heldFence,
      holdAll = false;
    WebGL2RenderingContext.prototype.fenceSync = function (...args) {
      const fence = originalFence.apply(this, args);
      if (arm && !heldFence) {
        arm = false;
        heldFence = fence;
        queueMicrotask(() => visibility(false));
      }
      return fence;
    };
    WebGL2RenderingContext.prototype.clientWaitSync = function (sync, ...args) {
      return holdAll || sync === heldFence
        ? this.TIMEOUT_EXPIRED
        : originalWait.call(this, sync, ...args);
    };
    let staleScratchWrites = 0,
      watchLate = false,
      expectedDuringCrossing,
      badCrossingWrites = 0,
      crossingWrites = 0;
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
      if (
        this.canvas === canvases[0] &&
        watchLate &&
        source?.dataset?.avatarRenderer !== 'shared-editor-scene'
      )
        staleScratchWrites++;
      const result = draw.call(this, source, ...args);
      if (
        this.canvas === canvases[0] &&
        expectedDuringCrossing &&
        source?.dataset?.avatarRenderer !== 'shared-editor-scene'
      ) {
        crossingWrites++;
        if (canvases[0].toDataURL() !== expectedDuringCrossing) badCrossingWrites++;
      }
      return result;
    };
    arm = true;
    await wait(
      () => heldFence && stats().stats.renderedInstances === 1,
      'held PBO with only one active destination',
    );
    const before = stats().presentation.directFrames;
    await wait(() => stats().presentation.directFrames >= before + 3, 'newer direct frames');
    // Hold the engine's pose without updating entry props/revision: only the
    // delivered sequence can distinguish this newer image from the old PBO job.
    engine.setWander(0, false);
    engine.setMotionFrame(0, 'reaction', 0.5);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const latest = canvases[0].toDataURL(),
      frame = stats().stats.frames;
    watchLate = true;
    heldFence = undefined;
    await new Promise((resolve) => setTimeout(resolve, 80));
    const retained = canvases[0].toDataURL() === latest;
    if (!retained || staleScratchWrites)
      throw Error('Old PBO frame overwrote a newer direct frame');
    watchLate = false;
    if (stats().stats.frames !== frame) throw Error('Test pose did not remain quiescent');
    visibility(true);
    engine.idle(0);
    await wait(() => stats().stats.renderedInstances === 4, 'all visible again');
    // A second crossing queues a newer PBO frame C behind old A while B is
    // already delivered directly. Observe every write, not merely the final PNG.
    arm = true;
    await wait(() => heldFence && stats().stats.renderedInstances === 1, 'second held A');
    engine.setWander(0, false);
    engine.setMotionFrame(0, 'reaction', 0.75);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expectedDuringCrossing = canvases[0].toDataURL();
    visibility(true);
    await Promise.all(
      slots.slice(1).map((slot) => slot.update({ ...props, paused: true }, recipe)),
    );
    await wait(() => stats().stats.presentationCapacity === false, 'new PBO C queued behind A');
    heldFence = undefined;
    await wait(
      () => crossingWrites > 0 && stats().stats.renderedInstances === 1,
      'new PBO C delivered',
    );
    if (badCrossingWrites) throw Error('Old PBO A flashed over direct B before new PBO C');
    expectedDuringCrossing = undefined;
    await Promise.all(slots.map((slot) => slot.update(props, recipe)));
    engine.idle(0);
    await wait(() => stats().stats.renderedInstances === 4, 'live after ordered crossing');
    await new Promise((resolve) => setTimeout(resolve, 60));
    holdAll = true;
    await wait(() => stats().stats.presentationCapacity === false, 'two held presentation jobs');
    const frozen = {
      ...props,
      paused: true,
      character: resolveAvatarCharacter({ preset: 'blue_beret', bodyColor: '#336699' }),
    };
    await Promise.all(
      slots.map((slot) => slot.update(frozen, resolveCompleteEditorRecipe(frozen))),
    );
    const beforeHidden = canvases.map((canvas) => canvas.toDataURL());
    let hidden = true,
      offset = 0;
    const now = performance.now.bind(performance);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.defineProperty(performance, 'now', { configurable: true, value: () => now() + offset });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => setTimeout(resolve, 30));
    offset = 60001;
    if (canvases.some((canvas, index) => canvas.toDataURL() !== beforeHidden[index]))
      throw Error('Cancelled hidden jobs wrote pixels');
    hidden = false;
    holdAll = false;
    document.dispatchEvent(new Event('visibilitychange'));
    await wait(
      () => stats().stats.renderedInstances === 0,
      'latest paused pixels after hidden resume',
    );
    const recovered = canvases.every((canvas, index) => canvas.toDataURL() !== beforeHidden[index]);
    const final = stats().presentation;
    for (const slot of slots) slot.dispose();
    WebGL2RenderingContext.prototype.fenceSync = originalFence;
    WebGL2RenderingContext.prototype.clientWaitSync = originalWait;
    CanvasRenderingContext2D.prototype.drawImage = draw;
    window.IntersectionObserver = NativeObserver;
    delete document.hidden;
    delete performance.now;
    return {
      ready,
      failures,
      retained,
      recovered,
      staleScratchWrites,
      badCrossingWrites,
      crossingWrites,
      maximumPending: final.maximumPending,
      finalPools: editorPoolDiagnostics().length,
    };
  });
  assert.deepEqual(errors, []);
  assert.equal(result.ready, 4);
  assert.equal(result.failures, 0);
  assert.equal(result.retained, true);
  assert.equal(result.badCrossingWrites, 0);
  assert.ok(result.crossingWrites > 0);
  assert.equal(result.recovered, true);
  assert.equal(result.finalPools, 0);
  assert.ok(result.maximumPending <= 2);
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
