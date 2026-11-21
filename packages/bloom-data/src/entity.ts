import {
  type EntityDefinition,
  type ListDefinition,
  type ListState,
  type RefDefinition,
  registerPersisted,
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
   * Copy the records to the durable store. A changed `version` drops this
   * type's stored rows when the store opens.
   */
  persist?: boolean | { version: number };
  /**
   * How an incoming record joins the one held (with its refs resolved).
   * Default: it replaces it. Return `held` to refuse a payload known to be
   * worse than what is held (one that lost an embedded record), or a merge of
   * the two to keep what a sparse payload does not carry.
   */
  combine?: (incoming: T, held: T) => T;
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
        : options.persist.version;
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
  };
  registerPersisted(definition);

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
  get(key: string): ListState<E> | undefined;
  /** Writes a key's list (a local change; a source writes its own pages). */
  set(key: string, next: (current: ListState<E> | undefined) => ListState<E> | undefined): void;
  /** Puts ids at the top of a held list, skipping those already in it. */
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
  const handle: List<E> = {
    definition,
    get: (key) => currentStore().listSlot(definition, key)?.state as ListState<E> | undefined,
    set(key, next) {
      const store = currentStore();
      const slot = store.listSlot(definition, key, true);
      store.setList(slot, next(slot.state as ListState<E> | undefined));
    },
    prepend(key, ids) {
      handle.set(key, (current) => {
        if (!current) return current;
        const held = new Set(current.ids);
        const added = ids.filter((id) => !held.has(id));
        return added.length === 0 ? current : { ...current, ids: [...added, ...current.ids] };
      });
    },
    keys: () => currentStore().listKeys(definition),
    load: (key) => currentStore().hydrateList(definition, key),
    loadNow: (key) => currentStore().loadListNow(definition, key),
  };
  return handle;
}
