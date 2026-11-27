/**
 * @jest-environment node
 *
 * The standard library's native store backends (`stdlib/Bloom/runtime.ts`), over
 * stand-ins with the Expo modules' synchronous surface: SQLite is Node's own (the same
 * SQL runs), the keystore rejects keys outside `[A-Za-z0-9._-]` as Android's does, and
 * the file system is a real temporary directory.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { fileStorage, secureStorage, sqliteStorage } from '../stdlib/Bloom/runtime';

function sqlite() {
  const db = new DatabaseSync(':memory:');
  return {
    execSync: (source: string) => db.exec(source),
    runSync: (source: string, params: readonly (string | null)[]) =>
      db.prepare(source).run(...params),
    getFirstSync: <T>(source: string, params: readonly string[]) =>
      (db.prepare(source).get(...params) as T | undefined) ?? null,
    getAllSync: <T>(source: string, params: readonly string[]) =>
      db.prepare(source).all(...params) as T[],
  };
}

function keystore() {
  const items = new Map<string, string>();
  const pending: Promise<void>[] = [];
  const valid = (key: string) => {
    if (!/^[\w.-]+$/.test(key)) throw new Error(`invalid key ${key}`);
  };
  return {
    items,
    pending,
    getItem: (key: string) => {
      valid(key);
      return items.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      valid(key);
      items.set(key, value);
    },
    deleteItemAsync: (key: string) => {
      valid(key);
      const done = Promise.resolve().then(() => void items.delete(key));
      pending.push(done);
      return done;
    },
  };
}

function fileSystem(root: string) {
  const at = (parts: (string | { uri: string })[]) =>
    path.join(...parts.map((p) => (typeof p === 'string' ? p : p.uri)));
  class Entry {
    readonly uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = at(parts);
    }
    get name() {
      return path.basename(this.uri);
    }
  }
  class File extends Entry {
    get exists() {
      return fs.existsSync(this.uri) && fs.statSync(this.uri).isFile();
    }
    textSync() {
      return fs.readFileSync(this.uri, 'utf8');
    }
    writeSync(text: string) {
      if (!this.exists) throw new Error('no such file');
      fs.writeFileSync(this.uri, text);
    }
    create(options?: { intermediates?: boolean }) {
      if (options?.intermediates) fs.mkdirSync(path.dirname(this.uri), { recursive: true });
      fs.writeFileSync(this.uri, '', { flag: 'wx' });
    }
    delete() {
      fs.rmSync(this.uri);
    }
  }
  class Directory extends Entry {
    get exists() {
      return fs.existsSync(this.uri) && fs.statSync(this.uri).isDirectory();
    }
    list() {
      return fs.readdirSync(this.uri).map((name) => new File(this.uri, name));
    }
    create() {
      fs.mkdirSync(this.uri, { recursive: true });
    }
  }
  return { File, Directory, Paths: { document: new Directory(root) } };
}

test('kv: SQLite keeps each store apart, and survives a new backend on the same database', () => {
  const db = sqlite();
  const kv = sqliteStorage(db);
  kv.set('settings', 'notifications.likes', 'true');
  kv.set('settings', 'theme', 'dark');
  kv.set('drafts', 'theme', 'other store');
  expect(kv.get('settings', 'theme')).toBe('dark');
  expect(kv.keys('settings')).toEqual(['notifications.likes', 'theme']);
  kv.set('settings', 'theme', 'light');
  kv.set('settings', 'notifications.likes', undefined);
  // A relaunch: the table is there already.
  const again = sqliteStorage(db);
  expect(again.get('settings', 'theme')).toBe('light');
  expect(again.get('settings', 'notifications.likes')).toBeUndefined();
  expect(again.keys('drafts')).toEqual(['theme']);
});

test('secure: any name and key reach the keystore, and a removed secret is gone at once and after a relaunch', async () => {
  const store = keystore();
  const secure = secureStorage(store);
  secure.set('session', 'access token/ü', 'abc');
  secure.set('session', 'refresh', 'def');
  expect(secure.get('session', 'access token/ü')).toBe('abc');
  expect(secure.keys('session')).toEqual(['access token/ü', 'refresh']);
  secure.set('session', 'refresh', undefined);
  // Before the keystore's asynchronous delete has run.
  expect(secure.get('session', 'refresh')).toBeUndefined();
  expect(secure.keys('session')).toEqual(['access token/ü']);
  await Promise.all(store.pending);
  const relaunched = secureStorage(store);
  expect(relaunched.get('session', 'access token/ü')).toBe('abc');
  expect(relaunched.get('session', 'refresh')).toBeUndefined();
  expect(relaunched.keys('session')).toEqual(['access token/ü']);
  expect([...store.items.keys()].every((k) => /^bloom\.[0-9a-f]+(\.[0-9a-f]+)?$/.test(k))).toBe(
    true,
  );
});

test('file: a path with slashes is one file of the store', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bloom-file-store-'));
  try {
    const files = fileStorage(fileSystem(root));
    expect(files.keys('cache')).toEqual([]);
    files.set('cache', 'feed/for-you.json', '[1]');
    files.set('cache', 'feed/for-you.json', '[1,2]');
    files.set('cache', 'profile.json', '{}');
    expect(files.get('cache', 'feed/for-you.json')).toBe('[1,2]');
    expect([...files.keys('cache')].sort()).toEqual(['feed/for-you.json', 'profile.json']);
    files.set('cache', 'profile.json', undefined);
    expect(files.get('cache', 'profile.json')).toBeUndefined();
    expect(fileStorage(fileSystem(root)).keys('cache')).toEqual(['feed/for-you.json']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
