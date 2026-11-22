import type { ListState } from './definition';
import type { Entity, List } from './entity';
import { environment, sleep, waitUntil } from './environment';
import { currentStore, withStore } from './root';
import type { Plain } from './share';
import { type Listener, type PutOptions, reportError, type Store } from './store';

/**
 * Sources fill entities and lists from the server: the fetching half of
 * SwiftUI's `@Query`. Each source and key has one state per store, so an
 * account switch starts every read afresh.
 *
 * What a read does, deliberately carried over from React Query:
 * - one request per key at a time: a second caller joins the one in flight;
 * - a refresh supersedes whatever is in flight, and a late answer of a
 *   superseded read (or of a closed store) is dropped;
 * - a continuation joins an in-flight first page instead of cancelling it,
 *   and never appends to a list refreshed since it started;
 * - failures retry with exponential backoff (1s, 2s, 4s … capped at 30s),
 *   and the data already shown stays on screen through retries and errors;
 * - offline, a read waits (`fetchStatus: 'paused'`) and resumes on reconnect;
 *   retries also wait while the app is in the background;
 * - fresh data is not read again on mount; stale data is shown, then read
 *   again; a disk copy is always stale;
 * - coming to the front and reconnecting read stale, observed keys again;
 * - an unobserved key leaves memory after `gcTime` (its disk copy stays);
 * - an unchanged answer changes nothing (structural sharing), so nothing
 *   re-renders.
 */

export type FetchStatus = 'idle' | 'fetching' | 'paused';

export interface SourceState {
  /** `loading` until the first answer; `error` when the last read failed after its retries. */
  readonly status: 'idle' | 'loading' | 'success' | 'error';
  readonly fetchStatus: FetchStatus;
  readonly error: unknown;
  /** Failed attempts of the read in progress (or of the last one). */
  readonly failureCount: number;
  /** When the data shown was read; 0 before any answer. */
  readonly updatedAt: number;
  /** Where the data shown came from. */
  readonly origin: 'network' | 'disk' | undefined;
}

export const IDLE_STATE: SourceState = {
  status: 'idle',
  fetchStatus: 'idle',
  error: null,
  failureCount: 0,
  updatedAt: 0,
  origin: undefined,
};

/** When a source's data counts as stale: an age in milliseconds, or a rule. */
export type Staleness<A extends unknown[]> =
  | number
  | ((read: { updatedAt: number; origin: 'network' | 'disk' | undefined }, ...args: A) => boolean);

interface CommonOptions<A extends unknown[]> {
  /** The key for the arguments; equal keys share one read and one copy. */
  key: (...args: A) => string;
  /** Default 0: data is stale once read. */
  stale?: Staleness<A>;
  /** How long an unobserved key stays in memory. Default 5 minutes; `Infinity` keeps it. */
  gcTime?: number;
  /** Retries after a failure, or a rule. Default 3. */
  retry?: number | ((failureCount: number, error: unknown) => boolean);
  retryDelay?: (failureCount: number, error: unknown) => number;
  /** Read stale, observed keys again when the app comes to the front. Default true. */
  refetchOnFocus?: boolean;
  /** Read stale, observed keys again on reconnect. Default true. */
  refetchOnReconnect?: boolean;
}

/** One page as the server answers it. */
export interface Page<T, X = undefined> {
  readonly items: readonly T[];
  /** The next page's cursor; none when this is the last page. */
  readonly next?: string | null;
  /** Defaults to whether there is a `next` cursor. */
  readonly hasMore?: boolean;
  /** Anything else the page carries, folded into the list's `extra`. */
  readonly extra?: X;
  /** Records the page carries that are not its items (stored, not listed). */
  readonly related?: readonly T[];
}

export interface PageRequest<E> {
  /** `undefined` for the first page. */
  readonly cursor: string | undefined;
  readonly signal: AbortSignal;
  /** The list as it stands when the read starts. */
  readonly current: ListState<E> | undefined;
}

export interface ListSourceOptions<A extends unknown[], T, E, X> extends CommonOptions<A> {
  load: (request: PageRequest<E>, ...args: NoInfer<A>) => Promise<Page<T, X>>;
  /** Folds a page's `extra` into the list's (`first` replaces, `next` appends). */
  fold?: (current: E | undefined, extra: X | undefined, mode: 'first' | 'next') => E;
  /** How the page's records are stored (`anonymous` for a broadcast's). */
  put?: PutOptions;
}

export interface RecordSourceOptions<A extends unknown[], T> extends CommonOptions<A> {
  /**
   * The key is the value of this entity `index` (a username), not the
   * record's id: the record is found through the index, so one already held
   * under that value (from a list, say) shows at once. Such a read has no
   * disk copy of its own.
   */
  index?: string;
  /** The record, or `null` when the server says it is gone (it is then removed). */
  load: (request: { readonly signal: AbortSignal }, ...args: NoInfer<A>) => Promise<T | null>;
  put?: PutOptions;
}

interface BaseSource<A extends unknown[]> {
  readonly id: number;
  key(...args: A): string;
  /** Reads the key unless it holds fresh data; joins a read in flight. Never rejects. */
  fetch(...args: A): Promise<void>;
  /** Reads the key again, superseding a read in flight. Never rejects. */
  refresh(...args: A): Promise<void>;
  /**
   * Marks the key stale in the store in scope, whatever its `stale` age: read
   * again now when it is observed (or being read), else when next observed.
   */
  invalidate(...args: A): void;
  /** `invalidate` for every key of this source in the store in scope. */
  invalidateAll(): void;
  state(...args: A): SourceState;
  /** @internal The hooks' subscription. */
  observe(store: Store, args: A): () => void;
  /** @internal */
  listenState(store: Store, args: A, listener: Listener): () => void;
  /** @internal */
  stateIn(store: Store, args: A): SourceState;
}

export interface ListSource<A extends unknown[], E> extends BaseSource<A> {
  readonly kind: 'list';
  readonly list: List<E>;
  /** Reads the next page, if there is one. Joins a read in flight. Never rejects. */
  more(...args: A): Promise<void>;
}

export interface RecordSource<A extends unknown[], T> extends BaseSource<A> {
  readonly kind: 'record';
  readonly entity: Entity<T>;
  /** The entity index the key is a value of; `undefined`: the key is the id. */
  readonly index: string | undefined;
  /** The id of the record the key names in `store`, if it is held. */
  idIn(store: Store, args: A): string | undefined;
}

interface Query {
  state: SourceState;
  readonly listeners: Set<Listener>;
  observers: number;
  args: unknown[];
  inflight: { promise: Promise<void>; controller: AbortController; mode: 'first' | 'next' } | null;
  epoch: number;
  gcTimer: ReturnType<typeof setTimeout> | undefined;
  diskTried: boolean;
  /** Stale whatever its age, until a read started since then answers. */
  invalid: boolean;
}

let nextSourceId = 1;

export function source<A extends unknown[], T, E = undefined, X = undefined>(
  target: List<E>,
  options: ListSourceOptions<A, T, E, X>,
): ListSource<A, E>;
export function source<A extends unknown[], T>(
  target: Entity<T>,
  options: RecordSourceOptions<A, T>,
): RecordSource<A, T>;
export function source(
  target: List<unknown> | Entity<unknown>,
  options:
    | ListSourceOptions<unknown[], unknown, unknown, unknown>
    | RecordSourceOptions<unknown[], unknown>,
): ListSource<unknown[], unknown> | RecordSource<unknown[], unknown> {
  const id = nextSourceId++;
  const isList = target.definition.kind === 'list';
  const gcTime = options.gcTime ?? 5 * 60_000;
  const refetchOnFocus = options.refetchOnFocus ?? true;
  const refetchOnReconnect = options.refetchOnReconnect ?? true;

  const queryOf = (store: Store, args: unknown[]): Query => {
    const key = `${id}\u0000${options.key(...args)}`;
    let query = store.queries.get(key) as Query | undefined;
    if (!query) {
      query = {
        state: IDLE_STATE,
        listeners: new Set(),
        observers: 0,
        args,
        inflight: null,
        epoch: 0,
        gcTimer: undefined,
        diskTried: false,
        invalid: false,
      };
      store.queries.set(key, query);
      connect(store);
    }
    return query;
  };

  const setState = (query: Query, patch: Partial<SourceState>) => {
    const next = { ...query.state, ...patch };
    const keys = Object.keys(patch) as (keyof SourceState)[];
    if (keys.every((k) => Object.is(next[k], query.state[k]))) return;
    query.state = next;
    for (const listener of [...query.listeners]) listener();
  };

  const listOf = (store: Store, args: unknown[]) =>
    isList
      ? store.listSlot((target as List<unknown>).definition, options.key(...args), true)
      : undefined;

  const index = isList ? undefined : (options as RecordSourceOptions<unknown[], unknown>).index;

  /** The id of the record a record source's key names, if it is held. */
  const idIn = (store: Store, args: unknown[]): string | undefined => {
    const definition = (target as Entity<unknown>).definition;
    const key = options.key(...args);
    if (index !== undefined) return store.lookup(definition, index, key);
    return store.slot(definition, key)?.value ? key : undefined;
  };

  const hasData = (store: Store, args: unknown[]): boolean =>
    isList ? Boolean(listOf(store, args)?.state) : idIn(store, args) !== undefined;

  const isStale = (store: Store, query: Query): boolean => {
    if (query.invalid || !hasData(store, query.args) || query.state.origin !== 'network')
      return true;
    const stale = options.stale ?? 0;
    if (typeof stale === 'number') return Date.now() - query.state.updatedAt >= stale;
    return stale(
      { updatedAt: query.state.updatedAt, origin: query.state.origin },
      ...(query.args as never[]),
    );
  };

  const shouldRetry = (failureCount: number, error: unknown): boolean => {
    const retry = options.retry ?? 3;
    return typeof retry === 'number' ? failureCount <= retry : retry(failureCount, error);
  };

  const retryDelay = (failureCount: number, error: unknown): number =>
    options.retryDelay?.(failureCount, error) ?? Math.min(1000 * 2 ** (failureCount - 1), 30_000);

  const apply = (store: Store, query: Query, mode: 'first' | 'next', answer: unknown) => {
    withStore(store, () =>
      store.batch(() => {
        if (!isList) {
          const definition = (target as Entity<unknown>).definition;
          if (answer !== null) store.put(definition, answer as Plain, options.put);
          else {
            const id = idIn(store, query.args);
            if (id !== undefined) store.remove(definition, id);
          }
          return;
        }
        const listOptions = options as ListSourceOptions<unknown[], unknown, unknown, unknown>;
        const page = answer as Page<unknown, unknown>;
        const slot = listOf(store, query.args);
        if (!slot) return;
        const definition = slot.definition;
        for (const record of page.related ?? []) {
          store.put(definition.of, record as Plain, listOptions.put);
        }
        const ids: string[] = [];
        for (const item of page.items) {
          const itemId = store.put(definition.of, item as Plain, listOptions.put);
          if (itemId !== undefined) ids.push(itemId);
        }
        // Pages build on the list's own state, never on a layer over it.
        const current = mode === 'next' ? slot.base : undefined;
        const visited = mode === 'next' && current?.next ? [...current.visited, current.next] : [];
        const next = page.next ?? undefined;
        const repeats = next !== undefined && visited.includes(next);
        const held = new Set(current?.ids ?? []);
        const unique = ids.filter((itemId) => {
          if (held.has(itemId)) return false;
          held.add(itemId);
          return true;
        });
        const extra = listOptions.fold
          ? listOptions.fold(current?.extra, page.extra, mode)
          : undefined;
        store.setList(slot, {
          ids: current ? [...current.ids, ...unique] : unique,
          extra,
          next: repeats ? undefined : next,
          hasMore: !repeats && (page.hasMore ?? next !== undefined) && next !== undefined,
          visited,
          updatedAt: Date.now(),
          origin: 'network',
        });
      }),
    );
  };

  const run = (
    store: Store,
    query: Query,
    mode: 'first' | 'next',
    force: boolean,
  ): Promise<void> => {
    if (store.closed) return Promise.resolve();
    if (query.inflight) {
      // A continuation joins whatever is in flight; so does a plain read.
      if (mode === 'next' || !force) return query.inflight.promise;
      query.inflight.controller.abort();
      query.inflight = null;
    }
    let cursor: string | undefined;
    if (mode === 'next') {
      const current = listOf(store, query.args)?.state;
      if (!current?.hasMore || current.next === undefined) return Promise.resolve();
      if (current.visited.includes(current.next)) return Promise.resolve();
      cursor = current.next;
    }
    const controller = new AbortController();
    query.epoch += 1;
    const epoch = query.epoch;
    const live = () => !controller.signal.aborted && query.epoch === epoch && !store.closed;
    const canProceed = () => environment.online;
    const canRetry = () => environment.online && environment.focused;

    const promise = (async () => {
      setState(query, {
        status: query.state.status === 'idle' ? 'loading' : query.state.status,
        fetchStatus: canProceed() ? 'fetching' : 'paused',
        failureCount: 0,
      });
      let failureCount = 0;
      for (;;) {
        if (!canProceed()) {
          setState(query, { fetchStatus: 'paused' });
          await waitUntil(canProceed, controller.signal);
          if (!live()) return;
          setState(query, { fetchStatus: 'fetching' });
        }
        let answer: unknown;
        try {
          const request = isList
            ? { cursor, signal: controller.signal, current: listOf(store, query.args)?.state }
            : { signal: controller.signal };
          answer = await withStore(store, () =>
            (options.load as (request: unknown, ...args: unknown[]) => Promise<unknown>)(
              request,
              ...query.args,
            ),
          );
        } catch (error) {
          if (!live()) return;
          failureCount += 1;
          if (!shouldRetry(failureCount, error)) {
            setState(query, { status: 'error', fetchStatus: 'idle', error, failureCount });
            return;
          }
          setState(query, { failureCount });
          await sleep(retryDelay(failureCount, error), controller.signal);
          if (!canRetry()) {
            setState(query, { fetchStatus: 'paused' });
            await waitUntil(canRetry, controller.signal);
            setState(query, { fetchStatus: 'fetching' });
          }
          if (!live()) return;
          continue;
        }
        if (!live()) return;
        apply(store, query, mode, answer);
        query.invalid = false;
        setState(query, {
          status: 'success',
          fetchStatus: 'idle',
          error: null,
          failureCount: 0,
          updatedAt: Date.now(),
          origin: 'network',
        });
        return;
      }
    })()
      .catch((error) => {
        // An abort is a superseded read, not a failure.
        if (!controller.signal.aborted) reportError(error);
      })
      .finally(() => {
        if (query.inflight?.controller === controller) {
          query.inflight = null;
          // A superseded read leaves its successor's state alone.
          if (query.state.fetchStatus !== 'idle' && query.epoch === epoch) {
            setState(query, { fetchStatus: 'idle' });
          }
          if (query.observers === 0) scheduleGc(store, query);
        }
      });
    query.inflight = { promise, controller, mode };
    return promise;
  };

  const scheduleGc = (store: Store, query: Query) => {
    if (query.gcTimer !== undefined || !Number.isFinite(gcTime) || store.closed) return;
    query.gcTimer = setTimeout(() => {
      query.gcTimer = undefined;
      if (query.observers > 0 || query.inflight || store.closed) return;
      const key = options.key(...query.args);
      store.queries.delete(`${id}\u0000${key}`);
      if (isList) store.evictList((target as List<unknown>).definition, key);
      store.collect();
    }, gcTime);
  };

  /** Reads the disk copy while the network read runs, and shows it if it lands first. */
  const hydrate = (store: Store, query: Query) => {
    if (query.diskTried || !store.persister || index !== undefined || hasData(store, query.args))
      return;
    query.diskTried = true;
    const key = options.key(...query.args);
    const read = isList
      ? store.hydrateList((target as List<unknown>).definition, key)
      : store
          .hydrate((target as Entity<unknown>).definition, [key])
          .then(() => hasData(store, query.args));
    void read.then((found) => {
      if (!found || query.state.origin === 'network' || store.closed) return;
      const updatedAt = isList ? (listOf(store, query.args)?.state?.updatedAt ?? 0) : 0;
      setState(query, { status: 'success', origin: 'disk', updatedAt });
    }, reportError);
  };

  /** This source's keys held in `store`. */
  const queriesIn = (store: Store): Query[] => {
    const out: Query[] = [];
    for (const [key, value] of store.queries) {
      if (key.startsWith(`${id}\u0000`)) out.push(value as Query);
    }
    return out;
  };

  const connect = (store: Store) => {
    if (store.sources.has(id)) return;
    store.sources.add(id);
    const stop = environment.subscribe((event) => {
      if (event === 'focus' ? !refetchOnFocus : event !== 'online' || !refetchOnReconnect) return;
      for (const query of queriesIn(store)) {
        if (query.observers > 0 && isStale(store, query)) void run(store, query, 'first', false);
      }
    });
    store.cleanups.add(() => {
      stop();
      for (const query of queriesIn(store)) {
        query.inflight?.controller.abort();
        if (query.gcTimer !== undefined) clearTimeout(query.gcTimer);
      }
    });
  };

  /**
   * Marks a key stale. A key observed reads again now; so does one being read,
   * since that read started before the change it must see.
   */
  const invalidateIn = (store: Store, query: Query) => {
    query.invalid = true;
    if (query.observers > 0 || query.inflight) void run(store, query, 'first', true);
  };

  const fetchIn = (store: Store, args: unknown[]): Promise<void> => {
    const query = queryOf(store, args);
    query.args = args;
    hydrate(store, query);
    if (!isStale(store, query)) return query.inflight?.promise ?? Promise.resolve();
    const promise = run(store, query, 'first', false);
    if (query.observers === 0 && !query.inflight) scheduleGc(store, query);
    return promise;
  };

  const base: BaseSource<unknown[]> = {
    id,
    key: (...args) => options.key(...args),
    fetch: (...args) => fetchIn(currentStore(), args),
    refresh: (...args) => {
      const store = currentStore();
      const query = queryOf(store, args);
      query.args = args;
      return run(store, query, 'first', true);
    },
    invalidate: (...args) => {
      const store = currentStore();
      // A key never read in this store has nothing to mark: its first read reads.
      const query = store.queries.get(`${id}\u0000${options.key(...args)}`) as Query | undefined;
      if (query) invalidateIn(store, query);
    },
    invalidateAll: () => {
      const store = currentStore();
      for (const query of queriesIn(store)) invalidateIn(store, query);
    },
    state: (...args) => queryOf(currentStore(), args).state,
    stateIn: (store, args) => queryOf(store, args).state,
    listenState(store, args, listener) {
      const query = queryOf(store, args);
      query.listeners.add(listener);
      return () => {
        query.listeners.delete(listener);
      };
    },
    observe(store, args) {
      const query = queryOf(store, args);
      query.args = args;
      query.observers += 1;
      if (query.gcTimer !== undefined) {
        clearTimeout(query.gcTimer);
        query.gcTimer = undefined;
      }
      const list = listOf(store, args);
      if (list) list.observed += 1;
      void fetchIn(store, args);
      return () => {
        query.observers -= 1;
        if (list) list.observed -= 1;
        if (query.observers === 0 && !query.inflight) scheduleGc(store, query);
      };
    },
  };

  if (isList) {
    return {
      ...base,
      kind: 'list',
      list: target as List<unknown>,
      more: (...args) => {
        const store = currentStore();
        const query = queryOf(store, args);
        query.args = args;
        return run(store, query, 'next', false);
      },
    };
  }
  return {
    ...base,
    kind: 'record',
    entity: target as Entity<unknown>,
    index,
    idIn: (store, args) => idIn(store, args),
  };
}
