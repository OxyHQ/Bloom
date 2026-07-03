import { act, renderHook } from '@testing-library/react-native';

import { useInteractionState } from '../hooks/useInteractionState';

describe('useInteractionState', () => {
  it('starts inactive and toggles on onIn/onOut', () => {
    const { result } = renderHook(() => useInteractionState());
    expect(result.current.state).toBe(false);

    act(() => result.current.onIn());
    expect(result.current.state).toBe(true);

    act(() => result.current.onOut());
    expect(result.current.state).toBe(false);
  });

  it('keeps handler identities stable across renders', () => {
    const { result, rerender } = renderHook(() => useInteractionState());
    const firstOnIn = result.current.onIn;
    const firstOnOut = result.current.onOut;

    rerender({});

    expect(result.current.onIn).toBe(firstOnIn);
    expect(result.current.onOut).toBe(firstOnOut);
  });
});
