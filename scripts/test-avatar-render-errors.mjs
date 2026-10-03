import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRenderErrorBoundary } from '../assets/character-runtime/render-errors.mjs';

function fixture() {
  const errors = [];
  let polls = 0;
  const gl = {
    NO_ERROR: 0,
    getError() {
      polls++;
      return errors.shift() ?? 0;
    },
  };
  return {
    boundary: createRenderErrorBoundary(gl),
    errors,
    polls: () => polls,
  };
}
test('one driver query covers a nested shared batch, while external probes remain exact', () => {
  const { boundary, errors, polls } = fixture();
  boundary.render(() => {
    for (let i = 0; i < 48; i++)
      boundary.render(() => {
        assert.equal(boundary.context.getError(), 0);
        assert.equal(boundary.context.getError(), 0);
      });
    assert.equal(polls(), 0);
  });
  assert.equal(polls(), 1);
  errors.push(0x500);
  assert.equal(boundary.context.getError(), 0x500);
  assert.equal(polls(), 2);
  boundary.render(() => {});
  assert.equal(polls(), 2, 'an idle tick never synchronizes the driver');
});
test('driver errors reject the complete batch before it can publish, then recover', () => {
  const { boundary, errors } = fixture();
  let published = false;
  assert.throws(() => {
    boundary.render(() => {
      errors.push(0x500, 0x502);
      boundary.context.getError();
    });
    published = true;
  }, /0x500, 0x502/);
  assert.equal(published, false);
  assert.equal(
    boundary.render(() => 42),
    42,
  );
});
test('a throwing native render restores polling and preserves both failures', () => {
  const { boundary, errors } = fixture();
  const failure = new Error('native failed');
  assert.throws(
    () =>
      boundary.render(() => {
        throw failure;
      }),
    (error) => error === failure,
  );
  assert.throws(
    () =>
      boundary.render(() => {
        errors.push(0x502);
        boundary.context.getError();
        throw failure;
      }),
    (error) => {
      assert(error instanceof AggregateError);
      assert.equal(error.errors[0], failure);
      assert.match(error.errors[1].message, /0x502/);
      return true;
    },
  );
  errors.push(0x507);
  assert.equal(boundary.context.getError(), 0x507);
});

function deferredFixture() {
  let polls = 0,
    queries = 0,
    deleted = 0,
    lost = false;
  const errors = [];
  const gl = {
    NO_ERROR: 0,
    SYNC_GPU_COMMANDS_COMPLETE: 1,
    TIMEOUT_EXPIRED: 2,
    CONDITION_SATISFIED: 3,
    ALREADY_SIGNALED: 4,
    WAIT_FAILED: 5,
    getError() {
      queries++;
      return errors.shift() ?? 0;
    },
    clear() {},
    fenceSync() {
      return {};
    },
    flush() {},
    isContextLost() {
      return lost;
    },
    clientWaitSync(_fence, flags, timeout) {
      assert.equal(flags, 0);
      assert.equal(timeout, 0);
      return ++polls < 2 ? this.TIMEOUT_EXPIRED : this.CONDITION_SATISFIED;
    },
    deleteSync() {
      deleted++;
    },
  };
  return {
    gl,
    boundary: createRenderErrorBoundary(gl),
    errors,
    queries: () => queries,
    deleted: () => deleted,
    lose: () => {
      lost = true;
    },
  };
}
test('deferred batches keep publication locked and query errors only after GPU completion', async () => {
  const { boundary, queries, deleted } = deferredFixture();
  const order = [];
  const completed = boundary.renderDeferred(
    () => {
      boundary.render(() => boundary.context.clear());
      assert.equal(boundary.context.getError(), 0);
      return 42;
    },
    (value) => {
      assert.equal(value, 42);
      assert.equal(boundary.pending, true);
      assert.equal(queries(), 1);
      order.push('publish');
    },
  );
  assert.equal(boundary.pending, true);
  assert.equal(queries(), 0);
  assert.throws(() => boundary.context.clear(), /pending/);
  assert.throws(() => boundary.context.getError(), /pending/);
  assert.throws(() => boundary.render(() => {}), /pending/);
  const waiter = boundary.wait().then(() => order.push('waiter'));
  assert.equal(await completed, 42);
  await waiter;
  assert.deepEqual(order, ['publish', 'waiter']);
  assert.equal(boundary.pending, false);
  assert.equal(deleted(), 1);
  assert.equal(boundary.context.getError(), 0);
});
test('deferred GPU errors reject without publishing, while unrelated lifecycle waiters settle', async () => {
  const { boundary, errors, deleted } = deferredFixture();
  let published = false;
  const completed = boundary.renderDeferred(
    () => {
      boundary.context.clear();
      errors.push(0x502);
    },
    () => {
      published = true;
    },
  );
  const settled = boundary.wait();
  await assert.rejects(completed, /0x502/);
  await settled;
  assert.equal(published, false);
  assert.equal(boundary.pending, false);
  assert.equal(deleted(), 1);
  assert.equal(
    boundary.render(() => 7),
    7,
  );
});
for (const mode of ['lost', 'timeout', 'failed', 'unavailable']) {
  test(`deferred ${mode} releases the lock without presenting`, async () => {
    const f = deferredFixture();
    if (mode === 'lost') f.lose();
    if (mode === 'failed') f.gl.clientWaitSync = () => f.gl.WAIT_FAILED;
    if (mode === 'timeout') f.gl.clientWaitSync = () => f.gl.TIMEOUT_EXPIRED;
    if (mode === 'unavailable') f.gl.fenceSync = () => null;
    let published = false;
    await assert.rejects(
      f.boundary.renderDeferred(
        () => f.boundary.context.clear(),
        () => {
          published = true;
        },
        { timeoutMs: 1, pollIntervalMs: 1 },
      ),
      mode === 'timeout' ? /timed out/ : new RegExp(mode),
    );
    assert.equal(published, false);
    assert.equal(f.boundary.pending, false);
    assert.equal(f.queries(), 0);
    assert.equal(f.deleted(), mode === 'unavailable' ? 0 : 1);
  });
}
