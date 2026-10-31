import manifest from '../generated/asset-manifest.json';
import { isRuntimeCompatible } from '../runtime';
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});
it('shares inflight checks, retries transient failures later, and pins runtime code as well as binary assets', async () => {
  jest.useFakeTimers();
  let finish!: (response: Response) => void;
  const fetch = jest.fn(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  global.fetch = fetch as unknown as typeof global.fetch;
  const url = 'https://compat.test/runtime.mjs';
  const first = isRuntimeCompatible(url),
    duplicate = isRuntimeCompatible(url);
  expect(first).toBe(duplicate);
  expect(fetch).toHaveBeenCalledTimes(1);
  finish({ ok: false } as Response);
  expect(await first).toBe(false);
  await isRuntimeCompatible(url);
  expect(fetch).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(5_001);
  const retry = isRuntimeCompatible(url);
  finish({ ok: true, json: async () => manifest } as Response);
  expect(await retry).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(60_001);
  const changed = isRuntimeCompatible(url);
  finish({
    ok: true,
    json: async () => ({
      ...manifest,
      files: { ...manifest.files, 'runtime.mjs': 'different shader or controller' },
    }),
  } as Response);
  expect(await changed).toBe(false);
  expect(await isRuntimeCompatible('https://compat.test/other-runtime.mjs')).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(3);
});
