import {
  shareVectorFrame,
  subscribeVectorFrame,
  vectorStateIdentity,
  vectorFrameRecipeKey,
} from '../vector-scheduler';

it('coordinates one request and shares only equal state within a tick, then releases it', () => {
  const callbacks = new Map<number, FrameRequestCallback>();
  let next = 0;
  const originalRequest = global.requestAnimationFrame;
  const originalCancel = global.cancelAnimationFrame;
  global.requestAnimationFrame = (callback) => {
    callbacks.set(++next, callback);
    return next;
  };
  global.cancelAnimationFrame = (id) => {
    if (id != null) callbacks.delete(id);
  };
  const outputs: object[] = [];
  let computations = 0;
  const compute = () => ({ id: ++computations });
  const first = subscribeVectorFrame(() =>
    outputs.push(shareVectorFrame('recipe:idle:0', compute)),
  );
  const second = subscribeVectorFrame(() =>
    outputs.push(shareVectorFrame('recipe:idle:0', compute)),
  );
  const independent = subscribeVectorFrame(() =>
    outputs.push(shareVectorFrame('recipe:look:.4', compute)),
  );
  try {
    expect(callbacks.size).toBe(1);
    const run = (time: number) => {
      const [id, callback] = callbacks.entries().next().value!;
      callbacks.delete(id);
      callback(time);
    };
    run(16);
    expect(computations).toBe(2);
    expect(outputs[0]).toBe(outputs[1]);
    expect(outputs[2]).not.toBe(outputs[1]);
    run(32);
    expect(computations).toBe(4);
    expect(outputs[3]).not.toBe(outputs[0]);
    first();
    second();
    independent();
    expect(callbacks.size).toBe(0);
    shareVectorFrame('paused', compute);
    shareVectorFrame('paused', compute);
    expect(computations).toBe(6);
  } finally {
    first();
    second();
    independent();
    global.requestAnimationFrame = originalRequest;
    global.cancelAnimationFrame = originalCancel;
  }
});
it('distinguishes interrupted poses by identity without mutating them', () => {
  const a = Object.freeze({ value: 1 }),
    b = Object.freeze({ value: 1 });
  expect(vectorStateIdentity(a)).toBe(vectorStateIdentity(a));
  expect(vectorStateIdentity(a)).not.toBe(vectorStateIdentity(b));
  expect(vectorStateIdentity(undefined)).toBe(0);
});

it('isolates a failed subscriber and reschedules healthy characters', () => {
  const originalRequest = global.requestAnimationFrame,
    originalCancel = global.cancelAnimationFrame;
  const originalReport = globalThis.reportError;
  const callbacks = new Map<number, FrameRequestCallback>();
  let next = 0,
    healthy = 0;
  const errors: unknown[] = [];
  global.requestAnimationFrame = (callback) => {
    callbacks.set(++next, callback);
    return next;
  };
  global.cancelAnimationFrame = (id) => {
    if (id != null) callbacks.delete(id);
  };
  globalThis.reportError = (error) => {
    errors.push(error);
  };
  const error = new Error('one bad avatar');
  const bad = subscribeVectorFrame(() => {
    throw error;
  });
  const good = subscribeVectorFrame(() => {
    healthy++;
  });
  try {
    const run = () => {
      const [id, callback] = callbacks.entries().next().value!;
      callbacks.delete(id);
      callback(16);
    };
    run();
    run();
    expect(healthy).toBe(2);
    expect(errors).toEqual([error]);
    good();
    bad();
    expect(callbacks.size).toBe(0);
  } finally {
    bad();
    good();
    global.requestAnimationFrame = originalRequest;
    global.cancelAnimationFrame = originalCancel;
    globalThis.reportError = originalReport;
  }
});

it('shares geometry-plus-paint identity independently of per-instance paint wrappers', () => {
  const geometry = { parts: [] },
    paint = { bodyColor: '#aabbcc' };
  const firstWrapper = { ...geometry, paint },
    secondWrapper = { ...geometry, paint: { ...paint } };
  expect(vectorStateIdentity(firstWrapper)).not.toBe(vectorStateIdentity(secondWrapper));
  const first = vectorFrameRecipeKey(geometry, 'same fitted recipe', firstWrapper.paint);
  expect(vectorFrameRecipeKey(geometry, 'same fitted recipe', secondWrapper.paint)).toBe(first);
  expect(vectorFrameRecipeKey({ ...geometry }, 'same fitted recipe', paint)).not.toBe(first);
  expect(vectorFrameRecipeKey(geometry, 'different pending eyewear', paint)).not.toBe(first);
  expect(vectorFrameRecipeKey(geometry, 'same fitted recipe', { bodyColor: '#ccddee' })).not.toBe(
    first,
  );
});
