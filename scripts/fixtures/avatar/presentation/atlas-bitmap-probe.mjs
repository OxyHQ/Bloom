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
    epoch = 0,
    nextAudit,
    auditPending = false;
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
  const finishAudit = async (batch, cells) => {
    const results = [];
    const compare = (a, b) => {
      let changed = 0,
        maxChannel = 0,
        absolute = 0;
      for (let i = 0; i < a.length; i += 4) {
        let difference = 0;
        for (let c = 0; c < 4; c++) {
          const value = Math.abs(a[i + c] - b[i + c]);
          difference = Math.max(difference, value);
          maxChannel = Math.max(maxChannel, value);
          absolute += value;
        }
        if (difference) changed++;
      }
      return { pixels: a.length / 4, changed, maxChannel, absolute };
    };
    for (const cell of cells) {
      const image = new Image();
      image.src = cell.png;
      await image.decode();
      const decoded = document.createElement('canvas');
      decoded.width = image.width;
      decoded.height = image.height;
      const context = decoded.getContext('2d');
      originalDraw.call(context, image, 0, 0);
      const pixels = context.getImageData(0, 0, decoded.width, decoded.height).data;
      results.push({
        width: cell.width,
        height: cell.height,
        rgba: compare(cell.expected, cell.actual),
        png: compare(cell.expected, pixels),
        ...(batch.audit.images && results.length === 0
          ? { referencePNG: cell.referencePNG, actualPNG: cell.png }
          : {}),
      });
    }
    batch.audit.resolve({ premultiplyAlpha, repremultiply, cells: results });
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
      if (batch.bitmap && nextAudit) {
        batch.audit = nextAudit;
        nextAudit = undefined;
      }
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
              if (disposed || batch.epoch !== epoch) {
                batch.audit?.reject(Error('Capture superseded'));
                return;
              }
              let first = true;
              const auditCells = [];
              for (const record of batch.records) {
                if (revisions.get(record.context) !== record.revision) {
                  metrics.staleDestinations++;
                  batch.audit?.reject(Error('Capture destination superseded'));
                  continue;
                }
                const start = performance.now();
                copy(record.context, bitmap, record.args, record.clear);
                const elapsed = performance.now() - start;
                if (first) metrics.firstCopyMs += elapsed;
                else metrics.remainingCopyMs += elapsed;
                first = false;
                metrics.destinations++;
                if (batch.audit) {
                  const canvas = record.context.canvas;
                  const expected = record.reference
                    .getContext('2d')
                    .getImageData(0, 0, canvas.width, canvas.height).data;
                  const actual = record.context.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                  ).data;
                  auditCells.push({
                    width: canvas.width,
                    height: canvas.height,
                    expected,
                    actual,
                    png: canvas.toDataURL('image/png'),
                    referencePNG: batch.audit.images
                      ? record.reference.toDataURL('image/png')
                      : undefined,
                  });
                }
              }
              metrics.completed++;
              if (batch.audit) return finishAudit(batch, auditCells);
            } finally {
              bitmap.close();
            }
          })
          .catch((error) => {
            metrics.errors.push(String(error));
            batch.audit?.reject(error);
          })
          .finally(() => pending.delete(task));
        pending.add(task);
        metrics.maximumPending = Math.max(metrics.maximumPending, pending.size);
      }
    }
    if (batch.bitmap) {
      let reference;
      if (batch.audit) {
        reference = document.createElement('canvas');
        reference.width = this.canvas.width;
        reference.height = this.canvas.height;
        originalDraw.call(reference.getContext('2d'), source, ...args);
      }
      batch.records.push({ context: this, args, clear, revision, reference });
    } else {
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
      nextAudit?.reject(Error('Capture mode changed'));
      nextAudit = undefined;
      epoch++;
      mode = next;
      reset();
    },
    reset,
    async captureNextFrame({ images = false } = {}) {
      if (auditPending) throw Error('A capture is already pending');
      if (mode !== 'bitmap' || disposed) throw Error('Capture requires an active bitmap probe');
      auditPending = true;
      await Promise.all(pending);
      if (mode !== 'bitmap' || disposed) {
        auditPending = false;
        throw Error('Capture superseded before scheduling');
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          nextAudit = undefined;
          auditPending = false;
          reject(Error('Capture timed out'));
        }, 20000);
        nextAudit = {
          images,
          resolve: (value) => {
            clearTimeout(timer);
            auditPending = false;
            resolve(value);
          },
          reject: (error) => {
            clearTimeout(timer);
            auditPending = false;
            reject(error);
          },
        };
      });
    },
    read: () => ({ mode, premultiplyAlpha, repremultiply, ...metrics, pending: pending.size }),
    drain: () => Promise.all(pending),
    dispose() {
      disposed = true;
      nextAudit?.reject(Error('Probe disposed'));
      nextAudit = undefined;
      epoch++;
      prototype.drawImage = originalDraw;
      prototype.clearRect = originalClear;
      batches.clear();
    },
  };
  globalThis.__avatarPresentationProbe = probe;
  return probe.read();
}
