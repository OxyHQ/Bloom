/** Observable framebuffer, clipping, resize and context ownership gate. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/__bloom_surface.html', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<!doctype html><body>' }),
  );
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/__bloom_surface.html`,
  );
  const result = await page.evaluate(async () => {
    const {
      acquireSharedSurface,
      sharedSurfaceStats,
      renderSharedBatchDeferred,
      waitForSharedRender,
      sharedRenderPending,
    } = await import('/bloom-character/shared-surface.mjs');
    const a = acquireSharedSurface(document.body),
      b = acquireSharedSurface(document.body);
    a.canvas.width = 80;
    a.canvas.height = 60;
    b.canvas.width = 96;
    b.canvas.height = 72;
    const first = a.canvas.getContext('webgl2'),
      second = b.canvas.getContext('webgl2');
    const cachedMethods = [
      'getExtension',
      'getParameter',
      'isEnabled',
      'bindFramebuffer',
      'viewport',
      'scissor',
      'enable',
      'disable',
      'blitFramebuffer',
      'readPixels',
      'clear',
    ].every((name) => first[name] === first[name]);
    const output = document.createElement('canvas');
    output.width = output.height = 100;
    const ctx = output.getContext('2d', { willReadFrequently: true });
    const pixel = (x, y) => [...ctx.getImageData(x, y, 1, 1).data];
    function paint(gl, color) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(...color);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    paint(first, [1, 0, 0, 1]);
    paint(second, [0, 1, 0, 1]);
    ctx.clearRect(0, 0, 100, 100);
    a.copy(ctx);
    const red = pixel(40, 30);
    ctx.clearRect(0, 0, 100, 100);
    b.copy(ctx);
    const green = pixel(40, 30);
    // Negative fit padding must be transparent, never another avatar's tile.
    ctx.clearRect(0, 0, 100, 100);
    a.copy(ctx, -10, -10, 100, 80, 0, 0, 100, 80);
    const padding = [pixel(2, 2), pixel(98, 40), pixel(40, 78)],
      inside = pixel(50, 40);
    // Native renders into multisampled FBOs and resolves at local coordinates.
    const samples = Math.min(4, first.getParameter(first.MAX_SAMPLES));
    const framebuffer = first.createFramebuffer(),
      renderbuffer = first.createRenderbuffer();
    first.bindFramebuffer(first.FRAMEBUFFER, framebuffer);
    first.bindRenderbuffer(first.RENDERBUFFER, renderbuffer);
    first.renderbufferStorageMultisample(
      first.RENDERBUFFER,
      samples,
      first.RGBA8,
      80,
      60,
    );
    first.framebufferRenderbuffer(
      first.FRAMEBUFFER,
      first.COLOR_ATTACHMENT0,
      first.RENDERBUFFER,
      renderbuffer,
    );
    first.clearColor(0, 0, 1, 1);
    first.clear(first.COLOR_BUFFER_BIT);
    first.bindFramebuffer(first.DRAW_FRAMEBUFFER, null);
    first.blitFramebuffer(
      0,
      0,
      80,
      60,
      0,
      0,
      80,
      60,
      first.COLOR_BUFFER_BIT,
      first.NEAREST,
    );
    ctx.clearRect(0, 0, 100, 100);
    a.copy(ctx);
    const resolved = pixel(40, 30);
    ctx.clearRect(0, 0, 100, 100);
    b.copy(ctx);
    const neighbour = pixel(40, 30);
    first.bindFramebuffer(first.FRAMEBUFFER, null);
    first.deleteFramebuffer(framebuffer);
    first.deleteRenderbuffer(renderbuffer);
    b.canvas.width = 100;
    b.canvas.height = 100;
    const liveDimensions = [
      second.drawingBufferWidth,
      second.drawingBufferHeight,
    ];
    paint(first, [1, 0, 0, 1]);
    paint(second, [0, 1, 0, 1]);
    first.getExtension('WEBGL_lose_context').loseContext();
    a.release();
    const retained = !second.isContextLost();
    paint(second, [0, 0, 1, 1]);
    ctx.clearRect(0, 0, 100, 100);
    b.copy(ctx);
    const afterDelete = pixel(50, 50);
    let overflowError;
    try {
      b.canvas.width = second.getParameter(second.MAX_RENDERBUFFER_SIZE) + 1;
    } catch (error) {
      overflowError = String(error);
    }
    ctx.clearRect(0, 0, 100, 100);
    b.copy(ctx);
    const afterOverflow = { width: b.canvas.width, pixel: pixel(50, 50) };
    const active = sharedSurfaceStats(),
      glError = second.getError();
    let boundaryError;
    try {
      b.render(() => {
        second.enable(0xffffffff);
        second.getError();
      });
    } catch (error) {
      boundaryError = String(error);
    }
    second.enable(0xffffffff);
    const outsideError = second.getError();
    const afterError = b.render(() => {
      paint(second, [0, 1, 0, 1]);
      return 'ok';
    });
    const deferredOrder = [];
    const completion = renderSharedBatchDeferred(
      () => {
        paint(second, [1, 0, 1, 1]);
      },
      () => {
        deferredOrder.push('publish');
        ctx.clearRect(0, 0, 100, 100);
        b.copy(ctx);
      },
    );
    const pendingDuringWait = sharedRenderPending();
    let blockedCopy = false,
      blockedResize = false;
    try {
      b.copy(ctx);
    } catch {
      blockedCopy = true;
    }
    try {
      b.canvas.width = 80;
    } catch {
      blockedResize = true;
    }
    const waiter = waitForSharedRender().then(() =>
      deferredOrder.push('waiter'),
    );
    await completion;
    await waiter;
    const deferredPixel = pixel(50, 50);
    let deferredError,
      failedPublished = false;
    try {
      await renderSharedBatchDeferred(
        () => second.enable(0xffffffff),
        () => {
          failedPublished = true;
        },
      );
    } catch (error) {
      deferredError = String(error);
    }
    const deferred = {
      order: deferredOrder,
      pendingDuringWait,
      blockedCopy,
      blockedResize,
      width: b.canvas.width,
      pixel: deferredPixel,
      error: deferredError,
      failedPublished,
      pendingAfter: sharedRenderPending(),
    };
    b.release();
    b.release();
    const getParameter = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function (name) {
      return name === this.MAX_RENDERBUFFER_SIZE
        ? 128
        : getParameter.call(this, name);
    };
    const small = acquireSharedSurface(document.body);
    paint(small.canvas.getContext('webgl2'), [1, 0, 0, 1]);
    let allocationError;
    try {
      acquireSharedSurface(document.body);
    } catch (error) {
      allocationError = String(error);
    }
    ctx.clearRect(0, 0, 100, 100);
    small.copy(ctx);
    const afterAllocationFailure = {
      surfaces: sharedSurfaceStats().surfaces,
      pixel: pixel(50, 50),
      nodes: document.querySelectorAll('canvas').length,
    };
    small.release();
    WebGL2RenderingContext.prototype.getParameter = getParameter;
    return {
      deferred,
      cachedMethods,
      liveDimensions,
      red,
      green,
      padding,
      inside,
      resolved,
      neighbour,
      retained,
      afterDelete,
      overflowError,
      afterOverflow,
      active,
      glError,
      boundaryError,
      outsideError,
      afterError,
      allocationError,
      afterAllocationFailure,
      final: sharedSurfaceStats(),
    };
  });
  assert.deepEqual(result.deferred.order, ['publish', 'waiter']);
  assert.equal(result.deferred.pendingDuringWait, true);
  assert.equal(result.deferred.blockedCopy, true);
  assert.equal(result.deferred.blockedResize, true);
  assert.equal(result.deferred.width, 100);
  assert.deepEqual(result.deferred.pixel, [255, 0, 255, 255]);
  assert.match(result.deferred.error, /0x500/);
  assert.equal(result.deferred.failedPublished, false);
  assert.equal(result.deferred.pendingAfter, false);
  assert.equal(result.cachedMethods, true);
  assert.deepEqual(result.liveDimensions, [100, 100]);
  assert.deepEqual(result.red, [255, 0, 0, 255]);
  assert.deepEqual(result.green, [0, 255, 0, 255]);
  assert.deepEqual(result.padding, [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  assert.deepEqual(result.inside, result.red);
  assert.deepEqual(result.resolved, [0, 0, 255, 255]);
  assert.deepEqual(result.neighbour, result.green);
  assert.equal(result.retained, true);
  assert.deepEqual(result.afterDelete, result.resolved);
  assert.match(result.overflowError, /exceeds device texture size/);
  assert.deepEqual(result.afterOverflow, {
    width: 100,
    pixel: result.afterDelete,
  });
  assert.equal(result.active.contexts, 1);
  assert.equal(result.active.surfaces, 1);
  assert.equal(result.glError, 0);
  assert.match(result.boundaryError, /Character WebGL render failed: 0x500/);
  assert.equal(result.outsideError, 0x500);
  assert.equal(result.afterError, 'ok');
  assert.match(result.allocationError, /atlas exceeds device texture size/);
  assert.deepEqual(result.afterAllocationFailure, {
    surfaces: 1,
    pixel: result.red,
    nodes: 2,
  });
  assert.equal(result.final.contexts, 0);
  assert.equal(result.final.surfaces, 0);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: independent atlas pixels, padded crop, MSAA resolve, resize and shared context lifetime.',
  );
} finally {
  await browser.close();
}
