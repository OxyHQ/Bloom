import assert from 'node:assert/strict';
import test from 'node:test';
import { createRenderBudget } from '../assets/character-runtime/render-budget.mjs';

function harness(limit = 4) {
  const frames = [];
  const budget = createRenderBudget(limit, (fn) => frames.push(fn));
  let live = 0,
    peak = 0;
  const items = [];
  function add({ deferred = false, still = false, interactive = false } = {}) {
    const item = { starts: 0, stops: 0, resolve: undefined, lease: undefined };
    item.lease = budget.register({
      start() {
        item.starts++;
        live++;
        peak = Math.max(peak, live);
        if (deferred)
          return new Promise((resolve) => {
            item.resolve = () => resolve({});
          });
        return {};
      },
      suspend() {
        item.stops++;
        live--;
      },
      error(error) {
        throw error;
      },
    });
    item.lease.update({ visible: true, still, interactive });
    items.push(item);
    return item;
  }
  async function frame() {
    frames.shift()?.();
    await Promise.resolve();
    await Promise.resolve();
    assert.ok(live <= limit, `GPU objects exceed budget: ${live}`);
  }
  return { budget, add, frame, items, live: () => live, peak: () => peak };
}

test('every avatar in a crowd gets painted without exceeding four GPU objects', async () => {
  const h = harness();
  for (let i = 0; i < 64; i++) h.add();
  for (let i = 0; i < 160; i++) {
    await h.frame();
    for (const item of h.items) if (item.starts) item.lease.painted();
  }
  assert.ok(h.items.every((item) => item.starts > 0));
  assert.equal(h.peak(), 4);
  assert.equal(h.live(), 4);
  for (const item of h.items) item.lease.dispose();
  assert.equal(h.live(), 0);
  assert.equal(h.budget.stats().registered, 0);
});

test('an editor preview prepares before passive avatars mounted ahead of it', async () => {
  // Preparation is serialized, so first-come order left an editor mounted
  // after a crowd of thumbnails without capabilities (its controls disabled)
  // until every one of them had painted. Even under reduced motion (still).
  const h = harness();
  const crowd = Array.from({ length: 12 }, () =>
    h.add({ deferred: true, still: true }),
  );
  await h.frame();
  assert.equal(crowd[0].starts, 1);
  const editor = h.add({ deferred: true, still: true, interactive: true });
  await h.frame();
  assert.equal(editor.starts, 0);
  // The surface already preparing finishes; the editor is admitted next.
  crowd[0].resolve();
  await Promise.resolve();
  crowd[0].lease.painted();
  await h.frame();
  assert.equal(editor.starts, 1);
  assert.equal(crowd.filter((item) => item.starts).length, 1);
  for (const item of h.items) item.lease.dispose();
});

test('cancelled async construction still occupies its slot until disposal', async () => {
  const h = harness(1);
  const cancelled = h.add({ deferred: true });
  await h.frame();
  cancelled.lease.dispose();
  const replacement = h.add();
  await h.frame();
  assert.equal(replacement.starts, 0);
  assert.equal(h.budget.stats().resident, 1);
  cancelled.resolve();
  await Promise.resolve();
  await h.frame();
  assert.equal(cancelled.stops, 1);
  assert.equal(replacement.starts, 1);
  replacement.lease.dispose();
  assert.equal(h.live(), 0);
});

test('an interacted snapshot preempts idle renderers and releases when hidden', async () => {
  const h = harness(2);
  const first = h.add(),
    second = h.add(),
    third = h.add();
  for (let i = 0; i < 12; i++) {
    await h.frame();
    for (const item of h.items) if (item.starts) item.lease.painted();
  }
  const snapshot = h.items.find((item) => item.stops === item.starts);
  assert.ok(snapshot);
  const previous = snapshot.starts;
  snapshot.lease.update({ priority: 3 });
  await h.frame();
  assert.equal(snapshot.starts, previous + 1);
  snapshot.lease.update({ visible: false });
  await h.frame();
  assert.equal(snapshot.stops, snapshot.starts);
  for (const item of [first, second, third]) item.lease.dispose();
  assert.equal(h.live(), 0);
});

test('static portraits release immediately after painting and leave no scheduled churn', async () => {
  const h = harness();
  const item = h.add({ still: true });
  await h.frame();
  item.lease.painted();
  await h.frame();
  assert.equal(h.live(), 0);
  for (let i = 0; i < 8; i++) await h.frame();
  assert.equal(item.starts, 1);
  item.lease.dispose();
});

test('a renderer failure frees preparation capacity for the remaining avatars', async () => {
  const frames = [];
  const budget = createRenderBudget(1, (fn) => frames.push(fn));
  const errors = [];
  let released = 0,
    secondStarted = false;
  const broken = budget.register({
    start: async () => ({}),
    suspend: () => released++,
    error: (error) => errors.push(error),
  });
  const next = budget.register({
    start: async () => {
      secondStarted = true;
      return {};
    },
    suspend() {},
    error(error) {
      throw error;
    },
  });
  broken.update({ visible: true });
  next.update({ visible: true });
  frames.shift()();
  await Promise.resolve();
  await Promise.resolve();
  broken.fail('preparation failed');
  frames.shift()();
  await Promise.resolve();
  assert.equal(released, 1);
  assert.equal(secondStarted, true);
  assert.deepEqual(errors, ['preparation failed']);
  broken.dispose();
  next.dispose();
});

test('a managed avatar tells the budget whether it is interactive, even when still', async () => {
  const noop = () => {};
  class Observer {
    observe() {}
    disconnect() {}
  }
  Object.assign(globalThis, {
    IntersectionObserver: Observer,
    ResizeObserver: Observer,
    devicePixelRatio: 1,
    document: { hidden: false, addEventListener: noop, removeEventListener: noop },
  });
  const { renderBudget } = await import('../assets/character-runtime/render-budget.mjs');
  const { createManagedAvatar } = await import('../assets/character-runtime/managed-avatar.mjs');
  const register = renderBudget.register;
  const reported = [];
  renderBudget.register = () => ({
    update: (value) => reported.push(value),
    painted: noop,
    fail: noop,
    dispose: noop,
  });
  try {
    const canvas = {
      clientWidth: 162,
      clientHeight: 162,
      addEventListener: noop,
      removeEventListener: noop,
    };
    for (const interactive of [true, false]) {
      reported.length = 0;
      const avatar = createManagedAvatar(
        canvas,
        { config: { character: { preset: 'bloom' } }, interactive, reduced: true },
        {},
        async () => ({}),
      );
      assert.equal(reported.at(-1).still, true);
      assert.equal(reported.at(-1).interactive, interactive);
      avatar.dispose();
    }
  } finally {
    renderBudget.register = register;
  }
});
