import React from 'react';
import * as ReactNative from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import { AppShell, AppShellHeader, NotificationBell, ProOfferCard } from '../app-shell';
import { RiHomeLine } from '../icons/remix';
import type { NotificationCenterItem } from '../notification-center';
import { resolvedStyle } from './support/rendered-style';

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];
const ITEMS: NotificationCenterItem[] = [
  { id: 'a', category: 'system', group: 'Today', title: 'A', description: 'a', timestamp: '1m', unread: true },
  { id: 'b', category: 'system', group: 'Today', title: 'B', description: 'b', timestamp: '2m', unread: true },
  { id: 'c', category: 'system', group: 'Today', title: 'C', description: 'c', timestamp: '3m' },
];

function renderIn(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        {ui}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
}

function setWidth(width: number) {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

afterEach(() => jest.restoreAllMocks());

describe('AppShellHeader', () => {
  it('title is a level-1 heading in title-2-medium with the px4 inset', () => {
    setWidth(1440);
    const screen = renderIn(<AppShellHeader title="Welcome" onMenuPress={() => {}} />);
    const title = screen.getByText('Welcome');
    expect(title.props.role).toBe('heading');
    expect(resolvedStyle(title.props.style)).toMatchObject({ fontSize: 20, lineHeight: 26, paddingLeft: 4, paddingRight: 4 });
  });
});

describe('AppShell', () => {
  it('wide: the rail is in flow and there is no menu button', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" title="Home" sidebar={{ items: NAV }} />);
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
    expect(screen.queryByTestId('shell-header-menu')).toBeNull();
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({ padding: 12, gap: 16 });
  });

  it('rail variant: in flow from sm, and below it the drawer opens the panel', () => {
    setWidth(700);
    const wide = renderIn(<AppShell testID="shell" title="Home" sidebar={{ variant: 'rail', items: NAV }} />);
    expect(resolvedStyle(wide.getByTestId('sidebar-item-home').props.style)).toMatchObject({ minHeight: 64 });
    expect(wide.queryByTestId('shell-header-menu')).toBeNull();
    wide.unmount();

    setWidth(500);
    const narrow = renderIn(<AppShell testID="shell" title="Home" sidebar={{ variant: 'rail', items: NAV }} />);
    expect(narrow.queryByTestId('sidebar-item-home')).toBeNull();
    fireEvent.press(narrow.getByTestId('shell-header-menu'));
    expect(narrow.getByTestId('sidebar-close')).toBeTruthy();
    expect(resolvedStyle(narrow.getByTestId('sidebar-item-home').props.style).minHeight).toBeUndefined();
  });

  it('narrow overlay: the menu button opens the drawer, the close button shuts it', () => {
    setWidth(700);
    const screen = renderIn(<AppShell testID="shell" title="Home" sidebar={{ items: NAV }} />);
    expect(screen.queryByTestId('sidebar-item-home')).toBeNull();
    fireEvent.press(screen.getByTestId('shell-header-menu'));
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
    fireEvent.press(screen.getByTestId('sidebar-close'));
    expect(screen.queryByTestId('sidebar-item-home')).toBeNull();
  });

  it('narrow reveal: the rail is mounted flat beneath and the veil closes it', () => {
    setWidth(700);
    const onDrawerOpenChange = jest.fn();
    const screen = renderIn(
      <AppShell
        testID="shell"
        drawer="reveal"
        title="Home"
        sidebar={{ items: NAV }}
        drawerOpen
        onDrawerOpenChange={onDrawerOpenChange}
      />,
    );
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
    fireEvent.press(screen.getByTestId('shell-veil'));
    expect(onDrawerOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('NotificationBell', () => {
  it('shows the unread count on the glyph, and an explicit override', () => {
    setWidth(1440);
    const screen = renderIn(<NotificationBell testID="bell" notifications={ITEMS} />);
    const count = screen.getByTestId('bell-count');
    expect(resolvedStyle(count.props.style)).toMatchObject({ width: 16, height: 16, top: 2, left: 18 });
    expect(screen.getByText('2')).toBeTruthy();
    const override = renderIn(<NotificationBell testID="bell2" notifications={ITEMS} unreadCount={5} />);
    expect(override.getByText('5')).toBeTruthy();
    const none = renderIn(<NotificationBell testID="bell3" notifications={ITEMS.slice(2, 3)} />);
    expect(none.queryByTestId('bell3-count')).toBeNull();
  });
});

describe('ProOfferCard', () => {
  it('keeps the card geometry and a named dismiss', () => {
    setWidth(1440);
    const onDismiss = jest.fn();
    const screen = renderIn(
      <ProOfferCard testID="offer" title="Pro" description="d" ctaLabel="Get Pro" onDismiss={onDismiss} />,
    );
    expect(resolvedStyle(screen.getByTestId('offer').props.style)).toMatchObject({
      width: 280,
      left: 12,
      bottom: 12,
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
      gap: 12,
    });
    const dismiss = screen.getByTestId('offer-dismiss');
    expect(dismiss.props.accessibilityLabel).toBe('Dismiss');
    fireEvent.press(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
