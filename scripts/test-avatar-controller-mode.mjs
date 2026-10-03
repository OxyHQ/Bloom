import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createControllerModeAdapter, CONTROLLER_WASM_SHA256 } from '../assets/character-runtime/controller-mode.mjs';
import { sha256Bytes } from '../assets/character-runtime/sha256.mjs';

const originalBytes = await readFile(new URL('../assets/character-runtime/orbit-characters.wasm', import.meta.url));
test('HTTP fallback hashes padding boundaries and original WASM against independent SHA-256', () => {
  for (const length of [0,1,55,56,63,64,65,127,128,129,1024]) {
    const bytes = randomBytes(length);
    assert.equal(sha256Bytes(bytes), createHash('sha256').update(bytes).digest('hex'));
  }
  assert.equal(sha256Bytes(originalBytes), CONTROLLER_WASM_SHA256);
});

test('guarded controller toggle rejects corrupt bytes before instantiation and fails closed on invalid handles', async () => {
  const previousFetch = globalThis.fetch;
  const previousInstantiate = WebAssembly.instantiate;
  let instantiations = 0;
  const memory = new WebAssembly.Memory({initial:3});
  WebAssembly.instantiate = async () => {
    instantiations++;
    return {instance:{exports:{Vd:memory}}};
  };
  try {
    globalThis.fetch = async () => new Response(new Uint8Array([0,97,115,109]));
    const corrupt = createControllerModeAdapter('original.wasm');
    corrupt.instantiateWasm({}, () => assert.fail('corrupt bytes instantiated'));
    await assert.rejects(corrupt.failure, /integrity mismatch/);
    assert.equal(instantiations, 0);

    globalThis.fetch = async () => new Response(originalBytes);
    const adapter = createControllerModeAdapter('original.wasm');
    await Promise.race([new Promise(resolve => adapter.instantiateWasm({}, resolve)), adapter.failure]);
    assert.equal(instantiations, 1);
    const handle=1024, impl=4096;
    let view=new DataView(memory.buffer);
    view.setUint32(handle,impl,true);
    view.setUint32(impl+74772,4001288,true);
    view.setUint8(impl+74640,0); // Restore binds before readiness/first paint.
    view.setUint8(impl+3015,1);
    let deleted=false;
    const character={$$:{ptr:handle},isDeleted:()=>deleted};
    adapter.register(character,true);
    assert.throws(()=>adapter.controllerMode(character,false),/Restore/);
    adapter.markBound(character);
    assert.equal(adapter.controllerMode(character,false),false);
    assert.equal(adapter.controllerState(character).settled,true);
    view.setUint8(impl+3008+35160,3);
    view.setUint32(impl+3008+35136,1,true);
    view.setBigUint64(impl+3008+35128,1n,true);
    assert.equal(adapter.controllerState(character).settled,false);
    view.setUint8(impl+3008+35160,4);
    assert.throws(()=>adapter.controllerState(character),/activity state/);
    view.setUint8(impl+3008+35160,0);
    view.setUint32(impl+3008+35136,0,true);
    view.setBigUint64(impl+3008+35128,0n,true);
    assert.equal(view.getUint8(impl+3015),0);
    memory.grow(1); // Old views detach; writes must reach the new memory.
    view=new DataView(memory.buffer);
    assert.equal(adapter.controllerMode(character,true),true);
    assert.equal(view.getUint8(impl+3015),1);
    assert.throws(()=>adapter.controllerMode(character,1),/boolean/);
    view.setUint32(impl+74772,4001289,true);
    assert.throws(()=>adapter.controllerMode(character,false),/layout/);
    assert.equal(view.getUint8(impl+3015),1);
    view.setUint32(impl+74772,4001288,true);
    character.$$.ptr=memory.buffer.byteLength+4;
    assert.throws(()=>adapter.controllerMode(character,false),/handle/);
    character.$$.ptr=handle;
    deleted=true;
    assert.throws(()=>adapter.controllerMode(character,false),/deleted/);
    deleted=false;
    adapter.unregister(character);
    assert.throws(()=>adapter.controllerMode(character,false),/unsupported/);
    adapter.register(character,false);
    assert.throws(()=>adapter.controllerMode(character,false),/unsupported/);
  } finally {
    globalThis.fetch=previousFetch;
    WebAssembly.instantiate=previousInstantiate;
  }
});
