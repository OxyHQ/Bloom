import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedCallback } from '../hooks/use-debounced-callback';

describe('useDebouncedCallback', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('fires the latest call once, flushes and cancels on demand, and drops or flushes on unmount', () => {
    const fn = jest.fn();
    const { result, rerender, unmount } = renderHook(
      ({ cb }: { cb: (n: number) => void }) => useDebouncedCallback(cb, 100),
      { initialProps: { cb: fn } },
    );
    const { run } = result.current;

    act(() => {
      run(1);
      run(2);
      jest.advanceTimersByTime(99);
    });
    expect(fn).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(fn.mock.calls).toEqual([[2]]);

    // The call uses the latest callback, and `run` keeps its identity.
    const next = jest.fn();
    rerender({ cb: next });
    expect(result.current.run).toBe(run);
    act(() => run(3));
    act(() => result.current.flush());
    expect(next.mock.calls).toEqual([[3]]);
    act(() => jest.advanceTimersByTime(500));
    expect(next).toHaveBeenCalledTimes(1);

    act(() => run(4));
    act(() => result.current.cancel());
    act(() => jest.advanceTimersByTime(500));
    expect(next).toHaveBeenCalledTimes(1);

    act(() => run(5));
    unmount();
    act(() => jest.advanceTimersByTime(500));
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('can flush a pending call on unmount', () => {
    const fn = jest.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(fn, 100, { flushOnUnmount: true }),
    );
    act(() => result.current.run('last'));
    unmount();
    expect(fn.mock.calls).toEqual([['last']]);
  });
});
