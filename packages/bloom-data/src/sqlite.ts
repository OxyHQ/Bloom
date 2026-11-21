import type { OpenOptions, PersistBatch, Persister, StoredList, StoredRecord } from './persist';

type Param = string | number | null;

/**
 * The part of expo-sqlite's database this persister uses. Pass
 * `SQLite.openDatabaseAsync(name)`, or `SQLite.openDatabaseSync(name)` to also
 * allow the one synchronous boot read (`list.loadNow`). This package does not
 * import expo-sqlite itself.
 */
export interface AsyncDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: Param[]): Promise<unknown>;
  getAllAsync<T>(source: string, ...params: Param[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}

/** A database that also has expo-sqlite's synchronous API (`openDatabaseSync`). */
export interface SyncDatabase extends AsyncDatabase {
  execSync(source: string): void;
  runSync(source: string, ...params: Param[]): unknown;
  getAllSync<T>(source: string, ...params: Param[]): T[];
}

const isSync = (database: AsyncDatabase): database is SyncDatabase =>
  typeof (database as Partial<SyncDatabase>).getAllSync === 'function';

const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS bloom_records (
  type TEXT NOT NULL,
  id TEXT NOT NULL,
  json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (type, id)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS bloom_lists (
  type TEXT NOT NULL,
  key TEXT NOT NULL,
  ids TEXT NOT NULL,
  json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (type, key)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS bloom_versions (
  type TEXT PRIMARY KEY NOT NULL,
  version INTEGER NOT NULL
) WITHOUT ROWID;
`;

/**
 * SQLite caps bound parameters per statement (999 before 3.32); reads by id
 * and multi-row writes go in chunks below it.
 */
const CHUNK = 200;

const placeholders = (count: number, width: number) =>
  Array.from(
    { length: count },
    () => `(${Array.from({ length: width }, () => '?').join(', ')})`,
  ).join(', ');

function* chunks<T>(items: readonly T[]): Generator<T[]> {
  for (let offset = 0; offset < items.length; offset += CHUNK) {
    yield items.slice(offset, offset + CHUNK);
  }
}

const VERSIONS = 'SELECT type, version FROM bloom_versions';
const DROP_TYPE = 'DELETE FROM bloom_records WHERE type = ?';
const SET_VERSION = 'INSERT OR REPLACE INTO bloom_versions (type, version) VALUES (?, ?)';
const READ_LIST = `SELECT l.ids AS ids, l.json AS json, r.id AS id, r.json AS record
  FROM bloom_lists l
  LEFT JOIN json_each(l.ids) AS j
  LEFT JOIN bloom_records r ON r.type = ? AND r.id = j.value
  WHERE l.type = ? AND l.key = ?`;
const readRecordsSql = (count: number) =>
  `SELECT id, json FROM bloom_records WHERE type = ? AND id IN (${Array.from({ length: count }, () => '?').join(', ')})`;

interface ListRow {
  ids: string;
  json: string;
  id: string | null;
  record: string | null;
}

/** The entity types whose stored version differs from the one asked for. */
function changedVersions(
  stored: ReadonlyArray<{ type: string; version: number }>,
  versions: Readonly<Record<string, number>>,
): Array<[string, number]> {
  const known = new Map(stored.map((row) => [row.type, row.version]));
  return Object.entries(versions).filter(([type, version]) => known.get(type) !== version);
}

function parseList(rows: readonly ListRow[]): StoredList | null {
  const [first] = rows;
  if (!first) return null;
  let ids: unknown;
  try {
    ids = JSON.parse(first.ids);
  } catch {
    return null;
  }
  if (!Array.isArray(ids)) return null;
  const records: StoredRecord[] = [];
  for (const row of rows) {
    if (row.id !== null && row.record !== null) records.push({ id: row.id, json: row.record });
  }
  return {
    ids: ids.filter((id): id is string => typeof id === 'string'),
    json: first.json,
    records,
  };
}

/**
 * A durable copy in one SQLite file: records as JSON by type and id, and each
 * list as one row of ordered ids. Open one per account
 * (`openDatabaseAsync(\`app-\${account}.db\`)`), so switching accounts never
 * needs a wipe and one account's rows can never be read as another's.
 *
 * Every call is few statements. Each asynchronous statement costs turns of
 * the JS thread, which is busiest exactly when a screen opens, so opening is
 * one script and one read, a list comes back with its records in one query,
 * and a write sends its rows in multi-row statements.
 *
 * Given a database with the synchronous API, it also serves the one
 * synchronous boot read (`openNow`, `readListNow`, `readRecordsNow`), with the
 * same statements.
 */
export function sqlitePersister(
  open: () => AsyncDatabase | SyncDatabase | Promise<AsyncDatabase>,
): Persister {
  let database: Promise<AsyncDatabase> | undefined;
  let syncDatabase: SyncDatabase | undefined;
  /** Rows older than this go with the first write, so opening stays short. */
  let pruneBefore: number | undefined;
  const db = () => {
    if (!database) {
      const opened = open();
      if (!(opened instanceof Promise) && isSync(opened)) syncDatabase = opened;
      database = Promise.resolve(opened);
    }
    return database;
  };
  /** The synchronous database, opening it now if the opener gives one; else `undefined`. */
  const dbNow = (): SyncDatabase | undefined => {
    if (!database) void db();
    return syncDatabase;
  };

  return {
    async open({ versions, maxAgeMs }: OpenOptions) {
      const handle = await db();
      await handle.execAsync(SCHEMA);
      const changed = changedVersions(await handle.getAllAsync(VERSIONS), versions);
      if (changed.length > 0) {
        await handle.withTransactionAsync(async () => {
          for (const [type, version] of changed) {
            await handle.runAsync(DROP_TYPE, type);
            await handle.runAsync(SET_VERSION, type, version);
          }
        });
      }
      pruneBefore = Date.now() - maxAgeMs;
    },

    openNow({ versions, maxAgeMs }: OpenOptions) {
      const handle = dbNow();
      if (!handle) return false;
      handle.execSync(SCHEMA);
      const changed = changedVersions(handle.getAllSync(VERSIONS), versions);
      if (changed.length > 0) {
        handle.execSync('BEGIN');
        try {
          for (const [type, version] of changed) {
            handle.runSync(DROP_TYPE, type);
            handle.runSync(SET_VERSION, type, version);
          }
          handle.execSync('COMMIT');
        } catch (error) {
          handle.execSync('ROLLBACK');
          throw error;
        }
      }
      pruneBefore = Date.now() - maxAgeMs;
      return true;
    },

    async readRecords(type, ids) {
      const handle = await db();
      const out: StoredRecord[] = [];
      for (const chunk of chunks(ids)) {
        out.push(
          ...(await handle.getAllAsync<StoredRecord>(readRecordsSql(chunk.length), type, ...chunk)),
        );
      }
      return out;
    },

    readRecordsNow(type, ids) {
      const handle = dbNow();
      if (!handle) return [];
      const out: StoredRecord[] = [];
      for (const chunk of chunks(ids)) {
        out.push(...handle.getAllSync<StoredRecord>(readRecordsSql(chunk.length), type, ...chunk));
      }
      return out;
    },

    async readList(type, key, recordType) {
      const handle = await db();
      return parseList(await handle.getAllAsync<ListRow>(READ_LIST, recordType, type, key));
    },

    readListNow(type, key, recordType) {
      const handle = dbNow();
      return handle
        ? parseList(handle.getAllSync<ListRow>(READ_LIST, recordType, type, key))
        : null;
    },

    async write(batch: PersistBatch) {
      const cutoff = pruneBefore;
      if (batch.records.length === 0 && batch.lists.length === 0 && cutoff === undefined) return;
      const handle = await db();
      const now = Date.now();
      const upserts = batch.records.filter((record) => record.json !== null);
      const deletes = new Map<string, string[]>();
      for (const record of batch.records) {
        if (record.json !== null) continue;
        const ids = deletes.get(record.type) ?? [];
        ids.push(record.id);
        deletes.set(record.type, ids);
      }
      await handle.withTransactionAsync(async () => {
        if (cutoff !== undefined) {
          pruneBefore = undefined;
          await handle.runAsync('DELETE FROM bloom_records WHERE updated_at < ?', cutoff);
          await handle.runAsync('DELETE FROM bloom_lists WHERE updated_at < ?', cutoff);
        }
        for (const chunk of chunks(upserts)) {
          const params: Param[] = [];
          for (const record of chunk) params.push(record.type, record.id, record.json, now);
          await handle.runAsync(
            `INSERT OR REPLACE INTO bloom_records (type, id, json, updated_at) VALUES ${placeholders(chunk.length, 4)}`,
            ...params,
          );
        }
        for (const [type, ids] of deletes) {
          for (const chunk of chunks(ids)) {
            await handle.runAsync(
              `DELETE FROM bloom_records WHERE type = ? AND id IN (${chunk.map(() => '?').join(', ')})`,
              type,
              ...chunk,
            );
          }
        }
        for (const list of batch.lists) {
          if (list.ids === null || list.json === null) {
            await handle.runAsync(
              'DELETE FROM bloom_lists WHERE type = ? AND key = ?',
              list.type,
              list.key,
            );
          } else {
            await handle.runAsync(
              'INSERT OR REPLACE INTO bloom_lists (type, key, ids, json, updated_at) VALUES (?, ?, ?, ?, ?)',
              list.type,
              list.key,
              JSON.stringify(list.ids),
              list.json,
              now,
            );
          }
        }
      });
    },

    async close() {
      if (!database) return;
      const handle = await database;
      database = undefined;
      syncDatabase = undefined;
      await handle.closeAsync();
    },
  };
}
