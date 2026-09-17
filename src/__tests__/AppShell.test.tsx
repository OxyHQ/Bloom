import React from 'react';
import * as ReactNative from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import { AppShell, AppShellHeader, AppShellMenuButton, NotificationBell, ProOfferCard, useAppShell } from '../app-shell';
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

describe('AppShell scroll on web', () => {
  /**
   * What is pinned is the STRUCTURE the browser needs: no scroll view between
   * the page and the document, a frame at least one viewport tall, and a
   * sticky rail. Whether that really scrolls the document was measured in
   * Chrome (Storybook `Blocks/App Shell`, the dashboard templates).
   */
  const original = ReactNative.Platform.OS;

  /** Scroll views that are the PAGE's — the sidebar scrolls its own list. */
  function pageScrollViews(screen: ReturnType<typeof renderIn>) {
    return screen.UNSAFE_queryAllByType(ReactNative.ScrollView).filter((node) => {
      for (let n = node.parent; n; n = n.parent) if (n.props.role === 'complementary') return false;
      return true;
    });
  }
  beforeEach(() => {
    Object.defineProperty(ReactNative.Platform, 'OS', { value: 'web', configurable: true, writable: true });
  });
  afterEach(() => {
    Object.defineProperty(ReactNative.Platform, 'OS', { value: original, configurable: true, writable: true });
  });

  it('document (default): no ScrollView, a viewport-tall frame and a sticky rail', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" title="Home" sidebar={{ items: NAV }} />);
    expect(pageScrollViews(screen)).toHaveLength(0);
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({ minHeight: '100dvh' });
    expect(resolvedStyle(screen.getByTestId('shell').props.style).overflow).toBeUndefined();
    // The shell's first child is the wrapper holding the in-flow rail.
    const wrapper = screen.getByTestId('shell').children[0];
    expect(typeof wrapper === 'object' && resolvedStyle(wrapper.props.style)).toMatchObject({
      position: 'sticky',
      top: 12,
      height: 'calc(100dvh - 24px)',
    });
  });

  it('reveal + document: the page column shrinks to the screen instead of growing to its longest line', () => {
    setWidth(390);
    const screen = renderIn(
      <AppShell testID="shell" drawer="reveal" title="Home" sidebar={{ items: NAV }}>
        <ReactNative.View testID="page" />
      </AppShell>,
    );
    // page → children wrapper → column → the page scroller.
    let node = hostParent(screen.getByTestId('page'));
    node = node && hostParent(node);
    node = node && hostParent(node);
    expect(resolvedStyle(node?.props.style)).toMatchObject({ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 });
  });

  it('container: the page scrolls its own ScrollView', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" scroll="container" title="Home" sidebar={{ items: NAV }} />);
    expect(pageScrollViews(screen)).toHaveLength(1);
  });
});

/** The nearest HOST ancestor (skipping composite components). */
function hostParent(node: { parent: unknown }) {
  let n = node.parent as { type: unknown; parent: unknown; props: Record<string, unknown> } | null;
  while (n && typeof n.type !== 'string') n = n.parent as typeof n;
  return n;
}

describe('AppShell without a title', () => {
  it('still shows the menu button while the sidebar is a drawer, and nothing when it is in flow', () => {
    setWidth(700);
    const narrow = renderIn(<AppShell testID="shell" sidebar={{ items: NAV }} />);
    fireEvent.press(narrow.getByTestId('shell-header-menu'));
    expect(narrow.getByTestId('sidebar-item-home')).toBeTruthy();
    narrow.unmount();

    setWidth(1440);
    const wide = renderIn(<AppShell testID="shell" sidebar={{ items: NAV }} />);
    expect(wide.queryByTestId('shell-header')).toBeNull();
  });

  it('a custom header opens the drawer with AppShellMenuButton or useAppShell', () => {
    setWidth(700);
    function Opener() {
      const shell = useAppShell();
      return (
        <ReactNative.Pressable testID="custom-open" onPress={shell.openDrawer}>
          <ReactNative.Text>{shell.drawerAvailable ? 'drawer' : 'in flow'}</ReactNative.Text>
        </ReactNative.Pressable>
      );
    }
    const screen = renderIn(
      <AppShell sidebar={{ items: NAV }} header={<><AppShellMenuButton testID="menu" /><Opener /></>} />,
    );
    expect(screen.getByText('drawer')).toBeTruthy();
    fireEvent.press(screen.getByTestId('menu'));
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
    fireEvent.press(screen.getByTestId('sidebar-close'));
    expect(screen.queryByTestId('sidebar-item-home')).toBeNull();
    fireEvent.press(screen.getByTestId('custom-open'));
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
  });

  it('AppShellMenuButton renders nothing while the sidebar is in flow', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell sidebar={{ items: NAV }} header={<AppShellMenuButton testID="menu" />} />);
    expect(screen.queryByTestId('menu')).toBeNull();
  });
});

describe('AppShell aside', () => {
  const Aside = () => <ReactNative.Text>Details</ReactNative.Text>;

  it('sits beside the content from asideFrom, at asideWidth', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" title="Home" aside={<Aside />} asideWidth={280} />);
    expect(resolvedStyle(screen.getByTestId('shell-aside').props.style)).toMatchObject({ width: 280 });
    // Beside: a child of the frame itself, not inside the content column.
    expect(hostParent(screen.getByTestId('shell-aside'))?.props.testID).toBe('shell');
  });

  it('below asideFrom it stacks after the content, or is hidden', () => {
    setWidth(1100);
    const stacked = renderIn(<AppShell testID="shell" title="Home" aside={<Aside />} />);
    expect(stacked.getByText('Details')).toBeTruthy();
    expect(resolvedStyle(stacked.getByTestId('shell-aside').props.style).width).toBeUndefined();
    stacked.unmount();
    const hidden = renderIn(<AppShell testID="shell" title="Home" aside={<Aside />} asideCollapse="hidden" />);
    expect(hidden.queryByText('Details')).toBeNull();
    hidden.unmount();
    const lg = renderIn(<AppShell testID="shell" title="Home" aside={<Aside />} asideFrom="lg" />);
    expect(resolvedStyle(lg.getByTestId('shell-aside').props.style)).toMatchObject({ width: 320 });
  });
});

describe('AppShell scroll="fixed"', () => {
  it('no page ScrollView; the content column fills the height', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" scroll="fixed" title="Chat" sidebar={{ items: NAV }}>
        <ReactNative.View testID="page" />
      </AppShell>,
    );
    const pageScrollers = screen.UNSAFE_queryAllByType(ReactNative.ScrollView).filter((node) => {
      for (let n = node.parent; n; n = n.parent) if (n.props.role === 'complementary') return false;
      return true;
    });
    expect(pageScrollers).toHaveLength(0);
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({ overflow: 'hidden' });
    expect(resolvedStyle(hostParent(screen.getByTestId('page'))?.props.style)).toMatchObject({ flex: 1, minHeight: 0 });
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
