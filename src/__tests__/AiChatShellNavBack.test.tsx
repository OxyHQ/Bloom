/**
 * Android back with the phone's nav drawer open closes the DRAWER.
 *
 * Found on a Pixel 8a with Bloom 4.23.0: the shell registered a hardware-back
 * handler for the panel drawer only, so back with the navigation drawer open
 * fell through to the activity and closed the app. The nav drawer now joins
 * `usePanelInteraction` like the panel; this pins that it takes back while
 * open, and hands it on once closed.
 */
import React from 'react';
import { Text } from 'react-native';
import * as ReactNative from 'react-native';
import { render } from '@testing-library/react-native';

import { AiChatShell } from '../ai-chat';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

type BackListener = () => boolean | null | undefined;

let listeners: BackListener[] = [];
let os: typeof ReactNative.Platform.OS;

beforeEach(() => {
  listeners = [];
  os = ReactNative.Platform.OS;
  ReactNative.Platform.OS = 'android';
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width: 400, height: 900, scale: 1, fontScale: 1 });
  jest.spyOn(ReactNative.BackHandler, 'addEventListener').mockImplementation((_name, listener) => {
    listeners.push(listener);
    return { remove: () => { listeners = listeners.filter((l) => l !== listener); } };
  });
});

afterEach(() => {
  ReactNative.Platform.OS = os;
  jest.restoreAllMocks();
});

/** What Android does: the newest listener first, until one returns true. */
const pressBack = (): boolean => [...listeners].reverse().some((listener) => listener() === true);

function Shell({ navOpen, onNavOpenChange }: { navOpen: boolean; onNavOpenChange: (open: boolean) => void }) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <AiChatShell sidebar={null} mobileSidebar={<Text>nav</Text>} navOpen={navOpen} onNavOpenChange={onNavOpenChange}>
        <Text>chat</Text>
      </AiChatShell>
    </BloomThemeProvider>
  );
}

it('closes the open nav drawer instead of leaving the app', () => {
  const onNavOpenChange = jest.fn();
  const screen = render(<Shell navOpen onNavOpenChange={onNavOpenChange} />);
  expect(pressBack()).toBe(true);
  expect(onNavOpenChange).toHaveBeenCalledWith(false);

  // Closed, back is the app's again (a navigator, or leaving).
  onNavOpenChange.mockClear();
  screen.rerender(<Shell navOpen={false} onNavOpenChange={onNavOpenChange} />);
  expect(pressBack()).toBe(false);
  expect(onNavOpenChange).not.toHaveBeenCalled();
});
