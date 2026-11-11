/**
 * `AppShell` never requires a `SafeAreaProvider` (`useShellInsets`): an app
 * mounted at its root without one — OxyOS's sample Inbox, which a desktop
 * window gives no insets — has none to inset, and draws. The real
 * `useSafeAreaInsets()` THROWS outside a provider ("No safe area value
 * available"), so this suite makes it throw as the library does, and the
 * shell's panels read the context instead, zeros without a provider.
 */
import * as Native from 'react-native';
import { render } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { AppShell } from '../app-shell';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { mockWindowSize } from './support/window-size';

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => {
      throw new Error(
        'No safe area value available. Make sure you are rendering `<SafeAreaProvider>` at the top of your app.',
      );
    },
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    {children}
  </BloomThemeProvider>
);

beforeEach(() => mockWindowSize({ width: 1440, height: 900, scale: 1, fontScale: 1 }));

it('draws a split panel layout with a sidebar and no SafeAreaProvider', () => {
  const screen = render(
    <AppShell
      sidebar={{ render: () => <Native.Text testID="sidebar">rail</Native.Text> }}
      panelLayout={{
        mode: 'split',
        panels: [
          { id: 'list', width: 320, content: <Native.Text testID="list">list</Native.Text> },
          { id: 'detail', content: <Native.Text testID="detail">detail</Native.Text> },
        ],
      }}
    />,
    { wrapper },
  );
  expect(screen.getByTestId('sidebar')).toBeTruthy();
  expect(screen.getByTestId('list')).toBeTruthy();
  expect(screen.getByTestId('detail')).toBeTruthy();
});

it("a provider's insets still reach the panels", () => {
  const insets = { top: 24, bottom: 0, left: 0, right: 0 };
  const screen = render(
    <SafeAreaInsetsContext.Provider value={insets}>
      <AppShell
        panelLayout={{
          mode: 'split',
          panels: [{ id: 'main', content: <Native.Text testID="main">main</Native.Text> }],
        }}
      />
    </SafeAreaInsetsContext.Provider>,
    { wrapper },
  );
  expect(screen.getByTestId('main')).toBeTruthy();
});
