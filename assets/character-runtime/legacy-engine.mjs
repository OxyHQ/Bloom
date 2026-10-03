import { NATIVE_PARTS, ORIGINAL_PRESETS } from './character-recipe.mjs';
import createModule from './orbit-characters.mjs';
import { createControllerModeAdapter } from './controller-mode.mjs';
import {
  createPreparationCache,
  preparationKey,
} from './preparation-cache.mjs';
import { waitForSharedRender } from './shared-surface.mjs';

let controller;
const pool = new Map();
const authoredFacades = new Map();
const pending = new Map();
const prepared = createPreparationCache();
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

async function finishRequest(id, result, reused = false) {
  const entry = pending.get(id);
  if (!entry || entry.delivering) return;
  entry.delivering = true;
  try {
    await entry.complete(result, reused);
  } finally {
    // Keep the owner's turn while the GPU boundary and native completion are
    // still waiting, even if that owner has already been canceled or deleted.
    pending.delete(id);
    pumpPreparationQueue();
    stopIdleWorker();
  }
}

function preparationWorker() {
  clearTimeout(idleTimer);
  if (worker) return worker;
  worker = new Worker(new URL('./legacy-worker.mjs', import.meta.url), {
    type: 'module',
  });
  worker.onmessage = ({ data }) => {
    void finishRequest(data.id, data);
  };
  worker.onerror = () => {
    const failed = [...pending.keys()];
    worker?.terminate();
    worker = undefined;
    for (const id of failed)
      void finishRequest(id, {
        error: 'Character preparation failed',
        milliseconds: 0,
      });
  };
  return worker;
}

function sharedModule() {
  if (!modulePromise) {
    controller = createControllerModeAdapter(
      () => new URL('./orbit-characters.wasm', import.meta.url),
    );
    modulePromise = Promise.race([
      createModule({
        locateFile: (file) => new URL(file, import.meta.url).href,
        instantiateWasm: controller.instantiateWasm,
      }),
      controller.failure,
    ])
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
          const cacheKeyExact = preparationKey({
            appearance,
            quality,
            key: cacheKey,
            activities,
            points: scope.points,
            authoredParts: scope.authoredParts,
            eyeSpacing: scope.authoredParts?.eyeSpacing,
          });
          const complete = async (result, reused = false) => {
            await waitForSharedRender();
            return scoped(scope, () => {
              if (result.bytes && !result.error && !reused)
                prepared.set(cacheKeyExact, result.bytes);
              module.orbitCompletePreparation(
                id,
                result.bytes ?? null,
                result.error || '',
                result.milliseconds || 0,
              );
            });
          };
          pending.set(request, { complete });
          const cached = prepared.get(cacheKeyExact);
          if (cached) {
            // Preserve asynchronous completion and the owner's preparation
            // turn. Completing inside orbitPrepare would re-enter native
            // dispatch while its job is still being registered.
            queueMicrotask(() => {
              void finishRequest(
                request,
                { bytes: cached, milliseconds: 0 },
                true,
              );
            });
            return;
          }
          try {
            preparationWorker().postMessage({
              id: request,
              appearance,
              quality,
              key: cacheKey,
              activities,
              points: scope.points,
              authoredParts: scope.authoredParts,
              eyeSpacing: scope.authoredParts?.eyeSpacing,
            });
          } catch (error) {
            void finishRequest(request, {
              error: String(error),
              milliseconds: 0,
            });
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
  const handles = new WeakMap();
  function wrap(target, activities = false, source) {
    controller.register(target, activities, source);
    const methods = new Map();
    let deleted = false;
    characters++;
    const proxy = new Proxy(target, {
      get(instance, key) {
        const value = Reflect.get(instance, key, instance);
        if (typeof value !== 'function' || key === 'constructor') return value;
        if (!methods.has(key))
          methods.set(key, (...args) => {
            const returned = scoped(scope, () => value.apply(instance, args));
            if (key === 'applyActivity' && returned === 0 && activities)
              controller.markBound(instance);
            if (key === 'delete' && !deleted) {
              controller.unregister(instance);
              deleted = true;
              characters--;
              stopIdleWorker();
            }
            // Embind handle clones retain the same native character and scope.
            if (returned !== instance && returned instanceof module.Character)
              return wrap(returned, activities, instance);
            return returned;
          });
        return methods.get(key);
      },
    });
    handles.set(proxy, target);
    return proxy;
  }
  result.controllerMode = (character, enabled) => {
    const instance = handles.get(character);
    if (!instance)
      throw new Error(
        'Character controller belongs to a different engine scope',
      );
    return scoped(scope, () => controller.controllerMode(instance, enabled));
  };
  result.controllerState = (character) => {
    const instance = handles.get(character);
    if (!instance)
      throw new Error(
        'Character controller belongs to a different engine scope',
      );
    return scoped(scope, () => controller.controllerState(instance));
  };
  result.controllerSignature = (character, preset) => {
    const instance = handles.get(character);
    if (!instance)
      throw new Error(
        'Character controller belongs to a different engine scope',
      );
    return scoped(scope, () =>
      controller.controllerSignature(instance, preset),
    );
  };
  result.controllerWithSignature = (character, preset, operation) => {
    const instance = handles.get(character);
    if (!instance)
      throw new Error(
        'Character controller belongs to a different engine scope',
      );
    return scoped(scope, () =>
      controller.controllerWithSignature(instance, preset, operation),
    );
  };
  result.Character = function Character(...args) {
    clearTimeout(idleTimer);
    return wrap(
      scoped(scope, () => new module.Character(...args)),
      args[3]?.activities,
    );
  };
  result.Character.prototype = module.Character.prototype;
  return result;
}

/** Original and custom bodies share one WASM instance and preparation worker.
 * Prepared mesh identities distinguish contours inside the shared GPU cache.
 */
function normalizeAuthoredParts(value) {
  if (!value || !Object.keys(value).length) return undefined;
  const keys = [
    'bodyPreset',
    'paintBody',
    'shape',
    'eyes',
    'eyewear',
    'accessory',
    'eyeSpacing',
  ];
  if (
    Object.keys(value).some((key) => !keys.includes(key)) ||
    (value.bodyPreset !== undefined &&
      !ORIGINAL_PRESETS.includes(value.bodyPreset)) ||
    (value.paintBody !== undefined && typeof value.paintBody !== 'boolean') ||
    (value.shape !== undefined && value.shape !== 'clippo') ||
    (value.eyes !== undefined &&
      ![...NATIVE_PARTS.eyes, 'todd', 'clippo', 'cyclops'].includes(
        value.eyes,
      )) ||
    (value.eyewear !== undefined &&
      !NATIVE_PARTS.eyewear.includes(value.eyewear)) ||
    (value.accessory !== undefined &&
      ![...NATIVE_PARTS.accessory, 'felipe_beret'].includes(value.accessory)) ||
    (value.eyeSpacing !== undefined &&
      (!Number.isFinite(value.eyeSpacing) ||
        value.eyeSpacing < 0.5 ||
        value.eyeSpacing > 1.5))
  )
    throw new Error('Unsupported authored character part');
  return Object.freeze(
    Object.fromEntries(
      keys
        .filter(
          (key) =>
            value[key] !== undefined &&
            !(key === 'eyeSpacing' && value[key] === 1),
        )
        .map((key) => [key, value[key]]),
    ),
  );
}
export async function getCharacterEngine(parts) {
  const authoredParts = normalizeAuthoredParts(parts);
  const module = await sharedModule();
  if (!authoredParts) {
    originalFacade ??= facade(module, originalScope);
    return originalFacade;
  }
  // Retain a bounded set of recipe facades; live Characters own their scopes.
  const key = JSON.stringify(authoredParts);
  if (!authoredFacades.has(key))
    authoredFacades.set(
      key,
      facade(module, { points: undefined, authoredParts }),
    );
  const result = authoredFacades.get(key);
  authoredFacades.delete(key);
  authoredFacades.set(key, result);
  if (authoredFacades.size > 64)
    authoredFacades.delete(authoredFacades.keys().next().value);
  return result;
}

export async function acquireLegacyEngine(points, parts) {
  clearTimeout(idleTimer);
  const authoredParts = normalizeAuthoredParts(parts);
  const key = JSON.stringify([points, authoredParts]);
  let entry = pool.get(key);
  if (!entry) {
    const scope = {
      points: points.map((point) => point.slice()),
      authoredParts,
    };
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
  preparationCache: prepared.stats(),
});
