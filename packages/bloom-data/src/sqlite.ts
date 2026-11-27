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
/** Deletes a type's rows past the newest `limit` written. */
const TRIM_TYPE = `DELETE FROM bloom_records WHERE type = ? AND id NOT IN (
  SELECT id FROM bloom_records WHERE type = ? ORDER BY updated_at DESC, id LIMIT ?)`;
const DROP_TYPE = 'DELETE FROM bloom_records WHERE type = ?';
const SET_VERSION = 'INSERT OR REPLACE INTO bloom_versions (type, version) VALUES (?, ?)';
const READ_LIST = `SELECT l.ids AS ids, l.json AS json, r.id AS id, r.json AS record
  FROM bloom_lists l
  LEFT JOIN json_each(l.ids) AS j
  LEFT JOIN bloom_records r ON r.type = ? AND r.id = j.value
  WHERE l.type = ? AND l.key = ?`;
/** A list's own row, for a SQLite without JSON functions (`json: false`). */
const READ_LIST_ROW = 'SELECT ids, json FROM bloom_lists WHERE type = ? AND key = ?';
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

/** A list row's ids, or `null` when they are not a JSON array. */
function parseIds(text: string): string[] | null {
  let ids: unknown;
  try {
    ids = JSON.parse(text);
  } catch {
    return null;
  }
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : null;
}

function parseList(rows: readonly ListRow[]): StoredList | null {
  const [first] = rows;
  if (!first) return null;
  const ids = parseIds(first.ids);
  if (!ids) return null;
  const records: StoredRecord[] = [];
  for (const row of rows) {
    if (row.id !== null && row.record !== null) records.push({ id: row.id, json: row.record });
  }
  return { ids, json: first.json, records };
}

export interface SqliteOptions {
  /**
   * Whether the SQLite has its JSON functions (`json_each`), as expo-sqlite's does (the
   * default). Without them (Android's own SQLite before API 34), a list is read as its row
   * and then its records by id, and the prune lists the kept types as parameters.
   */
  readonly json?: boolean;
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
  /** Deletes the database file (`() => SQLite.deleteDatabaseAsync(name)`); without it, `destroy` empties it. */
  remove?: () => Promise<void>,
  { json = true }: SqliteOptions = {},
): Persister {
  let database: Promise<AsyncDatabase> | undefined;
  let syncDatabase: SyncDatabase | undefined;
  /** Rows older than this go with the first write, so opening stays short. */
  let pruneBefore: number | undefined;
  /** The types the prune spares. */
  let keep: readonly string[] = [];
  /** The most rows each bounded type keeps. */
  let limits: Readonly<Record<string, number>> = {};
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

  const readRecords = async (type: string, ids: readonly string[]) => {
    const handle = await db();
    const out: StoredRecord[] = [];
    for (const chunk of chunks(ids)) {
      out.push(
        ...(await handle.getAllAsync<StoredRecord>(readRecordsSql(chunk.length), type, ...chunk)),
      );
    }
    return out;
  };
  const readRecordsNow = (type: string, ids: readonly string[]) => {
    const handle = dbNow();
    if (!handle) return [];
    const out: StoredRecord[] = [];
    for (const chunk of chunks(ids)) {
      out.push(...handle.getAllSync<StoredRecord>(readRecordsSql(chunk.length), type, ...chunk));
    }
    return out;
  };

  return {
    async open({ versions, maxAgeMs, keep: kept, limits: bounds = {} }: OpenOptions) {
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
      keep = kept;
      limits = bounds;
    },

    openNow({ versions, maxAgeMs, keep: kept, limits: bounds = {} }: OpenOptions) {
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
      keep = kept;
      limits = bounds;
      return true;
    },

    readRecords,
    readRecordsNow,

    async readList(type, key, recordType) {
      const handle = await db();
      if (json)
        return parseList(await handle.getAllAsync<ListRow>(READ_LIST, recordType, type, key));
      const [row] = await handle.getAllAsync<{ ids: string; json: string }>(
        READ_LIST_ROW,
        type,
        key,
      );
      const ids = row ? parseIds(row.ids) : null;
      if (!row || !ids) return null;
      return { ids, json: row.json, records: await readRecords(recordType, ids) };
    },

    readListNow(type, key, recordType) {
      const handle = dbNow();
      if (!handle) return null;
      if (json) return parseList(handle.getAllSync<ListRow>(READ_LIST, recordType, type, key));
      const [row] = handle.getAllSync<{ ids: string; json: string }>(READ_LIST_ROW, type, key);
      const ids = row ? parseIds(row.ids) : null;
      if (!row || !ids) return null;
      return { ids, json: row.json, records: readRecordsNow(recordType, ids) };
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
          await handle.runAsync(
            json
              ? 'DELETE FROM bloom_records WHERE updated_at < ? AND type NOT IN (SELECT value FROM json_each(?))'
              : `DELETE FROM bloom_records WHERE updated_at < ? AND type NOT IN (${keep.map(() => '?').join(', ')})`,
            cutoff,
            ...(json ? [JSON.stringify(keep)] : keep),
          );
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
        // Only a write can pass a bound: trim the bounded types it stored.
        for (const type of new Set(upserts.map((record) => record.type))) {
          const limit = limits[type];
          if (limit !== undefined) await handle.runAsync(TRIM_TYPE, type, type, limit);
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

    async destroy() {
      if (remove) {
        await this.close();
        await remove();
        return;
      }
      const handle = await db();
      await handle.execAsync(SCHEMA);
      await handle.execAsync(
        'DELETE FROM bloom_records; DELETE FROM bloom_lists; DELETE FROM bloom_versions;',
      );
      await this.close();
    },
  };
}
