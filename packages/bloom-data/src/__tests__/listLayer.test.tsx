import { action, type ListState, setActiveStore, source, Store, useListState } from '../index';
import { sqlitePersister } from '../sqlite';
import { Feed, Post, post } from './fixtures';
import { render, settle, update } from './support/render';
import { openTestDatabase, resetFiles } from './support/sqlite';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const held = (ids: string[]): ListState<{ cards: string[] }> => ({
  ids,
  extra: { cards: [] },
  next: undefined,
  hasMore: false,
  visited: [],
  updatedAt: 1,
  origin: 'network',
});

function seed(ids: string[]) {
  Post.put(ids.map((id) => post(id)));
  Feed.set('home', () => held(ids));
}

let server = deferred<void>();
const archive = action({
  optimistic: (id: string) => Feed.remove('home', [id]),
  run: () => server.promise,
});

let store: Store;
beforeEach(() => {
  server = deferred<void>();
  store = new Store();
  setActiveStore(store);
});
afterEach(async () => {
  await store.close();
  resetFiles();
});

describe('list layers', () => {
  it('shows a remove at once, then writes it into the list on success', async () => {
    seed(['1', '2', '3']);
    const done = archive('2');
    expect(Feed.get('home')?.ids).toEqual(['1', '3']);
    // The list's own state is untouched while the call is in flight.
    expect(store.listSlot(Feed.definition, 'home')?.base?.ids).toEqual(['1', '2', '3']);
    server.resolve();
    await done;
    expect(Feed.get('home')?.ids).toEqual(['1', '3']);
    expect(store.listSlot(Feed.definition, 'home')?.base?.ids).toEqual(['1', '3']);
    expect(store.listSlot(Feed.definition, 'home')?.layers).toBeUndefined();
  });

  it('rolls a remove back when the server refuses it', async () => {
    seed(['1', '2', '3']);
    const done = archive('2');
    expect(Feed.get('home')?.ids).toEqual(['1', '3']);
    server.reject(new Error('refused'));
    await expect(done).rejects.toThrow('refused');
    expect(Feed.get('home')?.ids).toEqual(['1', '2', '3']);
  });

  it('keeps what the reader sees while a refresh lands beneath the layer', async () => {
    seed(['1', '2', '3']);
    const pages = [['0', '1', '2', '3']];
    const feed = source(Feed, {
      key: (key: string) => key,
      load: async () => ({ items: (pages.shift() ?? []).map((id) => post(id)) }),
      fold: () => ({ cards: [] }),
    });
    const compose = action({
      optimistic: () => {
        Post.put(post('new'));
        Feed.insert('home', ['new'], 0);
        Feed.remove('home', ['2']);
      },
      run: () => server.promise,
    });
    const done = compose();
    expect(Feed.get('home')?.ids).toEqual(['new', '1', '3']);
    // The refresh still carries '2' and does not carry 'new' yet.
    await feed.refresh('home');
    expect(store.listSlot(Feed.definition, 'home')?.base?.ids).toEqual(['0', '1', '2', '3']);
    expect(Feed.get('home')?.ids).toEqual(['new', '0', '1', '3']);
    server.resolve();
    await done;
    expect(store.listSlot(Feed.definition, 'home')?.base?.ids).toEqual(['new', '0', '1', '3']);
    expect(Feed.get('home')?.ids).toEqual(['new', '0', '1', '3']);
  });

  it('inserts and moves, in a layer and as plain local writes', async () => {
    seed(['1', '2', '3']);
    const pin = action({
      optimistic: (id: string) => Feed.move('home', id, 0),
      run: () => server.promise,
    });
    const done = pin('3');
    expect(Feed.get('home')?.ids).toEqual(['3', '1', '2']);
    server.resolve();
    await done;
    expect(store.listSlot(Feed.definition, 'home')?.base?.ids).toEqual(['3', '1', '2']);

    // Outside an action: local writes, with no layer.
    Feed.insert('home', ['4', '1']);
    expect(Feed.get('home')?.ids).toEqual(['3', '1', '2', '4']);
    Feed.insert('home', ['5'], 1);
    Feed.move('home', '4', 1);
    expect(Feed.get('home')?.ids).toEqual(['3', '4', '5', '1', '2']);
    Feed.prepend('home', ['6', '3']);
    expect(Feed.get('home')?.ids).toEqual(['6', '3', '4', '5', '1', '2']);
    expect(store.listSlot(Feed.definition, 'home')?.layers).toBeUndefined();
  });

  it('is what useListState reads', async () => {
    seed(['1', '2']);
    const seen: Array<readonly string[] | undefined> = [];
    function Reader() {
      seen.push(useListState(Feed, 'home')?.ids);
      return null;
    }
    const tree = render(<Reader />);
    let done: Promise<unknown> = Promise.resolve();
    await settle(() => {
      done = archive('1');
    });
    expect(seen[seen.length - 1]).toEqual(['2']);
    await settle(async () => {
      server.reject(new Error('refused'));
      await done.catch(() => undefined);
    });
    expect(seen[seen.length - 1]).toEqual(['1', '2']);
    update(() => tree.unmount());
  });

  it('never writes a layer to the durable copy', async () => {
    await store.close();
    const db = openTestDatabase('layers.db');
    store = new Store({ persister: sqlitePersister(async () => db) });
    setActiveStore(store);
    seed(['1', '2', '3']);
    const done = archive('2');
    await store.flush();
    const stored = () =>
      JSON.parse(String(db.rows("SELECT ids FROM bloom_lists WHERE key = 'home'")[0]?.ids));
    expect(stored()).toEqual(['1', '2', '3']);
    server.resolve();
    await done;
    await store.flush();
    expect(stored()).toEqual(['1', '3']);
  });
});
