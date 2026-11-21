import { action, DataProvider, model, setActiveStore, Store, useModel, withStore } from '../index';
import { sqlitePersister } from '../sqlite';
import { render, settle, update } from './support/render';
import { openTestDatabase, resetFiles } from './support/sqlite';

const Language = model<string>('model-test-language', { persist: true });
const Settings = model<{ theme: string; sounds: boolean }>('model-test-settings', {
  persist: { version: 1 },
});

afterEach(() => resetFiles());

describe('model', () => {
  it('holds one value per store', () => {
    const a = new Store();
    const b = new Store();
    withStore(a, () => Language.set('en'));
    expect(withStore(a, () => Language.get())).toBe('en');
    expect(withStore(b, () => Language.get())).toBeUndefined();
    withStore(a, () => Language.set((current) => `${current}-GB`));
    expect(withStore(a, () => Language.get())).toBe('en-GB');
    withStore(a, () => Language.clear());
    expect(withStore(a, () => Language.get())).toBeUndefined();
  });

  it('is an action layer inside optimistic, and rolls back with it', async () => {
    const store = new Store();
    setActiveStore(store);
    Settings.set({ theme: 'light', sounds: true });
    const toggle = action({
      optimistic: () => Settings.set((current) => ({ theme: 'dark', sounds: !!current?.sounds })),
      run: async () => {
        throw new Error('refused');
      },
    });
    const call = toggle();
    expect(Settings.get()?.theme).toBe('dark');
    await call.catch(() => undefined);
    expect(Settings.get()).toEqual({ theme: 'light', sounds: true });
  });

  it('survives a restart, and is never aged out', async () => {
    const first = new Store({
      persister: sqlitePersister(async () => openTestDatabase('model.db')),
      persistMaxAgeMs: 1,
    });
    withStore(first, () => Language.set('es'));
    await first.close();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = new Store({
      persister: sqlitePersister(async () => openTestDatabase('model.db')),
      persistMaxAgeMs: 1,
    });
    // A write (which prunes) before the read: the value must survive it.
    withStore(second, () => Settings.set({ theme: 'dark', sounds: false }));
    await second.flush();
    await withStore(second, () => Language.load());
    expect(withStore(second, () => Language.get())).toBe('es');
    await second.close();
  });
});

describe('useModel', () => {
  it('reads the value, loads it from disk on mount, and re-renders on change', async () => {
    const seed = new Store({ persister: sqlitePersister(async () => openTestDatabase('use.db')) });
    withStore(seed, () => Language.set('fr'));
    await seed.close();
    const store = new Store({ persister: sqlitePersister(async () => openTestDatabase('use.db')) });
    const seen: Array<string | undefined> = [];
    const lengths: number[] = [];
    function Reader() {
      seen.push(useModel(Language));
      lengths.push(useModel(Language, (value) => value?.length ?? 0));
      return null;
    }
    render(
      <DataProvider store={store}>
        <Reader />
      </DataProvider>,
    );
    await settle();
    expect(seen[seen.length - 1]).toBe('fr');
    update(() => withStore(store, () => Language.set('de-AT')));
    expect(seen[seen.length - 1]).toBe('de-AT');
    expect(lengths[lengths.length - 1]).toBe(5);
    await store.close();
  });

  it('reads a model from another store than the tree’s', () => {
    const device = new Store();
    withStore(device, () => Language.set('it'));
    const seen: Array<string | undefined> = [];
    function Reader() {
      seen.push(useModel(Language, device));
      return null;
    }
    render(
      <DataProvider store={new Store()}>
        <Reader />
      </DataProvider>,
    );
    expect(seen[seen.length - 1]).toBe('it');
  });
});
