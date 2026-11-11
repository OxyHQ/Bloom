import { Platform } from 'react-native';

import { type BloomThemeStorage, webLocalStorage } from '../theme/persistence';

/**
 * A key-value store of strings, synchronous or not: `localStorage`, an
 * `AsyncStorage` (`@react-native-async-storage/async-storage`) or an MMKV
 * wrapper all fit. The same shape `BloomProvider` persists the theme through.
 */
export type BloomStorageAdapter = BloomThemeStorage;

export interface JsonStorage {
  /** The stored value, or `null` when absent, unreadable or not valid JSON. */
  get<T>(key: string): Promise<T | null>;
  /** Stores `value` as JSON; `null` or `undefined` removes the key. `false` when the write failed. */
  set<T>(key: string, value: T | null | undefined): Promise<boolean>;
  /** Removes the key. `false` when it failed. */
  remove(key: string): Promise<boolean>;
}

export interface CreateStorageOptions {
  /**
   * Where the strings live. Default: `localStorage` on web; on native pass an
   * `AsyncStorage`-compatible adapter — with none, values are kept in memory
   * for the session only (right for tests and server rendering, wrong for an
   * app, which is why a native app passes one).
   */
  adapter?: BloomStorageAdapter;
  /** Called with a failed read, write or parse. Default: nothing — a store is best-effort. */
  onError?: (error: unknown, operation: 'get' | 'set' | 'remove', key: string) => void;
}

function memoryAdapter(): BloomStorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

/**
 * A typed JSON store under a namespace: keys are written as `namespace:key`, so
 * two features (or two apps on one origin) cannot collide, and an empty
 * namespace keeps raw keys, which is how an app adopts it over data it already
 * stored. Every operation is best-effort and resolves — a full disk, a private
 * window or a corrupt value yields `null`/`false`, never a rejection.
 *
 * ```ts
 * const storage = createStorage('homiio', { adapter: AsyncStorage });
 * await storage.set('draft', { title });
 * const draft = await storage.get<Draft>('draft');
 * ```
 */
export function createStorage(namespace: string, options: CreateStorageOptions = {}): JsonStorage {
  const adapter =
    options.adapter ??
    (Platform.OS === 'web' && webLocalStorage ? webLocalStorage : memoryAdapter());
  const scoped = (key: string) => (namespace ? `${namespace}:${key}` : key);
  const fail = (error: unknown, operation: 'get' | 'set' | 'remove', key: string) => {
    options.onError?.(error, operation, key);
  };

  async function remove(key: string): Promise<boolean> {
    try {
      if (typeof adapter.removeItem === 'function') await adapter.removeItem(scoped(key));
      else await adapter.setItem(scoped(key), '');
      return true;
    } catch (error) {
      fail(error, 'remove', key);
      return false;
    }
  }

  return {
    async get<T>(key: string): Promise<T | null> {
      try {
        const raw = await adapter.getItem(scoped(key));
        return raw ? (JSON.parse(raw) as T) : null;
      } catch (error) {
        fail(error, 'get', key);
        return null;
      }
    },
    async set<T>(key: string, value: T | null | undefined): Promise<boolean> {
      if (value === null || value === undefined) return remove(key);
      try {
        await adapter.setItem(scoped(key), JSON.stringify(value));
        return true;
      } catch (error) {
        fail(error, 'set', key);
        return false;
      }
    },
    remove,
  };
}
