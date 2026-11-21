import type { SyncDatabase as ExpoSyncDatabase } from '../../sqlite';

interface SyncStatement {
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): unknown;
}
interface SyncDatabase {
  exec(source: string): void;
  prepare(source: string): SyncStatement;
  close(): void;
}

/** Node's built-in SQLite behind expo-sqlite's surface (async and sync), with every statement logged. */
export interface TestDatabase extends ExpoSyncDatabase {
  readonly log: string[];
  readonly closed: boolean;
  /** Synchronous peek for assertions. */
  rows(source: string, ...params: unknown[]): Array<Record<string, unknown>>;
}

/** Databases by file name, kept across close so a reopen reads the same file. */
const files = new Map<string, SyncDatabase>();

export function resetFiles(): void {
  for (const db of files.values()) db.close();
  files.clear();
}

export function openTestDatabase(name = ':memory:'): TestDatabase {
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (path: string) => SyncDatabase;
  };
  let db = files.get(name);
  if (!db) {
    db = new DatabaseSync(':memory:');
    files.set(name, db);
  }
  const handle = db;
  const log: string[] = [];
  let closed = false;
  let inTransaction = false;
  const plain = (rows: unknown[]) => rows.map((row) => ({ ...(row as object) }));
  return {
    log,
    get closed() {
      return closed;
    },
    rows: (source, ...params) =>
      plain(handle.prepare(source).all(...params)) as Array<Record<string, unknown>>,
    async execAsync(source) {
      log.push(source.trim().split('\n')[0] ?? '');
      handle.exec(source);
    },
    async runAsync(source, ...params) {
      log.push(source);
      return handle.prepare(source).run(...params);
    },
    async getAllAsync<T>(source: string, ...params: Array<string | number | null>) {
      log.push(source);
      return plain(handle.prepare(source).all(...params)) as T[];
    },
    async withTransactionAsync(task) {
      if (inTransaction) throw new Error('nested transaction');
      inTransaction = true;
      log.push('BEGIN');
      handle.exec('BEGIN');
      try {
        await task();
        handle.exec('COMMIT');
        log.push('COMMIT');
      } catch (error) {
        handle.exec('ROLLBACK');
        log.push('ROLLBACK');
        throw error;
      } finally {
        inTransaction = false;
      }
    },
    execSync(source) {
      log.push(`sync:${source.trim().split('\n')[0] ?? ''}`);
      handle.exec(source);
    },
    runSync(source, ...params) {
      log.push(`sync:${source}`);
      return handle.prepare(source).run(...params);
    },
    getAllSync<T>(source: string, ...params: Array<string | number | null>) {
      log.push(`sync:${source}`);
      return plain(handle.prepare(source).all(...params)) as T[];
    },
    async closeAsync() {
      closed = true;
    },
  };
}
