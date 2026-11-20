import { createAccounts, setActiveStore, source, Store, useList } from '../index';
import { sqlitePersister } from '../sqlite';
import { Feed, Post, post, User } from './fixtures';
import { render, settle, update } from './support/render';
import { openTestDatabase, resetFiles, type TestDatabase } from './support/sqlite';

const stores: Store[] = [];
function open(name: string): { store: Store; db: () => TestDatabase } {
  let db: TestDatabase | undefined;
  const store = new Store({
    persister: sqlitePersister(async () => {
      db = openTestDatabase(name);
      return db;
    }),
  });
  stores.push(store);
  setActiveStore(store);
  return {
    store,
    db: () => {
      if (!db) throw new Error('database not opened yet');
      return db;
    },
  };
}

afterEach(async () => {
  await Promise.all(stores.splice(0).map((store) => store.close()));
  resetFiles();
});

const feedPage = (ids: string[]) => ({ items: ids.map((id) => post(id)), extra: { cards: [] } });

describe('durable copy', () => {
  it('writes in the background after the frame, in one transaction', async () => {
    const { store, db } = open('a.db');
    await store.ready();
    const before = db().log.length;
    Post.put([post('1'), post('2')]);
    expect(db().log.length).toBe(before);
    await store.flush();
    const written = db().log.slice(before);
    expect(written[0]).toBe('BEGIN');
    expect(written[written.length - 1]).toBe('COMMIT');
    expect(written.filter((sql) => sql.startsWith('BEGIN'))).toHaveLength(1);
    const rows = db().rows('SELECT type, id FROM bloom_records ORDER BY type, id');
    expect(rows).toEqual([
      { type: 'test-post', id: '1' },
      { type: 'test-post', id: '2' },
      { type: 'test-user', id: 'u-1' },
      { type: 'test-user', id: 'u-2' },
    ]);
  });

  it('stores records normalised and deletes removed ones', async () => {
    const { store, db } = open('a.db');
    Post.put(post('1', { quotedPost: post('q') }));
    await store.flush();
    const [row] = db().rows("SELECT json FROM bloom_records WHERE id = '1'");
    expect(JSON.parse(String(row?.json))).toMatchObject({ user: 'u-1', quotedPost: 'q' });
    Post.remove('1');
    await store.flush();
    expect(db().rows("SELECT id FROM bloom_records WHERE id = '1'")).toEqual([]);
  });

  it('reads a list from disk when a screen opens, shows it, and reads the network after', async () => {
    const first = open('a.db');
    const feed = source(Feed, {
      key: (type: string) => type,
      load: async () => feedPage(['1', '2']),
      fold: (_current, extra) => extra ?? { cards: [] },
    });
    await feed.fetch('home');
    await first.store.close();

    const second = open('a.db');
    let answer!: (page: ReturnType<typeof feedPage>) => void;
    const reopened = source(Feed, {
      key: (type: string) => type,
      load: () => new Promise<ReturnType<typeof feedPage>>((resolve) => (answer = resolve)),
      fold: (_current, extra) => extra ?? { cards: [] },
    });
    // Nothing is read while React renders: the disk read starts after commit,
    // so the first render has no rows and no origin.
    function Home() {
      const view = useList(reopened, 'home');
      return <>{`${view.origin}:${view.ids.join(',')}`}</>;
    }
    const tree = render(<Home />);
    expect(tree.toJSON()).toBe('undefined:');
    await settle(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(tree.toJSON()).toBe('disk:1,2');
    expect(Post.get('1')?.user.name).toBe('User 1');
    await settle(() => answer(feedPage(['3'])));
    expect(tree.toJSON()).toBe('network:3');
    update(() => tree.unmount());
  });

  it('never lets the disk copy overwrite a record written since the screen opened', async () => {
    const first = open('a.db');
    Post.put(post('1', { text: 'old' }));
    await first.store.close();
    open('a.db');
    Post.put(post('1', { text: 'new' }));
    await Post.load(['1']);
    expect(Post.get('1')?.text).toBe('new');
  });

  it('drops a type’s rows when its schema version changes', async () => {
    const { store, db } = open('a.db');
    Post.put(post('1'));
    await store.flush();
    const persister = sqlitePersister(async () => openTestDatabase('a.db'));
    await persister.open({ versions: { 'test-post': 2, 'test-user': 1 }, maxAgeMs: 1e9 });
    expect(db().rows("SELECT id FROM bloom_records WHERE type = 'test-post'")).toEqual([]);
    expect(db().rows("SELECT id FROM bloom_records WHERE type = 'test-user'")).toHaveLength(1);
  });

  it('keeps one file per account, and an account switch flushes to the old file', async () => {
    const files: string[] = [];
    const accounts = createAccounts({
      persister: (account) =>
        sqlitePersister(async () => {
          files.push(account);
          return openTestDatabase(`${account}.db`);
        }),
    });
    accounts.open('alice');
    User.put({ id: 'me', name: 'Alice' });
    const alice = accounts.store as Store;
    accounts.open('bob');
    expect(alice.closed).toBe(true); // at once; its queued write still goes to Alice's file
    expect(User.get('me')).toBeUndefined();
    User.put({ id: 'me', name: 'Bob' });
    await accounts.close();
    await alice.close();
    accounts.open('alice');
    await User.load(['me']);
    expect(User.get('me')?.name).toBe('Alice');
    await accounts.close();
    expect(new Set(files)).toEqual(new Set(['alice', 'bob']));
    expect(
      openTestDatabase('bob.db').rows("SELECT json FROM bloom_records WHERE id = 'me'"),
    ).toEqual([{ json: JSON.stringify({ id: 'me', name: 'Bob' }) }]);
  });
});
