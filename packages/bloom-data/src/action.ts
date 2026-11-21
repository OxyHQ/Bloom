import { entity } from './entity';
import { environment, waitUntil } from './environment';
import { currentStore, withStore } from './root';
import {
  type Layer,
  type Listener,
  onStoreOpen,
  reportError,
  type Store,
  type StoredLayer,
} from './store';

/**
 * A change the server owns, shown at once.
 *
 * `optimistic` runs first, synchronously. Every entity write it makes
 * (`merge`, `patch`, `update`) and every list change (`insert`, `remove`,
 * `move`) becomes this call's layer: held over the server's copy, not
 * written into it. While the layer stands, server writes to the same fields
 * and lists (a feed refresh, a realtime echo) update the copy beneath it
 * without moving what the reader sees, which is what an echo guard used to do
 * by hand. Then `run` calls the server:
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
 *
 * A `durable` action's calls survive a restart. Each call is kept in the
 * account's outbox, with its arguments and its layer, until it settles or the
 * server refuses it; a call that fails while offline stays and runs again on
 * reconnect. When the store opens again, the outbox is read and each call
 * replayed in order: its layer shows at once and it runs when online, under
 * the same settle and rollback rules. Durable calls of a store run one at a
 * time, in call order, so a delete never overtakes the write before it. A
 * call may reach the server twice (its answer was lost to a restart), so make
 * the arguments say the target state (`setStarred(id, true)`, not a toggle).
 */
export interface ActionOptions<A extends unknown[], R> {
  /** A stable name, unique per app; required with `durable`. Outbox entries name their action by it. */
  name?: string;
  /** Keep each call in the account's outbox until it settles. Its arguments must be JSON-serialisable. */
  durable?: boolean;
  key?: (...args: A) => string;
  optimistic?: (...args: A) => void;
  run: (...args: A) => Promise<R>;
  settle?: (result: R, ...args: A) => void;
}

export type Action<A extends unknown[], R> = (...args: A) => Promise<R | undefined>;

/** What a store's actions are doing: for a "Syncing" indicator. */
export interface ActionStatus {
  /** Calls running now, or waiting for their turn. */
  readonly pending: number;
  /** Calls waiting for the network (offline); they run when it is back. */
  readonly paused: number;
}

const IDLE_STATUS: ActionStatus = Object.freeze({ pending: 0, paused: 0 });

/** A durable call as the outbox keeps it. */
interface OutboxEntry {
  readonly id: string;
  readonly name: string;
  readonly args: readonly unknown[];
  /** When it was called, in milliseconds since the epoch. */
  readonly at: number;
  /** Its optimistic layer, put back when it is replayed. */
  readonly layer: StoredLayer;
}

const OUTBOX_ID = 'calls';

/** The outbox: one record of the account's durable copy, never aged out. */
const Outbox = entity<{ id: string; calls: readonly OutboxEntry[] }>('bloom-outbox', {
  id: (outbox) => outbox.id,
  persist: true,
  expires: false,
});

/** The calls of one store. */
class Calls {
  status: ActionStatus = IDLE_STATUS;
  readonly listeners = new Set<Listener>();
  /**
   * Keys of the calls in flight. One space for every action, so a like and its
   * undo can share a key and exclude each other.
   */
  readonly keys = new Set<string>();
  /** The durable calls not settled, in call order: what the outbox holds. Replaced, never mutated. */
  entries: readonly OutboxEntry[] = [];
  /** Whether the outbox was read from the durable copy; until then it is not written. */
  loaded = false;
  /** Settles once every durable call so far has settled: the next one's turn. */
  turn: Promise<void> | undefined;

  change(pending: number, paused: number): void {
    this.status = {
      pending: this.status.pending + pending,
      paused: this.status.paused + paused,
    };
    for (const listener of [...this.listeners]) listener();
  }
}

const stores = new WeakMap<Store, Calls>();

function callsOf(store: Store): Calls {
  let calls = stores.get(store);
  if (!calls) {
    calls = new Calls();
    stores.set(store, calls);
  }
  return calls;
}

/** The store's action status now. */
export function actionStatus(store: Store): ActionStatus {
  return stores.get(store)?.status ?? IDLE_STATUS;
}

/** Calls `listener` whenever the store's action status changes. */
export function listenActionStatus(store: Store, listener: Listener): () => void {
  const calls = callsOf(store);
  calls.listeners.add(listener);
  return () => {
    calls.listeners.delete(listener);
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
async function whenOnline(store: Store, calls: Calls): Promise<void> {
  const controller = new AbortController();
  const abort = () => controller.abort(new StoreClosedError());
  store.cleanups.add(abort);
  calls.change(-1, 1);
  try {
    await waitUntil(() => environment.online, controller.signal);
  } finally {
    store.cleanups.delete(abort);
    calls.change(1, -1);
  }
}

// biome-ignore lint/suspicious/noExplicitAny: durable actions of every argument and result type
type AnyOptions = ActionOptions<any, any>;

/** Durable actions by name: what an outbox entry is replayed through. */
const durables = new Map<string, AnyOptions>();

/** Writes the outbox, once it was read (before, it would overwrite the stored calls). */
function save(store: Store, calls: Calls): void {
  if (calls.loaded) store.put(Outbox.definition, { id: OUTBOX_ID, calls: calls.entries });
}

function leave(store: Store, calls: Calls, entry: OutboxEntry): void {
  calls.entries = calls.entries.filter((held) => held !== entry);
  save(store, calls);
}

/** A call of an action: what runs after its layer is in place. */
interface Call {
  readonly options: AnyOptions;
  readonly args: readonly unknown[];
  readonly layer: Layer | null;
  readonly key: string | undefined;
  /** The outbox entry of a durable call. */
  readonly entry: OutboxEntry | undefined;
}

/**
 * Runs a call whose layer is in place and which counts as pending: waits for
 * the network and (a durable call) for the durable calls before it, then
 * settles or rolls back.
 */
async function perform(
  store: Store,
  calls: Calls,
  call: Call,
  after: Promise<void> | undefined,
): Promise<unknown> {
  const { options, args, layer, key, entry } = call;
  try {
    if (after) {
      if (!environment.online) await whenOnline(store, calls);
      await after;
    }
    let result: unknown;
    for (;;) {
      // Online, `run` starts in this same tick, as it always did.
      if (!environment.online) await whenOnline(store, calls);
      // Its account was left while it waited for its turn: it stays in that account's outbox.
      if (store.closed) throw new StoreClosedError();
      try {
        result = await withStore(store, () => options.run(...args));
        break;
      } catch (error) {
        // A durable call that failed while offline stays queued.
        if (entry && !environment.online) continue;
        throw error;
      }
    }
    store.batch(() => {
      if (layer) store.commitLayer(layer);
      if (entry) leave(store, calls, entry);
      if (!store.closed) withStore(store, () => options.settle?.(result, ...args));
    });
    return result;
  } catch (error) {
    // A closed store ignores both: the call stays in its account's outbox.
    store.batch(() => {
      if (layer) store.dropLayer(layer);
      if (entry) leave(store, calls, entry);
    });
    throw error;
  } finally {
    calls.change(-1, 0);
    if (key !== undefined) calls.keys.delete(key);
  }
}

const settled = (): undefined => undefined;

/**
 * The turn of the store's next durable call. The first time, it reads the
 * outbox from the durable copy and replays it: each call's layer goes back at
 * once, then the calls run in order.
 */
function turnOf(store: Store, calls: Calls): Promise<void> {
  calls.turn ??= replay(store, calls);
  return calls.turn;
}

async function replay(store: Store, calls: Calls): Promise<void> {
  let stored: readonly OutboxEntry[] = [];
  try {
    await store.hydrate(Outbox.definition, [OUTBOX_ID]);
    stored = (store.read(Outbox.definition, OUTBOX_ID)?.calls as OutboxEntry[] | undefined) ?? [];
  } catch (error) {
    reportError(error);
  }
  if (store.closed) return;
  const replayed: Call[] = [];
  store.batch(() => {
    // Newest first: each restored layer goes beneath the ones standing, so
    // they end up in call order, under any call made since the store opened.
    for (const entry of [...stored].reverse()) {
      // Dropped: an action an app update removed, or a key already in flight.
      const options = durables.get(entry.name);
      if (!options) continue;
      const key = options.key?.(...entry.args);
      if (key !== undefined && calls.keys.has(key)) continue;
      if (key !== undefined) calls.keys.add(key);
      replayed.unshift({
        options,
        args: entry.args,
        key,
        entry,
        layer: store.restoreLayer(entry.layer),
      });
    }
    calls.entries = [...replayed.map((call) => call.entry as OutboxEntry), ...calls.entries];
    calls.loaded = true;
    save(store, calls);
  });
  calls.change(replayed.length, 0);
  // What the calls changed is read from disk first, to show and settle into.
  await Promise.all(
    replayed.map((call) => call.layer && store.hydrateLayer(call.layer).catch(reportError)),
  );
  let turn: Promise<void> = Promise.resolve();
  for (const call of replayed) {
    // No caller waits for a replayed call: a refusal is its rollback.
    turn = perform(store, calls, call, turn).then(settled, settled);
  }
  await turn;
}

onStoreOpen((store) => {
  if (durables.size > 0) void turnOf(store, callsOf(store));
});

let nextCallId = 0;

export function action<A extends unknown[], R>(options: ActionOptions<A, R>): Action<A, R> {
  const { name, durable } = options;
  if (durable) {
    if (!name) throw new Error('bloom-data: a durable action needs a name');
    if (durables.has(name)) throw new Error(`bloom-data: two durable actions are named '${name}'`);
    durables.set(name, options);
  }
  return async (...args) => {
    const store = currentStore();
    const calls = callsOf(store);
    const key = options.key?.(...args);
    if (key !== undefined) {
      if (calls.keys.has(key)) return undefined;
      calls.keys.add(key);
    }
    calls.change(1, 0);
    const optimistic = options.optimistic;
    const layer = optimistic
      ? withStore(store, () => store.layer(() => optimistic(...args)))
      : null;
    if (!durable || !name) {
      return (await perform(
        store,
        calls,
        { options, args, layer, key, entry: undefined },
        undefined,
      )) as R;
    }
    nextCallId += 1;
    const entry: OutboxEntry = {
      id: `${Date.now().toString(36)}-${nextCallId.toString(36)}`,
      name,
      args,
      at: Date.now(),
      layer: layer ? store.saveLayer(layer) : { records: [], lists: [] },
    };
    // A new array: the stored outbox record shares the old one.
    calls.entries = [...calls.entries, entry];
    save(store, calls);
    const after = turnOf(store, calls);
    const done = perform(store, calls, { options, args, layer, key, entry }, after);
    calls.turn = done.then(settled, settled);
    return (await done) as R;
  };
}
