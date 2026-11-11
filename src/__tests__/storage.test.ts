import { Platform } from 'react-native';

import { createStorage } from '../storage';
import { createBloomThemeStorage } from '../theme/persistence';

function memory() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: async (k: string) => map.get(k) ?? null,
    setItem: async (k: string, v: string) => void map.set(k, v),
    removeItem: async (k: string) => void map.delete(k),
  };
}

describe('createStorage', () => {
  it('stores typed JSON under a namespace, removes on null and never rejects', async () => {
    const adapter = memory();
    const errors: string[] = [];
    const store = createStorage('app', { adapter, onError: (_e, op) => errors.push(op) });
    expect(await store.set('draft', { title: 'x' })).toBe(true);
    expect(adapter.map.get('app:draft')).toBe('{"title":"x"}');
    expect(await store.get<{ title: string }>('draft')).toEqual({ title: 'x' });
    expect(await store.set('draft', null)).toBe(true);
    expect(await store.get('draft')).toBeNull();

    adapter.map.set('app:bad', '{nope');
    expect(await store.get('bad')).toBeNull();
    adapter.setItem = async () => {
      throw new Error('full');
    };
    expect(await store.set('k', 1)).toBe(false);
    expect(errors).toEqual(['get', 'set']);

    // An empty namespace keeps raw keys, to adopt data an app already stored.
    adapter.map.set('raw', '1');
    expect(await createStorage('', { adapter }).get<number>('raw')).toBe(1);
  });
});

describe('createBloomThemeStorage', () => {
  it('pairs the key with the adapter on native and refuses an empty key', () => {
    Platform.OS = 'ios';
    const adapter = memory();
    expect(createBloomThemeStorage('noted.bloom.theme', adapter)).toEqual({
      persistKey: 'noted.bloom.theme',
      storage: adapter,
    });
    expect(() => createBloomThemeStorage(' ')).toThrow('persistKey');
  });
});
