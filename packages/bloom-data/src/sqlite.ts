import type { PersistBatch, Persister, StoredList, StoredRecord } from './persist';

/**
 * The part of expo-sqlite's asynchronous database this persister uses. Only
 * the async API: every statement runs off the JS thread, so persistence never
 * blocks a frame. Pass `SQLite.openDatabaseAsync(name)`; this package does not
 * import expo-sqlite itself.
 */
export interface AsyncDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: Array<string | number | null>): Promise<unknown>;
  getAllAsync<T>(source: string, ...params: Array<string | number | null>): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}

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

/** SQLite caps bound parameters per statement; reads by id go in chunks below it. */
const CHUNK = 500;

/**
 * A durable copy in one SQLite file: records as JSON by type and id, and each
 * list as one row of ordered ids. Open one per account
 * (`openDatabaseAsync(\`app-\${account}.db\`)`), so switching accounts never
 * needs a wipe and one account's rows can never be read as another's.
 */
export function sqlitePersister(open: () => Promise<AsyncDatabase>): Persister {
  let database: Promise<AsyncDatabase> | undefined;
  const db = () => {
    database ??= open();
    return database;
  };

  return {
    async open({ versions, maxAgeMs }) {
      const handle = await db();
      await handle.execAsync(SCHEMA);
      const stored = await handle.getAllAsync<{ type: string; version: number }>(
        'SELECT type, version FROM bloom_versions',
      );
      const known = new Map(stored.map((row) => [row.type, row.version]));
      const cutoff = Date.now() - maxAgeMs;
      await handle.withTransactionAsync(async () => {
        for (const [type, version] of Object.entries(versions)) {
          if (known.get(type) === version) continue;
          await handle.runAsync('DELETE FROM bloom_records WHERE type = ?', type);
          await handle.runAsync(
            'INSERT OR REPLACE INTO bloom_versions (type, version) VALUES (?, ?)',
            type,
            version,
          );
        }
        await handle.runAsync('DELETE FROM bloom_records WHERE updated_at < ?', cutoff);
        await handle.runAsync('DELETE FROM bloom_lists WHERE updated_at < ?', cutoff);
      });
    },

    async readRecords(type, ids) {
      const handle = await db();
      const out: StoredRecord[] = [];
      for (let offset = 0; offset < ids.length; offset += CHUNK) {
        const chunk = ids.slice(offset, offset + CHUNK);
        const rows = await handle.getAllAsync<StoredRecord>(
          `SELECT id, json FROM bloom_records WHERE type = ? AND id IN (${chunk.map(() => '?').join(', ')})`,
          type,
          ...chunk,
        );
        out.push(...rows);
      }
      return out;
    },

    async readList(type, key) {
      const handle = await db();
      const [row] = await handle.getAllAsync<{ ids: string; json: string }>(
        'SELECT ids, json FROM bloom_lists WHERE type = ? AND key = ?',
        type,
        key,
      );
      if (!row) return null;
      let ids: unknown;
      try {
        ids = JSON.parse(row.ids);
      } catch {
        return null;
      }
      if (!Array.isArray(ids)) return null;
      return {
        ids: ids.filter((id): id is string => typeof id === 'string'),
        json: row.json,
      } satisfies StoredList;
    },

    async write(batch: PersistBatch) {
      if (batch.records.length === 0 && batch.lists.length === 0) return;
      const handle = await db();
      const now = Date.now();
      await handle.withTransactionAsync(async () => {
        for (const record of batch.records) {
          if (record.json === null) {
            await handle.runAsync(
              'DELETE FROM bloom_records WHERE type = ? AND id = ?',
              record.type,
              record.id,
            );
          } else {
            await handle.runAsync(
              'INSERT OR REPLACE INTO bloom_records (type, id, json, updated_at) VALUES (?, ?, ?, ?)',
              record.type,
              record.id,
              record.json,
              now,
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
      await handle.closeAsync();
    },
  };
}
