/**
 * `useNetworkStatus`: one shared reading of the connection, from the optional
 * netinfo peer on native, and what media autoplay's "Wi-Fi only" consults.
 */
import React from 'react';
import { act, render } from '@testing-library/react-native';

import { provideNetInfo, useNetworkStatus, type NetworkStatus } from '../connection-status';
import type { NetInfoStateLike } from '../connection-status/netinfo';
import {
  BloomPreferencesProvider,
  useBloomPreferences,
  useMediaAutoplay,
  type BloomPreferencesContextValue,
} from '../preferences';

afterEach(() => provideNetInfo(null));

function fakeNetInfo() {
  const listeners = new Set<(state: NetInfoStateLike) => void>();
  const addEventListener = jest.fn((listener: (state: NetInfoStateLike) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  });
  provideNetInfo({ addEventListener });
  return {
    addEventListener,
    listeners,
    emit: (state: NetInfoStateLike) => act(() => listeners.forEach((listener) => listener(state))),
  };
}

it('reads online and metered from one subscription shared by every caller', () => {
  const netInfo = fakeNetInfo();
  const seen: NetworkStatus[] = [];
  function Probe() {
    seen.push(useNetworkStatus());
    return null;
  }
  const view = render(
    <>
      <Probe />
      <Probe />
    </>,
  );
  expect(seen[seen.length - 1]).toEqual({ online: true, metered: false });
  expect(netInfo.addEventListener).toHaveBeenCalledTimes(1);

  netInfo.emit({ isConnected: true, isInternetReachable: true, type: 'cellular' });
  expect(seen[seen.length - 1]).toEqual({ online: true, metered: true });
  netInfo.emit({ isConnected: false, isInternetReachable: false, type: 'none' });
  expect(seen[seen.length - 1]).toEqual({ online: false, metered: false });

  view.unmount();
  expect(netInfo.listeners.size).toBe(0);
});

it('holds Wi-Fi-only autoplay back on a metered connection', () => {
  const netInfo = fakeNetInfo();
  let autoplay: boolean | undefined;
  let setPreference: BloomPreferencesContextValue['setPreference'] | undefined;
  function Probe() {
    autoplay = useMediaAutoplay();
    setPreference = useBloomPreferences().setPreference;
    return null;
  }
  const view = render(
    <BloomPreferencesProvider>
      <Probe />
    </BloomPreferencesProvider>,
  );
  // "Always" (the default) never asks: an app's tests and screens that never
  // choose "Wi-Fi only" never touch netinfo.
  expect(netInfo.addEventListener).not.toHaveBeenCalled();

  act(() => setPreference?.('videoAutoplay', 'wifi'));
  expect(netInfo.addEventListener).toHaveBeenCalledTimes(1);
  expect(autoplay).toBe(true);
  netInfo.emit({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: { isConnectionExpensive: true },
  });
  expect(autoplay).toBe(false);
  netInfo.emit({ isConnected: true, isInternetReachable: true, type: 'wifi', details: null });
  expect(autoplay).toBe(true);

  act(() => setPreference?.('videoAutoplay', 'never'));
  expect(netInfo.listeners.size).toBe(0);
  view.unmount();
});
