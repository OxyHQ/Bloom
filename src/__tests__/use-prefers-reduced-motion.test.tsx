import { act, renderHook } from '@testing-library/react-native';

jest.mock('react-native-reanimated', () => {
  throw new Error('Reading the OS motion preference must not load Reanimated');
});

const reactModule: unknown = jest.requireActual('react');

/**
 * The hook asks the OS when its module loads, so every case loads a fresh copy
 * with the OS answer under its control.
 */
function load() {
  let change!: (value: boolean) => void;
  let resolve!: (value: boolean) => void;
  const remove = jest.fn();
  let hook!: typeof import('../hooks/use-prefers-reduced-motion').usePrefersReducedMotion;
  jest.isolateModules(() => {
    jest.doMock('react', () => reactModule);
    const { AccessibilityInfo } = require('react-native') as typeof import('react-native');
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
      new Promise<boolean>((done) => {
        resolve = done;
      }),
    );
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, listener) => {
      change = listener as (value: boolean) => void;
      return { remove } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>;
    });
    hook = (
      require('../hooks/use-prefers-reduced-motion') as typeof import('../hooks/use-prefers-reduced-motion')
    ).usePrefersReducedMotion;
  });
  return {
    hook,
    change: (value: boolean) => change(value),
    resolve: (v: boolean) => resolve(v),
    remove,
  };
}

describe('usePrefersReducedMotion', () => {
  afterEach(() => jest.restoreAllMocks());

  it('starts conservatively, resolves the native preference and follows OS changes', async () => {
    const os = load();
    const first = renderHook(os.hook);
    expect(first.result.current).toBe(true);
    await act(async () => {
      os.resolve(false);
    });
    expect(first.result.current).toBe(false);
    // A component mounting later reads the shared answer at once.
    const later = renderHook(os.hook);
    expect(later.result.current).toBe(false);
    act(() => os.change(true));
    expect(first.result.current).toBe(true);
    expect(later.result.current).toBe(true);
    first.unmount();
    later.unmount();
    expect(os.remove).toHaveBeenCalledTimes(1);
  });

  it('does not overwrite a newer OS event with a stale initial query', async () => {
    const os = load();
    const hook = renderHook(os.hook);
    act(() => os.change(false));
    await act(async () => {
      os.resolve(true);
    });
    expect(hook.result.current).toBe(false);
  });
});
