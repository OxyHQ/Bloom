import { Stop } from 'react-native-svg';
import { contrastRatio, mixColors } from '../styles/color-contrast';
import React from 'react';
import * as ReactNative from 'react-native';
import { fireEvent, render, within } from '@testing-library/react-native';

import { ContentPanel } from '../content-panel';
import { ScreenScrollView } from '../screen';
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
  const navigation = [{ value: 'home', label: 'Home', icon: <RiHomeLine /> }];
  it.each([[767, 'bottom'], [768, 'rail'], [1023, 'rail'], [1024, 'sidebar']] as const)('chooses navigation at width %s', (width, placement) => {
    setWidth(width);
    const screen = renderIn(<AppShell testID="shell" navigation={navigation} value="home" />);
    expect(screen.getByTestId(`shell-navigation-${placement}`)).toBeTruthy();
  });
  it('uses measured column width and leaves external list scrolling to the child', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" navigation={navigation} scroll="external"><ReactNative.View testID="list" /></AppShell>);
    fireEvent(screen.getByTestId('shell'), 'layout', { nativeEvent: { layout: { width: 600 } } });
    expect(screen.getByTestId('shell-navigation-bottom')).toBeTruthy();
    expect(screen.getByTestId('list')).toBeTruthy();
    expect(screen.UNSAFE_queryAllByType(ScreenScrollView)).toHaveLength(0);
  });
  it('honors explicit placement and forwards selection', () => {
    setWidth(390);
    const onValueChange = jest.fn();
    const screen = renderIn(<AppShell testID="shell" navigation={navigation} value="other" navigationPlacement="sidebar" onValueChange={onValueChange} />);
    fireEvent.press(screen.getByLabelText('Home'));
    expect(onValueChange).toHaveBeenCalledWith('home');
  });
  it.each(['card', 'docked'] as const)('preserves the %s sidebar surface with either navigation API', surface => {
    setWidth(1440);
    for (const navigationProps of [{ navigation }, { sidebar: { items: NAV } }]) {
      const screen = renderIn(<AppShell {...navigationProps} testID="surface-shell" navigationPlacement="sidebar" sidebar={{ ...navigationProps.sidebar, surface }} />);
      const gutter = surface === 'card' ? 12 : 0;
      expect(resolvedStyle(screen.getByTestId('surface-shell-navigation-sidebar').props.style)).toMatchObject({
        paddingTop: gutter, paddingBottom: gutter, paddingLeft: gutter, paddingRight: gutter,
      });
      const panelStyle = resolvedStyle(screen.getByTestId('surface-shell-sidebar').props.style);
      expect(panelStyle.borderRadius ?? 0).toBe(surface === 'card' ? 24 : 0);
      expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
      screen.unmount();
    }
  });
  it('floats the desktop action over content rather than beneath the sidebar', () => {
    setWidth(1440);
    const onPress = jest.fn();
    const screen = renderIn(<AppShell testID="action-shell" navigation={navigation} primaryAction={{ icon: RiHomeLine, accessibilityLabel: 'Create', onPress }} />);
    const nav = within(screen.getByTestId('action-shell-navigation-sidebar'));
    expect(nav.queryByLabelText('Create')).toBeNull();
    const contentChrome = within(screen.getByTestId('action-shell-screen-bottom'));
    fireEvent.press(contentChrome.getByLabelText('Create'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('retains sidebar data on wide screens', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" sidebar={{ items: NAV }} />);
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
  });
});

describe('NotificationBell', () => {
  it('shows the unread count on the glyph, and an explicit override', () => {
    setWidth(1440);
    const screen = renderIn(<NotificationBell testID="bell" notifications={ITEMS} />);
    const count = screen.getByTestId('bell-count');
    expect(resolvedStyle(count.props.style)).toMatchObject({ width: 16, height: 16, top: 2, insetInlineStart: 18 });
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
      insetInlineStart: 12,
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

it('keeps Pro Offer copy readable across its painted dark gradient', () => {
  const screen = render(<BloomThemeProvider mode="dark" colorPreset="olive"><ProOfferCard testID="tonal-offer" onDismiss={() => {}} title="Upgrade" description="More room for your work" ctaLabel="Get Pro" placement="inline" enterDelay={0} /></BloomThemeProvider>);
  const base = resolvedStyle(screen.getByTestId('tonal-offer').props.style).backgroundColor as string;
  const stops = screen.UNSAFE_getAllByType(Stop).slice(0, 2);
  expect(stops).toHaveLength(2);
  for (const stop of stops) {
    const painted = mixColors(base, stop.props.stopColor, stop.props.stopOpacity);
    for (const label of ['Upgrade', 'More room for your work']) {
      const ink = resolvedStyle(screen.getByText(label).props.style).color as string;
      expect(contrastRatio(ink, painted)).toBeGreaterThanOrEqual(4.5);
    }
  }
});


describe('navigation convenience with document layout on web', () => {
  const originalPlatform = ReactNative.Platform.OS;
  const navigation = [{ value: 'home', label: 'Home', icon: <RiHomeLine /> }];
  beforeEach(() => Object.defineProperty(ReactNative.Platform, 'OS', { value: 'web', configurable: true, writable: true }));
  afterEach(() => Object.defineProperty(ReactNative.Platform, 'OS', { value: originalPlatform, configurable: true, writable: true }));

  it.each([undefined, 'document'] as const)('preserves feed and aside without a page ScrollView (%s)', scroll => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="document-shell" navigation={navigation} scroll={scroll}
      variant="feed" contentWidth={560} asideWidth={280} asideFrom={1180}
      aside={<ReactNative.View testID="document-aside-content" />}>
      <ReactNative.View testID="document-content" />
    </AppShell>);
    expect(resolvedStyle(screen.getByTestId('document-shell').props.style).minHeight).toBe('100dvh');
    expect(resolvedStyle(screen.getByTestId('document-shell-aside').props.style).width).toBe(280);
    for (const testID of ['document-content', 'document-aside-content']) {
      for (let node = screen.getByTestId(testID).parent; node; node = node.parent) {
        expect(node.type).not.toBe(ReactNative.ScrollView);
      }
    }
  });

  it.each([390, 1440])('paints the full document frame for short content at width %s', width => {
    setWidth(width);
    const screen = renderIn(<AppShell testID="short" variant="feed" panel scroll="document" gutter={8}
      navigationAlign="content" sidebar={{ items: NAV, surface: 'plain' }} navFrom={700}>
      <ReactNative.Text>Short</ReactNative.Text>
    </AppShell>);
    const panel = screen.UNSAFE_root.findByType((ContentPanel as unknown as { type: React.ComponentType }).type);
    expect(panel.props.surfaceStyle.minHeight).toBe(width < 700 ? 'calc(100dvh - 0px)' : 'calc(100dvh - 16px)');
    expect(panel.props.surfaceStyle.height).toBeUndefined();
  });
  it('subtracts a measured external header once, but keeps an internal header inside the minimum', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="external" variant="feed" panel scroll="document" gutter={8}
      topBarVisibility="always" topBar={<ReactNative.Text>External</ReactNative.Text>}
      header={<ReactNative.Text>Internal</ReactNative.Text>} sidebar={{ items: NAV }}>
      <ReactNative.Text>Short</ReactNative.Text>
    </AppShell>);
    fireEvent(screen.getByTestId('external-top-bar'), 'layout', { nativeEvent: { layout: { height: 60 } } });
    const panel = screen.UNSAFE_root.findByType((ContentPanel as unknown as { type: React.ComponentType }).type);
    expect(panel.props.surfaceStyle.minHeight).toBe('calc(100dvh - 76px)');
    expect(panel.props.overlayInset).toEqual({ top: 68, bottom: 8 });
  });

  it('keeps the primary action above a custom bottom bar', () => {
    setWidth(390);
    const onPress = jest.fn();
    const screen = renderIn(<AppShell testID="custom-bottom" navigation={navigation}
      bottomBar={<ReactNative.View testID="custom-slot" />}
      primaryAction={{ icon: RiHomeLine, accessibilityLabel: 'Create', onPress }} />);
    expect(screen.getByTestId('custom-slot')).toBeTruthy();
    expect(screen.queryByTestId('custom-bottom-navigation-bottom')).toBeNull();
    fireEvent.press(within(screen.getByTestId('custom-bottom-floating-action')).getByLabelText('Create'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('honors explicit null chrome slots', () => {
    setWidth(390);
    const screen = renderIn(<AppShell testID="null-slots" navigation={navigation} bottomBar={null} floatingAction={null}
      primaryAction={{ icon: RiHomeLine, accessibilityLabel: 'Create' }} />);
    expect(screen.queryByTestId('null-slots-navigation-bottom')).toBeNull();
    expect(screen.queryByLabelText('Create')).toBeNull();
  });

  it('focus generates no sidebar or bottom navigation', () => {
    setWidth(390);
    const screen = renderIn(<AppShell testID="focus" variant="focus" navigation={navigation}
      primaryAction={{ icon: RiHomeLine, accessibilityLabel: 'Create' }} />);
    expect(screen.queryByTestId('focus-navigation-bottom')).toBeNull();
    expect(screen.queryByTestId('sidebar-item-home')).toBeNull();
    expect(screen.getByLabelText('Create')).toBeTruthy();
  });

  it('honors numeric navigation breakpoints and puts the compact action in the bottom bar', () => {
    setWidth(750);
    const onPress = jest.fn();
    const screen = renderIn(<AppShell testID="responsive-document" navigation={navigation} scroll="document"
      navFrom={700} navExpandedFrom={1100} primaryAction={{ icon: RiHomeLine, accessibilityLabel: 'Create', onPress }} />);
    expect(screen.queryByTestId('responsive-document-navigation-bottom')).toBeNull();
    fireEvent.press(screen.getByLabelText('Create'));
    expect(onPress).toHaveBeenCalledTimes(1);
    fireEvent(screen.getByTestId('responsive-document-screen'), 'layout', { nativeEvent: { layout: { width: 390, height: 900 } } });
    fireEvent(screen.getByTestId('responsive-document'), 'layout', { nativeEvent: { layout: { width: 390, height: 900 } } });
    expect(screen.getByTestId('responsive-document-navigation-bottom')).toBeTruthy();
    expect(screen.queryByTestId('responsive-document-floating-action')).toBeNull();
  });
});


describe('native navigation with layout props', () => {
  const navigation = [{ value: 'home', label: 'Home', icon: <RiHomeLine /> }];
  it('keeps the aside and owns container scrolling with default auto', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="native-feed" navigation={navigation} variant="feed"
      aside={<ReactNative.View testID="native-aside-content" />} asideFrom={1000} />);
    expect(screen.getByTestId('native-aside-content')).toBeTruthy();
    expect(screen.UNSAFE_queryAllByType(ReactNative.ScrollView).length).toBeGreaterThan(0);
  });
  it('external layout delegates page scrolling to its child', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="native-external" navigation={navigation} variant="feed" scroll="external">
      <ReactNative.View testID="owned-list" />
    </AppShell>);
    for (let node = screen.getByTestId('owned-list').parent; node; node = node.parent) {
      expect(node.type).not.toBe(ReactNative.ScrollView);
    }
  });
});
