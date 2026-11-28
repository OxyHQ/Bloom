/**
 * An HTTP request in a `.task` takes the task's cancellation: cancelled mid-flight (the id changes,
 * the view leaves), the request is aborted and surfaces as cancellation only. The `catch` does not
 * run (no error state, nothing reported as a failure) and nothing is set after it.
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const { Loader } = require('./packages/format-app/Sources/App/TaskHTTP.bloom') as {
  Loader: (props: {
    path: string;
    onFailure: (message: string) => void;
  }) => Parameters<typeof toElement>[0];
};

/** A `fetch` whose responses wait to be released, and that rejects when its signal aborts. */
function pendingFetch() {
  const pending = new Map<string, { resolve: (text: string) => void; signal?: AbortSignal }>();
  const fetch = jest.fn((url: string, init: { signal?: AbortSignal }) => {
    return new Promise((resolve, reject) => {
      const path = new URL(url).pathname;
      init.signal?.addEventListener('abort', () =>
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })),
      );
      pending.set(path, {
        signal: init.signal,
        resolve: (text) =>
          resolve({ status: 200, headers: new Map(), text: () => Promise.resolve(text) }),
      });
    });
  });
  return { fetch, pending };
}

const shown = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll(
    (node) => typeof node.type === 'string' && typeof node.props.children === 'string',
  )[0]?.props.children;

let original: typeof globalThis.fetch;
beforeEach(() => {
  original = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = original;
});

it('aborts a superseded request with no error state and no failure', async () => {
  const { fetch, pending } = pendingFetch();
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
  const failures: string[] = [];
  const onFailure = (message: string) => failures.push(message);
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(toElement(Loader({ path: '/a', onFailure })));
  });
  expect(pending.get('/a')?.signal?.aborted).toBe(false);
  await act(async () => r.update(toElement(Loader({ path: '/b', onFailure }))));
  expect(pending.get('/a')?.signal?.aborted).toBe(true);
  await act(async () => pending.get('/b')?.resolve('B'));
  expect(shown(r)).toBe('B');
  expect(failures).toEqual([]);
});

it('sets nothing after the view leaves mid-flight', async () => {
  const { fetch, pending } = pendingFetch();
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
  const failures: string[] = [];
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(toElement(Loader({ path: '/a', onFailure: (m) => failures.push(m) })));
  });
  await act(async () => r.unmount());
  expect(pending.get('/a')?.signal?.aborted).toBe(true);
  await act(async () => {});
  expect(failures).toEqual([]);
  // Nothing logged (the renderer's own deprecation notice aside), no state set after unmount.
  const logged = errors.mock.calls.filter(
    (call) => !String(call[0]).includes('react-test-renderer'),
  );
  expect(logged).toEqual([]);
  errors.mockRestore();
});

it('still reports a real failure', async () => {
  globalThis.fetch = jest.fn(() =>
    Promise.reject(new TypeError('Network request failed')),
  ) as unknown as typeof globalThis.fetch;
  const failures: string[] = [];
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(toElement(Loader({ path: '/a', onFailure: (m) => failures.push(m) })));
  });
  expect(shown(r)).toBe('failed');
  expect(failures).toEqual(['Network request failed']);
});
