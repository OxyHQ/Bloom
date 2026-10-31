import { Text } from 'react-native';
import * as ReactNative from 'react-native';
import { render } from '@testing-library/react-native';

import { AiChatShell } from '../ai-chat';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { mockWindowSize } from './support/window-size';

type BackListener = Parameters<typeof ReactNative.BackHandler.addEventListener>[1];
/** What React Native hands a back listener; nothing here reads it. */
const BACK_PRESS = { type: 'hardwareBackPress', timeStamp: 0 };

let listeners: BackListener[] = [];
let os: typeof ReactNative.Platform.OS;

beforeEach(() => {
  listeners = [];
  os = ReactNative.Platform.OS;
  ReactNative.Platform.OS = 'android';
  mockWindowSize({ width: 400, height: 900, scale: 1, fontScale: 1 });
  jest.spyOn(ReactNative.BackHandler, 'addEventListener').mockImplementation((_name, listener) => {
    listeners.push(listener);
    return {
      remove: () => {
        listeners = listeners.filter((l) => l !== listener);
      },
    };
  });
});

afterEach(() => {
  ReactNative.Platform.OS = os;
  jest.restoreAllMocks();
});

/** What Android does: the newest listener first, until one returns true. */
const pressBack = (): boolean =>
  [...listeners].reverse().some((listener) => listener(BACK_PRESS) === true);

function Shell({
  navOpen,
  onNavOpenChange,
}: {
  navOpen: boolean;
  onNavOpenChange: (open: boolean) => void;
}) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <AiChatShell
        sidebar={null}
        mobileSidebar={<Text>nav</Text>}
        navOpen={navOpen}
        onNavOpenChange={onNavOpenChange}
      >
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

it('puts the keyboard away when the drawer opens, and leaves it alone otherwise', () => {
  const dismiss = jest.spyOn(ReactNative.Keyboard, 'dismiss');
  dismiss.mockClear();
  const onNavOpenChange = jest.fn();
  const screen = render(<Shell navOpen={false} onNavOpenChange={onNavOpenChange} />);
  expect(dismiss).not.toHaveBeenCalled();
  // A composer that regained focus after a sheet closed kept the keyboard up
  // under the drawer (Android 16).
  screen.rerender(<Shell navOpen onNavOpenChange={onNavOpenChange} />);
  expect(dismiss).toHaveBeenCalledTimes(1);
  screen.rerender(<Shell navOpen={false} onNavOpenChange={onNavOpenChange} />);
  expect(dismiss).toHaveBeenCalledTimes(1);
});
