/** Exact raw framebuffer parity for the injected non-DOM host adapter. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url),
  puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { cases: [], errors: [] };
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => report.errors.push(e.message));
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*/avatar-host-parity.html' }] });
  cdp.on('Fetch.requestPaused', (e) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: e.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html><body style="margin:0"></body>').toString('base64'),
    }),
  );
  await page.goto(`${origin}/avatar-host-parity.html`);
  await cdp.send('Fetch.disable');
  const result = await page.evaluate(async () => {
    document.body.replaceChildren();
    const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:512px;height:128px;display:block';
    document.body.append(canvas);
    const contextCanvas = document.createElement('canvas');
    const gl = contextCanvas.getContext('webgl2', { alpha: true, antialias: false });
    let defaultPixels,
      hostPixels,
      hostFrame,
      subscriptions = 0,
      unsubscriptions = 0,
      domObservers = 0;
    const read = (context, framebuffer, width, height) => {
      const previous = context.getParameter(context.FRAMEBUFFER_BINDING);
      context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
      const pixels = new Uint8Array(width * height * 4);
      context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, pixels);
      context.bindFramebuffer(context.FRAMEBUFFER, previous);
      return pixels;
    };
    let normal;
    normal = new AuthoredAvatarEngine(canvas, {
      count: 4,
      size: 128,
      lazyWork: true,
      onFrame() {
        const g = normal.renderer.getContext();
        defaultPixels = read(g, null, g.drawingBufferWidth, g.drawingBufferHeight);
      },
    });
    await normal.loaded;
    normal.setPaused(true);
    const OriginalResize = globalThis.ResizeObserver,
      OriginalIntersection = globalThis.IntersectionObserver;
    globalThis.ResizeObserver = class {
      constructor() {
        domObservers++;
        throw Error('Injected host subscribed to DOM resize');
      }
    };
    globalThis.IntersectionObserver = class {
      constructor() {
        domObservers++;
        throw Error('Injected host subscribed to DOM intersection');
      }
    };
    let hosted;
    try {
      hosted = new AuthoredAvatarEngine(null, {
        count: 4,
        size: 128,
        lazyWork: true,
        host: {
          context: gl,
          getSize: () => ({ width: 512, height: 128, pixelRatio: 2 }),
          requestFrame: (cb) => requestAnimationFrame(cb),
          cancelFrame: (id) => cancelAnimationFrame(id),
          isHidden: () => false,
          subscribe() {
            subscriptions++;
            return () => unsubscriptions++;
          },
          onFrame(frame) {
            hostFrame = frame;
            hostPixels = read(gl, frame.framebuffer, frame.width, frame.height);
          },
        },
      });
    } finally {
      globalThis.ResizeObserver = OriginalResize;
      globalThis.IntersectionObserver = OriginalIntersection;
    }
    await hosted.loaded;
    hosted.setPaused(true);
    const engines = [normal, hosted];
    const presets = ['blue_beret', 'alfred', 'purple_heart', 'lime_frog'];
    for (const engine of engines) {
      await engine.setPresets(presets);
      await Promise.all(presets.map((_, i) => engine.prepareWork(i)));
    }
    const cases = [];
    for (const [name, kind, time, active] of [
      ['idle', 'idle', 0.5, [0, 1, 2, 3]],
      ['work', 'work', 1.5, [0, 1, 2, 3]],
      ['sparse-middle', 'reaction', 0.8, [2]],
      ['restore', 'idle', 0.5, [0, 1, 2, 3]],
    ]) {
      const before = engines.map((e) => e.stats().frames);
      for (const engine of engines)
        for (let i = 0; i < 4; i++) {
          engine.setInstanceRendering(i, active.includes(i));
          engine.setWander(i, false);
          engine.setMotionFrame(i, kind, time);
        }
      await new Promise((resolve, reject) => {
        const started = performance.now();
        const check = () => {
          if (engines.every((e, i) => e.stats().frames > before[i] && !e.fitPending)) resolve();
          else if (performance.now() - started > 20000) reject(Error('Held host frame timeout'));
          else requestAnimationFrame(check);
        };
        check();
      });
      if (defaultPixels.length !== hostPixels.length)
        throw Error(
          `Framebuffer dimensions differ ${defaultPixels.length} vs ${hostPixels.length}`,
        );
      let differentPixels = 0,
        maxDifference = 0,
        comparedPixels = 0,
        transparentPixels = 0,
        partialAlphaPixels = 0;
      const size = hostFrame.pixels,
        width = hostFrame.width;
      for (const index of active)
        for (let y = 0; y < size; y++)
          for (let x = index * size; x < (index + 1) * size; x++) {
            const at = (y * width + x) * 4;
            let delta = 0;
            for (let c = 0; c < 4; c++)
              delta = Math.max(delta, Math.abs(defaultPixels[at + c] - hostPixels[at + c]));
            if (delta) differentPixels++;
            maxDifference = Math.max(maxDifference, delta);
            comparedPixels++;
            if (defaultPixels[at + 3] === 0) transparentPixels++;
            else if (defaultPixels[at + 3] < 255) partialAlphaPixels++;
          }
      cases.push({
        name,
        differentPixels,
        maxDifference,
        comparedPixels,
        transparentPixels,
        partialAlphaPixels,
        width: hostFrame.width,
        height: hostFrame.height,
        backingPixelsPerAvatar: hostFrame.pixels,
      });
    }
    engines.forEach((e) => {
      e.dispose();
    });
    return { cases, domObservers, subscriptions, unsubscriptions };
  });
  Object.assign(report, result);
  assert.deepEqual(report.errors, []);
  assert.equal(report.domObservers, 0);
  assert.equal(report.subscriptions, 1);
  assert.equal(report.unsubscriptions, 1);
  assert(report.cases.every((c) => c.differentPixels === 0));
  console.log(JSON.stringify(report));
} finally {
  await mkdir('.local/avatar-host-parity', { recursive: true });
  await writeFile('.local/avatar-host-parity/report.json', `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
