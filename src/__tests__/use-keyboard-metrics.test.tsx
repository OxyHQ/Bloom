import { Keyboard, Platform, type KeyboardEvent } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import { useKeyboardMetrics } from '../hooks/use-keyboard-metrics';

afterEach(() => jest.restoreAllMocks());

it('follows the keyboard: its height and top while up, hidden again once it goes', () => {
  const listeners = new Map<string, (event: KeyboardEvent) => void>();
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((
    name: string,
    listener: (event: KeyboardEvent) => void,
  ) => {
    listeners.set(name, listener);
    return { remove: () => listeners.delete(name) };
  }) as unknown as typeof Keyboard.addListener);

  const { result, unmount } = renderHook(() => useKeyboardMetrics({ timing: 'will' }));
  expect(result.current).toEqual({ visible: false, height: 0, top: null });

  const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
  act(() =>
    listeners.get(show)?.({
      duration: 250,
      easing: 'keyboard',
      isEventFromThisApp: true,
      startCoordinates: { screenX: 0, screenY: 800, width: 400, height: 0 },
      endCoordinates: { screenX: 0, screenY: 500, width: 400, height: 300 },
    }),
  );
  expect(result.current).toEqual({ visible: true, height: 300, top: 500 });

  act(() => listeners.get(show.replace('Show', 'Hide'))?.({} as KeyboardEvent));
  expect(result.current).toEqual({ visible: false, height: 0, top: null });

  unmount();
  expect(listeners.size).toBe(0);
});
