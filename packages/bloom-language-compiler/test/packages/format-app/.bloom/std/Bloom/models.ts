// The standard library's data primitives (`Data.bloom`), over Bloom's data layer
// (`@oxy.so/bloom-data`): a `@Model` type is an entity keyed by its unique field, plus one
// list of every id it holds (insertion order), both copied to SQLite on Android and iOS.
// Only `Data.bloom` sees this file, through its `extern module "./models"`.

import {
  type Entity,
  entity,
  type List,
  list,
  realtime,
  type EventSocket,
  setActiveStore,
  activeStore,
  Store,
  useEntities,
  useEntity,
  useListState,
  useList,
  action,
  source,
  type ListSource,
  type Persister,
} from '@oxy.so/bloom-data';

declare const require: (id: string) => unknown;

/** The key of the list of every record a model holds. */
const ALL = 'all';

/** A `@Model` type's records: its entity and the list of every id. */
export type ModelHandle<T> = {
  readonly name: string;
  readonly key: string;
  readonly entity: Entity<T & object>;
  readonly all: List;
};

function onNative(): boolean {
  return (globalThis as { navigator?: { product?: string } }).navigator?.product === 'ReactNative';
}

type SQLiteModule = { openDatabaseSync(name: string): unknown };
type SQLitePersisterModule = { sqlitePersister(open: () => unknown): Persister };

let opened = false;

/**
 * Opens the app's durable store once, before the first model registers: SQLite on
 * Android and iOS (`bloom-data.db`), memory on the web and in tests. An app that opened
 * its own store first (one per account) keeps it.
 */
function ensureStore(): void {
  if (opened) return;
  opened = true;
  if (activeStore() || !onNative()) return;
  try {
    const sqlite = require('expo-sqlite') as SQLiteModule;
    const { sqlitePersister } = require('@oxy.so/bloom-data/sqlite') as SQLitePersisterModule;
    setActiveStore(
      new Store({
        persister: sqlitePersister(() => sqlite.openDatabaseSync('bloom-data.db')),
      }),
    );
  } catch (error) {
    console.warn(`Bloom: @Model records are kept in memory only (${String(error)})`);
  }
}

/** Registers the model `name`, keyed by its field `key`. */
export function modelRegister<T>(
  name: string,
  field: PropertyKey,
  persist: boolean,
): ModelHandle<T> {
  ensureStore();
  const key = String(field);
  const records = entity<T & object>(name, {
    id: (record) => {
      const id = (record as Record<string, unknown>)[key];
      return id === undefined || id === null ? undefined : String(id);
    },
    persist,
    expires: false,
  });
  const all = list(`${name}.all`, { of: records, persist });
  return { name, key, entity: records, all };
}

function idOf<T>(model: ModelHandle<T>, record: T): string {
  return String((record as Record<string, unknown>)[model.key]);
}

export function modelGet<T>(model: ModelHandle<T>, id: string): T | undefined {
  return model.entity.get(id);
}

/** Stores `records` (replacing held ones with the same key), each listed once. */
export function modelInsert<T>(model: ModelHandle<T>, records: readonly T[]): void {
  const held = model.all.get(ALL);
  if (!held) {
    model.all.set(ALL, () => ({
      ids: [],
      extra: undefined,
      next: undefined,
      hasMore: false,
      visited: [],
      updatedAt: 0,
      origin: 'local',
    }));
  }
  model.entity.put(records as readonly (T & object)[]);
  model.all.insert(
    ALL,
    records.map((r) => idOf(model, r)),
  );
}

export function modelUpdate<T>(
  model: ModelHandle<T>,
  id: string,
  change: (current: T) => T,
): boolean {
  return model.entity.update(id, (current) => change(current) as T & object);
}

export function modelDelete<T>(model: ModelHandle<T>, id: string): boolean {
  model.all.remove(ALL, [id]);
  return model.entity.remove(id);
}

/** Every held record, in insertion order. */
export function modelAll<T>(model: ModelHandle<T>): readonly T[] {
  const ids = model.all.get(ALL)?.ids ?? [];
  return ids.map((id) => model.entity.get(id)).filter((r): r is T & object => r !== undefined);
}

/** Reads the model's records from the durable copy (once, at a screen's open). */
export async function modelLoad<T>(model: ModelHandle<T>): Promise<void> {
  await model.all.load(ALL);
}

/** Sort keys: numbers, strings, booleans, a `Date` (a JS `Date`), or a struct of one number (`Duration`). */
function sortValue(value: unknown): unknown {
  if (value instanceof Date) return value.getTime();
  if (value !== null && typeof value === 'object') {
    const fields = Object.values(value as Record<string, unknown>);
    if (fields.length === 1 && typeof fields[0] === 'number') return fields[0];
  }
  return value;
}

export function compareBy(key: string, reverse: boolean): (a: unknown, b: unknown) => number {
  return (a, b) => {
    const x = sortValue((a as Record<string, unknown>)[key]) as number | string;
    const y = sortValue((b as Record<string, unknown>)[key]) as number | string;
    const order = x < y ? -1 : x > y ? 1 : 0;
    return reverse ? -order : order;
  };
}

const loading = new WeakSet<object>();

/**
 * `@Query`: the model's records, filtered and sorted, re-rendered when one of them (or
 * the list) changes. The first read of a model also reads its durable copy.
 */
export function useModelQuery<T>(
  model: ModelHandle<T>,
  sort: string | undefined,
  reverse: boolean,
  filter: ((record: T) => boolean) | undefined,
): readonly T[] {
  if (!loading.has(model)) {
    loading.add(model);
    void model.all.load(ALL);
  }
  const ids = useListState(model.all, ALL)?.ids ?? [];
  const records = useEntities(model.entity, ids);
  let out = records.filter((r): r is T & object => r !== undefined) as T[];
  if (filter) out = out.filter(filter);
  if (sort !== undefined) out = [...out].sort(compareBy(sort, reverse));
  return out;
}

/** One record by key, re-rendered when it changes; `undefined` while none is held. */
export function useModelRecord<T>(model: ModelHandle<T>, id: string | undefined): T | undefined {
  return useEntity(model.entity, id);
}

// ---- sources ------------------------------------------------------------------

/** What a source's load returns: a page of records and the next page's cursor. */
export type SourcePageValue<T> = {
  readonly items: readonly T[];
  readonly next: string | undefined;
};

export type SourceHandle<T> = {
  readonly model: ModelHandle<T>;
  readonly name: string;
  readonly source: ListSource<[name: string], undefined>;
};

/** A server list of `model`'s records, one page per `load(cursor)`, kept on disk too. */
export function sourceMake<T>(
  model: ModelHandle<T>,
  name: string,
  load: (cursor: string | undefined, signal: AbortSignal) => Promise<SourcePageValue<T>>,
): SourceHandle<T> {
  const pages = list<undefined>(`${model.name}.${name}`, { of: model.entity, persist: true });
  const made = source(pages, {
    key: (key: string) => key,
    load: async ({ cursor, signal }, _key: string) => {
      const page = await load(cursor, signal);
      return { items: page.items as readonly (T & object)[], next: page.next ?? null };
    },
  });
  return { model, name, source: made };
}

export function sourceRefresh<T>(handle: SourceHandle<T>): Promise<void> {
  return handle.source.refresh(handle.name);
}

export function sourceMore<T>(handle: SourceHandle<T>): Promise<void> {
  return handle.source.more(handle.name);
}

/** `@Query(source)`: the source's records in its order, read from the server when due. */
export function useSourceQuery<T>(handle: SourceHandle<T>): readonly T[] {
  const view = useList(handle.source, handle.name);
  const records = useEntities(handle.model.entity, view.ids);
  return records.filter((r): r is T & object => r !== undefined);
}

// ---- actions ------------------------------------------------------------------

/** An optimistic change and the server call that settles it (or rolls it back). */
export function actionMake<A, R>(
  name: string,
  optimistic: ((argument: A) => void) | undefined,
  perform: (argument: A) => Promise<R>,
): (argument: A) => Promise<R | undefined> {
  return action<[A], R>({ name, optimistic, run: perform });
}

export function actionRun<A, R>(
  run: (argument: A) => Promise<R | undefined>,
  argument: A,
): Promise<R | undefined> {
  return run(argument);
}

// ---- realtime -----------------------------------------------------------------

/** Writes a socket's events into the models, batched per frame. Returns the unsubscribe. */
export function realtimeListen(
  socket: EventSocket,
  handlers: Readonly<Record<string, (payload: unknown) => void>>,
): () => void {
  return realtime(socket, handlers);
}

/** A key path's field name (a key path is its name at runtime). */
export function keyName(path: PropertyKey | undefined): string | undefined {
  return path === undefined ? undefined : String(path);
}
