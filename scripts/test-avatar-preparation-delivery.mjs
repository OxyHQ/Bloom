import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

let namespace = 0;
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

async function fixture() {
  const gate = deferred(),
    requests = [],
    completed = [];
  const state = { wait: () => gate.promise };
  const module = {
    orbitCompletePreparation(id, bytes, error) {
      completed.push({ id, bytes: bytes && Array.from(bytes), error });
      bytes?.fill(255); // Native receivers must not mutate the retained scene.
    },
  };
  module.Character = class {
    render() {
      module.orbitPrepare(1, new Uint8Array([1, 2, 3]), 1, 'scene', false);
    }
    delete() {}
  };
  const previousWorker = globalThis.Worker;
  globalThis.Worker = class {
    constructor() {
      state.worker = this;
    }
    postMessage(data) {
      requests.push(data);
    }
    terminate() {
      state.terminated = true;
    }
  };
  globalThis.__bloomDeliveryFixture = { module, state };
  const data = (source) => 'data:text/javascript,' + encodeURIComponent(source);
  let source = await readFile(
    new URL('../assets/character-runtime/legacy-engine.mjs', import.meta.url),
    'utf8',
  );
  source = source.replace(
    /(['"])\.\/character-recipe\.mjs\1/,
    JSON.stringify(
      new URL(
        '../assets/character-runtime/character-recipe.mjs',
        import.meta.url,
      ).href,
    ),
  );
  source = source
    .replace(
      /(['"])\.\/controller-mode\.mjs\1/,
      JSON.stringify(
        new URL(
          '../assets/character-runtime/controller-mode.mjs',
          import.meta.url,
        ).href,
      ),
    )
    .replace(
      /(['"])\.\/orbit-characters\.mjs\1/,
      JSON.stringify(
        data(
          'export default ()=>Promise.resolve(globalThis.__bloomDeliveryFixture.module);',
        ),
      ),
    )
    .replace(
      /(['"])\.\/shared-surface\.mjs\1/,
      JSON.stringify(
        data(
          'export const waitForSharedRender=()=>globalThis.__bloomDeliveryFixture.state.wait();',
        ),
      ),
    )
    .replace(
      /(['"])\.\/preparation-cache\.mjs\1/,
      JSON.stringify(
        new URL(
          '../assets/character-runtime/preparation-cache.mjs',
          import.meta.url,
        ).href,
      ),
    );
  source = source.replace(
    /(['"])\.\/legacy-worker\.mjs\1/,
    JSON.stringify(
      new URL('../assets/character-runtime/legacy-worker.mjs', import.meta.url)
        .href,
    ),
  );
  const engine = await import(
    data(source + '\n// test namespace ' + namespace++)
  );
  const lease = await engine.acquireLegacyEngine([
    [1, 0],
    [0, 1],
    [-1, 0],
  ]);
  return {
    gate,
    state,
    engine,
    lease,
    requests,
    completed,
    cleanup() {
      globalThis.Worker = previousWorker;
      delete globalThis.__bloomDeliveryFixture;
    },
  };
}

test('worker replies retain a canceled preparation turn until the GPU boundary completes', async () => {
  const f = await fixture();
  try {
    const release = await f.engine.acquireCharacterPreparation();
    const character = new f.lease.module.Character();
    character.render();
    f.state.worker.onmessage({
      data: {
        id: f.requests[0].id,
        bytes: new Uint8Array([5, 6]),
        milliseconds: 4,
      },
    });
    await flush();
    assert.equal(f.engine.legacyEngineStats().pending, 1);
    assert.deepEqual(f.completed, []);
    release();
    character.delete();
    let admitted = false;
    const next = f.engine.acquireCharacterPreparation().then((release) => {
      admitted = true;
      return release;
    });
    // A worker failure arriving while its successful reply waits must not deliver
    // that native completion twice or release another character prematurely.
    f.state.worker.onerror();
    await flush();
    assert.equal(admitted, false);
    assert.equal(f.engine.legacyEngineStats().pending, 1);
    f.gate.resolve();
    (await next)();
    assert.deepEqual(f.completed, [{ id: 1, bytes: [5, 6], error: '' }]);
    assert.equal(f.engine.legacyEngineStats().pending, 0);
    assert.equal(f.engine.legacyEngineStats().preparationActive, false);
    f.lease.release();
    await new Promise((done) => setTimeout(done, 1));
  } finally {
    f.cleanup();
  }
});

test('cached completion is asynchronous, respects the GPU boundary and avoids another worker request', async () => {
  const f = await fixture();
  try {
    f.gate.resolve();
    const first = await f.engine.acquireCharacterPreparation();
    const a = new f.lease.module.Character();
    a.render();
    f.state.worker.onmessage({
      data: { id: f.requests[0].id, bytes: new Uint8Array([5, 6]) },
    });
    await flush();
    first();
    a.delete();
    const gpu = deferred();
    f.state.wait = () => gpu.promise;
    const second = await f.engine.acquireCharacterPreparation();
    const b = new f.lease.module.Character();
    b.render();
    assert.equal(
      f.completed.length,
      1,
      'cached bytes must not complete reentrantly inside render',
    );
    await flush();
    assert.equal(f.requests.length, 1);
    assert.equal(f.completed.length, 1);
    assert.equal(f.engine.legacyEngineStats().preparationCache.hits, 1);
    second();
    b.delete();
    let admitted = false;
    const next = f.engine.acquireCharacterPreparation().then((release) => {
      admitted = true;
      return release;
    });
    await flush();
    assert.equal(admitted, false);
    gpu.resolve();
    (await next)();
    assert.deepEqual(
      f.completed.map((entry) => entry.bytes),
      [
        [5, 6],
        [5, 6],
      ],
    );
    assert.equal(f.engine.legacyEngineStats().pending, 0);
    f.lease.release();
    await new Promise((done) => setTimeout(done, 1));
  } finally {
    f.cleanup();
  }
});

test('authored Clippo/Todd/Felipe scopes normalize ordering and stay independent', async () => {
  const f = await fixture();
  try {
    const combination = {
      shape: 'clippo',
      eyes: 'todd',
      accessory: 'felipe_beret',
    };
    const first = await f.engine.getCharacterEngine(combination);
    const reordered = await f.engine.getCharacterEngine({
      accessory: 'felipe_beret',
      eyes: 'todd',
      shape: 'clippo',
    });
    const other = await f.engine.getCharacterEngine({
      shape: 'clippo',
      eyes: 'clippo',
      accessory: 'felipe_beret',
    });
    assert.equal(first, reordered);
    assert.notEqual(first, other);
    const combinations = [];
    for (const shape of [undefined, 'clippo'])
      for (const eyes of [undefined, 'todd', 'clippo'])
        for (const accessory of [undefined, 'felipe_beret']) {
          if (!shape && !eyes && !accessory) continue;
          combinations.push(
            await f.engine.getCharacterEngine({
              ...(shape ? { shape } : {}),
              ...(eyes ? { eyes } : {}),
              ...(accessory ? { accessory } : {}),
            }),
          );
        }
    assert.equal(new Set(combinations).size, 11);
    await assert.rejects(
      f.engine.getCharacterEngine({ shape: 'circle' }),
      /Unsupported authored/,
    );
    await assert.rejects(
      f.engine.getCharacterEngine({ eyes: 'unknown-eye' }),
      /Unsupported authored/,
    );
    await assert.rejects(
      f.engine.getCharacterEngine({ shape: 'clippo', unexpected: true }),
      /Unsupported authored/,
    );
    const release = await f.engine.acquireCharacterPreparation();
    const character = new first.Character();
    character.render();
    assert.deepEqual(f.requests[0].authoredParts, combination);
    assert.equal(f.requests[0].points, undefined);
    character.delete();
    release();
    f.state.worker.onmessage({
      data: {
        id: f.requests[0].id,
        bytes: new Uint8Array([4]),
        milliseconds: 1,
      },
    });
    f.gate.resolve();
    await flush();
    f.lease.release();
    assert.equal(f.engine.legacyEngineStats().pending, 0);
    assert.equal(f.engine.legacyEngineStats().characters, 0);
  } finally {
    f.cleanup();
  }
});
