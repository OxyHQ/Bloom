import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { type Action, type ActionStatus, actionStatus, listenActionStatus } from './action';

import type { EntityDefinition, ListState } from './definition';
import type { Entity, List } from './entity';
import { MODEL_ID, type Model } from './model';
import { currentStore, withStore } from './root';
import { IDLE_STATE, type ListSource, type RecordSource, type SourceState } from './source';
import type { Listener, Store } from './store';
import { Tracker } from './track';

const StoreContext = createContext<Store | null>(null);

/**
 * Gives the tree its store: the signed-in account's on a device, a fresh one
 * per request on a server. Changing `store` (an account switch) re-reads
 * every hook below from the new one.
 */
export function DataProvider({ store, children }: { store: Store; children?: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** The store hooks read: the provider's, else the active one. */
export function useStore(): Store {
  return useContext(StoreContext) ?? currentStore();
}

class EntityReader {
  readonly tracker: Tracker;
  /** Stable for the reader's life, so the hook needs no `useCallback`. */
  readonly subscribe = (listener: Listener) => this.tracker.subscribe(listener);
  private definition: EntityDefinition | undefined;
  private id: string | null | undefined;
  private select: ((record: never) => unknown) | undefined;
  private value: unknown;
  private selected: unknown;
  private hasSelected = false;

  constructor(readonly store: Store) {
    this.tracker = new Tracker(store);
  }

  snapshot(
    definition: EntityDefinition,
    id: string | null | undefined,
    select: ((record: never) => unknown) | undefined,
    isEqual: (a: unknown, b: unknown) => boolean,
  ): unknown {
    if (definition !== this.definition || id !== this.id) {
      this.tracker.reset();
      this.definition = definition;
      this.id = id;
      this.hasSelected = false;
    }
    if (!select) {
      return id ? this.tracker.record(this.store.slot(definition, id, true)) : undefined;
    }
    let value: unknown;
    if (id) {
      const slot = this.store.slot(definition, id, true);
      value = this.store.read(definition, id);
      this.tracker.watch(slot);
      for (const dependency of slot.value ? this.store.dependencies(slot) : []) {
        this.tracker.watch(dependency);
      }
    }
    if (this.hasSelected && value === this.value && select === this.select) return this.selected;
    const selected = select(value as never);
    this.value = value;
    this.select = select;
    if (!this.hasSelected || !isEqual(selected, this.selected)) {
      this.selected = selected;
      this.hasSelected = true;
    }
    return this.selected;
  }
}

/**
 * One record, read with field-level subscriptions.
 *
 * Without `select`, it returns a read-only proxy over the record (or
 * `undefined`): the component re-renders only when a field it read changed
 * (see `track.ts`). With `select`, it returns `select(record)` and re-renders
 * when that result changes (`isEqual`, default `Object.is`); the record is
 * then a plain object with its refs resolved.
 */
export function useEntity<T>(entity: Entity<T>, id: string | null | undefined): T | undefined;
export function useEntity<T, S>(
  entity: Entity<T>,
  id: string | null | undefined,
  select: (record: T | undefined) => S,
  isEqual?: (a: S, b: S) => boolean,
): S;
export function useEntity<T, S>(
  entity: Entity<T>,
  id: string | null | undefined,
  select?: (record: T | undefined) => S,
  isEqual: (a: S, b: S) => boolean = Object.is,
): T | S | undefined {
  return useEntityIn(useStore(), entity, id, select, isEqual);
}

/** `useEntity` against a given store. */
function useEntityIn<T, S>(
  store: Store,
  entity: Entity<T>,
  id: string | null | undefined,
  select?: (record: T | undefined) => S,
  isEqual: (a: S, b: S) => boolean = Object.is,
): T | S | undefined {
  const reader = useMemo(() => new EntityReader(store), [store]);
  const getSnapshot = () =>
    reader.snapshot(
      entity.definition,
      id,
      select as ((record: never) => unknown) | undefined,
      isEqual as (a: unknown, b: unknown) => boolean,
    ) as T | S | undefined;
  return useSyncExternalStore(reader.subscribe, getSnapshot, getSnapshot);
}

/** A list as a screen reads it: ids in order, the source's state, and its two commands. */
export interface ListView<E> extends SourceState {
  readonly key: string;
  readonly ids: readonly string[];
  readonly extra: E | undefined;
  readonly hasMore: boolean;
  /** No data yet and a read is under way (or about to start). */
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  /** The list as stored, or `undefined` before the first answer. */
  readonly list: ListState<E> | undefined;
  readonly more: () => Promise<void>;
  readonly refresh: () => Promise<void>;
}

const NO_IDS: readonly string[] = Object.freeze([]);

/**
 * Passed as the arguments of `useList` or `useRecord`, observes nothing: the
 * hook returns an idle, empty view and reads nothing (a read that must wait
 * for something, such as the signed-in account).
 */
export const skip: unique symbol = Symbol('bloom-data.skip');
export type Skip = typeof skip;

const SKIP_KEY = '\u0000skip';

class ListReader<A extends unknown[], E> {
  private cached:
    | { key: string; list: ListState<E> | undefined; state: SourceState; view: ListView<E> }
    | undefined;
  private commands:
    | { key: string; more: () => Promise<void>; refresh: () => Promise<void> }
    | undefined;

  constructor(
    readonly store: Store,
    readonly source: ListSource<A, E>,
  ) {}

  subscribe(args: A | [Skip], listener: Listener): () => void {
    if (args[0] === skip) return () => undefined;
    const slot = this.store.listSlot(
      this.source.list.definition,
      this.source.key(...(args as A)),
      true,
    );
    const stopList = this.store.listen(slot, listener);
    const stopState = this.source.listenState(this.store, args as A, listener);
    return () => {
      stopList();
      stopState();
    };
  }

  snapshot(args: A | [Skip]): ListView<E> {
    const skipped = args[0] === skip;
    const key = skipped ? SKIP_KEY : this.source.key(...(args as A));
    const list = skipped
      ? undefined
      : (this.store.listSlot(this.source.list.definition, key, true).state as
          | ListState<E>
          | undefined);
    const state = skipped ? IDLE_STATE : this.source.stateIn(this.store, args as A);
    const cached = this.cached;
    if (cached && cached.key === key && cached.list === list && cached.state === state) {
      return cached.view;
    }
    if (this.commands?.key !== key) {
      const { store, source } = this;
      this.commands = skipped
        ? { key, more: () => Promise.resolve(), refresh: () => Promise.resolve() }
        : {
            key,
            more: () => withStore(store, () => source.more(...(args as A))),
            refresh: () => withStore(store, () => source.refresh(...(args as A))),
          };
    }
    const view: ListView<E> = {
      ...state,
      key,
      ids: list?.ids ?? NO_IDS,
      extra: list?.extra,
      hasMore: list?.hasMore ?? false,
      // Before its first read starts (the mount effect), a key with no data is loading.
      isLoading: !skipped && !list && (state.status === 'idle' || state.status === 'loading'),
      isFetching:
        state.fetchStatus === 'fetching' || (!skipped && !list && state.status === 'idle'),
      list,
      more: this.commands.more,
      refresh: this.commands.refresh,
    };
    this.cached = { key, list, state, view };
    return view;
  }
}

/**
 * The arguments, kept while their key is the same: the key is what identifies
 * a read, so equal keys must not start another.
 */
function useArgs<A extends unknown[]>(key: string, args: A | [Skip]): A | [Skip] {
  // biome-ignore lint/correctness/useExhaustiveDependencies: the key identifies the arguments
  return useMemo(() => args, [key]);
}

/**
 * Observes a list source for `args`: reads it when it has no data or stale
 * data (showing the disk copy meanwhile), keeps it in memory while mounted,
 * and re-renders when its ids or state change. A change to one of its
 * records does not re-render the list; rows read records with `useEntity`.
 */
export function useList<A extends unknown[], E>(
  source: ListSource<A, E>,
  ...args: A | [Skip]
): ListView<E> {
  const store = useStore();
  const key = args[0] === skip ? SKIP_KEY : source.key(...(args as A));
  const stableArgs = useArgs(key, args);
  const reader = useMemo(() => new ListReader(store, source), [store, source]);
  const subscribe = useCallback(
    (listener: Listener) => reader.subscribe(stableArgs, listener),
    [reader, stableArgs],
  );
  const getSnapshot = () => reader.snapshot(stableArgs);
  const view = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(
    () => (stableArgs[0] === skip ? undefined : source.observe(store, stableArgs as A)),
    [source, store, stableArgs],
  );
  return view;
}

/**
 * A list as it is held, read without reading it from the server: it re-renders
 * when the list changes and starts no read (what another screen's source
 * filled, say). `undefined` while no list is held for `key`.
 */
export function useListState<E>(
  list: List<E>,
  key: string | null | undefined,
): ListState<E> | undefined {
  const store = useStore();
  const subscribe = useCallback(
    (listener: Listener) =>
      key ? store.listen(store.listSlot(list.definition, key, true), listener) : () => undefined,
    [store, list, key],
  );
  const getSnapshot = () =>
    key ? (store.listSlot(list.definition, key)?.state as ListState<E> | undefined) : undefined;
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export interface RecordView<T> extends SourceState {
  readonly value: T | undefined;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly refresh: () => Promise<void>;
}

/**
 * The id a record source's key names: the key itself, or (a source with an
 * `index`) the id the index holds for it, re-read when the index moves.
 */
function useRecordId<A extends unknown[], T>(
  store: Store,
  source: RecordSource<A, T>,
  args: A | [Skip],
): string | undefined {
  const skipped = args[0] === skip;
  const key = skipped ? undefined : source.key(...(args as A));
  const index = source.index;
  const subscribe = useCallback(
    (listener: Listener) =>
      index !== undefined && key !== undefined
        ? store.listen(store.indexSlot(source.entity.definition, index, key), listener)
        : () => undefined,
    [store, source, index, key],
  );
  const getSnapshot = () =>
    key === undefined
      ? undefined
      : index === undefined
        ? key
        : store.lookup(source.entity.definition, index, key);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Observes a record source for `args` (or nothing, with `skip`): reads it
 * when it has no data or stale data, and returns the record with its state.
 * The record is read with field-level subscriptions, like `useEntity`.
 */
export function useRecord<A extends unknown[], T>(
  source: RecordSource<A, T>,
  ...args: A | [Skip]
): RecordView<T> {
  const store = useStore();
  const skipped = args[0] === skip;
  const key = skipped ? SKIP_KEY : source.key(...(args as A));
  const stableArgs = useArgs(key, args);
  const value = useEntity(source.entity, useRecordId(store, source, stableArgs));
  const subscribe = useCallback(
    (listener: Listener) =>
      stableArgs[0] === skip
        ? () => undefined
        : source.listenState(store, stableArgs as A, listener),
    [source, store, stableArgs],
  );
  const getSnapshot = () =>
    stableArgs[0] === skip ? IDLE_STATE : source.stateIn(store, stableArgs as A);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(
    () => (stableArgs[0] === skip ? undefined : source.observe(store, stableArgs as A)),
    [source, store, stableArgs],
  );
  const refresh = useCallback(
    () =>
      stableArgs[0] === skip
        ? Promise.resolve()
        : withStore(store, () => source.refresh(...(stableArgs as A))),
    [source, store, stableArgs],
  );
  return {
    ...state,
    value,
    isLoading:
      !skipped && value === undefined && (state.status === 'idle' || state.status === 'loading'),
    isFetching:
      state.fetchStatus === 'fetching' ||
      (!skipped && value === undefined && state.status === 'idle'),
    refresh,
  };
}

/**
 * A model's value in the store of the tree (or `store`, for a model that lives
 * in another one, such as a device's). Reads the disk copy on mount when
 * memory holds none, and re-renders when the value (or `select`'s answer)
 * changes.
 */
export function useModel<T>(model: Model<T>, store?: Store): T | undefined;
export function useModel<T, S>(
  model: Model<T>,
  select: (value: T | undefined) => S,
  store?: Store,
): S;
export function useModel<T, S>(
  model: Model<T>,
  selectOrStore?: ((value: T | undefined) => S) | Store,
  explicitStore?: Store,
): T | S | undefined {
  const select = typeof selectOrStore === 'function' ? selectOrStore : undefined;
  const tree = useStore();
  const store = (typeof selectOrStore === 'function' ? explicitStore : selectOrStore) ?? tree;
  const read = useCallback(
    (record: { value: T } | undefined) => (select ? select(record?.value) : record?.value),
    [select],
  );
  useEffect(() => {
    void withStore(store, () => model.load());
  }, [model, store]);
  return useEntityIn(store, model.entity, MODEL_ID, read) as T | S | undefined;
}

/** A component's calls of one action: run it, and what its last call is doing. */
export interface ActionView<A extends unknown[], R> {
  /** Calls the action in the tree's store. Rejects when the call fails (the error is also kept here). */
  readonly run: (...args: A) => Promise<R | undefined>;
  /** The last call is running or waiting for the network. */
  readonly isPending: boolean;
  /** The last call's failure, until the next call or `reset`. */
  readonly error: unknown;
  /** The last call's result. */
  readonly data: R | undefined;
  readonly reset: () => void;
}

interface CallState<R> {
  readonly isPending: boolean;
  readonly error: unknown;
  readonly data: R | undefined;
}

const NO_CALL: CallState<never> = { isPending: false, error: null, data: undefined };

/**
 * One action as a component calls it: `run` acts on the tree's store, and the
 * view says whether its last call is pending and how it ended. Only the last
 * call reports: an earlier one that ends later changes nothing.
 */
export function useAction<A extends unknown[], R>(action: Action<A, R>): ActionView<A, R> {
  const store = useStore();
  const [state, setState] = useState<CallState<R>>(NO_CALL);
  const calls = useRef(0);
  const run = useCallback(
    async (...args: A) => {
      calls.current += 1;
      const call = calls.current;
      setState({ isPending: true, error: null, data: undefined });
      try {
        const data = await withStore(store, () => action(...args));
        if (call === calls.current) setState({ isPending: false, error: null, data });
        return data;
      } catch (error) {
        if (call === calls.current) setState({ isPending: false, error, data: undefined });
        throw error;
      }
    },
    [action, store],
  );
  const reset = useCallback(() => {
    calls.current += 1;
    setState(NO_CALL);
  }, []);
  return { ...state, run, reset };
}

/** What the tree's store's actions are doing (running, waiting for the network). */
export function useActionStatus(): ActionStatus {
  const store = useStore();
  const subscribe = useCallback(
    (listener: Listener) => listenActionStatus(store, listener),
    [store],
  );
  const getSnapshot = () => actionStatus(store);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
