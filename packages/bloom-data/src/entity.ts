import {
  type EntityDefinition,
  type ListDefinition,
  type ListState,
  type RefDefinition,
  registerDefinition,
} from './definition';
import { currentStore } from './root';
import type { DeepPartial, Plain } from './share';
import type { PutOptions } from './store';

/** A ref target: an entity, or a function returning one (for a ref to itself). */
// biome-ignore lint/suspicious/noExplicitAny: a ref may point at an entity of any record type
export type RefTarget = Entity<any> | (() => Entity<any>);

export interface EntityOptions<T> {
  /** The record's id. */
  id: (record: T) => string | null | undefined;
  /**
   * Fields that hold another entity's record, one or two keys deep
   * (`user`, `'boost.originalPost'`). On write the embedded record is stored
   * in its own entity and the field keeps its id; on read it resolves again,
   * so one copy serves every record that embeds it.
   */
  refs?: Readonly<Record<string, RefTarget>>;
  /**
   * Fields only an authenticated payload may write. A `put` marked
   * `anonymous` (a broadcast hydrated for no viewer) keeps the held values.
   */
  viewerFields?: readonly (keyof T & string)[];
  /**
   * Copy the records to the durable store. A changed `version` (default 1)
   * drops this type's stored rows when the store opens. `keep` bounds the
   * rows on disk to the newest `keep` written (memory holds whatever is
   * loaded): older rows are deleted with each write, so a restart restores
   * only the kept ones. Rows written in one batch count as equally new.
   * `trim` decides what the durable copy stores of a record, each time it is
   * written there: the record in the same shape (a ref field holds the
   * referenced record's id), or `null` to skip writing it this time (its
   * stored row stays as it was). Memory always keeps the whole record.
   */
  persist?: boolean | { version?: number; keep?: number; trim?: (record: T) => T | null };
  /** Whether stored rows not written for `persistMaxAgeMs` are dropped. Default true. */
  expires?: boolean;
  /**
   * How an incoming record joins the one held (with its refs resolved).
   * Default: it replaces it. Return `held` to refuse a payload known to be
   * worse than what is held (one that lost an embedded record), or a merge of
   * the two to keep what a sparse payload does not carry.
   */
  combine?: (incoming: T, held: T) => T;
  /**
   * Secondary keys, by name: the value a record is also found by (a
   * username), or `null`/`undefined` for none. Normalise it here (trim, case),
   * and the same way where it is looked up. `lookup` and a source with
   * `index` read it; it is kept from memory, never read from disk.
   */
  index?: Readonly<Record<string, (record: T) => string | null | undefined>>;
  /**
   * Told, once per batch, about every record of this type a write stored,
   * whichever path wrote it (a source page, a `put`, a record embedded in
   * another). For work that follows a record's server state.
   */
  onStore?: (records: readonly T[]) => void;
}

/**
 * Records of one type, by id. Every method acts on the store in scope
 * (`currentStore`): outside React that is the active account's.
 */
export interface Entity<T> {
  readonly definition: EntityDefinition;
  /** The record with its refs resolved, as a plain object, or `undefined`. */
  get(id: string): T | undefined;
  has(id: string): boolean;
  /** Stores records as the server sent them (replacing the held ones, sharing what is equal). */
  put(records: T | readonly T[], options?: PutOptions): void;
  /** Merges a partial into a held record. Inside an action's `optimistic`, the change is the action's layer. */
  merge(id: string, partial: DeepPartial<T>): boolean;
  /** `merge` with a partial computed from the current record. */
  patch(id: string, change: (current: T) => DeepPartial<T> | undefined): boolean;
  /** Replaces a held record by what `next` returns (`undefined`: unchanged, `null`: remove). */
  update(id: string, next: (current: T) => T | null | undefined): boolean;
  /** Removes the record from memory, disk and every list of this entity. */
  remove(id: string): boolean;
  /** Ids of this entity's held records whose refs point at `id` of `target`. */
  referencing<U>(target: Entity<U>, id: string): string[];
  /** Every id held in memory. */
  ids(): string[];
  /** The id of the held record whose `index` value is `value`. */
  lookup(index: string, value: string): string | undefined;
  /** Reads records from the durable copy into memory (never overwriting memory). */
  load(ids: readonly string[]): Promise<void>;
}

export function entity<T extends object>(type: string, options: EntityOptions<T>): Entity<T> {
  let refs: RefDefinition[] | undefined;
  const persistVersion =
    options.persist === undefined || options.persist === false
      ? null
      : options.persist === true
        ? 1
        : (options.persist.version ?? 1);
  const definition: EntityDefinition = {
    kind: 'entity',
    type,
    idOf: (record) => {
      const id = options.id(record as T);
      return id === null || id === undefined || id === '' ? undefined : String(id);
    },
    refs() {
      refs ??= Object.entries(options.refs ?? {}).map(([path, target]) => {
        const keys = path.split('.');
        if (keys.length < 1 || keys.length > 2) {
          throw new Error(`bloom-data: ref '${path}' of '${type}' must be one or two keys deep`);
        }
        const resolved = typeof target === 'function' ? target() : target;
        return { path: keys as [string] | [string, string], target: resolved.definition };
      });
      return refs;
    },
    viewerFields: options.viewerFields ?? [],
    combine: options.combine as EntityDefinition['combine'],
    onStore: options.onStore as EntityDefinition['onStore'],
    persistVersion,
    expires: options.expires ?? true,
    persistLimit: typeof options.persist === 'object' ? options.persist.keep : undefined,
    persistTrim:
      typeof options.persist === 'object'
        ? (options.persist.trim as EntityDefinition['persistTrim'])
        : undefined,
    indexes: Object.entries(options.index ?? {}).map(([name, keyOf]) => [
      name,
      (record: Plain) => {
        const value = keyOf(record as T);
        return value === null || value === undefined || value === '' ? undefined : value;
      },
    ]),
  };
  registerDefinition(definition);

  return {
    definition,
    get: (id) => currentStore().read(definition, id) as T | undefined,
    has: (id) => Boolean(currentStore().slot(definition, id)?.value),
    put(records, putOptions) {
      const store = currentStore();
      const list = (Array.isArray(records) ? records : [records]) as Plain[];
      store.batch(() => {
        for (const record of list) store.put(definition, record, putOptions);
      });
    },
    merge: (id, partial) => currentStore().merge(definition, id, partial as Plain),
    patch(id, change) {
      const store = currentStore();
      const current = store.read(definition, id);
      if (!current) return false;
      const partial = change(current as T);
      return partial === undefined ? false : store.merge(definition, id, partial as Plain);
    },
    update(id, next) {
      const store = currentStore();
      const current = store.read(definition, id);
      if (!current) return false;
      const value = next(current as T);
      return value === undefined ? false : store.replace(definition, id, value as Plain | null);
    },
    remove: (id) => currentStore().remove(definition, id),
    referencing: (target, id) => currentStore().referencing(definition, target.definition, id),
    ids: () => currentStore().ids(definition),
    lookup: (index, value) => currentStore().lookup(definition, index, value),
    load: (ids) => currentStore().hydrate(definition, ids),
  };
}

export interface ListOptions<E> {
  /** The entity the list orders. */
  // biome-ignore lint/suspicious/noExplicitAny: a list orders records of any type
  of: Entity<any>;
  /** Copy the lists to the durable store: all of them, or the keys a rule picks. */
  persist?: boolean | ((key: string) => boolean);
  /** Drops removed ids from what the source folded beside them (`extra`). */
  dropFromExtra?: (extra: E, ids: ReadonlySet<string>) => E;
}

/** Ordered ids into an entity, per key, with what the source kept beside them. */
export interface List<E = unknown> {
  readonly definition: ListDefinition;
  /** The key's list as readers see it: its state with any optimistic layer over it. */
  get(key: string): ListState<E> | undefined;
  /**
   * Writes a key's list (a local change; a source writes its own pages).
   * `next` receives the list's own state, beneath any layer: `set` is never
   * an action's layer, so inside `optimistic` use `insert`, `remove` and `move`.
   */
  set(key: string, next: (current: ListState<E> | undefined) => ListState<E> | undefined): void;
  /**
   * Puts ids at index `at` (default: the end), skipping those already in the
   * list. Inside an action's `optimistic` this is the action's layer, like
   * every list change below; outside it, a local write to a held list.
   */
  insert(key: string, ids: readonly string[], at?: number): void;
  /** Takes ids out of the list (and out of its `extra`, through `dropFromExtra`). */
  remove(key: string, ids: readonly string[]): void;
  /** Moves an id of the list to index `to`. */
  move(key: string, id: string, to: number): void;
  /** `insert(key, ids, 0)`: puts ids at the top, skipping those already in the list. */
  prepend(key: string, ids: readonly string[]): void;
  /** Every key held in memory. */
  keys(): string[];
  /**
   * Reads a key's list and its records from the durable copy into memory,
   * unless memory holds the list already: at boot, for the screen that will
   * open first. Resolves whether it was read.
   */
  load(key: string): Promise<boolean>;
  /**
   * The one synchronous read: the list and its records from the durable copy,
   * now. Only at boot, for the screen the app opens on, before its tree
   * mounts; never during render. Returns whether it was read (it is not when
   * the copy has no synchronous access or the list is held).
   */
  loadNow(key: string): boolean;
}

export function list<E = unknown>(type: string, options: ListOptions<E>): List<E> {
  const definition: ListDefinition = {
    kind: 'list',
    type,
    of: options.of.definition,
    persist:
      typeof options.persist === 'function'
        ? options.persist
        : options.persist === true
          ? () => true
          : () => false,
    dropFromExtra: options.dropFromExtra as ListDefinition['dropFromExtra'],
  };
  registerDefinition(definition);
  const handle: List<E> = {
    definition,
    get: (key) => currentStore().listSlot(definition, key)?.state as ListState<E> | undefined,
    set(key, next) {
      const store = currentStore();
      const slot = store.listSlot(definition, key, true);
      store.setList(slot, next(slot.base as ListState<E> | undefined));
    },
    insert: (key, ids, at) =>
      currentStore().changeList(definition, key, { op: 'insert', ids: [...ids], at }),
    remove: (key, ids) =>
      currentStore().changeList(definition, key, { op: 'remove', ids: [...ids] }),
    move: (key, id, to) => currentStore().changeList(definition, key, { op: 'move', id, to }),
    prepend: (key, ids) => handle.insert(key, ids, 0),
    keys: () => currentStore().listKeys(definition),
    load: (key) => currentStore().hydrateList(definition, key),
    loadNow: (key) => currentStore().loadListNow(definition, key),
  };
  return handle;
}
