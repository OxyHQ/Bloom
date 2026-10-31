/** TEST ONLY. Install BEFORE creating fresh avatars. Target canvas identity,
 * dimensions, pointer bindings and snapshot API remain unchanged. One exact-size
 * OffscreenCanvas2D scratch is reused; each synchronous transfer consumes its
 * bitmap and leaves a blank scratch. No promises, queues, frame drops or reads. */
export function installBitmapRendererProbe({ mode = 'bitmap' } = {}) {
  globalThis.__avatarBitmapRendererProbe?.dispose();
  const original = HTMLCanvasElement.prototype.getContext;
  const contexts = new WeakMap();
  let scratch,
    scratchContext,
    supported = false;
  let metrics = {
    draws: 0,
    transfers: 0,
    frames: 0,
    drawMs: 0,
    transferMs: 0,
    errors: [],
    fallbacks: 0,
  };
  const sources = new WeakSet();
  try {
    const probe = new OffscreenCanvas(2, 2);
    const context = probe.getContext('2d');
    const target = document.createElement('canvas');
    const output = original.call(target, 'bitmaprenderer');
    if (!context || !output) throw Error('Missing presentation capability');
    context.fillRect(0, 0, 1, 1);
    output.transferFromImageBitmap(probe.transferToImageBitmap());
    supported = true;
  } catch {
    supported = false;
  }
  HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
    if (kind !== '2d' || !globalThis.canvases?.includes(this))
      return original.call(this, kind, ...args);
    const cached = contexts.get(this);
    if (cached) return cached;
    if (mode !== 'bitmap' || !supported) {
      if (mode === 'bitmap') metrics.fallbacks++;
      return original.call(this, kind, ...args);
    }
    const output = original.call(this, 'bitmaprenderer');
    if (!output) {
      metrics.fallbacks++;
      return original.call(this, kind, ...args);
    }
    const canvas = this;
    const facade = {
      canvas,
      clearRect(x, y, w, h) {
        if (x !== 0 || y !== 0 || w !== canvas.width || h !== canvas.height)
          throw Error('Probe requires full-canvas clear');
        // transferToImageBitmap replaced the prior scratch bitmap with blank.
      },
      drawImage(source, ...drawArgs) {
        if (
          drawArgs.length !== 8 ||
          drawArgs[4] !== 0 ||
          drawArgs[5] !== 0 ||
          drawArgs[6] !== canvas.width ||
          drawArgs[7] !== canvas.height
        )
          throw Error('Probe requires full-canvas draw');
        let bitmap;
        try {
          if (!scratch) {
            scratch = new OffscreenCanvas(canvas.width, canvas.height);
            scratchContext = scratch.getContext('2d');
          }
          if (scratch.width !== canvas.width) scratch.width = canvas.width;
          if (scratch.height !== canvas.height) scratch.height = canvas.height;
          if (!sources.has(source)) {
            sources.add(source);
            metrics.frames++;
            queueMicrotask(() => sources.delete(source));
          }
          const start = performance.now();
          scratchContext.drawImage(source, ...drawArgs);
          metrics.drawMs += performance.now() - start;
          const transfer = performance.now();
          bitmap = scratch.transferToImageBitmap();
          output.transferFromImageBitmap(bitmap);
          bitmap = null;
          metrics.transferMs += performance.now() - transfer;
          metrics.draws++;
          metrics.transfers++;
        } catch (error) {
          bitmap?.close();
          metrics.errors.push(String(error));
          throw error;
        }
      },
    };
    contexts.set(this, facade);
    return facade;
  };
  const probe = {
    read: () => ({
      mode,
      supported,
      ...metrics,
      pending: 0,
      scratch: scratch ? [scratch.width, scratch.height] : null,
    }),
    reset() {
      metrics = {
        draws: 0,
        transfers: 0,
        frames: 0,
        drawMs: 0,
        transferMs: 0,
        errors: [],
        fallbacks: 0,
      };
    },
    dispose() {
      HTMLCanvasElement.prototype.getContext = original;
      scratch = null;
      scratchContext = null;
    },
  };
  globalThis.__avatarBitmapRendererProbe = probe;
  return probe.read();
}
