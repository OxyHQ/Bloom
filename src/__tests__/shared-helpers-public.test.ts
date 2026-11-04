/**
 * The general-purpose pieces Bloom's families are built on are published from
 * their family's barrel, so an app reuses them instead of writing a second copy.
 */
import { Linking, Platform } from 'react-native';

import * as connectionStatus from '../connection-status';
import * as hooks from '../hooks';
import * as locale from '../locale';

it('publishes the shared hooks, helpers and formatters', () => {
  for (const name of [
    'useControllableState',
    'usePrefersReducedMotion',
    'useCssSafeAreaInsets',
    'useRovingTabIndex',
    'handleRovingKeyDown',
    'useNativeRovingGroup',
    'writeClipboardText',
    'clipboardAvailable',
    'useTextareaAutosize',
    'useKeyboardVisible',
    'useKeyboardMetrics',
    'useKeyboardReveal',
    'useBrowserTitle',
    'isPlainLinkActivation',
    'openHref',
    'openExternal',
  ]) {
    expect(typeof (hooks as Record<string, unknown>)[name]).toBe('function');
  }
  expect(locale.formatPercent(0.25, 'en')).toBe('25%');
  expect(locale.formatClock(83)).toBe('1:23');
  expect(typeof connectionStatus.useNetworkStatus).toBe('function');
});

it('openHref opens through Linking on native and navigates the document on web', () => {
  const openURL = jest.mocked(Linking.openURL);
  openURL.mockClear();
  hooks.openHref('https://oxy.so');
  expect(openURL).toHaveBeenCalledWith('https://oxy.so');

  const assign = jest.fn();
  const previous = Platform.OS;
  (globalThis as { location?: unknown }).location = { assign };
  Platform.OS = 'web';
  try {
    hooks.openHref('/inbox');
  } finally {
    Platform.OS = previous;
    delete (globalThis as { location?: unknown }).location;
  }
  expect(assign).toHaveBeenCalledWith('/inbox');
  expect(openURL).toHaveBeenCalledTimes(1);
});

it('openExternal opens a tab on web, the in-app browser on native, else the system handler', () => {
  const openBrowserAsync = jest.fn((_url: string) => Promise.resolve());
  jest.isolateModules(() => {
    jest.doMock('expo-web-browser', () => ({ openBrowserAsync }), { virtual: true });
    const { openExternal } = require('../hooks/link-activation') as typeof hooks;
    const { Linking: isolatedLinking } = require('react-native') as typeof import('react-native');
    openExternal('https://oxy.so');
    openExternal('mailto:hi@oxy.so');
    expect(openBrowserAsync).toHaveBeenCalledWith('https://oxy.so');
    expect(jest.mocked(isolatedLinking.openURL).mock.calls).toEqual([['mailto:hi@oxy.so']]);
  });
  jest.dontMock('expo-web-browser');

  const open = jest.fn();
  const previous = Platform.OS;
  (globalThis as { open?: unknown }).open = open;
  Platform.OS = 'web';
  try {
    hooks.openExternal('https://oxy.so');
  } finally {
    Platform.OS = previous;
    delete (globalThis as { open?: unknown }).open;
  }
  expect(open).toHaveBeenCalledWith('https://oxy.so', '_blank', 'noopener,noreferrer');
});

it('writeClipboardText writes through expo-clipboard where there is no browser clipboard', async () => {
  const setStringAsync = jest.fn((_text: string) => Promise.resolve(true));
  let written: Promise<void> | undefined;
  jest.isolateModules(() => {
    jest.doMock('expo-clipboard', () => ({ setStringAsync }), { virtual: true });
    const clipboard = require('../hooks/clipboard') as typeof hooks;
    expect(clipboard.clipboardAvailable()).toBe(true);
    written = clipboard.writeClipboardText('FE-12');
  });
  jest.dontMock('expo-clipboard');
  await written;
  expect(setStringAsync).toHaveBeenCalledWith('FE-12');
  // Without the peer there is nothing to write to.
  expect(hooks.clipboardAvailable()).toBe(false);
  await expect(hooks.writeClipboardText('FE-12')).rejects.toThrow('clipboard unavailable');
});
