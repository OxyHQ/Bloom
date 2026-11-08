import type { ResolvedAvatarCharacter } from './character';
type Listener = (now: number) => void;
const listeners = new Set<Listener>();
let request: number | undefined;
let dispatching = false;
const results = new Map<string, unknown>();
const identities = new WeakMap<object, number>();
let nextIdentity = 1;
export function vectorStateIdentity(value: object | undefined): number {
  if (!value) return 0;
  let id = identities.get(value);
  if (!id) {
    id = nextIdentity++;
    identities.set(value, id);
  }
  return id;
}
/** Geometry identity stays shared across per-instance paint wrappers. */
export function vectorFrameRecipeKey(
  geometry: object | undefined,
  recipe: string,
  paint: ResolvedAvatarCharacter['paint'],
): string {
  return JSON.stringify([vectorStateIdentity(geometry), recipe, paint]);
}
/** One animation-frame request; every subscriber retains its own clock and interaction state. */
export function subscribeVectorFrame(listener: Listener): () => void {
  listeners.add(listener);
  const tick = (now: number) => {
    request = undefined;
    results.clear();
    dispatching = true;
    const errors: unknown[] = [];
    try {
      for (const subscriber of Array.from(listeners)) {
        if (!listeners.has(subscriber)) continue;
        try {
          subscriber(now);
        } catch (error) {
          listeners.delete(subscriber);
          errors.push(error);
        }
      }
    } finally {
      dispatching = false;
      results.clear();
      if (listeners.size) request = requestAnimationFrame(tick);
    }
    // A failed instance stops itself, without freezing unrelated visible agents.
    for (const error of errors) {
      if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
      else
        setTimeout(() => {
          throw error;
        }, 0);
    }
  };
  if (request === undefined && !dispatching) request = requestAnimationFrame(tick);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && request !== undefined) {
      cancelAnimationFrame(request);
      request = undefined;
      results.clear();
    }
  };
}
/** Exact same recipe/pose can share projection within this tick, never across evolving frames. */
export function shareVectorFrame<T>(key: string, compute: () => T): T {
  if (!dispatching) return compute();
  if (results.has(key)) return results.get(key) as T;
  const result = compute();
  results.set(key, result);
  return result;
}
