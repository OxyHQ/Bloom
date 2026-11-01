import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useTouchInput } from '../styles/pointer';

it('keeps native touch semantics and shares an optional host media listener', () => {
  expect(Platform.OS).not.toBe('web');
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const listeners = new Set<() => void>();
  let matches = false;
  const add = jest.fn((_type: string, listener: () => void) => listeners.add(listener));
  const remove = jest.fn((_type: string, listener: () => void) => listeners.delete(listener));
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      matchMedia: () => ({
        get matches() {
          return matches;
        },
        addEventListener: add,
        removeEventListener: remove,
      }),
    },
  });
  let first: ReturnType<typeof renderHook<boolean, unknown>> | undefined;
  let second: ReturnType<typeof renderHook<boolean, unknown>> | undefined;
  try {
    first = renderHook(() => useTouchInput());
    second = renderHook(() => useTouchInput());
    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(true);
    expect(listeners.size).toBe(1);
    act(() => {
      matches = true;
      for (const listener of [...listeners]) listener();
    });
    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(true);
    first.unmount();
    first = undefined;
    expect(listeners.size).toBe(1);
    second.unmount();
    second = undefined;
    expect(listeners.size).toBe(0);
    expect(add).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  } finally {
    first?.unmount();
    second?.unmount();
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
