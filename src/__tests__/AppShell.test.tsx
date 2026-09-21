import React from 'react';
import * as ReactNative from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import { AppShell, AppShellHeader, AppShellMenuButton, NotificationBell, ProOfferCard, useAppShell } from '../app-shell';
import { RiHomeLine } from '../icons/remix';
import type { NotificationCenterItem } from '../notification-center';
import { ContentPanel } from '../content-panel';
import { useTheme } from '../theme/use-theme';
import { resolvedStyle } from './support/rendered-style';
import { resolveScrollMode } from '../app-shell/layout';

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

  it('compact feed reveals navigation without replacing its document content', () => {
    setWidth(390);
    const onDrawerOpenChange = jest.fn();
    const screen = renderIn(
      <AppShell testID="feed" variant="feed" drawer="reveal" scroll="document"
        navFrom={700} sidebar={{ items: NAV }} drawerOpen onDrawerOpenChange={onDrawerOpenChange}>
        <ReactNative.Text>Feed content</ReactNative.Text>
      </AppShell>,
    );
    expect(screen.getByTestId('feed-reveal-page')).toBeTruthy();
    expect(screen.getByText('Feed content')).toBeTruthy();
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
    fireEvent.press(screen.getByTestId('feed-veil'));
    expect(onDrawerOpenChange).toHaveBeenCalledWith(false);
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

  it('document asides use the page scroll and reveal their bottom when taller than the viewport', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" aside={<ReactNative.Text>Long context</ReactNative.Text>} />);
    const aside = screen.getByTestId('shell-aside');
    expect(screen.UNSAFE_queryAllByType(ReactNative.ScrollView)).toHaveLength(0);
    expect(resolvedStyle(aside.props.style)).toMatchObject({ position: 'sticky', top: 12 });
    expect(resolvedStyle(aside.props.style).height).toBeUndefined();
    fireEvent(aside, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 1200 } } });
    expect(resolvedStyle(aside.props.style).top).toBe(-312);
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

  it('header={null} draws NO header, menu button included — the page owns that corner', () => {
    setWidth(700);
    const screen = renderIn(<AppShell testID="shell" sidebar={{ items: NAV }} header={null} title="Ignored" />);
    expect(screen.queryByTestId('shell-header')).toBeNull();
    expect(screen.queryByTestId('shell-header-menu')).toBeNull();
    // The drawer is still THERE — the page opens it itself.
    expect(screen.getByTestId('shell-page')).toBeTruthy();
  });

  it('AppShellMenuButton renders nothing while the sidebar is in flow', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell sidebar={{ items: NAV }} header={<AppShellMenuButton testID="menu" />} />);
    expect(screen.queryByTestId('menu')).toBeNull();
  });
});

describe('AppShell breakpoints as numbers', () => {
  const Aside = () => <ReactNative.Text>Details</ReactNative.Text>;

  it('takes a literal width where an app does not land on a named tier', () => {
    // A feed whose side column earns its place at 990, between lg and xl.
    setWidth(1000);
    const beside = renderIn(
      <AppShell testID="shell" variant="feed" title="Home" aside={<Aside />} asideFrom={990} asideWidth={350} />,
    );
    expect(resolvedStyle(beside.getByTestId('shell-aside').props.style)).toMatchObject({ width: 350 });
    beside.unmount();

    setWidth(980);
    const stacked = renderIn(
      <AppShell testID="shell" variant="feed" title="Home" aside={<Aside />} asideFrom={990} asideWidth={350} />,
    );
    expect(resolvedStyle(stacked.getByTestId('shell-aside').props.style).width).toBeUndefined();
    stacked.unmount();

    // …and the rail goes in flow at 500, where the named tiers say `sm` is 640.
    setWidth(520);
    const rail = renderIn(<AppShell testID="shell" variant="feed" title="Home" sidebar={{ items: NAV }} navFrom={500} />);
    expect(rail.getByTestId('sidebar-item-home')).toBeTruthy();
    expect(rail.queryByTestId('shell-header-menu')).toBeNull();
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

describe('AppShell variant="canvas"', () => {
  const Canvas = () => <ReactNative.View testID="canvas" />;

  it('is one screen, never a document scroll, and the canvas area has no column, cap or padding', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" variant="canvas" sidebar={{ items: NAV }}>
        <Canvas />
      </AppShell>,
    );
    // The frame is the viewport and nothing scrolls it.
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({ overflow: 'hidden' });
    // Nothing between the canvas and the frame scrolls (the rail's own row
    // scroller is not the page's).
    for (let n = screen.getByTestId('canvas').parent; n; n = n.parent) {
      if (typeof n.type === 'string') expect(n.type).not.toContain('ScrollView');
    }
    // The page region fills, with no max width and no padding of its own.
    const page = resolvedStyle(screen.getByTestId('shell-page').props.style);
    expect(page).toMatchObject({ flex: 1, minWidth: 0, minHeight: 0 });
    expect(page.maxWidth).toBeUndefined();
    expect(page.padding).toBeUndefined();
    expect(page.paddingLeft).toBeUndefined();
  });

  it('keeps the row edge to edge and moves the inset onto the regions, so only the canvas reaches the window', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" variant="canvas" sidebar={{ items: NAV }} aside={<ReactNative.Text>In view</ReactNative.Text>}>
        <Canvas />
      </AppShell>,
    );
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({ padding: 0, gap: 0 });
    // The nav is still a card with a gutter around it…
    expect(resolvedStyle(hostParent(screen.getByTestId('sidebar-item-home'))?.props.style)).toBeTruthy();
    const nav = screen.getByTestId('shell').props.children;
    expect(nav).toBeTruthy();
    // …and the aside keeps its own inset rather than touching the edge.
    expect(resolvedStyle(screen.getByTestId('shell-aside').props.style)).toMatchObject({ padding: 16, paddingLeft: 0 });
  });
});

describe('AppShell panel fill', () => {
  /** Is `id` rendered inside the page scroller, or beside it? */
  function insidePage(screen: ReturnType<typeof renderIn>, id: string): boolean {
    for (let n = screen.getByTestId(id).parent; n; n = n.parent) {
      if (n.props?.testID === 'shell-page') return true;
    }
    return false;
  }

  it.each(['document', 'fixed'] as const)('%s panel leaves content spacing to its screen', (scroll) => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" variant="feed" panel scroll={scroll} gutter={24}
      header={<ReactNative.View testID="full-header" />}>
      <ReactNative.Text testID="body">Body</ReactNative.Text>
    </AppShell>);
    const parentStyle = resolvedStyle(hostParent(screen.getByTestId('full-header'))?.props.style);
    expect(parentStyle.padding ?? 0).toBe(0);
    expect(parentStyle.paddingLeft ?? parentStyle.paddingHorizontal ?? 0).toBe(0);
    expect(parentStyle.paddingRight ?? parentStyle.paddingHorizontal ?? 0).toBe(0);
    const bodyStyle = scroll === 'fixed'
      ? resolvedStyle(screen.getByTestId('shell-page').props.contentContainerStyle)
      : resolvedStyle(hostParent(screen.getByTestId('body'))?.props.style);
    expect(bodyStyle.paddingLeft ?? 0).toBe(0);
    expect(bodyStyle.paddingRight ?? 0).toBe(0);
    expect(bodyStyle.paddingTop ?? 0).toBe(0);
    expect(bodyStyle.paddingBottom ?? 0).toBe(0);
  });

  it('a panel in a BOUNDED shell pins the header and scrolls only the content under it', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" variant="feed" panel scroll="fixed" title="Home" sidebar={{ items: NAV }}>
        <ReactNative.Text testID="post">post</ReactNative.Text>
      </AppShell>,
    );
    // The scroller is the panel's own, with the header outside it: the frame
    // holds the screen and only the feed moves.
    expect(insidePage(screen, 'post')).toBe(true);
    expect(insidePage(screen, 'shell-header')).toBe(false);
  });

  it('a panel in a DOCUMENT-scrolled shell keeps growing with the page, header and all', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" variant="feed" panel scroll="document" title="Home" sidebar={{ items: NAV }}>
        <ReactNative.Text testID="post">post</ReactNative.Text>
      </AppShell>,
    );
    // Native has no document and resolves this to a container — but the page
    // ASKED for document scroll, so the header still travels with the content.
    expect(insidePage(screen, 'post')).toBe(true);
    expect(insidePage(screen, 'shell-header')).toBe(true);
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

// ---------------------------------------------------------------------------
//  Variants, slots and sizes
// ---------------------------------------------------------------------------

/**
 * The shell lays out from the box it was GIVEN, not from the window — the one
 * property every variant below rests on, and the one no window-width hook can
 * express. A preview pane, one half of a split view or a desktop app's own
 * chrome is narrower than the window, and the layout has to follow the pane.
 */
describe('AppShell measures itself', () => {
  it('takes its breakpoints from its own width once it has been laid out', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" title="Home" sidebar={{ items: NAV }} />);
    // The window says desktop, so the rail is in flow and there is no hamburger.
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
    expect(screen.queryByTestId('shell-header-menu')).toBeNull();

    fireEvent(screen.getByTestId('shell'), 'layout', {
      nativeEvent: { layout: { width: 480, height: 900, x: 0, y: 0 } },
    });

    // The BOX says phone. The window never changed.
    expect(screen.queryByTestId('sidebar-item-home')).toBeNull();
    expect(screen.getByTestId('shell-header-menu')).toBeTruthy();
  });

  it('falls back to the window before the first layout, so frame one is not a phone', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" title="Home" sidebar={{ items: NAV }} />);
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
  });
});

describe('AppShell variant="feed"', () => {
  it('is a contentWidth column that SHRINKS rather than overflowing', () => {
    setWidth(1440);
    const wide = renderIn(<AppShell testID="shell" variant="feed" title="Home" />);
    expect(resolvedStyle(wide.getByTestId('shell-content').props.style)).toMatchObject({
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: 600,
      maxWidth: 600,
      minWidth: 0,
    });
    // A `width` would be the bug: 600 inside a 360 phone overflows sideways.
    expect(resolvedStyle(wide.getByTestId('shell-content').props.style).width).toBeUndefined();
    wide.unmount();

    setWidth(360);
    const phone = renderIn(<AppShell testID="shell" variant="feed" contentWidth={520} title="Home" />);
    expect(resolvedStyle(phone.getByTestId('shell-content').props.style)).toMatchObject({
      flexShrink: 1,
      flexBasis: 520,
      maxWidth: 520,
    });
  });

  it('centres the content and the aside as a PAIR in what the nav leaves', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" variant="feed" title="Home" sidebar={{ items: NAV }} aside={<ReactNative.Text>Side</ReactNative.Text>} />,
    );
    const content = screen.getByTestId('shell-content');
    const aside = screen.getByTestId('shell-aside');
    const row = hostParent(content);
    expect(hostParent(aside)).toBe(row);
    expect(resolvedStyle(row?.props.style)).toMatchObject({ flexDirection: 'row', justifyContent: 'center' });
    expect(resolvedStyle(aside.props.style)).toMatchObject({ width: 320 });
  });

  it('can center navigation together with the reading column and contextual column', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" variant="feed" navigationAlign="content" contentWidth={600} asideWidth={280} gutter={16} sidebar={{ items: NAV }} aside={<ReactNative.Text>Context</ReactNative.Text>} />);
    expect(resolvedStyle(screen.getByTestId('shell').props.style).justifyContent).toBe('center');
    const group = hostParent(screen.getByTestId('shell-content'));
    expect(resolvedStyle(group?.props.style)).toMatchObject({ flexGrow: 0, flexBasis: 896, maxWidth: 896 });
  });

  it('can close the navigation gap without changing panel and aside insets', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" variant="feed" navigationGap={0} gutter={16}
      contentWidth={600} asideWidth={280} sidebar={{ items: NAV }} aside={<ReactNative.Text>Context</ReactNative.Text>} />);
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({ padding: 16, gap: 0 });
    const group = hostParent(screen.getByTestId('shell-content'));
    expect(resolvedStyle(group?.props.style).gap).toBe(16);
  });

  it('keeps a plain centered document shell flush while insetting only its reading group', () => {
    jest.replaceProperty(ReactNative.Platform, 'OS', 'web');
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" variant="feed" scroll="document" navigationAlign="content"
      sidebar={{ items: NAV, surface: 'plain' }} gutter={8} panel><ReactNative.Text>Body</ReactNative.Text></AppShell>);
    expect(resolvedStyle(screen.getByTestId('shell').props.style).padding).toBe(0);
    expect(resolvedStyle(screen.getByTestId('shell-navigation').props.style).top).toBe(0);
    const group = hostParent(screen.getByTestId('shell-content'));
    expect(resolvedStyle(group?.props.style)).toMatchObject({ paddingTop: 8, paddingBottom: 8 });
  });

  it.each([
    { width: 699, framedFrom: undefined, expected: false },
    { width: 700, framedFrom: undefined, expected: true },
    { width: 767, framedFrom: undefined, expected: true },
    { width: 699, framedFrom: 640 as const, expected: undefined },
  ])('coordinates panel framing with navigation, respecting overrides: %j', ({ width, framedFrom, expected }) => {
    jest.replaceProperty(ReactNative.Platform, 'OS', 'web');
    setWidth(width);
    const screen = renderIn(<AppShell variant="feed" panel navFrom={700} framedFrom={framedFrom}
      sidebar={{ items: NAV, variant: 'rail' }}><ReactNative.Text>Body</ReactNative.Text></AppShell>);
    const panel = screen.UNSAFE_root.findByType((ContentPanel as unknown as { type: React.ComponentType }).type);
    expect(panel.props.framed).toBe(expected);
  });

  it('below asideFrom the side column stacks under the content instead', () => {
    setWidth(1100);
    const screen = renderIn(
      <AppShell testID="shell" variant="feed" title="Home" aside={<ReactNative.Text>Side</ReactNative.Text>} />,
    );
    expect(screen.getByText('Side')).toBeTruthy();
    expect(resolvedStyle(screen.getByTestId('shell-aside').props.style).width).toBeUndefined();
  });

  it('uses one gutter for padding and gap, where dashboard keeps its 12/16 pair', () => {
    setWidth(1440);
    const feed = renderIn(<AppShell testID="shell" variant="feed" title="Home" />);
    expect(resolvedStyle(feed.getByTestId('shell').props.style)).toMatchObject({ padding: 16, gap: 16 });
    feed.unmount();
    const dash = renderIn(<AppShell testID="shell" title="Home" />);
    expect(resolvedStyle(dash.getByTestId('shell').props.style)).toMatchObject({ padding: 12, gap: 16 });
    dash.unmount();
    const wide = renderIn(<AppShell testID="shell" variant="feed" gutter={24} title="Home" />);
    expect(resolvedStyle(wide.getByTestId('shell').props.style)).toMatchObject({ padding: 24, gap: 24 });
  });
});

describe('AppShell variant="focus"', () => {
  it('draws no navigation at all, sidebar or not', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" variant="focus" title="Sign in" sidebar={{ items: NAV }} />);
    expect(screen.queryByTestId('sidebar-item-home')).toBeNull();
    expect(screen.queryByTestId('shell-header-menu')).toBeNull();
    expect(resolvedStyle(screen.getByTestId('shell-content').props.style)).toMatchObject({ flexBasis: 600 });
  });

  it('takes no aside in either position — it is a single column by definition', () => {
    setWidth(1440);
    const wide = renderIn(
      <AppShell testID="shell" variant="focus" title="Sign in" aside={<ReactNative.Text>Side</ReactNative.Text>} />,
    );
    expect(wide.queryByText('Side')).toBeNull();
    wide.unmount();
    // Below `asideFrom` an aside STACKS under the content — also not here.
    setWidth(500);
    const narrow = renderIn(
      <AppShell testID="shell" variant="focus" title="Sign in" aside={<ReactNative.Text>Side</ReactNative.Text>} />,
    );
    expect(narrow.queryByText('Side')).toBeNull();
  });

  it('keeps the bar slots, so a sign-up flow still gets its footer CTA', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell
        testID="shell"
        variant="focus"
        title="Sign in"
        bottomBarVisibility="always"
        bottomBar={<ReactNative.Text>Continue</ReactNative.Text>}
      />,
    );
    expect(screen.getByText('Continue')).toBeTruthy();
  });
});

describe('AppShell variant="split"', () => {
  const PANES = {
    list: <ReactNative.Text>List</ReactNative.Text>,
    info: <ReactNative.Text>Info</ReactNative.Text>,
  };

  it('shows two panes from splitFrom and the third from infoFrom', () => {
    setWidth(1440);
    const three = renderIn(
      <AppShell testID="shell" variant="split" title="Inbox" list={PANES.list} info={PANES.info}>
        <ReactNative.Text>Detail</ReactNative.Text>
      </AppShell>,
    );
    expect(three.getByTestId('shell-pane-list')).toBeTruthy();
    expect(three.getByTestId('shell-pane-detail')).toBeTruthy();
    expect(three.getByTestId('shell-pane-info')).toBeTruthy();
    expect(resolvedStyle(three.getByTestId('shell-pane-list').props.style)).toMatchObject({ width: 360 });
    expect(resolvedStyle(three.getByTestId('shell-pane-info').props.style)).toMatchObject({ width: 320 });
    three.unmount();

    setWidth(1100);
    const two = renderIn(
      <AppShell testID="shell" variant="split" title="Inbox" list={PANES.list} info={PANES.info}>
        <ReactNative.Text>Detail</ReactNative.Text>
      </AppShell>,
    );
    expect(two.getByTestId('shell-pane-list')).toBeTruthy();
    expect(two.getByTestId('shell-pane-detail')).toBeTruthy();
    expect(two.queryByTestId('shell-pane-info')).toBeNull();
  });

  it('below splitFrom renders EXACTLY the one pane `pane` names', () => {
    setWidth(500);
    const list = renderIn(
      <AppShell testID="shell" variant="split" list={PANES.list} info={PANES.info}>
        <ReactNative.Text>Detail</ReactNative.Text>
      </AppShell>,
    );
    expect(list.getByTestId('shell-pane-list')).toBeTruthy();
    expect(list.queryByTestId('shell-pane-detail')).toBeNull();
    expect(list.queryByTestId('shell-pane-info')).toBeNull();
    // Alone, the pane fills the row rather than keeping its column width.
    expect(resolvedStyle(list.getByTestId('shell-pane-list').props.style).width).toBeUndefined();
    list.unmount();

    const detail = renderIn(
      <AppShell testID="shell" variant="split" pane="detail" list={PANES.list} info={PANES.info}>
        <ReactNative.Text>Detail</ReactNative.Text>
      </AppShell>,
    );
    expect(detail.queryByTestId('shell-pane-list')).toBeNull();
    expect(detail.getByTestId('shell-pane-detail')).toBeTruthy();
    detail.unmount();

    // `pane` names a pane that was never given content: fall back rather than
    // render an empty screen.
    const empty = renderIn(
      <AppShell testID="shell" variant="split" pane="info">
        <ReactNative.Text>Detail</ReactNative.Text>
      </AppShell>,
    );
    expect(empty.getByTestId('shell-pane-detail')).toBeTruthy();
    expect(empty.queryByTestId('shell-pane-info')).toBeNull();
  });

  it('gives each pane its own scroller, or none when the page owns one', () => {
    setWidth(1440);
    const own = renderIn(
      <AppShell testID="shell" variant="split" list={PANES.list}>
        <ReactNative.Text>Detail</ReactNative.Text>
      </AppShell>,
    );
    const panes = own.UNSAFE_queryAllByType(ReactNative.ScrollView).filter((node) => {
      for (let n = node.parent; n; n = n.parent) if (n.props.role === 'complementary') return false;
      return true;
    });
    expect(panes.length).toBe(2);
    own.unmount();

    const none = renderIn(
      <AppShell testID="shell" variant="split" paneScroll={false} list={PANES.list}>
        <ReactNative.Text>Detail</ReactNative.Text>
      </AppShell>,
    );
    expect(
      none.UNSAFE_queryAllByType(ReactNative.ScrollView).filter((node) => {
        for (let n = node.parent; n; n = n.parent) if (n.props.role === 'complementary') return false;
        return true;
      }).length,
    ).toBe(0);
  });

  it('names the divider and lets the keyboard move it', () => {
    setWidth(1440);
    const onListWidthChange = jest.fn();
    const screen = renderIn(
      <AppShell testID="shell" variant="split" list={PANES.list} onListWidthChange={onListWidthChange}>
        <ReactNative.Text>Detail</ReactNative.Text>
      </AppShell>,
    );
    const divider = screen.getByTestId('shell-divider');
    expect(divider.props.accessibilityLabel).toBe('Resize panes');
    expect(divider.props['aria-orientation']).toBe('vertical');
  });

  it('is one screen, never a document scroll', () => {
    // The reduction itself is a pure function, and it is the part that matters:
    // three columns that each keep their own scroll position cannot also be
    // growing one document.
    expect(resolveScrollMode('split', 'document')).toBe('fixed');
    expect(resolveScrollMode('split', 'container')).toBe('container');
    expect(resolveScrollMode('split', 'fixed')).toBe('fixed');
    // (`fixedRoot`'s web spelling — `height: 100dvh` — is read from
    // `Platform.OS` at module load, which jest has already fixed as native by
    // the time a test could mock it. What is assertable here is the frame's
    // shape: bounded and clipped, so the panes scroll instead of the page.)
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" variant="split" scroll="document" list={PANES.list}>
        <ReactNative.Text>Detail</ReactNative.Text>
      </AppShell>,
    );
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({ overflow: 'hidden' });
  });
});

describe('AppShell pinned slots', () => {
  const original = ReactNative.Platform.OS;
  const INSETS = { top: 44, bottom: 34, left: 0, right: 0 };
  beforeEach(() => {
    Object.defineProperty(ReactNative.Platform, 'OS', { value: 'web', configurable: true, writable: true });
  });
  afterEach(() => {
    Object.defineProperty(ReactNative.Platform, 'OS', { value: original, configurable: true, writable: true });
  });

  function renderWithInsets(ui: React.ReactElement) {
    return renderIn(<SafeAreaInsetsContext.Provider value={INSETS}>{ui}</SafeAreaInsetsContext.Provider>);
  }

  it('pins the bottom bar to the viewport with the safe-area inset as its own padding', () => {
    setWidth(500);
    const screen = renderWithInsets(
      <AppShell testID="shell" variant="feed" sidebar={{ items: NAV }} bottomBar={<ReactNative.Text>Tabs</ReactNative.Text>} />,
    );
    const bar = screen.getByTestId('shell-bottom-bar');
    expect(resolvedStyle(bar.props.style)).toMatchObject({
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      paddingBottom: 34,
    });
    // A style entry is dropped by react-native-web; this has to be the PROP.
    expect(bar.props.pointerEvents).toBe('box-none');
  });

  it('reserves the bar and the action button MEASURED heights under the content', () => {
    setWidth(500);
    const screen = renderWithInsets(
      <AppShell
        testID="shell"
        variant="feed"
        sidebar={{ items: NAV }}
        bottomBar={<ReactNative.Text>Tabs</ReactNative.Text>}
        floatingAction={<ReactNative.Text>+</ReactNative.Text>}
      />,
    );
    fireEvent(screen.getByTestId('shell-bottom-bar'), 'layout', {
      nativeEvent: { layout: { width: 500, height: 72, x: 0, y: 0 } },
    });
    fireEvent(screen.getByTestId('shell-floating-action'), 'layout', {
      nativeEvent: { layout: { width: 500, height: 56, x: 0, y: 0 } },
    });
    // The action sits ABOVE the bar, a gutter clear of it…
    expect(resolvedStyle(screen.getByTestId('shell-floating-action').props.style)).toMatchObject({ bottom: 72 + 16 });
    // …and the page reserves both, so the last row is never behind either.
    expect(resolvedStyle(screen.getByTestId('shell-page').props.style)).toMatchObject({
      paddingBottom: 72 + 56 + 16,
    });
  });

  it('reserves nothing when there is no bar and no action', () => {
    setWidth(500);
    const screen = renderWithInsets(<AppShell testID="shell" variant="feed" sidebar={{ items: NAV }} />);
    expect(resolvedStyle(screen.getByTestId('shell-page').props.style)).toMatchObject({ paddingBottom: 0 });
  });

  it('draws the bars while the nav is a drawer, or always', () => {
    setWidth(1440);
    const flow = renderWithInsets(
      <AppShell testID="shell" variant="feed" sidebar={{ items: NAV }} bottomBar={<ReactNative.Text>Tabs</ReactNative.Text>} />,
    );
    expect(flow.queryByTestId('shell-bottom-bar')).toBeNull();
    flow.unmount();

    const always = renderWithInsets(
      <AppShell
        testID="shell"
        variant="feed"
        sidebar={{ items: NAV }}
        bottomBarVisibility="always"
        bottomBar={<ReactNative.Text>Tabs</ReactNative.Text>}
      />,
    );
    expect(always.getByTestId('shell-bottom-bar')).toBeTruthy();
  });

  it('pins the top bar above the columns, and gives it the menu button', () => {
    setWidth(500);
    const screen = renderWithInsets(
      <AppShell
        testID="shell"
        variant="feed"
        title="Home"
        sidebar={{ items: NAV }}
        topBar={<AppShellMenuButton testID="bar-menu" />}
      />,
    );
    const bar = screen.getByTestId('shell-top-bar');
    expect(resolvedStyle(bar.props.style)).toMatchObject({ position: 'sticky', top: 0, paddingTop: 44 });
    // It is a sibling ABOVE the row, not a child of the content column.
    expect(hostParent(bar)?.props.testID).toBe('shell');
    // ONE hamburger: the bar's. The header does not add a second under it.
    expect(screen.getByTestId('bar-menu')).toBeTruthy();
    expect(screen.queryByTestId('shell-header-menu')).toBeNull();
  });
});

describe('AppShell nav sizing', () => {
  it('navFrom moves the tier the rail sits in flow from', () => {
    setWidth(800);
    const md = renderIn(<AppShell testID="shell" title="Home" navFrom="md" sidebar={{ items: NAV }} />);
    expect(md.getByTestId('sidebar-item-home')).toBeTruthy();
    expect(md.queryByTestId('shell-header-menu')).toBeNull();
    md.unmount();

    const lg = renderIn(<AppShell testID="shell" title="Home" sidebar={{ items: NAV }} />);
    expect(lg.queryByTestId('sidebar-item-home')).toBeNull();
    expect(lg.getByTestId('shell-header-menu')).toBeTruthy();
  });

  it('navExpandedFrom swaps icons for labels, and lets the rail sit in flow from sm', () => {
    setWidth(700);
    const rail = renderIn(<AppShell testID="shell" title="Home" navExpandedFrom="lg" sidebar={{ items: NAV }} />);
    // The rail's own item geometry (64 tall) is what says it is the rail.
    expect(resolvedStyle(rail.getByTestId('sidebar-item-home').props.style)).toMatchObject({ minHeight: 64 });
    rail.unmount();

    setWidth(1440);
    const panel = renderIn(<AppShell testID="shell" title="Home" navExpandedFrom="lg" sidebar={{ items: NAV }} />);
    expect(resolvedStyle(panel.getByTestId('sidebar-item-home').props.style).minHeight).toBeUndefined();
  });
});


describe('AppShell panel theme', () => {
  it.each([390, 1440])('at %ipx scopes only the reading column without remounting content', (width) => {
    setWidth(width);
    const mounted = jest.fn();
    function Probe({ id }: { id: string }) {
      const { colors } = useTheme();
      React.useEffect(() => { mounted(id); }, []);
      return <ReactNative.Text testID={id}>{colors.primary}</ReactNative.Text>;
    }
    function Frame({ preset }: { preset?: 'rose' | 'teal' }) {
      return <BloomThemeProvider mode="light" colorPreset="teal">
        <AppShell variant="feed" panel panelColorPreset={preset} aside={<Probe id="aside-color" />}>
          <Probe id="panel-color" />
        </AppShell>
      </BloomThemeProvider>;
    }
    const screen = render(<Frame />);
    const original = screen.getByTestId('aside-color').props.children;
    expect(screen.getByTestId('panel-color').props.children).toBe(original);
    screen.rerender(<Frame preset="rose" />);
    expect(screen.getByTestId('aside-color').props.children).toBe(original);
    expect(screen.getByTestId('panel-color').props.children).not.toBe(original);
    expect(mounted.mock.calls.filter(([id]) => id === 'panel-color')).toHaveLength(1);
  });
});
