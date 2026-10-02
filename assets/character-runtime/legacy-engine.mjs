import createModule from './orbit-characters.mjs';

const pool = new Map();
const pending = new Map();
const originalScope = Object.freeze({ points: undefined });
let modulePromise,
  originalFacade,
  currentScope,
  worker,
  idleTimer,
  characters = 0,
  sequence = 0;

const dispatchTimers = new Map();
const preparationQueue = [];
let activePreparation;

function pumpPreparationQueue() {
  if (pending.size || dispatchTimers.size) return;
  if (activePreparation && !activePreparation.released) return;
  activePreparation = undefined;
  const next = preparationQueue.shift();
  if (!next) return;
  next.signal?.removeEventListener('abort', next.abort);
  const lease = { released: false };
  activePreparation = lease;
  next.resolve(() => {
    if (lease.released) return;
    lease.released = true;
    pumpPreparationQueue();
  });
}

function scoped(scope, operation) {
  const previous = currentScope;
  const schedule = globalThis.setTimeout;
  const cancel = globalThis.clearTimeout;
  currentScope = scope;
  // Emscripten dispatches preparation asynchronously. Keep the owning scope
  // through its timer, but preserve the engine's timing and callback ordering.
  // The preparation lease prevents other characters from joining that global
  // native queue until this owner's preparation has settled.
  globalThis.setTimeout = function (callback, delay, ...args) {
    const nativeDispatcher =
      typeof callback === 'function' &&
      Number(delay) === 0 &&
      Function.prototype.toString
        .call(callback)
        .includes(
          'safeSetTimeout.mapping[id]=undefined;callUserCallback(func)',
        );
    let handle;
    handle = schedule.call(
      globalThis,
      typeof callback === 'function'
        ? (...values) => {
            if (nativeDispatcher) dispatchTimers.delete(handle);
            try {
              return scoped(scope, () => callback(...values));
            } finally {
              pumpPreparationQueue();
            }
          }
        : callback,
      delay,
      ...args,
    );
    if (nativeDispatcher) dispatchTimers.set(handle, scope);
    return handle;
  };
  globalThis.clearTimeout = function (handle) {
    dispatchTimers.delete(handle);
    return cancel.call(globalThis, handle);
  };
  try {
    return operation();
  } finally {
    globalThis.setTimeout = schedule;
    globalThis.clearTimeout = cancel;
    currentScope = previous;
    pumpPreparationQueue();
  }
}

/** Fair, cancelable setup lease for the native engine's global prepare queue.
 * Acquire before constructing or changing a Character's geometry. Release
 * after preparation/paint, or dispose/error. A released owner with a pending
 * native callback retains its turn until that callback has completed.
 */
export function acquireCharacterPreparation(signal) {
  return new Promise((resolve, reject) => {
    const abort = () => {
      const index = preparationQueue.indexOf(entry);
      if (index >= 0) preparationQueue.splice(index, 1);
      reject(new DOMException('Character preparation aborted', 'AbortError'));
      pumpPreparationQueue();
    };
    const entry = { resolve, reject, signal, abort };
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener('abort', abort, { once: true });
    preparationQueue.push(entry);
    pumpPreparationQueue();
  });
}

function stopIdleWorker() {
  clearTimeout(idleTimer);
  if (characters || pool.size || pending.size || dispatchTimers.size) return;
  idleTimer = setTimeout(() => {
    if (!characters && !pool.size && !pending.size && !dispatchTimers.size) {
      worker?.terminate();
      worker = undefined;
    }
  }, 0);
}

function preparationWorker() {
  clearTimeout(idleTimer);
  if (worker) return worker;
  worker = new Worker(new URL('./legacy-worker.mjs', import.meta.url), {
    type: 'module',
  });
  worker.onmessage = ({ data }) => {
    const entry = pending.get(data.id);
    if (!entry) return;
    pending.delete(data.id);
    entry.complete(data);
    pumpPreparationQueue();
    stopIdleWorker();
  };
  worker.onerror = () => {
    const failed = [...pending.values()];
    pending.clear();
    worker?.terminate();
    worker = undefined;
    for (const entry of failed)
      entry.complete({
        error: 'Character preparation failed',
        milliseconds: 0,
      });
    pumpPreparationQueue();
    stopIdleWorker();
  };
  return worker;
}

function sharedModule() {
  if (!modulePromise) {
    modulePromise = createModule({
      locateFile: (file) => new URL(file, import.meta.url).href,
    })
      .then((module) => {
        module.orbitPrepare = (
          id,
          appearance,
          quality,
          cacheKey,
          activities,
        ) => {
          const scope = currentScope;
          if (!scope) {
            module.orbitCompletePreparation(
              id,
              null,
              'Character preparation requires a scoped call',
              0,
            );
            return;
          }
          const request = ++sequence;
          const complete = (result) =>
            scoped(scope, () => {
              module.orbitCompletePreparation(
                id,
                result.bytes ?? null,
                result.error || '',
                result.milliseconds || 0,
              );
            });
          pending.set(request, { complete });
          try {
            preparationWorker().postMessage({
              id: request,
              appearance,
              quality,
              key: cacheKey,
              activities,
              points: scope.points,
            });
          } catch (error) {
            pending.delete(request);
            complete({ error: String(error), milliseconds: 0 });
            pumpPreparationQueue();
            stopIdleWorker();
          }
        };
        return module;
      })
      .catch((error) => {
        modulePromise = undefined;
        throw error;
      });
  }
  return modulePromise;
}

function facade(module, scope) {
  const result = Object.create(module);
  function wrap(target) {
    const methods = new Map();
    let deleted = false;
    characters++;
    return new Proxy(target, {
      get(instance, key) {
        const value = Reflect.get(instance, key, instance);
        if (typeof value !== 'function' || key === 'constructor') return value;
        if (!methods.has(key))
          methods.set(key, (...args) => {
            const returned = scoped(scope, () => value.apply(instance, args));
            if (key === 'delete' && !deleted) {
              deleted = true;
              characters--;
              stopIdleWorker();
            }
            // Embind handle clones retain the same native character and scope.
            if (returned !== instance && returned instanceof module.Character)
              return wrap(returned);
            return returned;
          });
        return methods.get(key);
      },
    });
  }
  result.Character = function Character(...args) {
    clearTimeout(idleTimer);
    return wrap(scoped(scope, () => new module.Character(...args)));
  };
  result.Character.prototype = module.Character.prototype;
  return result;
}

/** Original and custom bodies share one WASM instance and preparation worker.
 * Prepared mesh identities distinguish contours inside the shared GPU cache.
 */
export async function getCharacterEngine() {
  const module = await sharedModule();
  originalFacade ??= facade(module, originalScope);
  return originalFacade;
}

export async function acquireLegacyEngine(points) {
  clearTimeout(idleTimer);
  const key = JSON.stringify(points);
  let entry = pool.get(key);
  if (!entry) {
    const scope = { points: points.map((point) => point.slice()) };
    entry = {
      references: 0,
      facade: sharedModule().then((module) => facade(module, scope)),
    };
    pool.set(key, entry);
  }
  entry.references++;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    if (--entry.references === 0) pool.delete(key);
    stopIdleWorker();
  };
  try {
    return { module: await entry.facade, release };
  } catch (error) {
    release();
    throw error;
  }
}

export const legacyEngineStats = () => ({
  // Historical field counts leased contour entries; sharedModules is the
  // actual WASM count, including the instance used by original characters.
  modules: pool.size,
  sharedModules: modulePromise ? 1 : 0,
  characters,
  preparationWaiters: preparationQueue.length,
  preparationActive: !!activePreparation,
  dispatchTimers: dispatchTimers.size,
  pending: pending.size,
  worker: !!worker,
});
