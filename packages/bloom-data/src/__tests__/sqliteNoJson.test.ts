import { sqlitePersister } from '../sqlite';
import { openTestDatabase, resetFiles, type TestDatabase } from './support/sqlite';

/**
 * A SQLite without its JSON functions, as Android's own before API 34: any statement that
 * names one fails, as it would there.
 */
function withoutJson(name: string): TestDatabase {
  const db = openTestDatabase(name);
  const check = (source: string) => {
    if (/\bjson_\w+\s*\(/i.test(source)) throw new Error(`no such function: ${source}`);
  };
  return {
    ...db,
    get log() {
      return db.log;
    },
    get closed() {
      return db.closed;
    },
    async execAsync(source) {
      check(source);
      return db.execAsync(source);
    },
    async runAsync(source, ...params) {
      check(source);
      return db.runAsync(source, ...params);
    },
    async getAllAsync(source, ...params) {
      check(source);
      return db.getAllAsync(source, ...params);
    },
    execSync(source) {
      check(source);
      db.execSync(source);
    },
    runSync(source, ...params) {
      check(source);
      return db.runSync(source, ...params);
    },
    getAllSync(source, ...params) {
      check(source);
      return db.getAllSync(source, ...params);
    },
  };
}

afterEach(() => resetFiles());

const list = (ids: string[]) => ({ type: 'feed', key: 'home', ids, json: '{"page":1}' });
const record = (id: string, type = 'post') => ({ type, id, json: `{"id":"${id}"}` });

describe('sqlitePersister without JSON functions (json: false)', () => {
  it('fails as that SQLite would with the JSON statements', async () => {
    const persister = sqlitePersister(async () => withoutJson('plain.db'));
    await persister.open({ versions: {}, maxAgeMs: 1e9, keep: [] });
    // The first write prunes with `json_each`, and a list read joins with it.
    await expect(persister.write({ records: [record('1')], lists: [list(['1'])] })).rejects.toThrow(
      'no such function',
    );
    await expect(persister.readList('feed', 'home', 'post')).rejects.toThrow('no such function');
  });

  it('reads a list as its row, then its records by id', async () => {
    const persister = sqlitePersister(async () => withoutJson('a.db'), undefined, { json: false });
    await persister.open({ versions: { post: 1 }, maxAgeMs: 1e9, keep: [] });
    await persister.write({
      records: [record('1'), record('2')],
      lists: [list(['2', 'missing', '1'])],
    });
    const stored = await persister.readList('feed', 'home', 'post');
    expect(stored?.ids).toEqual(['2', 'missing', '1']);
    expect(stored?.json).toBe('{"page":1}');
    expect([...(stored?.records ?? [])].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      [record('1'), record('2')].map(({ id, json }) => ({ id, json })),
    );
    expect(await persister.readList('feed', 'absent', 'post')).toBeNull();
  });

  it('serves the synchronous boot read the same way', async () => {
    const writer = sqlitePersister(async () => withoutJson('boot.db'), undefined, { json: false });
    await writer.open({ versions: {}, maxAgeMs: 1e9, keep: [] });
    await writer.write({ records: [record('1')], lists: [list(['1'])] });

    let db: TestDatabase | undefined;
    const reader = sqlitePersister(
      () => {
        db = withoutJson('boot.db');
        return db;
      },
      undefined,
      { json: false },
    );
    expect(reader.openNow?.({ versions: {}, maxAgeMs: 1e9, keep: [] })).toBe(true);
    expect(reader.readListNow?.('feed', 'home', 'post')).toEqual({
      ids: ['1'],
      json: '{"page":1}',
      records: [{ id: '1', json: '{"id":"1"}' }],
    });
    expect(db?.log.every((sql) => sql.startsWith('sync:'))).toBe(true);
  });

  it('prunes old rows with the kept types as parameters', async () => {
    const first = sqlitePersister(async () => withoutJson('prune.db'), undefined, { json: false });
    await first.open({ versions: {}, maxAgeMs: 1e9, keep: [] });
    await first.write({
      records: [record('p', 'post'), record('s', 'setting'), record('d', 'draft')],
      lists: [list(['p'])],
    });
    await new Promise((resolve) => setTimeout(resolve, 5));

    let db: TestDatabase | undefined;
    const later = sqlitePersister(
      async () => {
        db = withoutJson('prune.db');
        return db;
      },
      undefined,
      { json: false },
    );
    await later.open({ versions: {}, maxAgeMs: 1, keep: ['setting', 'draft'] });
    await later.write({ records: [], lists: [] });
    expect(db?.rows('SELECT type, id FROM bloom_records ORDER BY type')).toEqual([
      { type: 'draft', id: 'd' },
      { type: 'setting', id: 's' },
    ]);
    expect(db?.rows('SELECT key FROM bloom_lists')).toEqual([]);

    const none = sqlitePersister(async () => withoutJson('prune.db'), undefined, { json: false });
    await none.open({ versions: {}, maxAgeMs: 1, keep: [] });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await none.write({ records: [], lists: [] });
    expect(db?.rows('SELECT id FROM bloom_records')).toEqual([]);
  });
});
