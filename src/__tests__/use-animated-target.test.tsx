import { act, renderHook } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';
import { Easing } from 'react-native-reanimated';

import { useAnimatedTarget } from '../toast/use-animated-target';

/**
 * The point of this hook is WHERE the animation starts: assigned from JS, never
 * returned from a mapper (which does not tick on web). That distinction is not
 * observable under the reanimated test mock — it resolves `withTiming` straight
 * to its destination — so it is guarded by the source assertion in
 * `ToastHostWebFork.test.ts` and verified for real in a browser. What these tests
 * pin is the value contract the row depends on.
 */
const CONFIG = { duration: 600, easing: Easing.linear };

describe('useAnimatedTarget', () => {
  it('starts at the initial target rather than at zero', () => {
    const { result } = renderHook(() => useAnimatedTarget(120, CONFIG));
    expect(result.current.value).toBe(120);
  });

  it('animates toward a changed target', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useAnimatedTarget(target, CONFIG),
      { initialProps: { target: 0 } },
    );
    expect(result.current.value).toBe(0);

    act(() => {
      rerender({ target: -140 });
    });
    // The reanimated test mock resolves withTiming to its destination value.
    expect(result.current.value).toBe(-140);
  });

  it('keeps the same shared value across renders', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useAnimatedTarget(target, CONFIG),
      { initialProps: { target: 0 } },
    );
    const first = result.current;

    act(() => {
      rerender({ target: 10 });
    });
    expect(result.current).toBe(first);
  });

  /**
   * An estimate is no state the user saw (a toast's height before it measured
   * itself), so the value follows it, and leaves it, without animating. The
   * mock resolves `withTiming` at once, so what is pinned is whether the hook
   * asked for an animation at all.
   */
  it('follows and leaves an estimated target without animating', () => {
    const timing = jest.spyOn(Reanimated, 'withTiming');
    try {
      const { result, rerender } = renderHook(
        ({ target, estimated }: { target: number; estimated: boolean }) =>
          useAnimatedTarget(target, { ...CONFIG, estimated }),
        { initialProps: { target: Number.POSITIVE_INFINITY, estimated: true } },
      );
      act(() => {
        rerender({ target: 80, estimated: true });
      });
      expect(result.current.value).toBe(80);
      act(() => {
        rerender({ target: 78, estimated: false });
      });
      expect(result.current.value).toBe(78);
      expect(timing).not.toHaveBeenCalled();

      // Once it rests on a real target, a change animates again.
      act(() => {
        rerender({ target: 54, estimated: false });
      });
      expect(timing).toHaveBeenCalledTimes(1);
      expect(timing).toHaveBeenCalledWith(54, expect.objectContaining({ duration: 600 }));
    } finally {
      timing.mockRestore();
    }
  });

  it('does not re-assign when the target is unchanged', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useAnimatedTarget(target, CONFIG),
      { initialProps: { target: 42 } },
    );

    act(() => {
      rerender({ target: 42 });
    });
    expect(result.current.value).toBe(42);
  });
});
