import type { OpenOptions, PersistBatch, Persister, StoredList, StoredRecord } from './persist';

/**
 * The durable copy on the web, in IndexedDB: one database per account
 * (`name`), written in the background and read when a screen opens, like the
 * SQLite copy on a device. IndexedDB has no synchronous API, so the boot read
 * (`list.loadNow`) finds nothing here and the first list comes from
 * `list.load` or its source.
 */

const RECORDS = 'records';
const LISTS = 'lists';
const VERSIONS = 'versions';

interface RecordRow {
  type: string;
  id: string;
  json: string;
  updatedAt: number;
}

interface ListRow {
  type: string;
  key: string;
  ids: string[];
  json: string;
  updatedAt: number;
}

const request = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const done = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

/** Deletes every row of `store` that `drop` picks, walking it once. */
function deleteWhere<T>(store: IDBObjectStore, drop: (row: T) => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const cursor = store.openCursor();
    cursor.onerror = () => reject(cursor.error);
    cursor.onsuccess = () => {
      const at = cursor.result;
      if (!at) {
        resolve();
        return;
      }
      if (drop(at.value as T)) at.delete();
      at.continue();
    };
  });
}

/** The IndexedDB factory of this runtime, or `undefined` (a server render, a test without it). */
function factory(): IDBFactory | undefined {
  return typeof indexedDB === 'undefined' ? undefined : indexedDB;
}

/** Whether this runtime has IndexedDB, so a web app can keep a durable copy. */
export function hasIndexedDb(): boolean {
  return factory() !== undefined;
}

export function indexedDbPersister(name: string): Persister {
  let database: Promise<IDBDatabase> | undefined;
  /** Rows older than this go with the first write, so opening stays short. */
  let pruneBefore: number | undefined;
  let keep: ReadonlySet<string> = new Set();
  /** The most rows each bounded type keeps. */
  let limits: Readonly<Record<string, number>> = {};

  const db = (): Promise<IDBDatabase> => {
    if (!database) {
      const idb = factory();
      if (!idb) return Promise.reject(new Error('bloom-data: IndexedDB is not available'));
      const open = idb.open(name, 1);
      open.onupgradeneeded = () => {
        const handle = open.result;
        handle.createObjectStore(RECORDS, { keyPath: ['type', 'id'] });
        handle.createObjectStore(LISTS, { keyPath: ['type', 'key'] });
        handle.createObjectStore(VERSIONS, { keyPath: 'type' });
      };
      database = request(open);
    }
    return database;
  };

  const readRecords = async (
    handle: IDBDatabase,
    type: string,
    ids: readonly string[],
  ): Promise<StoredRecord[]> => {
    const store = handle.transaction(RECORDS, 'readonly').objectStore(RECORDS);
    const rows = await Promise.all(
      ids.map((id) => request(store.get([type, id]) as IDBRequest<RecordRow | undefined>)),
    );
    return rows.flatMap((row) => (row ? [{ id: row.id, json: row.json }] : []));
  };

  return {
    async open({ versions, maxAgeMs, keep: kept, limits: bounds = {} }: OpenOptions) {
      const handle = await db();
      const transaction = handle.transaction([RECORDS, VERSIONS], 'readwrite');
      const stored = (await request(transaction.objectStore(VERSIONS).getAll())) as Array<{
        type: string;
        version: number;
      }>;
      const held = new Map(stored.map((row) => [row.type, row.version]));
      const changed = Object.entries(versions).filter(
        ([type, version]) => held.get(type) !== version,
      );
      if (changed.length > 0) {
        const types = new Set(changed.map(([type]) => type));
        await deleteWhere<RecordRow>(transaction.objectStore(RECORDS), (row) =>
          types.has(row.type),
        );
        for (const [type, version] of changed)
          transaction.objectStore(VERSIONS).put({ type, version });
      }
      await done(transaction);
      pruneBefore = Date.now() - maxAgeMs;
      keep = new Set(kept);
      limits = bounds;
    },

    async readRecords(type, ids) {
      return ids.length === 0 ? [] : readRecords(await db(), type, ids);
    },

    async readList(type, key, recordType): Promise<StoredList | null> {
      const handle = await db();
      const row = (await request(
        handle.transaction(LISTS, 'readonly').objectStore(LISTS).get([type, key]),
      )) as ListRow | undefined;
      if (!row) return null;
      return {
        ids: row.ids,
        json: row.json,
        records: await readRecords(handle, recordType, row.ids),
      };
    },

    async write(batch: PersistBatch) {
      const cutoff = pruneBefore;
      if (batch.records.length === 0 && batch.lists.length === 0 && cutoff === undefined) return;
      const handle = await db();
      const transaction = handle.transaction([RECORDS, LISTS], 'readwrite');
      const records = transaction.objectStore(RECORDS);
      const lists = transaction.objectStore(LISTS);
      if (cutoff !== undefined) {
        pruneBefore = undefined;
        await deleteWhere<RecordRow>(
          records,
          (row) => row.updatedAt < cutoff && !keep.has(row.type),
        );
        await deleteWhere<ListRow>(lists, (row) => row.updatedAt < cutoff);
      }
      const now = Date.now();
      for (const record of batch.records) {
        if (record.json === null) records.delete([record.type, record.id]);
        else records.put({ type: record.type, id: record.id, json: record.json, updatedAt: now });
      }
      for (const list of batch.lists) {
        if (list.json === null || list.ids === null) lists.delete([list.type, list.key]);
        else
          lists.put({
            type: list.type,
            key: list.key,
            ids: [...list.ids],
            json: list.json,
            updatedAt: now,
          });
      }
      // Only a write can pass a bound: trim the bounded types it stored.
      const stored = new Set(
        batch.records.flatMap((record) => (record.json === null ? [] : [record.type])),
      );
      for (const type of stored) {
        const limit = limits[type];
        if (limit === undefined) continue;
        // Every row of the type: keys are [type, id], and an array sorts after any id.
        const rows = (await request(
          records.getAll(IDBKeyRange.bound([type], [type, []])),
        )) as RecordRow[];
        rows.sort((a, b) => b.updatedAt - a.updatedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        for (const row of rows.slice(limit)) records.delete([type, row.id]);
      }
      await done(transaction);
    },

    async close() {
      const opened = database;
      database = undefined;
      if (opened) (await opened.catch(() => undefined))?.close();
    },

    async destroy() {
      await this.close();
      const idb = factory();
      if (idb) await request(idb.deleteDatabase(name));
    },
  };
}
