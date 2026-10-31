/** TEST ONLY, before fresh avatar creation. Persistent OffscreenCanvas2D backing
 * with its original HTML placeholder; same dimensions/filter/identity. No worker.
 * Browser placeholder presentation is asynchronous: this is a throughput probe,
 * not a claim that the production synchronous onReady/snapshot contract holds. */
export function installOffscreenDestinationProbe() {
  globalThis.__avatarOffscreenDestinationProbe?.dispose();
  const original = HTMLCanvasElement.prototype.getContext,
    contexts = new WeakMap(),
    surfaces = new Set();
  let metrics = { draws: 0, frames: 0, drawMs: 0, clearMs: 0, errors: [], fallbacks: 0 },
    supported = false;
  const sources = new WeakSet();
  try {
    supported = !!document.createElement('canvas').transferControlToOffscreen().getContext('2d');
  } catch {}
  HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
    if (kind !== '2d' || !globalThis.canvases?.includes(this))
      return original.call(this, kind, ...args);
    if (contexts.has(this)) return contexts.get(this);
    if (!supported) {
      metrics.fallbacks++;
      return original.call(this, kind, ...args);
    }
    const canvas = this,
      offscreen = canvas.transferControlToOffscreen(),
      context = offscreen.getContext('2d');
    if (!context) throw Error('Transferred destination has no 2D context');
    surfaces.add(offscreen);
    for (const dimension of ['width', 'height'])
      Object.defineProperty(canvas, dimension, {
        configurable: true,
        get: () => offscreen[dimension],
        set: (value) => {
          offscreen[dimension] = value;
        },
      });
    const facade = {
      canvas,
      clearRect(...values) {
        const start = performance.now();
        context.clearRect(...values);
        metrics.clearMs += performance.now() - start;
      },
      drawImage(source, ...values) {
        try {
          if (!sources.has(source)) {
            sources.add(source);
            metrics.frames++;
            queueMicrotask(() => sources.delete(source));
          }
          const start = performance.now();
          context.drawImage(source, ...values);
          metrics.drawMs += performance.now() - start;
          metrics.draws++;
        } catch (error) {
          metrics.errors.push(String(error));
          throw error;
        }
      },
    };
    contexts.set(canvas, facade);
    return facade;
  };
  globalThis.__avatarOffscreenDestinationProbe = {
    read: () => ({ supported, ...metrics, destinations: surfaces.size }),
    reset() {
      metrics = { draws: 0, frames: 0, drawMs: 0, clearMs: 0, errors: [], fallbacks: 0 };
    },
    dispose() {
      HTMLCanvasElement.prototype.getContext = original;
      for (const surface of surfaces) {
        surface.width = 0;
        surface.height = 0;
      }
      surfaces.clear();
    },
  };
  return globalThis.__avatarOffscreenDestinationProbe.read();
}
