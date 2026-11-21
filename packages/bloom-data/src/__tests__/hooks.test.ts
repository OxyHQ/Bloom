import { entity, list, setActiveStore, Store } from '../index';
import { sqlitePersister } from '../sqlite';
import { openTestDatabase, resetFiles } from './support/sqlite';

interface Boost {
  id: string;
  original?: { id: string } | null;
}

describe('entity combine and onStore', () => {
  const stored: string[][] = [];
  const Item = entity<Boost>('accept-item', {
    id: (item) => item.id,
    // A boost that lost its original never replaces one that has it.
    combine: (incoming, held) => (incoming.original || !held.original ? incoming : held),
    onStore: (records) => stored.push(records.map((record) => record.id)),
  });

  beforeEach(() => {
    setActiveStore(new Store());
    stored.length = 0;
  });

  it('keeps the held record when the incoming one is refused', () => {
    Item.put({ id: 'b', original: { id: 'o' } });
    Item.put({ id: 'b', original: null });
    expect(Item.get('b')?.original).toEqual({ id: 'o' });
    Item.put({ id: 'c', original: null });
    expect(Item.get('c')).toEqual({ id: 'c', original: null });
  });

  it('reports what each batch stored, once', () => {
    Item.put([
      { id: '1', original: null },
      { id: '2', original: null },
    ]);
    Item.put({ id: '3' });
    expect(stored).toEqual([['1', '2'], ['3']]);
  });
});

describe('list persistence rule', () => {
  afterEach(() => resetFiles());

  it('copies only the keys the rule picks', async () => {
    const db = openTestDatabase('rule.db');
    const store = new Store({ persister: sqlitePersister(async () => db) });
    setActiveStore(store);
    const Row = entity<{ id: string }>('rule-row', { id: (row) => row.id, persist: true });
    const Rows = list('rule-rows', { of: Row, persist: (key) => !key.startsWith('scoped:') });
    const state = {
      ids: [],
      extra: undefined,
      next: undefined,
      hasMore: false,
      visited: [],
      updatedAt: 1,
      origin: 'local' as const,
    };
    Rows.set('home', () => state);
    Rows.set('scoped:search', () => state);
    await store.flush();
    expect(db.rows('SELECT key FROM bloom_lists')).toEqual([{ key: 'home' }]);
    await store.close();
  });
});
