import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  createControllerModeAdapter,
  CONTROLLER_WASM_SHA256,
} from '../assets/character-runtime/controller-mode.mjs';
import { sha256Bytes } from '../assets/character-runtime/sha256.mjs';

const originalBytes = await readFile(
  new URL('../assets/character-runtime/orbit-characters.wasm', import.meta.url),
);
test('HTTP fallback hashes padding boundaries and original WASM against independent SHA-256', () => {
  for (const length of [0, 1, 55, 56, 63, 64, 65, 127, 128, 129, 1024]) {
    const bytes = randomBytes(length);
    assert.equal(
      sha256Bytes(bytes),
      createHash('sha256').update(bytes).digest('hex'),
    );
  }
  assert.equal(sha256Bytes(originalBytes), CONTROLLER_WASM_SHA256);
});

test('guarded controller toggle rejects corrupt bytes before instantiation and fails closed on invalid handles', async () => {
  const previousFetch = globalThis.fetch;
  const previousInstantiate = WebAssembly.instantiate;
  let instantiations = 0;
  const memory = new WebAssembly.Memory({ initial: 3 });
  WebAssembly.instantiate = async () => {
    instantiations++;
    return { instance: { exports: { Vd: memory } } };
  };
  try {
    globalThis.fetch = async () =>
      new Response(new Uint8Array([0, 97, 115, 109]));
    const corrupt = createControllerModeAdapter('original.wasm');
    corrupt.instantiateWasm({}, () =>
      assert.fail('corrupt bytes instantiated'),
    );
    await assert.rejects(corrupt.failure, /integrity mismatch/);
    assert.equal(instantiations, 0);

    globalThis.fetch = async () => new Response(originalBytes);
    const adapter = createControllerModeAdapter('original.wasm');
    await Promise.race([
      new Promise((resolve) => adapter.instantiateWasm({}, resolve)),
      adapter.failure,
    ]);
    assert.equal(instantiations, 1);
    const handle = 1024,
      impl = 4096;
    let view = new DataView(memory.buffer);
    view.setUint32(handle, impl, true);
    view.setUint32(impl + 74772, 4001288, true);
    view.setUint8(impl + 74640, 0); // Restore binds before readiness/first paint.
    view.setUint8(impl + 3015, 1);
    let deleted = false;
    const character = { $$: { ptr: handle }, isDeleted: () => deleted };
    adapter.register(character, true);
    assert.throws(() => adapter.controllerMode(character, false), /Restore/);
    adapter.markBound(character);
    assert.equal(adapter.controllerMode(character, false), false);
    assert.equal(adapter.controllerState(character).settled, true);
    view.setUint8(impl + 3008 + 35160, 3);
    view.setUint32(impl + 3008 + 35136, 1, true);
    view.setBigUint64(impl + 3008 + 35128, 1n, true);
    assert.equal(adapter.controllerState(character).settled, false);
    view.setUint8(impl + 3008 + 35160, 4);
    assert.throws(() => adapter.controllerState(character), /activity state/);
    view.setUint8(impl + 3008 + 35160, 0);
    view.setUint32(impl + 3008 + 35136, 0, true);
    view.setBigUint64(impl + 3008 + 35128, 0n, true);
    assert.equal(view.getUint8(impl + 3015), 0);
    memory.grow(1); // Old views detach; writes must reach the new memory.
    view = new DataView(memory.buffer);
    assert.equal(adapter.controllerMode(character, true), true);
    assert.equal(view.getUint8(impl + 3015), 1);
    assert.throws(() => adapter.controllerMode(character, 1), /boolean/);
    view.setUint32(impl + 74772, 4001289, true);
    assert.throws(() => adapter.controllerMode(character, false), /layout/);
    assert.equal(view.getUint8(impl + 3015), 1);
    view.setUint32(impl + 74772, 4001288, true);
    character.$$.ptr = memory.buffer.byteLength + 4;
    assert.throws(() => adapter.controllerMode(character, false), /handle/);
    character.$$.ptr = handle;
    deleted = true;
    assert.throws(() => adapter.controllerMode(character, false), /deleted/);
    deleted = false;
    adapter.unregister(character);
    assert.throws(
      () => adapter.controllerMode(character, false),
      /unsupported/,
    );
    adapter.register(character, false);
    assert.throws(
      () => adapter.controllerMode(character, false),
      /unsupported/,
    );
  } finally {
    globalThis.fetch = previousFetch;
    WebAssembly.instantiate = previousInstantiate;
  }
});

test('signature identity borrows native literals synchronously and restores owning strings after errors and memory growth', async () => {
  const previousFetch = globalThis.fetch,
    previousInstantiate = WebAssembly.instantiate;
  const memory = new WebAssembly.Memory({ initial: 3 });
  try {
    globalThis.fetch = async () => new Response(originalBytes);
    WebAssembly.instantiate = async () => ({
      instance: { exports: { Vd: memory } },
    });
    const adapter = createControllerModeAdapter('original.wasm');
    await Promise.race([
      new Promise((resolve) => adapter.instantiateWasm({}, resolve)),
      adapter.failure,
    ]);
    const handle = 1024,
      impl = 65536,
      offsets = [73396, 73792];
    let view = new DataView(memory.buffer);
    view.setUint32(handle, impl, true);
    view.setUint32(impl + 74772, 4001288, true);
    view.setUint8(impl + 3015, 1);
    const literal = new TextEncoder().encode('purple_heart\0');
    new Uint8Array(memory.buffer, 4922, literal.length).set(literal);
    // One original SSO and one heap-owning string: neither ownership is touched.
    const saved = [
      Uint8Array.from([65, 66, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2]),
      Uint8Array.from([0, 128, 0, 0, 12, 0, 0, 0, 16, 0, 0, 128]),
    ];
    offsets.forEach((offset, i) =>
      new Uint8Array(memory.buffer, impl + offset, 12).set(saved[i]),
    );
    let calls = 0;
    const character = {
      $$: { ptr: handle },
      isDeleted: () => false,
      playReaction(kind) {
        calls++;
        assert.equal(kind, 2);
        for (const offset of offsets) {
          assert.equal(view.getUint32(impl + offset, true), 4922);
          assert.equal(view.getUint32(impl + offset + 4, true), 12);
        }
        return 0;
      },
    };
    adapter.register(character, true);
    adapter.markBound(character);
    adapter.controllerMode(character, false);
    const restored = () =>
      offsets.forEach((offset, i) =>
        assert.deepEqual(
          new Uint8Array(memory.buffer, impl + offset, 12),
          saved[i],
        ),
      );
    assert.equal(adapter.controllerSignature(character, 'purple_heart'), 0);
    assert.equal(calls, 1);
    restored();
    assert.throws(
      () =>
        adapter.controllerWithSignature(character, 'purple_heart', () => {
          memory.grow(1);
          throw Error('native failure');
        }),
      /native failure/,
    );
    restored();
    view = new DataView(memory.buffer);
    assert.throws(
      () =>
        adapter.controllerWithSignature(character, 'purple_heart', () =>
          Promise.resolve(),
        ),
      /synchronous/,
    );
    restored();
    assert.throws(
      () => adapter.controllerSignature(character, 'unknown'),
      /original body/,
    );
    restored();
    view.setUint8(4922, 0);
    assert.throws(
      () => adapter.controllerSignature(character, 'purple_heart'),
      /signature literal/,
    );
    restored();
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = previousFetch;
    WebAssembly.instantiate = previousInstantiate;
  }
});
