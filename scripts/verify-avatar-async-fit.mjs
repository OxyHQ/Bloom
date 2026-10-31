/** Hold real GPU fences to exercise fit cancellation and latest presentation. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { cases: [], errors: [] };
try {
  for (const mode of ['latest', 'dispose', 'context', 'hidden', 'failure']) {
    const page = await browser.newPage();
    page.on('pageerror', (error) => report.errors.push(error.message));
    await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });
    await page.goto(`${origin}/iframe.html`);
    const result = await page.evaluate(async (mode) => {
      const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'display:block;width:128px;height:128px';
      document.body.replaceChildren(canvas);
      let engine,
        frames = 0,
        errors = 0,
        held = true,
        fail = false,
        polls = 0;
      let peakReadbacks = 0;
      const readbacks = new Set(),
        fences = new Set();
      const samples = [];
      const proto = WebGL2RenderingContext.prototype,
        original = {};
      for (const key of [
        'clientWaitSync',
        'createBuffer',
        'deleteBuffer',
        'bindBuffer',
        'fenceSync',
        'deleteSync',
      ])
        original[key] = proto[key];
      proto.clientWaitSync = function (...args) {
        polls++;
        if (fail) return this.WAIT_FAILED;
        if (held) return this.TIMEOUT_EXPIRED;
        return original.clientWaitSync.apply(this, args);
      };
      proto.bindBuffer = function (target, buffer) {
        if (target === this.PIXEL_PACK_BUFFER && buffer) {
          readbacks.add(buffer);
          peakReadbacks = Math.max(peakReadbacks, readbacks.size);
        }
        return original.bindBuffer.call(this, target, buffer);
      };
      proto.deleteBuffer = function (buffer) {
        readbacks.delete(buffer);
        return original.deleteBuffer.call(this, buffer);
      };
      proto.fenceSync = function (...args) {
        const fence = original.fenceSync.apply(this, args);
        if (fence) fences.add(fence);
        return fence;
      };
      proto.deleteSync = function (fence) {
        fences.delete(fence);
        return original.deleteSync.call(this, fence);
      };
      const wait = async (predicate, label) => {
        const start = performance.now();
        while (!predicate()) {
          if (performance.now() - start > 20000) throw Error(`Timed out: ${label}`);
          await new Promise((r) => setTimeout(r, 10));
        }
      };
      const snapshot = () => {
        const gl = engine.renderer.getContext(),
          pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
        gl.readPixels(
          0,
          0,
          gl.drawingBufferWidth,
          gl.drawingBufferHeight,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels,
        );
        samples.push(pixels);
      };
      engine = new AuthoredAvatarEngine(canvas, {
        size: 128,
        lazyWork: true,
        onFrame: () => {
          frames++;
          snapshot();
        },
        onError: () => errors++,
      });
      await engine.loaded;
      engine.setPaused(true);
      engine.setMotionFrame(0, 'idle', 0.5);
      await wait(() => engine.stats().pendingFitReads > 0, 'pending fit');
      const initialPasses = engine.stats().fitPasses;
      await new Promise((r) => setTimeout(r, 35));
      if (frames !== 0 || engine.stats().fitPasses !== initialPasses)
        throw Error('Fit delivered or rendered repeatedly while held');
      if (mode === 'latest') {
        canvas.style.width = '256px';
        engine.setCount(4);
        await engine.setPreset(0, 'alfred');
        await engine.setPreset(1, 'gus');
        await engine.setPreset(2, 'lime_frog');
        await engine.setPreset(3, 'purple_heart');
        await engine.setSize(64);
        engine.setMotionFrame(0, 'reaction', 0.7);
        engine.setMotionFrame(1, 'idle', 0.3);
        await wait(() => engine.stats().pendingFitReads > 0, 'new generation');
        if (frames !== 0) throw Error('Stale frame delivered');
        held = false;
        await wait(() => frames > 0, 'latest first delivery');
        const first = samples.at(-1);
        const previous = frames;
        engine.setMotionFrame(0, 'reaction', 0.7);
        engine.setMotionFrame(1, 'idle', 0.3);
        await wait(() => frames > previous, 'cached latest delivery');
        const second = samples.at(-1);
        if (first.length !== second.length || first.some((value, index) => value !== second[index]))
          throw Error('Latest first image differs from cached pose');
      } else if (mode === 'context') {
        const gl = engine.renderer.getContext(),
          extension = gl.getExtension('WEBGL_lose_context');
        if (!extension) throw Error('Context loss extension unavailable');
        extension.loseContext();
        await wait(() => engine.contextLost, 'context lost');
        if (readbacks.size || fences.size)
          throw Error('Context loss retained GPU readback objects');
        held = false;
        extension.restoreContext();
        await wait(() => frames > 0, 'restored first delivery');
        if (errors) throw Error('Recoverable context loss reported fatal');
      } else if (mode === 'hidden') {
        canvas.style.display = 'none';
        await wait(() => !engine.inViewport && !engine.stats().pendingFitReads, 'hidden cancel');
        if (readbacks.size || fences.size || errors) throw Error('Hidden read retained resources');
        canvas.style.display = 'block';
        await wait(() => engine.stats().pendingFitReads > 0, 'visible new fit');
        if (frames) throw Error('Hidden stale fit delivered');
        held = false;
        await wait(() => frames > 0, 'visible first delivery');
      } else if (mode === 'failure') {
        fail = true;
        held = false;
        await wait(() => errors === 1, 'readback error');
        await new Promise((r) => setTimeout(r, 35));
        if (errors !== 1 || frames !== 0 || !engine.stats().renderFailure)
          throw Error('Failure did not settle once');
      }
      engine.dispose();
      canvas.remove();
      const before = polls;
      await new Promise((r) => setTimeout(r, 35));
      if (readbacks.size || fences.size || polls !== before || peakReadbacks > 2)
        throw Error('Dispose leaked a buffer/fence/poll');
      for (const [key, value] of Object.entries(original)) proto[key] = value;
      return { mode, frames, errors, readbacks: readbacks.size, fences: fences.size };
    }, mode);
    report.cases.push(result);
    console.log(JSON.stringify(result));
    await page.close();
  }
  const failurePage = await browser.newPage();
  await failurePage.goto(`${origin}/iframe.html`);
  const poolFailure = await failurePage.evaluate(async () => {
    const { createAvatar } = await import('/runtime/avatar-runtime.ts');
    const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
    const { editorPoolDiagnostics } = await import('/runtime/avatar-pool.ts');
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:64px;height:64px';
    document.body.replaceChildren(canvas);
    let errors = 0,
      ready = 0;
    const original = WebGL2RenderingContext.prototype.clientWaitSync;
    WebGL2RenderingContext.prototype.clientWaitSync = function () {
      return this.WAIT_FAILED;
    };
    const controller = await createAvatar(
      canvas,
      {
        character: resolveAvatarCharacter({ preset: 'blue_beret' }),
        reduced: true,
      },
      { onError: () => errors++, onReady: () => ready++ },
    );
    const start = performance.now();
    while (!errors) {
      if (performance.now() - start > 20000) throw Error('Pool never reported fit failure');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await new Promise((resolve) => setTimeout(resolve, 30));
    const pools = editorPoolDiagnostics().length;
    controller.dispose();
    WebGL2RenderingContext.prototype.clientWaitSync = original;
    if (errors !== 1 || ready !== 0 || pools !== 0)
      throw Error('Pool fit failure leaked or duplicated callbacks');
    return { mode: 'pool-failure', errors, ready, pools };
  });
  report.cases.push(poolFailure);
  console.log(JSON.stringify(poolFailure));
  await failurePage.close();
  assert.equal(report.errors.length, 0, report.errors.join('\n'));
} finally {
  await mkdir('.local/avatar-async-fit', { recursive: true });
  await writeFile('.local/avatar-async-fit/report.json', `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
