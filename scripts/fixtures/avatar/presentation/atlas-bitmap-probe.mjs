/** TEST-ONLY injection into an already loaded avatar page. It retains the actual
 * pool, engine, canvases, dimensions and colors. This is not production routing:
 * first-ready callbacks are still owned by the synchronous pool, so this probe
 * measures steady presentation only, after every visible avatar is ready. */
export function installAtlasBitmapProbe({
  premultiplyAlpha = 'default',
  repremultiply = false,
} = {}) {
  globalThis.__avatarPresentationProbe?.dispose();
  const prototype = CanvasRenderingContext2D.prototype;
  const originalDraw = prototype.drawImage;
  const originalClear = prototype.clearRect;
  const contexts = new WeakSet();
  const clears = new WeakMap();
  const revisions = new WeakMap();
  const batches = new Map();
  const pending = new Set();
  let mode = 'direct',
    disposed = false,
    epoch = 0;
  let metrics;
  const reset = () =>
    (metrics = {
      frames: 0,
      completed: 0,
      staleDestinations: 0,
      fallbackFrames: 0,
      bitmapCallMs: 0,
      bitmapLatencyMs: 0,
      firstCopyMs: 0,
      remainingCopyMs: 0,
      maximumPending: 0,
      destinations: 0,
      errors: [],
    });
  reset();
  const copy = (context, source, args, clear) => {
    if (clear) originalClear.apply(context, clear);
    originalDraw.call(context, source, ...args);
  };
  prototype.clearRect = function (...args) {
    if (!disposed && contexts.has(this)) {
      clears.set(this, args);
      return;
    }
    return originalClear.apply(this, args);
  };
  prototype.drawImage = function (source, ...args) {
    if (disposed || source?.dataset?.avatarRenderer !== 'shared-editor-scene')
      return originalDraw.call(this, source, ...args);
    contexts.add(this);
    const revision = (revisions.get(this) ?? 0) + 1;
    revisions.set(this, revision);
    const clear = clears.get(this);
    clears.delete(this);
    let batch = batches.get(source);
    if (!batch) {
      batch = { epoch, records: [], first: true, bitmap: mode === 'bitmap' && pending.size < 2 };
      batches.set(source, batch);
      queueMicrotask(() => {
        if (batches.get(source) === batch) batches.delete(source);
      });
      metrics.frames++;
      if (mode === 'bitmap' && !batch.bitmap) metrics.fallbackFrames++;
      if (batch.bitmap) {
        const started = performance.now();
        let task;
        // The promise does NOT guarantee non-blocking capture: call time is
        // deliberately recorded separately from asynchronous completion latency.
        const capture = createImageBitmap(source, { premultiplyAlpha });
        metrics.bitmapCallMs += performance.now() - started;
        task = capture
          .then(async (bitmap) => {
            if (!repremultiply || disposed || batch.epoch !== epoch) return bitmap;
            try {
              const start = performance.now();
              const next = createImageBitmap(bitmap, { premultiplyAlpha: 'premultiply' });
              metrics.bitmapCallMs += performance.now() - start;
              return await next;
            } finally {
              bitmap.close();
            }
          })
          .then((bitmap) => {
            try {
              metrics.bitmapLatencyMs += performance.now() - started;
              if (disposed || batch.epoch !== epoch) return;
              let first = true;
              for (const record of batch.records) {
                if (revisions.get(record.context) !== record.revision) {
                  metrics.staleDestinations++;
                  continue;
                }
                const start = performance.now();
                copy(record.context, bitmap, record.args, record.clear);
                const elapsed = performance.now() - start;
                if (first) metrics.firstCopyMs += elapsed;
                else metrics.remainingCopyMs += elapsed;
                first = false;
                metrics.destinations++;
              }
              metrics.completed++;
            } finally {
              bitmap.close();
            }
          })
          .catch((error) => {
            metrics.errors.push(String(error));
          })
          .finally(() => pending.delete(task));
        pending.add(task);
        metrics.maximumPending = Math.max(metrics.maximumPending, pending.size);
      }
    }
    if (batch.bitmap) batch.records.push({ context: this, args, clear, revision });
    else {
      const start = performance.now();
      copy(this, source, args, clear);
      const elapsed = performance.now() - start;
      if (batch.first) {
        metrics.firstCopyMs += elapsed;
        metrics.completed++;
      } else metrics.remainingCopyMs += elapsed;
      batch.first = false;
      metrics.destinations++;
    }
  };
  const probe = {
    async setMode(next) {
      if (next !== 'direct' && next !== 'bitmap') throw Error('Unknown experimental presenter');
      await Promise.all(pending);
      epoch++;
      mode = next;
      reset();
    },
    reset,
    read: () => ({ mode, premultiplyAlpha, repremultiply, ...metrics, pending: pending.size }),
    drain: () => Promise.all(pending),
    dispose() {
      disposed = true;
      epoch++;
      prototype.drawImage = originalDraw;
      prototype.clearRect = originalClear;
      batches.clear();
    },
  };
  globalThis.__avatarPresentationProbe = probe;
  return probe.read();
}
