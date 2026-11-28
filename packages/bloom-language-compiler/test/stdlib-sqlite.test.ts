// `@Model`'s SQLite in a Bloom build (stdlib/Bloom/models.ts): `nativeDatabase` over the
// `sql…` functions of `BloomStorage`, here a stand-in over Node's SQLite that frames rows as
// the Kotlin side does (`Databases.rows`), under BloomData's persister without JSON functions.
import { sqlitePersister } from '../../bloom-data/src/sqlite';
import { decodeRows, nativeDatabase } from '../stdlib/Bloom/models';

type Row = Record<string, string | number | bigint | null | Uint8Array>;
interface Db {
  exec(source: string): void;
  prepare(source: string): {
    all(...p: unknown[]): Row[];
    run(...p: unknown[]): { changes: number };
  };
  close(): void;
}

/** What `Databases.rows` writes for these rows. */
function frame(rows: Row[], columns: string[]): string {
  let out = `${columns.length};`;
  for (const name of columns) out += `${name.length}:${name}`;
  for (const row of rows) {
    for (const name of columns) {
      const value = row[name];
      if (value === null || value === undefined || value instanceof Uint8Array) out += 'n';
      else if (typeof value === 'string') out += `s${value.length}:${value}`;
      else if (typeof value === 'bigint' || Number.isInteger(value)) out += `i${value};`;
      else out += `f${value};`;
    }
  }
  return out;
}

function bridge() {
  const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => Db };
  const open = new Map<number, Db>();
  const log: string[] = [];
  return {
    log,
    isAvailable: () => true,
    sqlOpen(_name: string) {
      open.set(1, open.get(1) ?? new DatabaseSync(':memory:'));
      return 1;
    },
    sqlExec(db: number, source: string) {
      log.push(source.trim().split('\n')[0] ?? '');
      if (/\bjson_\w+\s*\(/i.test(source)) throw new Error('no such function');
      open.get(db)?.exec(source);
    },
    sqlRun(db: number, source: string, params: string) {
      log.push(source);
      if (/\bjson_\w+\s*\(/i.test(source)) throw new Error('no such function');
      return (
        open
          .get(db)
          ?.prepare(source)
          .run(...JSON.parse(params)).changes ?? 0
      );
    },
    sqlAll(db: number, source: string, params: string) {
      log.push(source);
      if (/\bjson_\w+\s*\(/i.test(source)) throw new Error('no such function');
      const statement = open.get(db)?.prepare(source) as unknown as {
        all(...p: unknown[]): Row[];
        columns(): Array<{ name: string }>;
      };
      return frame(
        statement.all(...JSON.parse(params)),
        statement.columns().map((c) => c.name),
      );
    },
    sqlClose(db: number) {
      open.get(db)?.close();
      open.delete(db);
    },
    sqlDelete(_name: string) {
      open.get(1)?.close();
      open.delete(1);
    },
  };
}

describe('decodeRows', () => {
  it('reads every kind of cell, with framing characters and any text inside', () => {
    const text = 'a;b:c "quoted" \\ \n line ✓ 𝄞';
    const rows: Row[] = [
      { id: 'x', n: 3, f: 1.5, v: null },
      { id: text, n: -9007199254740991, f: 1e21, v: '' },
    ];
    expect(decodeRows(frame(rows, ['id', 'n', 'f', 'v']))).toEqual([
      { id: 'x', n: 3, f: 1.5, v: null },
      { id: text, n: -9007199254740991, f: 1e21, v: '' },
    ]);
  });

  it('reads no rows', () => {
    expect(decodeRows(frame([], ['id']))).toEqual([]);
  });
});

describe('nativeDatabase', () => {
  it('serves BloomData’s persister (json: false), synchronously and not', async () => {
    const native = bridge();
    const database = nativeDatabase(native, 'bloom-data.db');
    const persister = sqlitePersister(
      () => database,
      () => database.deleteAsync(),
      {
        json: false,
      },
    );
    expect(persister.openNow?.({ versions: { post: 1 }, maxAgeMs: 1e9, keep: [] })).toBe(true);
    await persister.write({
      records: [
        { type: 'post', id: '1', json: '{"text":"a;b:c"}' },
        { type: 'post', id: '2', json: '{"text":"two"}' },
      ],
      lists: [{ type: 'feed', key: 'home', ids: ['1', '2'], json: '{"next":null}' }],
    });
    const stored = persister.readListNow?.('feed', 'home', 'post');
    expect(stored?.ids).toEqual(['1', '2']);
    expect(stored?.records).toHaveLength(2);
    expect(await persister.readRecords('post', ['2'])).toEqual([
      { id: '2', json: '{"text":"two"}' },
    ]);
    expect(native.log).toContain('BEGIN');
    expect(native.log).toContain('COMMIT');

    await expect(
      database.withTransactionAsync(async () => {
        await database.runAsync('DELETE FROM bloom_records');
        throw new Error('undone');
      }),
    ).rejects.toThrow('undone');
    expect(native.log).toContain('ROLLBACK');
    expect(database.getAllSync('SELECT id FROM bloom_records ORDER BY id')).toEqual([
      { id: '1' },
      { id: '2' },
    ]);
    await persister.destroy();
  });
});
