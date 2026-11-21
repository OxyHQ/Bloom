import { environment, waitUntil } from './environment';
import { currentStore, withStore } from './root';
import type { Listener, Store } from './store';

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
 * - it resolves: the layer is written into the server copy (the server
 *   accepted it) and `settle` writes the server's own answer over it, in one
 *   notification, so the reader sees no flicker between the two;
 * - it rejects: the layer goes (that is the rollback: the copy beneath it is
 *   current, including anything realtime brought meanwhile) and the call
 *   rejects with the error.
 *
 * Offline, the optimistic change shows at once and `run` waits for the
 * network (the call counts as `paused` in `actionStatus`); if the store
 * closes meanwhile, the call rejects with `StoreClosedError`.
 *
 * The store is the one in scope when the action was called. If its account is
 * left before the answer, nothing is applied: the store is closed.
 *
 * A `key` makes the action exclusive: while a call with the same key is in
 * flight (of this action or any other), another resolves to `undefined` at
 * once without running. A like and its undo share a key, say.
 */
export interface ActionOptions<A extends unknown[], R> {
  key?: (...args: A) => string;
  optimistic?: (...args: A) => void;
  run: (...args: A) => Promise<R>;
  settle?: (result: R, ...args: A) => void;
}

export type Action<A extends unknown[], R> = (...args: A) => Promise<R | undefined>;

/**
 * Keys of the actions in flight, per store. One space for every action, so a
 * like and its undo can share a key and exclude each other.
 */
const inFlight = new WeakMap<object, Set<string>>();

/** What a store's actions are doing: for a "Syncing" indicator. */
export interface ActionStatus {
  /** Calls running now. */
  readonly pending: number;
  /** Calls waiting for the network (offline); they run when it is back. */
  readonly paused: number;
}

const IDLE_STATUS: ActionStatus = Object.freeze({ pending: 0, paused: 0 });

class StatusHolder {
  status: ActionStatus = IDLE_STATUS;
  readonly listeners = new Set<Listener>();
  change(pending: number, paused: number): void {
    this.status = {
      pending: this.status.pending + pending,
      paused: this.status.paused + paused,
    };
    for (const listener of [...this.listeners]) listener();
  }
}

const statuses = new WeakMap<Store, StatusHolder>();

function holderOf(store: Store): StatusHolder {
  let holder = statuses.get(store);
  if (!holder) {
    holder = new StatusHolder();
    statuses.set(store, holder);
  }
  return holder;
}

/** The store's action status now. */
export function actionStatus(store: Store): ActionStatus {
  return statuses.get(store)?.status ?? IDLE_STATUS;
}

/** Calls `listener` whenever the store's action status changes. */
export function listenActionStatus(store: Store, listener: Listener): () => void {
  const holder = holderOf(store);
  holder.listeners.add(listener);
  return () => {
    holder.listeners.delete(listener);
  };
}

/** Thrown into a call that was waiting for the network when its store closed. */
export class StoreClosedError extends Error {
  constructor() {
    super('bloom-data: the store closed before the action ran');
    this.name = 'StoreClosedError';
  }
}

/** Waits for the network, counted as paused; rejects if the store closes first. */
async function whenOnline(store: Store, holder: StatusHolder): Promise<void> {
  const controller = new AbortController();
  const abort = () => controller.abort(new StoreClosedError());
  store.cleanups.add(abort);
  holder.change(-1, 1);
  try {
    await waitUntil(() => environment.online, controller.signal);
  } finally {
    store.cleanups.delete(abort);
    holder.change(1, -1);
  }
}

export function action<A extends unknown[], R>(options: ActionOptions<A, R>): Action<A, R> {
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
    const holder = holderOf(store);
    holder.change(1, 0);
    const optimistic = options.optimistic;
    const layer = optimistic
      ? withStore(store, () => store.layer(() => optimistic(...args)))
      : null;
    try {
      // Online, `run` starts in this same tick, as it always did.
      if (!environment.online) await whenOnline(store, holder);
      const result = await withStore(store, () => options.run(...args));
      store.batch(() => {
        if (layer) store.commitLayer(layer);
        if (!store.closed) withStore(store, () => options.settle?.(result, ...args));
      });
      return result;
    } catch (error) {
      if (layer) store.dropLayer(layer);
      throw error;
    } finally {
      holder.change(-1, 0);
      if (key !== undefined) keys?.delete(key);
    }
  };
}
