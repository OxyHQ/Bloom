import { currentStore, withStore } from './root';

/**
 * A change the server owns, shown at once.
 *
 * `optimistic` runs first, synchronously. Every entity write it makes
 * (`merge`, `patch`, `update`) becomes this call's layer: a patch of concrete
 * values held over the server's copy, not written into it. While the layer
 * stands, server writes to the same fields (a feed refresh, a realtime echo)
 * update the copy beneath it without moving what the reader sees, which is
 * what an echo guard used to do by hand. Then `run` calls the server:
 *
 * - it resolves: the layer goes and `settle` writes the server's answer, in
 *   one notification, so the reader sees no flicker between the two;
 * - it rejects: the layer goes (that is the rollback: the copy beneath it is
 *   current, including anything realtime brought meanwhile) and the call
 *   rejects with the error.
 *
 * The store is the one in scope when the action was called. If its account is
 * left before the answer, nothing is applied: the store is closed.
 *
 * A `key` makes the action exclusive: while a call with the same key is in
 * flight, another resolves to `undefined` at once without running.
 */
export interface ActionOptions<A extends unknown[], R> {
  key?: (...args: A) => string;
  optimistic?: (...args: A) => void;
  run: (...args: A) => Promise<R>;
  settle?: (result: R, ...args: A) => void;
}

export type Action<A extends unknown[], R> = (...args: A) => Promise<R | undefined>;

export function action<A extends unknown[], R>(options: ActionOptions<A, R>): Action<A, R> {
  const inFlight = new WeakMap<object, Set<string>>();
  return async (...args) => {
    const store = currentStore();
    const key = options.key?.(...args);
    let keys = inFlight.get(store);
    if (key !== undefined) {
      if (keys?.has(key)) return undefined;
      if (!keys) {
        keys = new Set();
        inFlight.set(store, keys);
      }
      keys.add(key);
    }
    const optimistic = options.optimistic;
    const layer = optimistic
      ? withStore(store, () => store.layer(() => optimistic(...args)))
      : null;
    try {
      const result = await withStore(store, () => options.run(...args));
      store.batch(() => {
        if (layer) store.dropLayer(layer);
        if (!store.closed) withStore(store, () => options.settle?.(result, ...args));
      });
      return result;
    } catch (error) {
      if (layer) store.dropLayer(layer);
      throw error;
    } finally {
      if (key !== undefined) keys?.delete(key);
    }
  };
}
