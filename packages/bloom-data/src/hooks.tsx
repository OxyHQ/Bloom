import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

import type { EntityDefinition, ListState } from './definition';
import type { Entity } from './entity';
import { currentStore, withStore } from './root';
import type { ListSource, RecordSource, SourceState } from './source';
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
  const store = useStore();
  const reader = useMemo(() => new EntityReader(store), [store]);
  const subscribe = useCallback(
    (listener: Listener) => reader.tracker.subscribe(listener),
    [reader],
  );
  const getSnapshot = () =>
    reader.snapshot(
      entity.definition,
      id,
      select as ((record: never) => unknown) | undefined,
      isEqual as (a: unknown, b: unknown) => boolean,
    ) as T | S | undefined;
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
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

  subscribe(args: A, listener: Listener): () => void {
    const slot = this.store.listSlot(this.source.list.definition, this.source.key(...args), true);
    const stopList = this.store.listen(slot, listener);
    const stopState = this.source.listenState(this.store, args, listener);
    return () => {
      stopList();
      stopState();
    };
  }

  snapshot(args: A): ListView<E> {
    const key = this.source.key(...args);
    const list = this.store.listSlot(this.source.list.definition, key, true).state as
      | ListState<E>
      | undefined;
    const state = this.source.stateIn(this.store, args);
    const cached = this.cached;
    if (cached && cached.key === key && cached.list === list && cached.state === state) {
      return cached.view;
    }
    if (this.commands?.key !== key) {
      const { store, source } = this;
      this.commands = {
        key,
        more: () => withStore(store, () => source.more(...args)),
        refresh: () => withStore(store, () => source.refresh(...args)),
      };
    }
    const view: ListView<E> = {
      ...state,
      key,
      ids: list?.ids ?? NO_IDS,
      extra: list?.extra,
      hasMore: list?.hasMore ?? false,
      // Before its first read starts (the mount effect), a key with no data is loading.
      isLoading: !list && (state.status === 'idle' || state.status === 'loading'),
      isFetching: state.fetchStatus === 'fetching' || (!list && state.status === 'idle'),
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
function useArgs<A extends unknown[]>(key: string, args: A): A {
  // biome-ignore lint/correctness/useExhaustiveDependencies: the key identifies the arguments
  return useMemo(() => args, [key]);
}

/**
 * Observes a list source for `args`: reads it when it has no data or stale
 * data (showing the disk copy meanwhile), keeps it in memory while mounted,
 * and re-renders when its ids or state change. A change to one of its
 * records does not re-render the list; rows read records with `useEntity`.
 */
export function useList<A extends unknown[], E>(source: ListSource<A, E>, ...args: A): ListView<E> {
  const store = useStore();
  const key = source.key(...args);
  const stableArgs = useArgs(key, args);
  const reader = useMemo(() => new ListReader(store, source), [store, source]);
  const subscribe = useCallback(
    (listener: Listener) => reader.subscribe(stableArgs, listener),
    [reader, stableArgs],
  );
  const getSnapshot = () => reader.snapshot(stableArgs);
  const view = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => source.observe(store, stableArgs), [source, store, stableArgs]);
  return view;
}

export interface RecordView<T> extends SourceState {
  readonly value: T | undefined;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly refresh: () => Promise<void>;
}

/** Observes a record source for `args` and reads its record with field-level subscriptions. */
export function useRecord<A extends unknown[], T>(
  source: RecordSource<A, T>,
  ...args: A
): RecordView<T> {
  const store = useStore();
  const key = source.key(...args);
  const stableArgs = useArgs(key, args);
  const value = useEntity(source.entity, key);
  const subscribe = useCallback(
    (listener: Listener) => source.listenState(store, stableArgs, listener),
    [source, store, stableArgs],
  );
  const getSnapshot = () => source.stateIn(store, stableArgs);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => source.observe(store, stableArgs), [source, store, stableArgs]);
  const refresh = useCallback(
    () => withStore(store, () => source.refresh(...stableArgs)),
    [source, store, stableArgs],
  );
  return {
    ...state,
    value,
    isLoading: value === undefined && (state.status === 'idle' || state.status === 'loading'),
    isFetching:
      state.fetchStatus === 'fetching' || (value === undefined && state.status === 'idle'),
    refresh,
  };
}
