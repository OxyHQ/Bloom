import { renderWebStill } from '../character-still-web';
import { loadCharacterRuntime } from '../character-runtime-module';
import { resolveAvatarCharacter } from '../character';
import type { Controller } from '../CharacterAvatar';

jest.mock('../character-runtime-module', () => ({ loadCharacterRuntime: jest.fn() }));
const load = jest.mocked(loadCharacterRuntime);
const PNG = 'data:image/png;base64,QUJD';
const job = {
  key: 'test',
  runtimeUrl: 'https://example.test/runtime.mjs',
  character: resolveAvatarCharacter({ preset: 'blue_beret' }),
  css: 64,
  ratio: 1,
};
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
let boxes: {
  style: Record<string, string>;
  remove: jest.Mock;
  append: jest.Mock;
  setAttribute: jest.Mock;
  toDataURL: jest.Mock;
}[];
beforeEach(() => {
  jest.useFakeTimers();
  boxes = [];
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      body: { append: jest.fn() },
      createElement: () => {
        const element = {
          style: {},
          remove: jest.fn(),
          append: jest.fn(),
          setAttribute: jest.fn(),
          toDataURL: jest.fn(() => PNG),
        };
        boxes.push(element);
        return element;
      },
    },
  });
});
afterEach(async () => {
  await jest.runOnlyPendingTimersAsync();
  jest.useRealTimers();
  load.mockReset();
  if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
  else Reflect.deleteProperty(globalThis, 'document');
});

it('ends a hung creation at the paint timeout and releases its late controller', async () => {
  let created!: (controller: Controller) => void;
  const controller = { update: jest.fn(), dispose: jest.fn() };
  load.mockResolvedValue({
    createAvatar: () =>
      new Promise((resolve) => {
        created = resolve;
      }),
  });
  const pending = renderWebStill(job);
  await jest.advanceTimersByTimeAsync(15_000);
  expect(await pending).toBeNull();
  expect(boxes[0]?.remove).toHaveBeenCalledTimes(1);
  created(controller);
  await Promise.resolve();
  expect(controller.dispose).toHaveBeenCalledTimes(1);
});

it('captures once, retains its scene briefly, then releases it without a second disposal on the next job', async () => {
  const controllers: { update: jest.Mock; dispose: jest.Mock }[] = [];
  load.mockResolvedValue({
    createAvatar: async (_canvas: unknown, _props: unknown, callbacks: { onReady(): void }) => {
      const controller = { update: jest.fn(), dispose: jest.fn() };
      controllers.push(controller);
      callbacks.onReady();
      return controller;
    },
  });
  expect(await renderWebStill(job)).toBe(PNG);
  expect(controllers[0]?.dispose).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1500);
  expect(controllers[0]?.dispose).toHaveBeenCalledTimes(1);
  expect(await renderWebStill(job)).toBe(PNG);
  expect(controllers[0]?.dispose).toHaveBeenCalledTimes(1);
  expect(controllers[1]?.dispose).not.toHaveBeenCalled();
});

it('applies the same deadline to loading the runtime module itself', async () => {
  load.mockImplementation(() => new Promise(() => {}));
  const pending = renderWebStill(job);
  await jest.advanceTimersByTimeAsync(15_000);
  expect(await pending).toBeNull();
  expect(boxes[0]?.remove).toHaveBeenCalledTimes(1);
});
