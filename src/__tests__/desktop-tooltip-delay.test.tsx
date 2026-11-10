/**
 * A desktop platform's tooltip waits about a second under a resting pointer,
 * then its neighbours show at once for a moment; an explicit delay wins, and
 * everywhere else the default stays immediate.
 */
import { act, renderHook } from '@testing-library/react-native';

import {
  DESKTOP_TOOLTIP_DELAY,
  TOOLTIP_WARM_WINDOW,
  useDelayedVisibility,
} from '../tooltip/use-delayed-visibility';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('useDelayedVisibility', () => {
  it('waits for the delay, then shows; closing is immediate', () => {
    const hook = renderHook(
      ({ v }: { v: boolean }) => useDelayedVisibility(v, DESKTOP_TOOLTIP_DELAY, true),
      {
        initialProps: { v: true },
      },
    );
    expect(hook.result.current).toBe(false);
    act(() => {
      jest.advanceTimersByTime(DESKTOP_TOOLTIP_DELAY - 1);
    });
    expect(hook.result.current).toBe(false);
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(hook.result.current).toBe(true);
    hook.rerender({ v: false });
    expect(hook.result.current).toBe(false);
    hook.unmount();
  });

  it('shows a neighbour at once while warm, and waits again once the window passed', () => {
    const first = renderHook(
      ({ v }: { v: boolean }) => useDelayedVisibility(v, DESKTOP_TOOLTIP_DELAY, true),
      {
        initialProps: { v: true },
      },
    );
    act(() => {
      jest.advanceTimersByTime(DESKTOP_TOOLTIP_DELAY);
    });
    expect(first.result.current).toBe(true);
    first.rerender({ v: false });

    const neighbour = renderHook(
      ({ v }: { v: boolean }) => useDelayedVisibility(v, DESKTOP_TOOLTIP_DELAY, true),
      {
        initialProps: { v: false },
      },
    );
    neighbour.rerender({ v: true });
    expect(neighbour.result.current).toBe(true);
    neighbour.rerender({ v: false });

    act(() => {
      jest.advanceTimersByTime(TOOLTIP_WARM_WINDOW + 1);
    });
    const later = renderHook(() => useDelayedVisibility(true, DESKTOP_TOOLTIP_DELAY, true));
    expect(later.result.current).toBe(false);
    first.unmount();
    neighbour.unmount();
    later.unmount();
  });

  it('keeps a delay of 0 immediate', () => {
    const hook = renderHook(() => useDelayedVisibility(true, 0));
    expect(hook.result.current).toBe(true);
  });
});
