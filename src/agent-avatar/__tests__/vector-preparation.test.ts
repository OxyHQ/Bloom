import { useVectorGeometryPreparation } from '../use-vector-geometry-preparation';
import { loadVectorGeometry } from '../vector-compose';
const mockEffects: Array<() => () => void> = [];
jest.mock('react', () => ({ useEffect: (effect: () => () => void) => mockEffects.push(effect) }));
jest.mock('../default-catalog', () => ({ useVectorAssetLoader: () => ({}) }));
jest.mock('../vector-compose', () => ({
  loadVectorGeometry: jest.fn(),
  vectorGeometryKey: (c: { shape: string }) => c.shape,
}));
beforeEach(() => {
  jest.useFakeTimers();
  mockEffects.length = 0;
  jest
    .mocked(loadVectorGeometry)
    .mockReset()
    .mockResolvedValue({} as never);
});
afterEach(() => {
  jest.useRealTimers();
});
it('cancels neighbors when the user moves on before the quiet interval', () => {
  useVectorGeometryPreparation([{ preset: 'blue_beret' }]);
  const dispose = mockEffects[0]!();
  dispose();
  jest.runAllTimers();
  expect(loadVectorGeometry).not.toHaveBeenCalled();
});
it('prepares at most two recipes sequentially and cancels a queued successor', async () => {
  const originalIdle = global.requestIdleCallback,
    originalCancel = global.cancelIdleCallback;
  const idle = new Map<number, IdleRequestCallback>();
  let next = 0;
  global.requestIdleCallback = (callback) => {
    idle.set(++next, callback);
    return next;
  };
  global.cancelIdleCallback = (id) => {
    if (id != null) idle.delete(id);
  };
  try {
    useVectorGeometryPreparation([
      { preset: 'blue_beret' },
      { preset: 'alfred' },
      { preset: 'clippo' },
    ]);
    const dispose = mockEffects[0]!();
    jest.advanceTimersByTime(250);
    expect(loadVectorGeometry).not.toHaveBeenCalled();
    expect(idle.size).toBe(1);
    const first = idle.get(1)!;
    idle.delete(1);
    first({ didTimeout: false, timeRemaining: () => 10 });
    await Promise.resolve();
    await Promise.resolve();
    expect(loadVectorGeometry).toHaveBeenCalledTimes(1);
    dispose();
    expect(idle.size).toBe(0);
  } finally {
    global.requestIdleCallback = originalIdle;
    global.cancelIdleCallback = originalCancel;
  }
});
