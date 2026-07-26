import { AppState, type AppStateStatus } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import {
  subscribeToAppState,
  useAppStateChange,
} from '../toast/use-app-state';

/**
 * Both platform branches matter: RN-Web reports `AppState.isAvailable === false`
 * during prerender (no document to listen to), where upstream's unconditional
 * subscribe + `subscription.remove()` on unmount throws a `TypeError`.
 */
describe('subscribeToAppState', () => {
  afterEach(() => {
    AppState.isAvailable = true;
    jest.restoreAllMocks();
  });

  it('subscribes and unsubscribes when AppState is available', () => {
    const remove = jest.fn();
    const addEventListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({ remove });

    const unsubscribe = subscribeToAppState(() => {});
    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(addEventListener.mock.calls[0]?.[0]).toBe('change');

    unsubscribe();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe, and returns a safe no-op, when AppState is unavailable', () => {
    AppState.isAvailable = false;
    const addEventListener = jest.spyOn(AppState, 'addEventListener');

    const unsubscribe = subscribeToAppState(() => {});

    expect(addEventListener).not.toHaveBeenCalled();
    // The whole point: tearing down must not throw where there is no subscription.
    expect(() => unsubscribe()).not.toThrow();
  });
});

describe('useAppStateChange', () => {
  const setup = () => {
    const onBackground = jest.fn();
    const onForeground = jest.fn();
    const listeners: Array<(status: AppStateStatus) => void> = [];
    const remove = jest.fn();

    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      listeners.push(listener);
      return { remove };
    });

    const hook = renderHook(() =>
      useAppStateChange({ onBackground, onForeground }),
    );

    const emit = (status: AppStateStatus) => {
      act(() => {
        for (const listener of listeners) {
          listener(status);
        }
      });
    };

    return { onBackground, onForeground, emit, remove, hook };
  };

  afterEach(() => {
    AppState.isAvailable = true;
    jest.restoreAllMocks();
  });

  it('reports leaving and returning to the foreground', () => {
    const { onBackground, onForeground, emit } = setup();

    emit('background');
    expect(onBackground).toHaveBeenCalledTimes(1);
    expect(onForeground).not.toHaveBeenCalled();

    emit('active');
    expect(onForeground).toHaveBeenCalledTimes(1);
  });

  it('reports one edge per transition, not one per event', () => {
    const { onBackground, onForeground, emit } = setup();

    // iOS emits `inactive` on the way to `background`; upstream treats both as a
    // fresh backgrounding and pauses an already-paused timer again.
    emit('inactive');
    emit('background');
    expect(onBackground).toHaveBeenCalledTimes(1);

    emit('active');
    emit('active');
    expect(onForeground).toHaveBeenCalledTimes(1);
  });

  it('ignores an initial active event when the app was already active', () => {
    const { onBackground, onForeground, emit } = setup();
    emit('active');
    expect(onForeground).not.toHaveBeenCalled();
    expect(onBackground).not.toHaveBeenCalled();
  });

  it('removes its subscription on unmount', () => {
    const { remove, hook } = setup();
    hook.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('mounts and unmounts cleanly with no AppState subscription at all', () => {
    AppState.isAvailable = false;
    const onBackground = jest.fn();
    const onForeground = jest.fn();

    const hook = renderHook(() =>
      useAppStateChange({ onBackground, onForeground }),
    );
    expect(() => hook.unmount()).not.toThrow();
    expect(onBackground).not.toHaveBeenCalled();
  });
});
