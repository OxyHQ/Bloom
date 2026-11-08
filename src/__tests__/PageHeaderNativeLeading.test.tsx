import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { PageHeader } from '../page-header/PageHeader';
import { AppShellMenuButton } from '../app-shell/AppShellMenuButton';
import { AppShellProvider, NO_DOCK } from '../app-shell/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const noop = () => {};
const dock = NO_DOCK;
function Subject({ shown }: { shown: boolean }) {
  return (
    <BloomThemeProvider mode="light">
      <AppShellProvider
        value={{
          drawerAvailable: shown,
          drawerOpen: false,
          openDrawer: noop,
          closeDrawer: noop,
          toggleDrawer: noop,
          navigationDock: dock,
          topBarDock: dock,
        }}
      >
        <PageHeader testID="header" title="Inbox" leading={<AppShellMenuButton testID="menu" />} />
      </AppShellProvider>
    </BloomThemeProvider>
  );
}
it.each(['android', 'ios'] as const)(
  'native %s hidden leading content releases its gap and can recover',
  (platform) => {
    const previous = Platform.OS;
    Platform.OS = platform;
    try {
      const screen = render(<Subject shown={false} />);
      const title = screen.getByTestId('header-title');
      const measure = () => screen.getByTestId('header-leading-measure');
      const layout = (width: number) =>
        fireEvent(measure(), 'layout', {
          nativeEvent: { layout: { x: 0, y: 0, width, height: 36 } },
        });
      layout(0);
      expect(screen.queryByTestId('menu')).toBeNull();
      expect(resolvedStyle(screen.getByTestId('header-start').props.style).gap).toBe(0);
      screen.rerender(<Subject shown />);
      expect(screen.getByTestId('header-title')).toBe(title);
      expect(screen.getByTestId('menu')).toBeTruthy();
      layout(36);
      expect(resolvedStyle(screen.getByTestId('header-start').props.style).gap).toBe(6);
      screen.rerender(<Subject shown={false} />);
      layout(0);
      expect(screen.getByTestId('header-title')).toBe(title);
      expect(resolvedStyle(screen.getByTestId('header-start').props.style).gap).toBe(0);
      expect(resolvedStyle(measure().props.style).display).not.toBe('none');
    } finally {
      Platform.OS = previous;
    }
  },
);
