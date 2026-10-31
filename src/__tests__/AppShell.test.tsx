import React from 'react';
import * as ReactNative from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AiChatResizeHandle } from '../ai-chat/AiChatResizeHandle';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import {
  AppShell,
  AppShellPanel,
  AppShellPanels,
  useAppShellPanel,
  AppShellHeader,
  AppShellMenuButton,
  NotificationBell,
  ProOfferCard,
  useAppShell,
} from '../app-shell';
import { RiHomeLine } from '../icons/remix';
import type { NotificationCenterItem } from '../notification-center';
import { ContentPanel } from '../content-panel';
import { useTheme } from '../theme/use-theme';
import { resolvedStyle } from './support/rendered-style';

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];
const ITEMS: NotificationCenterItem[] = [
  {
    id: 'a',
    category: 'system',
    group: 'Today',
    title: 'A',
    description: 'a',
    timestamp: '1m',
    unread: true,
  },
  {
    id: 'b',
    category: 'system',
    group: 'Today',
    title: 'B',
    description: 'b',
    timestamp: '2m',
    unread: true,
  },
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
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

afterEach(() => jest.restoreAllMocks());

describe('AppShellHeader', () => {
  it('title is a level-1 heading in title-2-medium with the px4 inset', () => {
    setWidth(1440);
    const screen = renderIn(<AppShellHeader title="Welcome" onMenuPress={() => {}} />);
    const title = screen.getByText('Welcome');
    expect(title.props.role).toBe('heading');
    expect(resolvedStyle(title.props.style)).toMatchObject({
      fontSize: 20,
      lineHeight: 26,
      paddingLeft: 4,
      paddingRight: 4,
    });
  });
});

describe('AppShell', () => {
  it('wide: the rail is in flow and there is no menu button', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" title="Home" sidebar={{ items: NAV }} />);
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
    expect(screen.queryByTestId('shell-header-menu')).toBeNull();
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({
      padding: 12,
      gap: 16,
    });
  });

  it('rail variant: in flow from sm, and below it the drawer opens the panel', () => {
    setWidth(700);
    const wide = renderIn(
      <AppShell testID="shell" title="Home" sidebar={{ variant: 'rail', items: NAV }} />,
    );
    expect(resolvedStyle(wide.getByTestId('sidebar-item-home').props.style)).toMatchObject({
      minHeight: 64,
    });
    expect(wide.queryByTestId('shell-header-menu')).toBeNull();
    wide.unmount();

    setWidth(500);
    const narrow = renderIn(
      <AppShell testID="shell" title="Home" sidebar={{ variant: 'rail', items: NAV }} />,
    );
    expect(narrow.queryByTestId('sidebar-item-home')).toBeNull();
    fireEvent.press(narrow.getByTestId('shell-header-menu'));
    expect(narrow.getByTestId('sidebar-close')).toBeTruthy();
    // The panel's row, not the rail's 64-tall item (a panel row's floor is its square).
    expect(resolvedStyle(narrow.getByTestId('sidebar-item-home').props.style).minHeight).not.toBe(
      64,
    );
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
      <AppShell
        testID="feed"
        variant="feed"
        drawer="reveal"
        scroll="document"
        navFrom={700}
        sidebar={{ items: NAV }}
        drawerOpen
        onDrawerOpenChange={onDrawerOpenChange}
      >
        <ReactNative.Text>Feed content</ReactNative.Text>
      </AppShell>,
    );
    expect(screen.getByTestId('feed-reveal-page', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('Feed content', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('sidebar-item-home')).toBeTruthy();
    fireEvent.press(screen.getByTestId('feed-veil', { includeHiddenElements: true }));
    expect(onDrawerOpenChange).toHaveBeenCalledWith(false);
  });

  it.each(['fixed', 'document'] as const)(
    'dashboard %s reveal moves its bottom slot with the page',
    (scroll) => {
      setWidth(390);
      const screen = renderIn(
        <AppShell
          testID="shell"
          drawer="reveal"
          scroll={scroll}
          drawerOpen
          sidebar={{ items: NAV }}
          bottomBar={<ReactNative.Text>Navigation</ReactNative.Text>}
        />,
      );
      const host = screen.getByTestId('shell-reveal-bars', { includeHiddenElements: true });
      expect(resolvedStyle(host.props.style)).toMatchObject({
        transform: [{ translateX: 272 }],
        top: 0,
        bottom: 0,
      });
      expect(host.props.pointerEvents).toBe('none');
      expect(
        resolvedStyle(
          screen.getByTestId('shell-bottom-bar', { includeHiddenElements: true }).props.style,
        ).position,
      ).toBe('absolute');
      fireEvent.press(screen.getByTestId('shell-veil', { includeHiddenElements: true }));
    },
  );

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
    fireEvent.press(screen.getByTestId('shell-veil', { includeHiddenElements: true }));
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
    Object.defineProperty(ReactNative.Platform, 'OS', {
      value: 'web',
      configurable: true,
      writable: true,
    });
  });
  afterEach(() => {
    Object.defineProperty(ReactNative.Platform, 'OS', {
      value: original,
      configurable: true,
      writable: true,
    });
  });

  it('document (default): no ScrollView, a viewport-tall frame and a sticky rail', () => {
    setWidth(1440);
    const screen = renderIn(<AppShell testID="shell" title="Home" sidebar={{ items: NAV }} />);
    expect(pageScrollViews(screen)).toHaveLength(0);
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({
      minHeight: '100dvh',
    });
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
    const screen = renderIn(
      <AppShell testID="shell" aside={<ReactNative.Text>Long context</ReactNative.Text>} />,
    );
    const aside = screen.getByTestId('shell-aside');
    expect(screen.UNSAFE_queryAllByType(ReactNative.ScrollView)).toHaveLength(0);
    expect(resolvedStyle(aside.props.style)).toMatchObject({ position: 'sticky', top: 12 });
    expect(resolvedStyle(aside.props.style).height).toBeUndefined();
    fireEvent(aside, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 1200 } },
    });
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
    expect(resolvedStyle(node?.props.style)).toMatchObject({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      minWidth: 0,
    });
  });

  it('container: the page scrolls its own ScrollView', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" scroll="container" title="Home" sidebar={{ items: NAV }} />,
    );
    expect(pageScrollViews(screen)).toHaveLength(1);
  });
});

/** The nearest HOST ancestor (skipping composite components). */
function hostParent(node: { parent: unknown }) {
  let n = node.parent as { type: unknown; parent: unknown; props: Record<string, unknown> } | null;
  while (n && typeof n.type !== 'string') n = n.parent as typeof n;
  return n;
}

/** The padding of the row that frames `node`: its nearest host ancestor laid out as a row. */
function framePadding(node: { parent: unknown }): number {
  for (let n = hostParent(node); n; n = hostParent(n)) {
    const style = resolvedStyle(n.props.style);
    if (style.flexDirection === 'row') return (style.padding as number | undefined) ?? 0;
  }
  return 0;
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
      <AppShell
        sidebar={{ items: NAV }}
        header={
          <>
            <AppShellMenuButton testID="menu" />
            <Opener />
          </>
        }
      />,
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
    const screen = renderIn(
      <AppShell testID="shell" sidebar={{ items: NAV }} header={null} title="Ignored" />,
    );
    expect(screen.queryByTestId('shell-header')).toBeNull();
    expect(screen.queryByTestId('shell-header-menu')).toBeNull();
    // The drawer is still THERE — the page opens it itself.
    expect(screen.getByTestId('shell-page')).toBeTruthy();
  });

  it('AppShellMenuButton renders nothing while the sidebar is in flow', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell sidebar={{ items: NAV }} header={<AppShellMenuButton testID="menu" />} />,
    );
    expect(screen.queryByTestId('menu')).toBeNull();
  });
});

describe('AppShell breakpoints as numbers', () => {
  const Aside = () => <ReactNative.Text>Details</ReactNative.Text>;

  it('takes a literal width where an app does not land on a named tier', () => {
    // A feed whose side column earns its place at 990, between lg and xl.
    setWidth(1000);
    const beside = renderIn(
      <AppShell
        testID="shell"
        variant="feed"
        title="Home"
        aside={<Aside />}
        asideFrom={990}
        asideWidth={350}
      />,
    );
    expect(resolvedStyle(beside.getByTestId('shell-aside').props.style)).toMatchObject({
      width: 350,
    });
    beside.unmount();

    setWidth(980);
    const stacked = renderIn(
      <AppShell
        testID="shell"
        variant="feed"
        title="Home"
        aside={<Aside />}
        asideFrom={990}
        asideWidth={350}
      />,
    );
    expect(resolvedStyle(stacked.getByTestId('shell-aside').props.style).width).toBeUndefined();
    stacked.unmount();

    // …and the rail goes in flow at 500, where the named tiers say `sm` is 640.
    setWidth(520);
    const rail = renderIn(
      <AppShell
        testID="shell"
        variant="feed"
        title="Home"
        sidebar={{ items: NAV }}
        navFrom={500}
      />,
    );
    expect(rail.getByTestId('sidebar-item-home')).toBeTruthy();
    expect(rail.queryByTestId('shell-header-menu')).toBeNull();
  });
});

describe('AppShell aside', () => {
  const Aside = () => <ReactNative.Text>Details</ReactNative.Text>;

  it('sits beside the content from asideFrom, at asideWidth', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" title="Home" aside={<Aside />} asideWidth={280} />,
    );
    expect(resolvedStyle(screen.getByTestId('shell-aside').props.style)).toMatchObject({
      width: 280,
    });
    // Beside: a child of the frame itself, not inside the content column.
    expect(hostParent(screen.getByTestId('shell-aside'))?.props.testID).toBe('shell');
  });

  it('below asideFrom it stacks after the content, or is hidden', () => {
    setWidth(1100);
    const stacked = renderIn(<AppShell testID="shell" title="Home" aside={<Aside />} />);
    expect(stacked.getByText('Details')).toBeTruthy();
    expect(resolvedStyle(stacked.getByTestId('shell-aside').props.style).width).toBeUndefined();
    stacked.unmount();
    const hidden = renderIn(
      <AppShell testID="shell" title="Home" aside={<Aside />} asideCollapse="hidden" />,
    );
    expect(hidden.queryByText('Details')).toBeNull();
    hidden.unmount();
    const lg = renderIn(<AppShell testID="shell" title="Home" aside={<Aside />} asideFrom="lg" />);
    expect(resolvedStyle(lg.getByTestId('shell-aside').props.style)).toMatchObject({ width: 320 });
  });
});

describe('AppShell aside that renders nothing', () => {
  // Data-driven widgets that each return null when they have nothing to show.
  const Empty = () => null;
  const layout = (node: ReturnType<ReturnType<typeof renderIn>['getByTestId']>, height: number) =>
    fireEvent(node, 'layout', { nativeEvent: { layout: { width: 350, height } } });

  it.each(['document', 'fixed', 'container'] as const)(
    'reserves the column until measured, then gives it back while empty (scroll=%s)',
    (scroll) => {
      setWidth(1440);
      const screen = renderIn(
        <AppShell
          testID="shell"
          variant="feed"
          scroll={scroll}
          title="Home"
          aside={<Empty />}
          asideWidth={350}
        />,
      );
      // First frame: reserved, so a non-empty aside never jumps.
      expect(resolvedStyle(screen.getByTestId('shell-aside').props.style)).toMatchObject({
        width: 350,
      });
      layout(screen.getByTestId('shell-aside-content'), 0);
      expect(screen.queryByTestId('shell-aside')).toBeNull();
      // Still mounted and measured at its width — out of flow, invisible, unreachable.
      const probe = screen.getByTestId('shell-aside-probe', { includeHiddenElements: true });
      expect(resolvedStyle(probe.props.style)).toMatchObject({
        position: 'absolute',
        width: 350,
        opacity: 0,
      });
      expect(probe.props.pointerEvents).toBe('none');
      expect(probe.props['aria-hidden']).toBe(true);
      // Content appears: the column comes back.
      layout(screen.getByTestId('shell-aside-content', { includeHiddenElements: true }), 180);
      expect(resolvedStyle(screen.getByTestId('shell-aside').props.style)).toMatchObject({
        width: 350,
      });
      expect(screen.queryByTestId('shell-aside-probe', { includeHiddenElements: true })).toBeNull();
    },
  );

  it('keeps a measured non-empty aside beside the content', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" title="Home" aside={<ReactNative.Text>Details</ReactNative.Text>} />,
    );
    layout(screen.getByTestId('shell-aside-content'), 40);
    expect(resolvedStyle(screen.getByTestId('shell-aside').props.style)).toMatchObject({
      width: 320,
    });
  });

  it('an empty stacked aside takes no slot either', () => {
    setWidth(1100);
    const screen = renderIn(<AppShell testID="shell" title="Home" aside={<Empty />} />);
    expect(screen.getByTestId('shell-aside')).toBeTruthy();
    layout(screen.getByTestId('shell-aside-content'), 0);
    expect(screen.queryByTestId('shell-aside')).toBeNull();
    expect(
      resolvedStyle(
        screen.getByTestId('shell-aside-probe', { includeHiddenElements: true }).props.style,
      ),
    ).toMatchObject({
      position: 'absolute',
      width: '100%',
    });
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
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({
      overflow: 'hidden',
    });
    expect(resolvedStyle(hostParent(screen.getByTestId('page'))?.props.style)).toMatchObject({
      // Longhands, never `flex: 1` — see `flexFill` in app-shell/layout.ts.
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      minHeight: 0,
    });
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
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({
      overflow: 'hidden',
    });
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
      <AppShell
        testID="shell"
        variant="canvas"
        sidebar={{ items: NAV }}
        aside={<ReactNative.Text>In view</ReactNative.Text>}
      >
        <Canvas />
      </AppShell>,
    );
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({
      padding: 0,
      gap: 0,
    });
    // The nav is still a card with a gutter around it…
    expect(
      resolvedStyle(hostParent(screen.getByTestId('sidebar-item-home'))?.props.style),
    ).toBeTruthy();
    const nav = screen.getByTestId('shell').props.children;
    expect(nav).toBeTruthy();
    // …and the aside keeps its own inset rather than touching the edge.
    expect(resolvedStyle(screen.getByTestId('shell-aside').props.style)).toMatchObject({
      paddingTop: 16,
      paddingBottom: 16,
      paddingInlineEnd: 16,
    });
    expect(
      resolvedStyle(screen.getByTestId('shell-aside').props.style).paddingInlineStart,
    ).toBeUndefined();
  });
});

describe('NotificationBell', () => {
  it('shows the unread count on the glyph, and an explicit override', () => {
    setWidth(1440);
    const screen = renderIn(<NotificationBell testID="bell" notifications={ITEMS} />);
    const count = screen.getByTestId('bell-count');
    expect(resolvedStyle(count.props.style)).toMatchObject({
      width: 16,
      height: 16,
      top: 2,
      insetInlineStart: 18,
    });
    expect(screen.getByText('2')).toBeTruthy();
    const override = renderIn(
      <NotificationBell testID="bell2" notifications={ITEMS} unreadCount={5} />,
    );
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
      <ProOfferCard
        testID="offer"
        title="Pro"
        description="d"
        ctaLabel="Get Pro"
        onDismiss={onDismiss}
      />,
    );
    expect(resolvedStyle(screen.getByTestId('offer').props.style)).toMatchObject({
      width: 280,
      insetInlineStart: 12,
      bottom: 12,
      borderRadius: 16,
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
    const phone = renderIn(
      <AppShell testID="shell" variant="feed" contentWidth={520} title="Home" />,
    );
    expect(resolvedStyle(phone.getByTestId('shell-content').props.style)).toMatchObject({
      flexShrink: 1,
      flexBasis: 520,
      maxWidth: 520,
    });
  });

  it('centres the content and the aside as a PAIR in what the nav leaves', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell
        testID="shell"
        variant="feed"
        title="Home"
        sidebar={{ items: NAV }}
        aside={<ReactNative.Text>Side</ReactNative.Text>}
      />,
    );
    const content = screen.getByTestId('shell-content');
    const aside = screen.getByTestId('shell-aside');
    const row = hostParent(content);
    expect(hostParent(aside)).toBe(row);
    expect(resolvedStyle(row?.props.style)).toMatchObject({
      flexDirection: 'row',
      justifyContent: 'center',
    });
    expect(resolvedStyle(aside.props.style)).toMatchObject({ width: 320 });
  });

  it('can center navigation together with the reading column and contextual column', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell
        testID="shell"
        variant="feed"
        navigationAlign="content"
        contentWidth={600}
        asideWidth={280}
        gutter={16}
        sidebar={{ items: NAV }}
        aside={<ReactNative.Text>Context</ReactNative.Text>}
      />,
    );
    expect(resolvedStyle(screen.getByTestId('shell').props.style).justifyContent).toBe('center');
    const group = hostParent(screen.getByTestId('shell-content'));
    expect(resolvedStyle(group?.props.style)).toMatchObject({
      flexGrow: 0,
      flexBasis: 896,
      maxWidth: 896,
    });
  });

  it('can close the navigation gap without changing panel and aside insets', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell
        testID="shell"
        variant="feed"
        navigationGap={0}
        gutter={16}
        contentWidth={600}
        asideWidth={280}
        sidebar={{ items: NAV }}
        aside={<ReactNative.Text>Context</ReactNative.Text>}
      />,
    );
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({
      padding: 16,
      gap: 0,
    });
    const group = hostParent(screen.getByTestId('shell-content'));
    expect(resolvedStyle(group?.props.style).gap).toBe(16);
  });

  it('below asideFrom the side column stacks under the content instead', () => {
    setWidth(1100);
    const screen = renderIn(
      <AppShell
        testID="shell"
        variant="feed"
        title="Home"
        aside={<ReactNative.Text>Side</ReactNative.Text>}
      />,
    );
    expect(screen.getByText('Side')).toBeTruthy();
    expect(resolvedStyle(screen.getByTestId('shell-aside').props.style).width).toBeUndefined();
  });

  it('uses one gutter for padding and gap, where dashboard keeps its 12/16 pair', () => {
    setWidth(1440);
    const feed = renderIn(<AppShell testID="shell" variant="feed" title="Home" />);
    expect(resolvedStyle(feed.getByTestId('shell').props.style)).toMatchObject({
      padding: 16,
      gap: 16,
    });
    feed.unmount();
    const dash = renderIn(<AppShell testID="shell" title="Home" />);
    expect(resolvedStyle(dash.getByTestId('shell').props.style)).toMatchObject({
      padding: 12,
      gap: 16,
    });
    dash.unmount();
    const wide = renderIn(<AppShell testID="shell" variant="feed" gutter={24} title="Home" />);
    expect(resolvedStyle(wide.getByTestId('shell').props.style)).toMatchObject({
      padding: 24,
      gap: 24,
    });
  });
});

describe('AppShell variant="focus"', () => {
  it('draws no navigation at all, sidebar or not', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" variant="focus" title="Sign in" sidebar={{ items: NAV }} />,
    );
    expect(screen.queryByTestId('sidebar-item-home')).toBeNull();
    expect(screen.queryByTestId('shell-header-menu')).toBeNull();
    expect(resolvedStyle(screen.getByTestId('shell-content').props.style)).toMatchObject({
      flexBasis: 600,
    });
  });

  it('takes no aside in either position — it is a single column by definition', () => {
    setWidth(1440);
    const wide = renderIn(
      <AppShell
        testID="shell"
        variant="focus"
        title="Sign in"
        aside={<ReactNative.Text>Side</ReactNative.Text>}
      />,
    );
    expect(wide.queryByText('Side')).toBeNull();
    wide.unmount();
    // Below `asideFrom` an aside STACKS under the content — also not here.
    setWidth(500);
    const narrow = renderIn(
      <AppShell
        testID="shell"
        variant="focus"
        title="Sign in"
        aside={<ReactNative.Text>Side</ReactNative.Text>}
      />,
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

describe('AppShell pinned slots', () => {
  const original = ReactNative.Platform.OS;
  const INSETS = { top: 44, bottom: 34, left: 0, right: 0 };
  beforeEach(() => {
    Object.defineProperty(ReactNative.Platform, 'OS', {
      value: 'web',
      configurable: true,
      writable: true,
    });
  });
  afterEach(() => {
    Object.defineProperty(ReactNative.Platform, 'OS', {
      value: original,
      configurable: true,
      writable: true,
    });
  });

  function renderWithInsets(ui: React.ReactElement) {
    return renderIn(
      <SafeAreaInsetsContext.Provider value={INSETS}>{ui}</SafeAreaInsetsContext.Provider>,
    );
  }

  it('pins the bottom bar to the viewport with the safe-area inset as its own padding', () => {
    setWidth(500);
    const screen = renderWithInsets(
      <AppShell
        testID="shell"
        variant="feed"
        sidebar={{ items: NAV }}
        bottomBar={<ReactNative.Text>Tabs</ReactNative.Text>}
      />,
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
    expect(resolvedStyle(screen.getByTestId('shell-floating-action').props.style)).toMatchObject({
      bottom: 72 + 16,
    });
    // …and the page reserves both, so the last row is never behind either.
    expect(resolvedStyle(screen.getByTestId('shell-page').props.style)).toMatchObject({
      paddingBottom: 72 + 56 + 16,
    });
  });

  it('reserves nothing when there is no bar and no action', () => {
    setWidth(500);
    const screen = renderWithInsets(
      <AppShell testID="shell" variant="feed" sidebar={{ items: NAV }} />,
    );
    expect(resolvedStyle(screen.getByTestId('shell-page').props.style)).toMatchObject({
      paddingBottom: 0,
    });
  });

  it('draws the bars while the nav is a drawer, or always', () => {
    setWidth(1440);
    const flow = renderWithInsets(
      <AppShell
        testID="shell"
        variant="feed"
        sidebar={{ items: NAV }}
        bottomBar={<ReactNative.Text>Tabs</ReactNative.Text>}
      />,
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
    expect(resolvedStyle(bar.props.style)).toMatchObject({
      position: 'sticky',
      top: 0,
      paddingTop: 44,
    });
    // It is a sibling ABOVE the row, not a child of the content column.
    expect(hostParent(bar)?.props.testID).toBe('shell');
    // ONE hamburger: the bar's. The header does not add a second under it.
    expect(screen.getByTestId('bar-menu')).toBeTruthy();
    expect(screen.queryByTestId('shell-header-menu')).toBeNull();
  });
});

describe('AppShell nav sizing', () => {
  it.each([
    [1440, 'expanded'],
    [1262, 'expanded'],
    [1261, 'collapsed'],
    [1200, 'collapsed'],
    [1024, 'collapsed'],
    [1023, 'rail'],
    [768, 'rail'],
    [767, 'drawer'],
  ] as const)('automatically uses %s pixels for %s navigation', (width, mode) => {
    setWidth(width);
    const screen = renderIn(
      <AppShell
        testID="shell"
        variant="feed"
        contentWidth={620}
        asideWidth={350}
        asideFrom={990}
        gutter={8}
        aside={<ReactNative.Text>Aside</ReactNative.Text>}
        sidebar={{ items: NAV }}
      />,
    );
    const toggle = screen.queryByTestId('sidebar-collapse');
    if (mode === 'expanded' || mode === 'collapsed') {
      expect(toggle?.props['aria-expanded']).toBe(mode === 'expanded');
      expect(screen.queryByTestId('sidebar-rail-scroll')).toBeNull();
    } else if (mode === 'rail') {
      expect(toggle).toBeNull();
      expect(screen.getByTestId('sidebar-rail-scroll')).toBeTruthy();
    } else {
      expect(screen.queryByTestId('sidebar-item-home')).toBeNull();
    }
  });

  it('honors controlled expansion and releases aside capacity when the aside is empty', () => {
    setWidth(1100);
    const makeShell = (collapsed?: boolean) => (
      <AppShell
        testID="shell"
        variant="feed"
        contentWidth={620}
        asideWidth={350}
        asideFrom={990}
        gutter={8}
        aside={<ReactNative.Text>Aside</ReactNative.Text>}
        sidebar={{ items: NAV, collapsed }}
      />
    );
    const screen = renderIn(makeShell(false));
    expect(screen.getByTestId('sidebar-collapse').props['aria-expanded']).toBe(true);
    screen.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PortalProvider>
          {makeShell()}
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    );
    expect(screen.getByTestId('sidebar-collapse').props['aria-expanded']).toBe(false);
    expect(screen.getByTestId('sidebar-collapse').props['aria-disabled']).toBe(true);
    fireEvent(screen.getByTestId('shell-aside-content'), 'layout', {
      nativeEvent: { layout: { width: 350, height: 0, x: 0, y: 0 } },
    });
    expect(screen.getByTestId('sidebar-collapse').props['aria-expanded']).toBe(true);
  });

  it('resizes its measured container and preserves a manual collapse without allowing expansion to squeeze content', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" variant="feed" contentWidth={900} sidebar={{ items: NAV }} />,
    );
    const resize = (width: number) =>
      fireEvent(screen.getByTestId('shell'), 'layout', {
        nativeEvent: { layout: { width, height: 900, x: 0, y: 0 } },
      });
    resize(1100);
    expect(screen.getByTestId('sidebar-collapse').props['aria-expanded']).toBe(false);
    fireEvent.press(screen.getByTestId('sidebar-collapse'));
    expect(screen.getByTestId('sidebar-collapse').props['aria-expanded']).toBe(false);
    resize(1440);
    expect(screen.getByTestId('sidebar-collapse').props['aria-expanded']).toBe(true);
    fireEvent.press(screen.getByTestId('sidebar-collapse'));
    resize(1100);
    resize(1440);
    expect(screen.getByTestId('sidebar-collapse').props['aria-expanded']).toBe(false);
  });

  it.each([1440, 1200, 1024, 989, 767])(
    'spans the existing aside track at %ipx without changing navigation capacity',
    (width) => {
      setWidth(width);
      const shell = (span: 'content' | 'content-aside') => (
        <AppShell
          testID="shell"
          variant="feed"
          panels
          navigationAlign="content"
          contentWidth={620}
          contentSpan={span}
          aside={<ReactNative.Text>Side</ReactNative.Text>}
          asideWidth={350}
          asideFrom={990}
          asideGap={0}
          gutter={8}
          sidebar={{ items: NAV }}
        />
      );
      const normal = renderIn(shell('content'));
      const before = normal.queryByTestId('sidebar-collapse')?.props['aria-expanded'];
      normal.unmount();
      const expanded = renderIn(shell('content-aside'));
      expect(expanded.queryByTestId('sidebar-collapse')?.props['aria-expanded']).toBe(before);
      // A compact region has no cap: its animated style writes it as UNSET (null).
      expect(resolvedStyle(expanded.getByTestId('shell-content').props.style).maxWidth).toBe(
        width < 768 ? null : width >= 990 ? 970 : 620,
      );
      if (width >= 990) {
        const aside = expanded.getByTestId('shell-aside', { includeHiddenElements: true });
        expect(aside.props['aria-hidden']).toBe(true);
        expect(resolvedStyle(aside.props.style)).toMatchObject({ width: 0, opacity: 0 });
      } else {
        expect(expanded.queryByText('Side')).toBeNull();
      }
    },
  );

  it('navFrom moves the tier the rail sits in flow from', () => {
    setWidth(800);
    const md = renderIn(
      <AppShell testID="shell" title="Home" navFrom="md" sidebar={{ items: NAV }} />,
    );
    expect(md.getByTestId('sidebar-item-home')).toBeTruthy();
    expect(md.queryByTestId('shell-header-menu')).toBeNull();
    md.unmount();

    const lg = renderIn(
      <AppShell testID="shell" title="Home" navFrom="lg" sidebar={{ items: NAV }} />,
    );
    expect(lg.queryByTestId('sidebar-item-home')).toBeNull();
    expect(lg.getByTestId('shell-header-menu')).toBeTruthy();
  });

  it('navExpandedFrom swaps icons for labels, and lets the rail sit in flow from sm', () => {
    setWidth(700);
    const rail = renderIn(
      <AppShell testID="shell" title="Home" navExpandedFrom="lg" sidebar={{ items: NAV }} />,
    );
    // The rail's own item geometry (64 tall) is what says it is the rail.
    expect(resolvedStyle(rail.getByTestId('sidebar-item-home').props.style)).toMatchObject({
      minHeight: 64,
    });
    rail.unmount();

    setWidth(1440);
    const panel = renderIn(
      <AppShell testID="shell" title="Home" navExpandedFrom="lg" sidebar={{ items: NAV }} />,
    );
    expect(resolvedStyle(panel.getByTestId('sidebar-item-home').props.style).minHeight).not.toBe(
      64,
    );
  });
});

describe('AppShellPanel theme', () => {
  it.each([390, 1440])('at %ipx scopes only the panel without remounting content', (width) => {
    setWidth(width);
    const mounted = jest.fn();
    function Probe({ id }: { id: string }) {
      const { colors } = useTheme();
      React.useEffect(() => {
        mounted(id);
      }, []);
      return <ReactNative.Text testID={id}>{colors.primary}</ReactNative.Text>;
    }
    function Frame({ preset }: { preset?: 'rose' | 'teal' }) {
      return (
        <BloomThemeProvider mode="light" colorPreset="teal">
          <AppShell variant="feed" panels aside={<Probe id="aside-color" />}>
            <AppShellPanel colorPreset={preset}>
              <Probe id="panel-color" />
            </AppShellPanel>
          </AppShell>
        </BloomThemeProvider>
      );
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

describe('AppShell panels: the frame', () => {
  const contentPanels = (screen: ReturnType<typeof renderIn>) =>
    screen.UNSAFE_root.findAllByType(
      (ContentPanel as unknown as { type: React.ComponentType }).type,
    );

  /**
   * The shell owns the gutter on ALL FOUR sides. A plain, content-aligned nav
   * runs flush, so the row keeps only its END padding and the region its own
   * top and bottom: the end side is the one a content-aligned row once forgot,
   * leaving every page without an aside running into the window's edge.
   */
  it.each([true, false])(
    'a flush nav keeps the end gutter, with an aside (%s) or without',
    (withAside) => {
      jest.replaceProperty(ReactNative.Platform, 'OS', 'web');
      setWidth(1440);
      const screen = renderIn(
        <AppShell
          testID="shell"
          variant="feed"
          panels
          scroll="page"
          navigationAlign="content"
          contentWidth={1800}
          gutter={8}
          navigationGap={8}
          sidebar={{ items: NAV, surface: 'plain' }}
          aside={withAside ? <ReactNative.Text>Side</ReactNative.Text> : null}
          asideFrom="lg"
        >
          <AppShellPanel>
            <ReactNative.Text>Body</ReactNative.Text>
          </AppShellPanel>
        </AppShell>,
      );
      expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({
        paddingTop: 0,
        paddingBottom: 0,
        paddingInlineStart: 0,
        paddingInlineEnd: 8,
        gap: 8,
      });
      const group = hostParent(screen.getByTestId('shell-content'));
      expect(resolvedStyle(group?.props.style)).toMatchObject({ paddingTop: 8, paddingBottom: 8 });
      expect(contentPanels(screen)[0]?.props.framed).toBe(true);
    },
  );

  it('a card nav pads the row on every side by the gutter', () => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" variant="feed" panels gutter={12} sidebar={{ items: NAV }}>
        <AppShellPanel>
          <ReactNative.Text>Body</ReactNative.Text>
        </AppShellPanel>
      </AppShell>,
    );
    expect(resolvedStyle(screen.getByTestId('shell').props.style)).toMatchObject({ padding: 12 });
  });

  /**
   * Compact (the nav a drawer): panels are full-bleed and there is NO gutter
   * on any side, in every mode — the phone's top strip came from deciding this
   * off a `panel` prop the route had turned off.
   */
  it.each(['page', 'document', 'fixed', 'container'] as const)(
    'compact %s: no gutter on any side, panels full-bleed',
    (scroll) => {
      setWidth(390);
      const screen = renderIn(
        <AppShell
          testID="shell"
          variant="feed"
          panels
          scroll={scroll}
          navigationAlign="content"
          drawer="reveal"
          gutter={8}
          sidebar={{ items: NAV, surface: 'plain' }}
        >
          <AppShellPanels>
            <AppShellPanel id="a">
              <ReactNative.Text>A</ReactNative.Text>
            </AppShellPanel>
          </AppShellPanels>
        </AppShell>,
      );
      const row = hostParent(hostParent(screen.getByTestId('shell-content')) as never);
      for (const node of [row, hostParent(screen.getByTestId('shell-content'))]) {
        const style = resolvedStyle(node?.props.style);
        for (const key of ['padding', 'paddingTop', 'paddingBottom', 'paddingInlineEnd'])
          expect(style[key] ?? 0).toBe(0);
      }
      expect(contentPanels(screen)[0]?.props.framed).toBe(false);
    },
  );

  it.each([
    { width: 699, framedFrom: undefined, expected: false },
    { width: 700, framedFrom: undefined, expected: true },
    { width: 639, framedFrom: 640, expected: false },
    { width: 699, framedFrom: 640, expected: true },
    { width: 699, framedFrom: 'md' as const, expected: false },
  ])('framing follows the navigation unless framedFrom says otherwise: %j', (c) => {
    jest.replaceProperty(ReactNative.Platform, 'OS', 'web');
    setWidth(c.width);
    const screen = renderIn(
      <AppShell
        variant="feed"
        panels
        navFrom={700}
        framedFrom={c.framedFrom}
        sidebar={{ items: NAV, variant: 'rail' }}
      >
        <AppShellPanel>
          <ReactNative.Text>Body</ReactNative.Text>
        </AppShellPanel>
      </AppShell>,
    );
    expect(contentPanels(screen)[0]?.props.framed).toBe(c.expected);
  });

  it('without navigation, panels are framed from md', () => {
    setWidth(767);
    const narrow = renderIn(
      <AppShell variant="feed" panels>
        <AppShellPanel>
          <ReactNative.Text>Body</ReactNative.Text>
        </AppShellPanel>
      </AppShell>,
    );
    expect(contentPanels(narrow)[0]?.props.framed).toBe(false);
    narrow.unmount();
    setWidth(768);
    const wide = renderIn(
      <AppShell variant="feed" panels>
        <AppShellPanel>
          <ReactNative.Text>Body</ReactNative.Text>
        </AppShellPanel>
      </AppShell>,
    );
    expect(contentPanels(wide)[0]?.props.framed).toBe(true);
  });

  it('a dashboard reveal shell frames its region with the gutter, none while compact', () => {
    for (const [width, outer] of [
      [1440, 12],
      [900, 12],
      [600, 0],
    ] as const) {
      setWidth(width);
      const screen = renderIn(
        <AppShell
          testID="shell"
          panels
          drawer="reveal"
          scroll="fixed"
          header={null}
          framedFrom="md"
          gutter={12}
          contentMaxWidth="none"
          sidebar={{ items: NAV }}
        >
          <AppShellPanel>
            <ReactNative.Text>Body</ReactNative.Text>
          </AppShellPanel>
        </AppShell>,
      );
      // The reveal shell keeps its page host mounted across widths, so the
      // gutter frames the region's row rather than the page: measure the box
      // around the region, which is the frame either way.
      expect([
        width,
        framePadding(screen.getByTestId('shell-content', { includeHiddenElements: true })),
      ]).toEqual([width, outer]);
      screen.unmount();
    }
  });
});

describe('AppShellPanel alone in the region', () => {
  function insidePage(screen: ReturnType<typeof renderIn>, id: string): boolean {
    for (let n = screen.getByTestId(id).parent; n; n = n.parent) {
      if (n.props?.testID === 'shell-page') return true;
    }
    return false;
  }

  it('grows with a document, with a viewport-tall frame pinned at the gutter', () => {
    jest.replaceProperty(ReactNative.Platform, 'OS', 'web');
    setWidth(1440);
    const screen = renderIn(
      <AppShell
        testID="shell"
        variant="feed"
        panels
        scroll="document"
        gutter={16}
        sidebar={{ items: NAV }}
      >
        <AppShellPanel header={<ReactNative.View testID="panel-header" />}>
          <ReactNative.Text testID="post">post</ReactNative.Text>
        </AppShellPanel>
      </AppShell>,
    );
    const panel = screen.UNSAFE_root.findByType(
      (ContentPanel as unknown as { type: React.ComponentType }).type,
    );
    expect(panel.props).toMatchObject({
      fill: false,
      overlaySizing: 'viewport',
      overlayInset: { top: 16, bottom: 16 },
      framed: true,
    });
    expect(resolvedStyle(panel.props.surfaceStyle).minHeight).toBe('calc(100dvh - 32px)');
    expect(insidePage(screen, 'post')).toBe(true);
    expect(insidePage(screen, 'panel-header')).toBe(true);
  });

  it.each(['fixed', 'container'] as const)('%s: fills, or grows in the container', (scroll) => {
    setWidth(1440);
    const screen = renderIn(
      <AppShell testID="shell" variant="feed" panels scroll={scroll} sidebar={{ items: NAV }}>
        <AppShellPanel>
          <ReactNative.Text>post</ReactNative.Text>
        </AppShellPanel>
      </AppShell>,
    );
    const panel = screen.UNSAFE_root.findByType(
      (ContentPanel as unknown as { type: React.ComponentType }).type,
    );
    expect(panel.props.fill).toBe(scroll === 'fixed');
    expect(panel.props.overlaySizing).toBe(scroll === 'fixed' ? 'panel' : 'viewport');
    const pageScrollers = screen
      .UNSAFE_queryAllByType(ReactNative.ScrollView)
      .filter((node) => node.props.testID === 'shell-page');
    expect(pageScrollers).toHaveLength(scroll === 'container' ? 1 : 0);
  });

  it.each([true, false])(
    'a growing panel reserves the bottom bar only when requested (%s)',
    (reserve) => {
      setWidth(390);
      const screen = renderIn(
        <AppShell
          testID="shell"
          variant="feed"
          panels
          scroll="document"
          reserveBottomBarSpace={reserve}
          bottomBar={<ReactNative.Text>Navigation</ReactNative.Text>}
        >
          <AppShellPanel>
            <ReactNative.Text testID="body">Body</ReactNative.Text>
          </AppShellPanel>
        </AppShell>,
      );
      fireEvent(screen.getByTestId('shell-bottom-bar'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 80 } },
      });
      // Painted in the panel's published fill (what a Screen page paints), never
      // left as padding over the material.
      const spacer = screen.queryByTestId('app-shell-panel-reserve');
      if (reserve) {
        expect(resolvedStyle(spacer?.props.style)).toMatchObject({ height: 80, flexShrink: 0 });
        expect(resolvedStyle(spacer?.props.style).backgroundColor).toBeTruthy();
      } else {
        expect(spacer).toBeNull();
      }
      expect(
        resolvedStyle(hostParent(screen.getByTestId('body'))?.props.style).paddingBottom ?? 0,
      ).toBe(0);
    },
  );

  it('scroll="panel" gives a bounded panel its own ScrollView; content scroll has none', () => {
    setWidth(1440);
    for (const scroll of ['panel', 'content'] as const) {
      const screen = renderIn(
        <AppShell variant="feed" panels scroll="fixed" sidebar={{ items: NAV }}>
          <AppShellPanel scroll={scroll}>
            <ReactNative.Text>post</ReactNative.Text>
          </AppShellPanel>
        </AppShell>,
      );
      const inPanel = screen.UNSAFE_queryAllByType(ReactNative.ScrollView).filter((node) => {
        for (let n = node.parent; n; n = n.parent)
          if (n.props.role === 'complementary') return false;
        return true;
      });
      expect(inPanel).toHaveLength(scroll === 'panel' ? 1 : 0);
      screen.unmount();
    }
  });
});

describe('AppShellPanels', () => {
  const twoPanels = (
    extra: Partial<React.ComponentProps<typeof AppShellPanels>> = {},
    probes?: { a?: React.ReactNode; b?: React.ReactNode },
  ) => (
    <AppShell
      testID="shell"
      variant="feed"
      panels
      scroll="fixed"
      gutter={8}
      sidebar={{ items: NAV }}
    >
      <AppShellPanels testID="group" {...extra}>
        <AppShellPanel
          id="results"
          testID="results"
          width={560}
          minWidth={360}
          maxWidth={900}
          resizable
        >
          {probes?.a ?? <ReactNative.Text>Results</ReactNative.Text>}
        </AppShellPanel>
        <AppShellPanel id="map" testID="map" minWidth={400}>
          {probes?.b ?? <ReactNative.Text>Map</ReactNative.Text>}
        </AppShellPanel>
      </AppShellPanels>
    </AppShell>
  );

  it('separated: the gap between panels is the shell gutter, each its own framed surface', () => {
    setWidth(1440);
    const screen = renderIn(twoPanels());
    expect(resolvedStyle(screen.getByTestId('map').props.style).marginInlineStart).toBe(8);
    const panels = screen.UNSAFE_root.findAllByType(
      (ContentPanel as unknown as { type: React.ComponentType }).type,
    );
    expect(panels).toHaveLength(2);
    for (const panel of panels) expect(panel.props).toMatchObject({ framed: true, fill: true });
  });

  it('uses the shared track resolver while preserving declared widths and minimums', () => {
    setWidth(1440);
    const screen = renderIn(twoPanels());
    const results = resolvedStyle(screen.getByTestId('results').props.style);
    const map = resolvedStyle(screen.getByTestId('map').props.style);
    expect(results.width).toBe(560);
    expect(Number(map.width)).toBeGreaterThanOrEqual(400);
    expect(Number(results.width) + Number(map.width) + 8).toBe(1440);
  });

  it('collapses below collapseBelow, measured on the group OWN box, to the panel `show` names', () => {
    setWidth(1440);
    const screen = renderIn(twoPanels({ collapseBelow: 900, show: 'map' }));
    expect(screen.getByTestId('results')).toBeTruthy();
    fireEvent(screen.getByTestId('group'), 'layout', {
      nativeEvent: { layout: { width: 800, height: 600 } },
    });
    expect(screen.queryByTestId('results')).toBeNull();
    expect(screen.getByTestId('map')).toBeTruthy();
    expect(screen.queryByTestId('map-gap')).toBeNull();
    // Hidden tracks cannot receive input while their exit sizing animates.
    expect(screen.getByTestId('map').props.pointerEvents).toBe('auto');
  });

  it('collapsed without `show`: the first panel', () => {
    setWidth(600);
    const screen = renderIn(twoPanels({ collapseBelow: 900 }));
    expect(screen.getByTestId('results')).toBeTruthy();
    expect(screen.queryByTestId('map')).toBeNull();
    expect(screen.queryByTestId('results-divider')).toBeNull();
  });

  it('useAppShellPanel says whether a panel is drawn alone', () => {
    function Probe({ id }: { id: string }) {
      const { alone, id: own } = useAppShellPanel();
      return <ReactNative.Text testID={id}>{`${own}:${alone}`}</ReactNative.Text>;
    }
    const probes = { a: <Probe id="a" />, b: <Probe id="b" /> };
    setWidth(600);
    const narrow = renderIn(twoPanels({ collapseBelow: 900 }, probes));
    expect(narrow.getByTestId('a').props.children).toBe('results:true');
    narrow.unmount();
    setWidth(1440);
    const wide = renderIn(twoPanels({ collapseBelow: 900 }, probes));
    expect(wide.getByTestId('a').props.children).toBe('results:false');
    expect(wide.getByTestId('b').props.children).toBe('map:false');
  });

  it('names the divider, and a keyboard nudge moves the width within its range', () => {
    setWidth(1440);
    const onWidthChange = jest.fn();
    const screen = renderIn(
      <AppShell variant="feed" panels scroll="fixed" sidebar={{ items: NAV }}>
        <AppShellPanels>
          <AppShellPanel
            testID="list"
            width={360}
            minWidth={280}
            maxWidth={520}
            resizable
            onWidthChange={onWidthChange}
          >
            <ReactNative.Text>List</ReactNative.Text>
          </AppShellPanel>
          <AppShellPanel testID="detail">
            <ReactNative.Text>Detail</ReactNative.Text>
          </AppShellPanel>
        </AppShellPanels>
      </AppShell>,
    );
    const divider = screen.getByTestId('list-divider');
    expect(divider.props.accessibilityLabel).toBe('Resize panes');
    expect(divider.props['aria-orientation']).toBe('vertical');
    fireEvent(screen.getByTestId('list'), 'layout', {
      nativeEvent: { layout: { width: 360, height: 600 } },
    });
    // The grip reports arrow keys (±16) through `onNudge` and a drag through
    // `onResize`, measured from the width the panel was DRAWN at.
    const grip = screen.UNSAFE_getByType(AiChatResizeHandle);
    act(() => grip.props.onNudge(-16));
    expect(onWidthChange).toHaveBeenLastCalledWith(344);
    act(() => {
      grip.props.onResizeStart();
      grip.props.onResize(-500);
    });
    expect(onWidthChange).toHaveBeenLastCalledWith(280);
    act(() => grip.props.onResize(500));
    expect(onWidthChange).toHaveBeenLastCalledWith(520);
    // The anchor sits in the middle of the gap, on the panel's end edge.
    expect(resolvedStyle(screen.getByTestId('list-resize-anchor').props.style)).toMatchObject({
      insetInlineEnd: -8,
      width: 0,
    });
  });

  it('hideBelow drops a trailing panel below the group width it needs', () => {
    const three = (width: number) => {
      setWidth(width);
      return renderIn(
        <AppShell variant="feed" panels scroll="fixed">
          <AppShellPanels appearance="joined">
            <AppShellPanel testID="list" width={360}>
              <ReactNative.Text>List</ReactNative.Text>
            </AppShellPanel>
            <AppShellPanel testID="message">
              <ReactNative.Text>Message</ReactNative.Text>
            </AppShellPanel>
            <AppShellPanel testID="info" width={320} hideBelow={1100}>
              <ReactNative.Text>Info</ReactNative.Text>
            </AppShellPanel>
          </AppShellPanels>
        </AppShell>,
      );
    };
    const wide = three(1440);
    expect(wide.getByTestId('info')).toBeTruthy();
    // Joined: ONE surface, hairlines between.
    expect(
      wide.UNSAFE_root.findAllByType(
        (ContentPanel as unknown as { type: React.ComponentType }).type,
      ),
    ).toHaveLength(1);
    expect(resolvedStyle(wide.getByTestId('message').props.style).marginInlineStart).toBe(1);
    wide.unmount();
    const narrow = three(1000);
    expect(narrow.queryByTestId('info')).toBeNull();
    expect(narrow.getByTestId('message')).toBeTruthy();
  });

  it('compact: separated panels go full-bleed with hairlines, no gutter', () => {
    setWidth(767);
    const screen = renderIn(
      <AppShell variant="feed" panels scroll="fixed" gutter={8} sidebar={{ items: NAV }}>
        <AppShellPanels>
          <AppShellPanel testID="a" width={400}>
            <ReactNative.Text>A</ReactNative.Text>
          </AppShellPanel>
          <AppShellPanel testID="b">
            <ReactNative.Text>B</ReactNative.Text>
          </AppShellPanel>
        </AppShellPanels>
      </AppShell>,
    );
    expect(resolvedStyle(screen.getByTestId('b').props.style).marginInlineStart).toBe(1);
    for (const panel of screen.UNSAFE_root.findAllByType(
      (ContentPanel as unknown as { type: React.ComponentType }).type,
    ))
      expect(panel.props.framed).toBe(false);
  });

  it('keeps a panel and its state mounted when a sibling comes and goes', () => {
    const mounted = jest.fn();
    function Draft() {
      const [draft, setDraft] = React.useState('');
      React.useEffect(() => {
        mounted();
      }, []);
      return <ReactNative.TextInput testID="draft" value={draft} onChangeText={setDraft} />;
    }
    function Frame({ open }: { open: boolean }) {
      return (
        <BloomThemeProvider mode="light">
          <AppShell variant="feed" panels scroll="fixed">
            <AppShellPanels>
              {open && (
                <AppShellPanel id="list" width={360}>
                  <ReactNative.Text>List</ReactNative.Text>
                </AppShellPanel>
              )}
              <AppShellPanel id="detail">
                <Draft />
              </AppShellPanel>
            </AppShellPanels>
          </AppShell>
        </BloomThemeProvider>
      );
    }
    setWidth(1440);
    const screen = render(<Frame open={false} />);
    fireEvent.changeText(screen.getByTestId('draft'), 'kept');
    screen.rerender(<Frame open />);
    screen.rerender(<Frame open={false} />);
    expect(screen.getByTestId('draft').props.value).toBe('kept');
    expect(mounted).toHaveBeenCalledTimes(1);
  });

  it('is bounded in a document region too: scroll="panel" scrolls, no bar reserve', () => {
    jest.replaceProperty(ReactNative.Platform, 'OS', 'web');
    setWidth(1440);
    const screen = renderIn(
      <AppShell
        testID="shell"
        variant="feed"
        panels
        scroll="document"
        gutter={8}
        sidebar={{ items: NAV }}
      >
        <AppShellPanels testID="group">
          <AppShellPanel width={400} scroll="panel">
            <ReactNative.Text>A</ReactNative.Text>
          </AppShellPanel>
          <AppShellPanel>
            <ReactNative.Text testID="b-body">B</ReactNative.Text>
          </AppShellPanel>
        </AppShellPanels>
      </AppShell>,
    );
    // One viewport less the 8 + 8 gutters: the document has nothing to scroll.
    expect(resolvedStyle(screen.getByTestId('group-frame').props.style).height).toBe(
      'calc(100dvh - 16px)',
    );
    const inGroup = screen.UNSAFE_queryAllByType(ReactNative.ScrollView).filter((node) => {
      for (let n = node.parent; n; n = n.parent) if (n.props.testID === 'group') return true;
      return false;
    });
    expect(inGroup).toHaveLength(0); // Web uses Screen's shared DOM owner, not another RN ScrollView.
    const owners = screen.UNSAFE_root.findAll(
      (node) => node.props.dataSet?.bloomScreenViewport === 'element',
    );
    expect(owners.length).toBeGreaterThan(0);
    expect(screen.queryByTestId('app-shell-panel-reserve')).toBeNull();
  });

  it('works outside a shell as a bounded, framed group with a 12 gap', () => {
    const screen = renderIn(
      <AppShellPanels>
        <AppShellPanel testID="a" width={300}>
          <ReactNative.Text>A</ReactNative.Text>
        </AppShellPanel>
        <AppShellPanel testID="b">
          <ReactNative.Text>B</ReactNative.Text>
        </AppShellPanel>
      </AppShellPanels>,
    );
    expect(resolvedStyle(screen.getByTestId('b').props.style).marginInlineStart).toBe(12);
  });
});

describe('AppShell native safe-area frame', () => {
  const originalOS = ReactNative.Platform.OS;
  const insets = { top: 47, right: 7, bottom: 34, left: 20 };
  beforeEach(() => {
    Object.defineProperty(ReactNative.Platform, 'OS', {
      value: 'ios',
      configurable: true,
      writable: true,
    });
    setWidth(390);
  });
  afterEach(() => {
    Object.defineProperty(ReactNative.Platform, 'OS', {
      value: originalOS,
      configurable: true,
      writable: true,
    });
  });
  function withInsets(ui: React.ReactElement) {
    return renderIn(
      <SafeAreaInsetsContext.Provider value={insets}>{ui}</SafeAreaInsetsContext.Provider>,
    );
  }
  function ReadInsets() {
    const value = React.useContext(SafeAreaInsetsContext);
    return <ReactNative.Text testID="device-insets">{JSON.stringify(value)}</ReactNative.Text>;
  }

  it.each(['dashboard', 'feed'] as const)(
    '%s reveal keeps pages and navigation safe without charging the bar twice',
    (variant) => {
      const view = withInsets(
        <AppShell
          variant={variant}
          safeArea
          scroll="fixed"
          drawer="reveal"
          drawerOpen
          sidebar={{ items: NAV }}
          header={null}
          bottomBar={<ReadInsets />}
          testID="safe"
        >
          <ReactNative.Text>Page</ReactNative.Text>
        </AppShell>,
      );
      expect(resolvedStyle(view.getByTestId('safe-safe-area').props.style)).toMatchObject({
        paddingTop: 47,
        paddingInlineStart: 20,
        paddingInlineEnd: 7,
        paddingBottom: 0,
      });
      expect(
        resolvedStyle(
          view.getByTestId('safe-bottom-bar', { includeHiddenElements: true }).props.style,
        ).paddingBottom,
      ).toBe(34);
      expect(resolvedStyle(view.getByTestId('safe-navigation-drawer').props.style)).toMatchObject({
        paddingTop: 12,
        paddingBottom: 46,
      });
      expect(
        view.getByTestId('device-insets', { includeHiddenElements: true }).props.children,
      ).toBe(JSON.stringify(insets));
      if (variant === 'dashboard') {
        fireEvent(view.getByTestId('safe-bottom-bar', { includeHiddenElements: true }), 'layout', {
          nativeEvent: { layout: { height: 100 } },
        });
        // The page reserves exactly the bar: a compact reveal page lays out as
        // the overlay one does, with no reveal-only gutter of its own.
        expect(
          resolvedStyle(view.getByTestId('safe-page', { includeHiddenElements: true }).props.style)
            .paddingBottom,
        ).toBe(100);
      }
    },
  );

  it('without bottom chrome the frame owns bottom, and topBar does not charge top again', () => {
    const view = withInsets(
      <AppShell
        safeArea
        scroll="fixed"
        topBar={<ReactNative.Text>Header</ReactNative.Text>}
        topBarVisibility="always"
        testID="safe"
      >
        <ReadInsets />
      </AppShell>,
    );
    expect(resolvedStyle(view.getByTestId('safe-safe-area').props.style).paddingBottom).toBe(34);
    expect(resolvedStyle(view.getByTestId('safe-top-bar').props.style).paddingTop).toBe(0);
    expect(view.getByTestId('device-insets', { includeHiddenElements: true }).props.children).toBe(
      JSON.stringify(insets),
    );
  });

  it('portaled overlay navigation uses original top, bottom and landscape insets', () => {
    const view = withInsets(
      <AppShell
        safeArea
        scroll="fixed"
        drawer="overlay"
        drawerOpen
        sidebar={{ items: NAV }}
        testID="safe"
      />,
    );
    expect(resolvedStyle(view.getByTestId('safe-navigation-drawer').props.style)).toMatchObject({
      paddingTop: 59,
      paddingBottom: 46,
      paddingInlineStart: 32,
      paddingInlineEnd: 19,
    });
  });

  it('portaled overlay navigation clears the device insets without safeArea too', () => {
    // An app whose Screens own their insets passes no `safeArea`; the drawer is
    // portaled past every Screen, so its insets are its own. Keyed on
    // `safeArea` it ran under the status bar (Allo, Android).
    const view = withInsets(
      <AppShell
        scroll="fixed"
        drawer="overlay"
        drawerOpen
        sidebar={{ items: NAV }}
        testID="bare"
      />,
    );
    expect(resolvedStyle(view.getByTestId('bare-navigation-drawer').props.style)).toMatchObject({
      paddingTop: 59,
      paddingBottom: 46,
      paddingInlineStart: 32,
      paddingInlineEnd: 19,
    });
  });

  it('safeArea is opt-in and has no effect on the web frame', () => {
    const off = withInsets(<AppShell scroll="fixed" testID="safe" />);
    expect(off.queryByTestId('safe-safe-area')).toBeNull();
    off.unmount();
    Object.defineProperty(ReactNative.Platform, 'OS', {
      value: 'web',
      configurable: true,
      writable: true,
    });
    const web = withInsets(<AppShell safeArea scroll="fixed" testID="safe" />);
    expect(web.queryByTestId('safe-safe-area')).toBeNull();
  });

  it('adaptive navigation still selects the safe-area engine', () => {
    const view = withInsets(<AppShell safeArea scroll="auto" navigation={[]} testID="safe" />);
    expect(view.getByTestId('safe-safe-area')).toBeTruthy();
  });
});

describe('AppShell full-width and explicit reveal gutters', () => {
  it.each([false, true])(
    '1920px: contentMaxWidth none removes the cap (adaptive=%s)',
    (adaptive) => {
      setWidth(1920);
      const view = renderIn(
        <AppShell
          testID="fluid"
          contentMaxWidth="none"
          {...(adaptive
            ? { scroll: 'auto' as const, navigation: [] }
            : { scroll: 'fixed' as const })}
        >
          <ReactNative.Text>Wide content</ReactNative.Text>
        </AppShell>,
      );
      const content = resolvedStyle(view.getByTestId('fluid-content').props.style);
      expect(content.width).toBe('100%');
      expect(content.maxWidth).toBeUndefined();
    },
  );

  it.each([390, 1024, 1920])(
    'explicit zero gutter removes every dashboard reveal frame edge at %spx',
    (width) => {
      setWidth(width);
      const view = renderIn(
        <AppShell
          testID="flush"
          drawer="reveal"
          scroll="fixed"
          gutter={0}
          sidebar={{ items: NAV }}
          header={null}
          bottomBar={<ReactNative.Text>Tabs</ReactNative.Text>}
        >
          <ReactNative.Text>Page</ReactNative.Text>
        </AppShell>,
      );
      // No gutter frames the row. At desktop the navigation is in flow and the
      // page keeps the dashboard's own 12 top inset, as the overlay shell does.
      expect(framePadding(view.getByTestId('flush-page', { includeHiddenElements: true }))).toBe(0);
      const page = resolvedStyle(view.getByTestId('flush-page').props.style);
      expect(page.padding ?? 0).toBe(0);
      if (width < 1024) expect(page.paddingTop ?? 0).toBe(0);
      if (width < 1024) {
        fireEvent(view.getByTestId('flush-bottom-bar'), 'layout', {
          nativeEvent: { layout: { height: 80 } },
        });
        const reserved = resolvedStyle(view.getByTestId('flush-page').props.style);
        expect([
          reserved.paddingLeft ?? 0,
          reserved.paddingRight ?? 0,
          reserved.paddingTop ?? 0,
        ]).toEqual([0, 0, 0]);
        expect(reserved.paddingBottom).toBe(80);
        expect(
          resolvedStyle(
            view.getByTestId('flush-navigation-drawer', { includeHiddenElements: true }).props
              .style,
          ),
        ).toMatchObject({
          paddingTop: 0,
          paddingBottom: 0,
          paddingInlineStart: 0,
        });
      }
    },
  );
});

it('overlay bottom navigation leaves a zero-gutter mobile page at full height', () => {
  setWidth(390);
  const view = renderIn(
    <AppShell
      testID="overlay-frame"
      drawer="reveal"
      scroll="fixed"
      gutter={0}
      header={null}
      sidebar={{ items: NAV }}
      reserveBottomBarSpace={false}
      bottomBar={<ReactNative.Text>Overlay navigation</ReactNative.Text>}
    >
      <ReactNative.Text>Full height page</ReactNative.Text>
    </AppShell>,
  );
  fireEvent(view.getByTestId('overlay-frame-bottom-bar'), 'layout', {
    nativeEvent: { layout: { height: 140 } },
  });
  const page = resolvedStyle(view.getByTestId('overlay-frame-page').props.style);
  expect(page.padding ?? 0).toBe(0);
  expect(page.paddingBottom ?? 0).toBe(0);
  expect(resolvedStyle(view.getByTestId('overlay-frame-bottom-bar').props.style)).toMatchObject({
    position: 'absolute',
    bottom: 0,
  });
});
