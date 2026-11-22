import 'fake-indexeddb/auto';
import { entity, type Persister, Store, setActiveStore } from '../index';
import { indexedDbPersister } from '../indexeddb';
import { sqlitePersister } from '../sqlite';
import { openTestDatabase, resetFiles } from './support/sqlite';

interface Thread {
  id: string;
  title: string;
}
/** A conversation with its messages: only the two written last stay on disk. */
const Thread = entity<Thread>('retention-thread', { id: (t) => t.id, persist: { keep: 2 } });
interface Conversation {
  id: string;
  messages: Array<{ text: string; streaming?: boolean }>;
  draft?: boolean;
}
/** Its last two finished messages go to disk; a draft is not written at all. */
const Conversation = entity<Conversation>('retention-conversation', {
  id: (c) => c.id,
  persist: {
    trim: (conversation) =>
      conversation.draft
        ? null
        : {
            ...conversation,
            messages: conversation.messages.filter((m) => !m.streaming).slice(-2),
          },
  },
});

/** Unbounded, written in the same batches. */
const Note = entity<Thread>('retention-note', { id: (n) => n.id, persist: true });

let counter = 0;
const fresh = () => {
  counter += 1;
  return `retention-${counter}`;
};
const copies: Record<string, () => () => Persister> = {
  sqlite: () => {
    const file = `${fresh()}.db`;
    return () => sqlitePersister(async () => openTestDatabase(file));
  },
  indexeddb: () => {
    const name = fresh();
    return () => indexedDbPersister(name);
  },
};

const stores: Store[] = [];
function launch(persister: Persister): Store {
  const store = new Store({ persister });
  stores.push(store);
  setActiveStore(store);
  return store;
}
/** A write a moment after the last, so it is newer on disk. */
async function write(store: Store, fn: () => void): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 3));
  fn();
  await store.flush();
}

afterEach(async () => {
  await Promise.all(stores.splice(0).map((store) => store.close()));
  resetFiles();
});

describe.each(Object.keys(copies))('persist.keep (%s)', (kind) => {
  it('keeps the newest rows on disk, holds every one in memory, and restores the kept ones', async () => {
    const copy = (copies[kind] as () => () => Persister)();
    const first = launch(copy());
    await write(first, () => Thread.put({ id: 't1', title: 'one' }));
    await write(first, () => Thread.put({ id: 't2', title: 'two' }));
    await write(first, () => {
      Thread.put({ id: 't3', title: 'three' });
      Note.put([
        { id: 'n1', title: 'a' },
        { id: 'n2', title: 'b' },
        { id: 'n3', title: 'c' },
      ]);
    });
    // Memory holds whatever is loaded.
    expect(Thread.ids().sort()).toEqual(['t1', 't2', 't3']);
    // Writing t1 again makes it the newest: t2 is now the oldest, past the bound.
    await write(first, () => Thread.merge('t1', { title: 'one, again' }));
    await first.close();

    launch(copy());
    await Thread.load(['t1', 't2', 't3']);
    await Note.load(['n1', 'n2', 'n3']);
    expect(Thread.get('t1')?.title).toBe('one, again');
    expect(Thread.get('t2')).toBeUndefined();
    expect(Thread.get('t3')?.title).toBe('three');
    expect(Note.ids().sort()).toEqual(['n1', 'n2', 'n3']);
  });

  it('stores what trim returns, keeps the whole record in memory, and skips a null', async () => {
    const copy = (copies[kind] as () => () => Persister)();
    const first = launch(copy());
    const messages = [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd', streaming: true }];
    await write(first, () =>
      Conversation.put([
        { id: 'c1', messages },
        { id: 'c2', messages: [{ text: 'saved' }] },
      ]),
    );
    // A draft now: c2's write is skipped, so its stored row stays as it was.
    await write(first, () =>
      Conversation.merge('c2', { draft: true, messages: [{ text: 'saved' }, { text: 'draft' }] }),
    );
    expect(Conversation.get('c1')?.messages).toEqual(messages);
    expect(Conversation.get('c2')?.messages).toHaveLength(2);
    await first.close();

    launch(copy());
    await Conversation.load(['c1', 'c2']);
    expect(Conversation.get('c1')?.messages).toEqual([{ text: 'b' }, { text: 'c' }]);
    expect(Conversation.get('c2')).toEqual({ id: 'c2', messages: [{ text: 'saved' }] });
  });
});
