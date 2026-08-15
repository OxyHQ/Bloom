import { renderHook } from '@testing-library/react-native';

import { useGutters } from '../hooks/use-gutters';
import { space } from '../styles/tokens';

// The RN mock reports a 375px-wide window (below the `sm` 640 breakpoint), so
// every case resolves to the `base` tier.

describe('useGutters', () => {
  it('expands a single size to all four edges', () => {
    const { result } = renderHook(() => useGutters(['base']));
    expect(result.current).toEqual({
      paddingTop: space.lg,
      paddingRight: space.lg,
      paddingBottom: space.lg,
      paddingLeft: space.lg,
    });
  });

  it('treats a two-value list as [vertical, horizontal]', () => {
    const { result } = renderHook(() => useGutters([0, 'wide']));
    expect(result.current).toEqual({
      paddingTop: 0,
      paddingRight: space.xl,
      paddingBottom: 0,
      paddingLeft: space.xl,
    });
  });

  it('maps a four-value list to [top, right, bottom, left]', () => {
    const { result } = renderHook(() =>
      useGutters(['compact', 'base', 0, 'wide']),
    );
    expect(result.current).toEqual({
      paddingTop: space.sm,
      paddingRight: space.lg,
      paddingBottom: 0,
      paddingLeft: space.xl,
    });
  });

  it('returns zero padding for a `0` gutter', () => {
    const { result } = renderHook(() => useGutters([0]));
    expect(result.current).toEqual({
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
    });
  });

  it('keeps a stable object identity across re-renders at the same width', () => {
    const { result, rerender } = renderHook(() => useGutters(['base']));
    const first = result.current;
    rerender({});
    expect(result.current).toBe(first);
  });
});
