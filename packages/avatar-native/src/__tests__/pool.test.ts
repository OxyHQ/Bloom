import {
  createAvatarReconciler,
  createAvatarSlotController,
  avatarPresentationFrozen,
} from '../../../../runtime/avatar-controller';
import { attachNativeAvatar } from '../pool';
import type { EngineHost, RenderValue } from '../types';
const mockEngines: any[] = [];
const mockBridge = {
  present: jest.fn(),
  destroyContext: jest.fn(async () => {}),
  snapshot: jest.fn(async () => 'data:image/png;base64,test'),
};
const mockContext = jest.fn(async () => ({
  contextId: 1,
  getParameter: (key: number) => (key === 3 ? [4096, 4096] : 4096),
  MAX_TEXTURE_SIZE: 1,
  MAX_RENDERBUFFER_SIZE: 2,
  MAX_VIEWPORT_DIMS: 3,
  flushEXP: jest.fn(),
}));
jest.mock('../bridge', () => ({
  get bridge() {
    return mockBridge;
  },
  createContext: () => mockContext(),
}));
jest.mock('../runtime', () => ({
  assetBase: (url: string) => new URL('.', url).href,
  getRuntime: () => ({
    AuthoredAvatarEngine: class {
      loaded = Promise.resolve();
      host: EngineHost;
      setCount = jest.fn();
      setSize = jest.fn(async () => {});
      presets = new Map<number, string>();
      cachedPresets = new Set<string>();
      setPreset = jest.fn(async (index: number, preset: string, isCurrent = () => true) => {
        this.cachedPresets.add(preset);
        if (isCurrent()) this.presets.set(index, preset);
      });
      getInstancePreset = jest.fn((index: number) => this.presets.get(index));
      hasPreset = jest.fn((preset: string) => this.cachedPresets.has(preset));
      cancelPresetChange = jest.fn();
      beginPointer = jest.fn(() => 0);
      point = jest.fn();
      endPointer = jest.fn();
      resetAppearance = jest.fn();
      idle = jest.fn();
      setWander = jest.fn();
      setGaze = jest.fn();
      setInstancePaused = jest.fn();
      setInstanceRendering = jest.fn();
      dispose = jest.fn();
      clearColor = jest.fn();
      setColor = jest.fn();
      prepareWork = jest.fn(async () => true);
      work = jest.fn();
      entrance = jest.fn();
      react = jest.fn();
      constructor(_: null, options: { host: EngineHost; preset: string }) {
        this.presets.set(0, options.preset);
        this.cachedPresets.add(options.preset);
        this.host = options.host;
        mockEngines.push(this);
      }
    },
    createCatalogAssetResolver: () => null,
    createCatalogMotion: null,
    resolveCompleteEditorRecipe: (value: RenderValue) => ({
      preset: value.character as string,
      capabilities: { key: 'test', available: {}, selected: {} },
    }),
    createAvatarSlotController: (...args: any[]) => (createAvatarSlotController as any)(...args),
    createAvatarReconciler: (...args: any[]) => (createAvatarReconciler as any)(...args),
    avatarPresentationFrozen,
  }),
}));
const url = 'https://example.test/runtime.mjs';
const initial: RenderValue = { character: 'blue_beret', reduced: false, paused: true };
const drain = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const output = {
  framebuffer: { id: 9 },
  width: 192,
  height: 192,
  columns: 1,
  rows: 1,
  pixels: 192,
  renderedIndices: [0],
};
let aborts: AbortController[] = [];
async function attach(
  value = initial,
  size = 64,
  callbacks = { onError: jest.fn(), onReady: jest.fn() },
) {
  const abort = new AbortController();
  aborts.push(abort);
  return {
    avatar: await attachNativeAvatar(url, value, size, size, callbacks, abort.signal),
    callbacks,
    abort,
  };
}
beforeEach(() => {
  mockEngines.length = 0;
  jest.clearAllMocks();
  mockBridge.present.mockImplementation(async (_id, _frame, tiles) =>
    tiles.map((tile: number[]) => tile[0]),
  );
});
afterEach(async () => {
  aborts.forEach((abort) => abort.abort());
  aborts = [];
  await drain();
});

it('shares a context across same-size mounts and waits for actual surface swap before ready, including frozen first paint', async () => {
  const first = await attach(),
    second = await attach();
  expect(mockContext).toHaveBeenCalledTimes(1);
  expect(first.avatar.contextId).toBe(second.avatar.contextId);
  const engine = mockEngines[0];
  engine.host.onFrame(output);
  await drain();
  expect(mockBridge.present).not.toHaveBeenCalled();
  first.avatar.visibility(true);
  first.avatar.surfaceReady();
  let ack!: (ids: number[]) => void;
  mockBridge.present.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        ack = resolve;
      }),
  );
  engine.host.onFrame(output);
  await drain();
  expect(first.callbacks.onReady).not.toHaveBeenCalled();
  ack([first.avatar.surfaceId]);
  await drain();
  expect(first.callbacks.onReady).toHaveBeenCalledTimes(1);
  expect(engine.setInstanceRendering).toHaveBeenLastCalledWith(0, false);
  engine.host.onFrame(output);
  await drain();
  expect(mockBridge.present).toHaveBeenCalledTimes(1);
  first.avatar.surfaceReady();
  engine.host.onFrame(output);
  await drain();
  expect(mockBridge.present).toHaveBeenCalledTimes(2);
  expect(first.callbacks.onReady).toHaveBeenCalledTimes(1);
});

it('holds offscreen slots and invalidates a fresh frame on reentry without resetting motion', async () => {
  const { avatar } = await attach({ ...initial, paused: false });
  const engine = mockEngines[0];
  const idleCount = engine.idle.mock.calls.length;
  avatar.visibility(true);
  avatar.surfaceReady();
  engine.host.onFrame(output);
  await drain();
  avatar.visibility(false);
  expect(engine.setInstancePaused).toHaveBeenLastCalledWith(0, true);
  engine.host.onFrame(output);
  await drain();
  expect(mockBridge.present).toHaveBeenCalledTimes(1);
  avatar.visibility(true);
  engine.host.onFrame(output);
  await drain();
  expect(mockBridge.present).toHaveBeenCalledTimes(2);
  expect(engine.idle).toHaveBeenCalledTimes(idleCount);
});

it('ignores stale swap acknowledgements and destroys the context only after its final batch settles', async () => {
  const { avatar, abort, callbacks } = await attach();
  const engine = mockEngines[0];
  avatar.visibility(true);
  avatar.surfaceReady();
  let ack!: (ids: number[]) => void;
  mockBridge.present.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        ack = resolve;
      }),
  );
  engine.host.onFrame(output);
  await drain();
  abort.abort();
  await drain();
  expect(mockBridge.destroyContext).not.toHaveBeenCalled();
  ack([avatar.surfaceId]);
  await drain();
  expect(callbacks.onReady).not.toHaveBeenCalled();
  expect(mockBridge.destroyContext).toHaveBeenCalledTimes(1);
});

it('drains resize changes arriving during an asset upgrade while preserving consumed action keys', async () => {
  const { avatar } = await attach({ ...initial, workingKey: 1 });
  const engine = mockEngines[0];
  let complete!: () => void;
  engine.setSize.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
  );
  avatar.resize(100, 100);
  avatar.resize(240, 240);
  expect(engine.setSize.mock.calls).toEqual([[128]]);
  complete();
  await drain();
  expect(engine.setSize.mock.calls).toEqual([[128], [320]]);
  expect(engine.work).not.toHaveBeenCalled();
  expect(engine.idle).toHaveBeenCalledTimes(1);
});

it('bounds CPU/GPU overlap to two outstanding native presentation batches', async () => {
  global.requestAnimationFrame = (callback) =>
    setTimeout(() => callback(Date.now()), 16) as unknown as number;
  global.cancelAnimationFrame = (id) => clearTimeout(id);
  jest.useFakeTimers();
  try {
    const { avatar } = await attach({ ...initial, paused: false });
    const engine = mockEngines[0];
    avatar.visibility(true);
    avatar.surfaceReady();
    let ack!: (ids: number[]) => void;
    mockBridge.present.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          ack = resolve;
        }),
    );
    engine.host.onFrame(output);
    let ackSecond!: (ids: number[]) => void;
    mockBridge.present.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          ackSecond = resolve;
        }),
    );
    engine.host.onFrame(output);
    const draw = jest.fn();
    const token = engine.host.requestFrame(draw);
    jest.runOnlyPendingTimers();
    await drain();
    expect(draw).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
    ack([avatar.surfaceId]);
    await drain();
    expect(jest.getTimerCount()).toBe(1);
    jest.runOnlyPendingTimers();
    expect(draw).toHaveBeenCalledTimes(1);
    engine.host.cancelFrame(token);
    ackSecond([avatar.surfaceId]);
    await drain();
  } finally {
    jest.useRealTimers();
  }
});

it('bounds simultaneous mounts before allocating a second context without reducing any slot resolution', async () => {
  const mounted = await Promise.all(Array.from({ length: 17 }, () => attach()));
  expect(mockContext).toHaveBeenCalledTimes(2);
  expect(new Set(mounted.map(({ avatar }) => avatar.surfaceId)).size).toBe(17);
  expect(mockEngines[0].setCount.mock.calls.at(-1)[0]).toBe(16);
  expect(mockEngines[1].setCount.mock.calls.at(-1)[0]).toBe(1);
});

it('releases a native context whose creation completes after its final pending consumer cancels', async () => {
  let created!: (gl: any) => void;
  mockContext.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        created = resolve;
      }),
  );
  const abort = new AbortController();
  const pending = attachNativeAvatar(url, initial, 64, 64, { onError: jest.fn() }, abort.signal);
  abort.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  created({ contextId: 99 });
  await drain();
  expect(mockBridge.destroyContext).toHaveBeenCalledWith(99);
  expect(mockEngines).toHaveLength(0);
});

it('clears only its owned pointer on cancellation, including gaze, and does not reset another slot', async () => {
  const { avatar } = await attach();
  const engine = mockEngines[0];
  avatar.pointerEnd();
  expect(engine.endPointer).not.toHaveBeenCalled();
  expect(avatar.pointerDown(20, 20)).toBe(true);
  avatar.pointerMove(24, 25);
  avatar.pointerEnd();
  expect(engine.endPointer).toHaveBeenCalledTimes(1);
  expect(engine.point).toHaveBeenLastCalledWith(-1, -1);
});
