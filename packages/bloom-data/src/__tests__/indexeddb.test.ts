import 'fake-indexeddb/auto';
import { createAccounts, entity, list, model, Store, withStore } from '../index';
import { indexedDbPersister } from '../indexeddb';

interface Note {
  id: string;
  text: string;
}
const Note = entity<Note>('idb-note', { id: (n) => n.id, persist: { version: 1 } });
const Notes = list('idb-notes', { of: Note, persist: true });
const Theme = model<string>('idb-theme', { persist: true });

let counter = 0;
const freshName = () => `idb-test-${(counter += 1)}`;

describe('indexedDbPersister', () => {
  it('keeps records, lists and models across a restart', async () => {
    const name = freshName();
    const first = new Store({ persister: indexedDbPersister(name) });
    withStore(first, () => {
      Note.put([
        { id: 'a', text: 'one' },
        { id: 'b', text: 'two' },
      ]);
      Notes.set('all', () => ({
        ids: ['a', 'b'],
        extra: undefined,
        next: undefined,
        hasMore: false,
        visited: [],
        updatedAt: 1,
        origin: 'local',
      }));
      Theme.set('dark');
    });
    await first.close();

    const second = new Store({ persister: indexedDbPersister(name) });
    expect(await withStore(second, () => Notes.load('all'))).toBe(true);
    await withStore(second, () => Theme.load());
    withStore(second, () => {
      expect(Notes.get('all')?.ids).toEqual(['a', 'b']);
      expect(Note.get('b')?.text).toBe('two');
      expect(Theme.get()).toBe('dark');
    });
    await second.close();
  });

  it('deletes a record and drops a type whose version changed', async () => {
    const name = freshName();
    const persister = indexedDbPersister(name);
    await persister.open({ versions: { 'idb-note': 1 }, maxAgeMs: 1e9, keep: [] });
    await persister.write({
      records: [
        { type: 'idb-note', id: 'a', json: '{"id":"a"}' },
        { type: 'idb-note', id: 'b', json: '{"id":"b"}' },
      ],
      lists: [],
    });
    await persister.write({ records: [{ type: 'idb-note', id: 'a', json: null }], lists: [] });
    expect(await persister.readRecords('idb-note', ['a', 'b'])).toEqual([
      { id: 'b', json: '{"id":"b"}' },
    ]);
    await persister.close();
    const reopened = indexedDbPersister(name);
    await reopened.open({ versions: { 'idb-note': 2 }, maxAgeMs: 1e9, keep: [] });
    expect(await reopened.readRecords('idb-note', ['b'])).toEqual([]);
    await reopened.close();
  });

  it('ages out old rows on the first write, except the kept types', async () => {
    const name = freshName();
    const persister = indexedDbPersister(name);
    await persister.open({ versions: {}, maxAgeMs: 1e9, keep: [] });
    await persister.write({
      records: [
        { type: 'old', id: '1', json: '{}' },
        { type: 'setting', id: 'value', json: '"x"' },
      ],
      lists: [],
    });
    await persister.close();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const later = indexedDbPersister(name);
    await later.open({ versions: {}, maxAgeMs: 1, keep: ['setting'] });
    await later.write({ records: [], lists: [] });
    expect(await later.readRecords('old', ['1'])).toEqual([]);
    expect(await later.readRecords('setting', ['value'])).toEqual([{ id: 'value', json: '"x"' }]);
    await later.close();
  });
});

describe('createAccounts().forget', () => {
  it("closes the account's store and deletes its copy", async () => {
    const prefix = freshName();
    const accounts = createAccounts({
      persister: (account) => indexedDbPersister(`${prefix}-${account}`),
    });
    const alice = accounts.open('alice');
    withStore(alice, () => Note.put({ id: 'a', text: 'private' }));
    await accounts.forget('alice');
    expect(alice.closed).toBe(true);
    expect(accounts.store).toBeUndefined();

    const again = accounts.open('alice');
    await withStore(again, () => Note.load(['a']));
    expect(withStore(again, () => Note.get('a'))).toBeUndefined();
    await accounts.close();
  });
});
