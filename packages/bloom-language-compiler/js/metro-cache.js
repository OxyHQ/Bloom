// Not read from ./compile: the config loads without loading the native compiler.
const os = require('node:os');
const path = require('node:path');

const { isCurrent } = require('./dependencies');

/**
 * Metro keys a cached transform by the config and the module's own content,
 * per file, and its transformer cannot add to that key. A `.bloom` module's
 * output also depends on what it imports (another module's structs and
 * views, a TS component or value, its types), so a cached `.bloom` transform
 * carries the files its compile read with their digests (under this key, set
 * by `./metro-transformer`), and every cache store `withBloomLanguage` wraps
 * answers it as a miss once one of them has changed. Metro then transforms
 * the module again and stores the new result.
 *
 * Within one running Metro, a module is transformed again when it changes, so
 * an edited declaration reaches the `.bloom` modules importing it when they
 * next change or Metro next starts, never from a stale cache.
 */
const DEPENDENCIES = 'bloomLanguageDependencies';
const WRAPPED = Symbol.for('@oxy.so/bloom-language-compiler/checks-imports');

/** `store`, answering a cached `.bloom` transform whose imports changed as a miss. */
function checkingImports(store) {
  if (store[WRAPPED]) return store;
  // Every call goes to the store itself: a store with private fields (Expo's
  // `BinaryFileStore`, behind its `VaryingCacheStore`) throws when its methods run on
  // another object, as they would on an `Object.create(store)`.
  return {
    [WRAPPED]: true,
    name: store.name ?? store.constructor?.name,
    get: async (key) => {
      const value = await store.get(key);
      const dependencies = value?.[DEPENDENCIES];
      return dependencies && !isCurrent(dependencies) ? null : value;
    },
    set: (key, value) => store.set(key, value),
    clear: () => store.clear?.(),
  };
}

/**
 * A config's `cacheStores` (a list, a function of `metro-cache`, or none for
 * Metro's default), each store wrapped by `checkingImports`.
 */
function withImportCheckingStores(stores) {
  if (typeof stores === 'function') return (MetroCache) => stores(MetroCache).map(checkingImports);
  if (stores) return stores.map(checkingImports);
  // Metro's default store, as metro-config makes it.
  return (MetroCache) => [
    checkingImports(new MetroCache.FileStore({ root: path.join(os.tmpdir(), 'metro-cache') })),
  ];
}

module.exports = { DEPENDENCIES, checkingImports, withImportCheckingStores };
