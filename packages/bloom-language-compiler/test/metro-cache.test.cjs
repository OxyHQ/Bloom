// The Metro adapter's cache stores (js/metro-cache.js) call the store they wrap, so a
// store with private fields (Expo's BinaryFileStore) still clears and writes.
const assert = require('node:assert/strict');
const { test } = require('node:test');

const { checkingImports } = require('../js/metro-cache');

class PrivateStore {
  #items = new Map();
  #cleared = 0;
  get name() {
    return 'PrivateStore';
  }
  async get(key) {
    return this.#items.get(key) ?? null;
  }
  async set(key, value) {
    this.#items.set(key, value);
  }
  clear() {
    this.#cleared += 1;
    this.#items.clear();
  }
  get cleared() {
    return this.#cleared;
  }
}

test('a store with private fields is wrapped, and still gets, sets and clears', async () => {
  const store = new PrivateStore();
  const wrapped = checkingImports(store);
  await wrapped.set('k', { code: 'x' });
  assert.deepEqual(await wrapped.get('k'), { code: 'x' });
  wrapped.clear();
  assert.equal(store.cleared, 1);
  assert.equal(await wrapped.get('k'), null);
  assert.equal(checkingImports(wrapped), wrapped);
  assert.equal(wrapped.name, 'PrivateStore');
});
