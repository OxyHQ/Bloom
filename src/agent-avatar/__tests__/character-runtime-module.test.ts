import { loadCharacterRuntime } from '../character-runtime-module';

const registryKey = Symbol.for('bloom.character.runtimes');
const scope = globalThis as unknown as Record<symbol, Map<string, unknown>>;
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
let scripts: { onload: (() => void) | null; onerror: (() => void) | null; remove: jest.Mock }[];
beforeEach(() => {
  jest.useFakeTimers();
  scripts = [];
  scope[registryKey] = new Map();
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      baseURI: 'https://example.test/',
      head: { appendChild: jest.fn() },
      createElement: () => {
        const script = { onload: null, onerror: null, remove: jest.fn() };
        scripts.push(script);
        return script;
      },
    },
  });
});
afterEach(() => {
  jest.useRealTimers();
  Reflect.deleteProperty(scope, registryKey);
  if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
  else Reflect.deleteProperty(globalThis, 'document');
});

it('shares the pending import, retries after its deadline, and ignores the old script callback', async () => {
  const first = loadCharacterRuntime('/timed-out.mjs');
  expect(loadCharacterRuntime('/timed-out.mjs')).toBe(first);
  const staleLoad = scripts[0]?.onload;
  const rejected = expect(first).rejects.toThrow('timed out');
  await jest.advanceTimersByTimeAsync(15_000);
  await rejected;
  expect(scripts[0]?.remove).toHaveBeenCalledTimes(1);
  const retry = loadCharacterRuntime('/timed-out.mjs');
  expect(retry).not.toBe(first);
  staleLoad?.();
  expect(loadCharacterRuntime('/timed-out.mjs')).toBe(retry);
  const runtime = { createAvatar() {} };
  scope[registryKey]?.set('https://example.test/timed-out.mjs', runtime);
  scripts[1]?.onload?.();
  expect(await retry).toBe(runtime);
  expect(await loadCharacterRuntime('/timed-out.mjs')).toBe(runtime);
  expect(scripts).toHaveLength(2);
});

it('rejects an unregistered module and permits another request', async () => {
  const failed = loadCharacterRuntime('/invalid.mjs');
  const rejected = expect(failed).rejects.toThrow('Invalid character runtime');
  scripts[0]?.onload?.();
  await rejected;
  const retry = loadCharacterRuntime('/invalid.mjs');
  const failedAgain = expect(retry).rejects.toThrow('could not be loaded');
  scripts[1]?.onerror?.();
  await failedAgain;
  expect(scripts).toHaveLength(2);
});
