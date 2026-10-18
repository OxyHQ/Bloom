import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

jest.mock('react-native-reanimated', () => {
  throw new Error('Reading the OS motion preference must not load Reanimated');
});

describe('usePrefersReducedMotion', () => {
  afterEach(() => jest.restoreAllMocks());

  it('starts conservatively, resolves the native preference and follows OS changes', async () => {
    let change!: (value: boolean) => void;
    let resolve!: (value: boolean) => void;
    const remove = jest.fn();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
      new Promise<boolean>((done) => {
        resolve = done;
      }),
    );
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, listener) => {
      change = listener as (value: boolean) => void;
      return { remove };
    });
    const hook = renderHook(usePrefersReducedMotion);
    expect(hook.result.current).toBe(true);
    await act(async () => {
      resolve(false);
    });
    expect(hook.result.current).toBe(false);
    act(() => change(true));
    expect(hook.result.current).toBe(true);
    hook.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('does not overwrite a newer OS event with a stale initial query', async () => {
    let change!: (value: boolean) => void;
    let resolve!: (value: boolean) => void;
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
      new Promise<boolean>((done) => {
        resolve = done;
      }),
    );
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, listener) => {
      change = listener as (value: boolean) => void;
      return { remove: jest.fn() };
    });
    const hook = renderHook(usePrefersReducedMotion);
    act(() => change(true));
    await act(async () => {
      resolve(false);
    });
    expect(hook.result.current).toBe(true);
  });
});
