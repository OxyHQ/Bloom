import createModule from './orbit-characters.mjs';

const pool = new Map();
const pending = new Map();
let worker,
  idleTimer,
  sequence = 0;
function preparationWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./legacy-worker.mjs', import.meta.url), {
    type: 'module',
  });
  worker.onmessage = ({ data }) => {
    const entry = pending.get(data.id);
    if (!entry) return;
    pending.delete(data.id);
    entry.complete(data);
  };
  worker.onerror = () => {
    const failed = [...pending.values()];
    pending.clear();
    worker?.terminate();
    worker = undefined;
    for (const entry of failed)
      entry.complete({
        error: 'Legacy character preparation failed',
        milliseconds: 0,
      });
  };
  return worker;
}

/** Separate geometry caches for different contours; one shared preparation worker.
 * Unused rendering modules are released, never retained in an unbounded catalog.
 */
export async function acquireLegacyEngine(points) {
  clearTimeout(idleTimer);
  const key = JSON.stringify(points);
  let entry = pool.get(key);
  if (!entry) {
    entry = { references: 0, module: null };
    entry.module = createModule({
      locateFile: (file) => new URL(file, import.meta.url).href,
    }).then((module) => {
      module.orbitPrepare = (id, appearance, quality, cacheKey, activities) => {
        const request = ++sequence;
        pending.set(request, {
          owner: entry,
          complete: (result) => {
            module.orbitCompletePreparation(
              id,
              result.bytes ?? null,
              result.error || '',
              result.milliseconds || 0,
            );
          },
        });
        try {
          preparationWorker().postMessage({
            id: request,
            appearance,
            quality,
            key: cacheKey,
            activities,
            points,
          });
        } catch (error) {
          pending.delete(request);
          module.orbitCompletePreparation(id, null, String(error), 0);
        }
      };
      return module;
    });
    pool.set(key, entry);
  }
  entry.references++;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    if (--entry.references !== 0) return;
    pool.delete(key);
    for (const [id, request] of pending)
      if (request.owner === entry) pending.delete(id);
    if (!pool.size)
      idleTimer = setTimeout(() => {
        if (!pool.size) {
          worker?.terminate();
          worker = undefined;
        }
      }, 0);
  };
  try {
    return { module: await entry.module, release };
  } catch (error) {
    release();
    throw error;
  }
}

export const legacyEngineStats = () => ({
  modules: pool.size,
  pending: pending.size,
  worker: !!worker,
});
