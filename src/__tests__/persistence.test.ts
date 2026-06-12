import {
  readPersistedTheme,
  readPersistedThemeSync,
  writePersistedTheme,
  type BloomThemeStorage,
} from '../theme/persistence';

function createSyncStorage(initial?: Record<string, string>): BloomThemeStorage & {
  store: Record<string, string>;
} {
  const store: Record<string, string> = { ...initial };
  return {
    store,
    getItem: (key) => (key in store ? store[key]! : null),
    setItem: (key, value) => {
      store[key] = value;
    },
  };
}

function createAsyncStorage(initial?: Record<string, string>): BloomThemeStorage & {
  store: Record<string, string>;
} {
  const store: Record<string, string> = { ...initial };
  return {
    store,
    getItem: (key) => Promise.resolve(key in store ? store[key]! : null),
    setItem: (key, value) => {
      store[key] = value;
      return Promise.resolve();
    },
  };
}

describe('readPersistedThemeSync', () => {
  it('returns kind=none when persistKey is missing', () => {
    expect(readPersistedThemeSync(undefined, createSyncStorage())).toEqual({ kind: 'none' });
  });

  it('returns kind=none when storage is missing', () => {
    expect(readPersistedThemeSync('k', undefined)).toEqual({ kind: 'none' });
  });

  it('detects async adapters', () => {
    expect(readPersistedThemeSync('k', createAsyncStorage())).toEqual({ kind: 'async' });
  });

  it('parses valid sync payloads', () => {
    const storage = createSyncStorage({ k: JSON.stringify({ mode: 'dark', colorPreset: 'blue' }) });
    expect(readPersistedThemeSync('k', storage)).toEqual({
      kind: 'sync',
      state: { mode: 'dark', colorPreset: 'blue' },
    });
  });

  it('returns sync/null on empty storage', () => {
    expect(readPersistedThemeSync('k', createSyncStorage())).toEqual({ kind: 'sync', state: null });
  });

  it('rejects malformed JSON', () => {
    const storage = createSyncStorage({ k: 'not-json' });
    expect(readPersistedThemeSync('k', storage)).toEqual({ kind: 'sync', state: null });
  });

  it('rejects unknown color presets', () => {
    const storage = createSyncStorage({ k: JSON.stringify({ colorPreset: 'not-a-preset' }) });
    expect(readPersistedThemeSync('k', storage)).toEqual({ kind: 'sync', state: null });
  });

  it('rejects unknown modes', () => {
    const storage = createSyncStorage({ k: JSON.stringify({ mode: 'rainbow' }) });
    expect(readPersistedThemeSync('k', storage)).toEqual({ kind: 'sync', state: null });
  });

  it('accepts partial payloads (mode only)', () => {
    const storage = createSyncStorage({ k: JSON.stringify({ mode: 'dark' }) });
    expect(readPersistedThemeSync('k', storage)).toEqual({
      kind: 'sync',
      state: { mode: 'dark', colorPreset: undefined },
    });
  });

  it('accepts partial payloads (preset only)', () => {
    const storage = createSyncStorage({ k: JSON.stringify({ colorPreset: 'purple' }) });
    expect(readPersistedThemeSync('k', storage)).toEqual({
      kind: 'sync',
      state: { mode: undefined, colorPreset: 'purple' },
    });
  });

  it('handles thrown getItem as sync/null', () => {
    const storage: BloomThemeStorage = {
      getItem: () => {
        throw new Error('boom');
      },
      setItem: () => undefined,
    };
    expect(readPersistedThemeSync('k', storage)).toEqual({ kind: 'sync', state: null });
  });
});

describe('readPersistedTheme', () => {
  it('reads async storage', async () => {
    const storage = createAsyncStorage({ k: JSON.stringify({ mode: 'dark' }) });
    await expect(readPersistedTheme('k', storage)).resolves.toEqual({
      mode: 'dark',
      colorPreset: undefined,
    });
  });

  it('returns null when persistence is off', async () => {
    await expect(readPersistedTheme(undefined, createAsyncStorage())).resolves.toBeNull();
    await expect(readPersistedTheme('k', undefined)).resolves.toBeNull();
  });

  it('swallows storage errors', async () => {
    const storage: BloomThemeStorage = {
      getItem: () => Promise.reject(new Error('boom')),
      setItem: () => Promise.resolve(),
    };
    await expect(readPersistedTheme('k', storage)).resolves.toBeNull();
  });
});

describe('writePersistedTheme', () => {
  it('serializes only defined keys', async () => {
    const storage = createSyncStorage();
    await writePersistedTheme('k', storage, { mode: 'dark' });
    expect(JSON.parse(storage.store.k!)).toEqual({ mode: 'dark' });
  });

  it('serializes both keys when both are present', async () => {
    const storage = createSyncStorage();
    await writePersistedTheme('k', storage, { mode: 'light', colorPreset: 'oxy' });
    expect(JSON.parse(storage.store.k!)).toEqual({ mode: 'light', colorPreset: 'oxy' });
  });

  it('is a no-op when persistence is off', async () => {
    const storage = createSyncStorage();
    await writePersistedTheme(undefined, storage, { mode: 'dark' });
    expect(storage.store.k).toBeUndefined();
  });

  it('swallows storage errors', async () => {
    const storage: BloomThemeStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('boom');
      },
    };
    await expect(
      writePersistedTheme('k', storage, { mode: 'dark' }),
    ).resolves.toBeUndefined();
  });
});
