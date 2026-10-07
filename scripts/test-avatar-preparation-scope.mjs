import assert from 'node:assert/strict';
import test from 'node:test';

let namespace = 0;
async function freshEngine() {
  return import(
    `../assets/character-runtime/legacy-engine.mjs?test=${namespace++}`
  );
}

test('preparation leases admit FIFO and double release cannot skip an owner', async () => {
  const engine = await freshEngine();
  const releaseFirst = await engine.acquireCharacterPreparation();
  const order = [];
  const second = engine.acquireCharacterPreparation().then((release) => {
    order.push('second');
    return release;
  });
  const third = engine.acquireCharacterPreparation().then((release) => {
    order.push('third');
    return release;
  });
  await Promise.resolve();
  assert.deepEqual(order, []);
  releaseFirst();
  const releaseSecond = await second;
  releaseFirst();
  await Promise.resolve();
  assert.deepEqual(order, ['second']);
  releaseSecond();
  (await third)();
  assert.deepEqual(order, ['second', 'third']);
  assert.equal(engine.legacyEngineStats().preparationActive, false);
});

test('canceling a queued waiter removes it without releasing the current owner', async () => {
  const engine = await freshEngine();
  const release = await engine.acquireCharacterPreparation();
  const controller = new AbortController();
  const canceled = engine.acquireCharacterPreparation(controller.signal);
  const rejection = assert.rejects(canceled, { name: 'AbortError' });
  const next = engine.acquireCharacterPreparation();
  controller.abort();
  await rejection;
  assert.equal(engine.legacyEngineStats().preparationWaiters, 1);
  assert.equal(engine.legacyEngineStats().preparationActive, true);
  release();
  (await next)();
  assert.equal(engine.legacyEngineStats().preparationWaiters, 0);
  assert.equal(engine.legacyEngineStats().preparationActive, false);
});

test('a signal canceled before enqueue consumes no preparation turn', async () => {
  const engine = await freshEngine();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(engine.acquireCharacterPreparation(controller.signal), {
    name: 'AbortError',
  });
  assert.equal(engine.legacyEngineStats().preparationWaiters, 0);
  assert.equal(engine.legacyEngineStats().preparationActive, false);
  (await engine.acquireCharacterPreparation())();
});

test('an admitted owner explicitly releases after cleanup even if its signal aborts', async () => {
  const engine = await freshEngine();
  const controller = new AbortController();
  const release = await engine.acquireCharacterPreparation(controller.signal);
  controller.abort();
  const next = engine.acquireCharacterPreparation();
  assert.equal(engine.legacyEngineStats().preparationWaiters, 1);
  assert.equal(engine.legacyEngineStats().preparationActive, true);
  release();
  (await next)();
  assert.equal(engine.legacyEngineStats().preparationWaiters, 0);
});
