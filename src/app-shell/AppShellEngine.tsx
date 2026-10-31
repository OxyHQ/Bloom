import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import { ScrollArea } from '../layout/ScrollArea';
import { StyledView } from '../styles/styled-primitives';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { BottomEdgeProvider } from '../layout/bottom-edge';
import type React from 'react';
import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';

import { useControllableState } from '../hooks/use-controllable-state';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { Backdrop, OverlayRoot } from '../overlay';
import { Portal } from '../portal';
import { SidebarSlot } from './SidebarSlot';
import { animateMotion } from '../motion/recipes';
import { animateWithSpec } from '../motion/spec';
import { useAppShellSidebarMetrics } from './use-sidebar-metrics';
import { BREAKPOINTS } from '../styles/breakpoints';
import {
  WEB_OVERFLOW_CLIP,
  WEB_POSITION_FIXED,
  WEB_POSITION_STICKY,
  type WebCssStyle,
} from '../styles/web-view-style';
import { ScrollBar } from '../layout';
import { useTheme } from '../theme/use-theme';
import { useThemePaint, useThemeRecipe } from '../theme/use-theme-paint';
import { resolvePanelChrome } from '../styles/panel-chrome';
import { useMessages } from '../locale/messages';
import { APP_SHELL_MESSAGES } from './messages';
import {
  AppShellBottomBar,
  AppShellFloatingAction,
  AppShellTopBar,
  useShellInsets,
} from './AppShellBars';
import { AppShellHeader } from './AppShellHeader';
import { APP_SHELL_DEFAULTS as D, breakpointPx } from './constants';
import { AppShellProvider } from './context';
import {
  DOCK_VARS,
  DockEdgeStrip,
  DockHost,
  dockRootStyle,
  useDockProperties,
  useDockSlotStyle,
} from './EdgeDock';
import { useEdgeDock } from './use-edge-dock';
import { resolveSidebarGeometry } from '../sidebar/geometry';
import { SIDEBAR_RAIL_WIDTH } from '../sidebar/SidebarRail';
import { ScreenNavigationContext, type ScreenNavigationState } from '../screen/context';
import { TabBarMinimizeProvider } from '../tab-bar/context';
import { AppShellRegionContext, type AppShellRegionValue } from '../layout/app-shell-region';
import {
  flexFill,
  flushSidebarAtEveryWidth,
  resolveScrollMode,
  rootFrame,
  stickyRail,
  type ScrollMode,
} from './layout';
import type { AppShellEdge, AppShellEngineProps } from './types';
import { useShellWidth } from './use-shell-width';
import { useRoomChanged } from './use-room-changed';
import { useShellViewport } from './use-shell-viewport';
import { PanelCssContext, PanelCssLayoutContext } from './panel-layout-css';
import { useCssShellLayout } from './shell-layout-css';
import { usePanelInteraction } from './use-panel-interaction';
import { Z_INDEX } from '../styles/z-index';
import { useWindow } from '../window/use-window';
import {
  useWindowCornerTaken,
  WindowChromeProvider,
  WindowCornerProvider,
  type WindowChrome,
} from '../window/context';
import { WindowControls } from '../window/WindowControls';
import { WindowDragRegion } from '../window/WindowDragRegion';
import { closingOnChoice } from './drawer-choice';
import {
  DRAWER_EASE as REVEAL_EASE,
  DRAWER_MS as REVEAL_MS,
  useDrawerSwipe,
} from './use-drawer-swipe';
import { UNSET } from '../styles/animated-style';

/**
 * The page frame — one engine, four shapes (`variant`).
 *
 *   root       row, background-full; one screen tall at least (document
 *              scroll), exactly (`fixed`), or its parent's height (`container`).
 *              It MEASURES ITSELF (`useShellWidth`) and every breakpoint below
 *              is read off that width, not off the window, so a shell embedded
 *              in a preview pane lays out for the pane.
 *   nav        the sidebar in flow from `navFrom` (`lg` for the panel, `sm` for
 *              a rail, `sm` whenever `navExpandedFrom` swaps the two); below it
 *              the same props drive the drawer. `overlay` pads the whole frame
 *              by `gutter`, `reveal` sits the rail 12 from the top-start corner
 *   page       `dashboard` one fluid column capped at `contentMaxWidth`;
 *              `feed`/`focus` a `contentWidth` reading column centred in what
 *              the nav leaves. With `panels` that column is the REGION the
 *              routes' `AppShellPanel`s are framed in (`AppShellRegion`)
 *   aside      optional end-side column (right in LTR), `asideWidth` (320) wide from `asideFrom`
 *              (xl), pinned like the rail; below it stacked after the content
 *   slots      `topBar` above the columns, `bottomBar` pinned to the bottom
 *              with the safe-area inset, `floatingAction` above that bar —
 *              each measured, so the content reserves exactly their height
 *   below nav  the header grows a hamburger (also with no title — see
 *              `useAppShell` / `AppShellMenuButton`). `overlay` opens the rail
 *              as a drawer (12 inset) over a 40% black backdrop; `reveal`
 *              slides the page 272 toward the end edge and rounds it to 32 while the rail,
 *              flat beneath it, scales up from 0.94 and fades in (325ms,
 *              cubic-bezier(0.42, 0, 0.58, 1)); pressing the page (a 10% black
 *              / 5% white veil) closes it
 *
 * WHY THERE ARE NO TRICKS IN HERE, and none left for a consumer: every region
 * is a flex child of one row, sized by `flexBasis`/`maxWidth` and shrinkable, so
 * nothing is positioned by hand and nothing can overflow the frame. The only
 * `position` values in the family are the sticky nav/aside and the bar slots'
 * own anchor — all inside the shell. No negative margin, no `100vw`, no
 * window-width hook, anywhere.
 */

/**
 * The page's scroller. `document`: a plain box, the page grows the document.
 * `fixed`: a plain box that fills the frame's height and never scrolls — the
 * page owns its scrolling. `container`: a `ScrollView` filling the frame.
 *
 * `document` and `fixed` are the SAME node, so a switch between them is a
 * style diff: every flex here — and in each `style` handed in — is spelled in
 * longhands (`flexFill`), never `flex: 1` (see `flexFill` for why).
 */
function Scroller({
  mode,
  style,
  contentStyle,
  testID,
  children,
}: {
  mode: ScrollMode;
  style: WebCssStyle;
  contentStyle: WebCssStyle;
  testID?: string;
  children: React.ReactNode;
}) {
  if (mode === 'document')
    return (
      <View testID={testID} style={[style, contentStyle]}>
        {children}
      </View>
    );
  if (mode === 'fixed') {
    return (
      <View testID={testID} style={[flexFill, { minHeight: 0 }, style, contentStyle]}>
        {children}
      </View>
    );
  }
  return (
    <ScrollArea testID={testID} style={[flexFill, style]} contentContainerStyle={contentStyle}>
      {children}
    </ScrollArea>
  );
}

/** A route Screen's own clearance beyond the occupied bottom edge (Screen's default). */
const PAGE_CLEARANCE = 16;
const AnimatedLayoutView = Animated.createAnimatedComponent(StyledView);
const READING_TRANSITION =
  'web:transition-[width,flex-basis,max-width,flex-grow] web:duration-[380ms] web:ease-in-out web:motion-reduce:transition-none';

export function createAppShellEngine() {
  const AppShellComponent: React.FC<AppShellEngineProps> = ({
    variant = 'dashboard',
    safeArea = false,
    navigationAlign = 'edge',
    navigationGap,
    asideGap,
    sidebar,
    drawer = D.drawer,
    title,
    breadcrumb,
    actions,
    header,
    aside,
    asideWidth = D.asideWidth,
    asideFrom = D.asideFrom,
    asideCollapse = 'stack',
    children,
    contentMaxWidth = D.contentMaxWidth,
    contentWidth = D.contentWidth,
    contentSpan = 'content',
    gutter: gutterProp,
    navFrom: navFromProp,
    navExpandedFrom,
    panels = false,
    framedFrom: framedFromProp,
    topBar,
    topBarVisibility = 'compact',
    topBarDock,
    frameInset,
    background: backgroundMode = 'page',
    windowControls = 'auto',
    bottomBar,
    bottomBarVisibility = 'compact',
    reserveBottomBarSpace = true,
    floatingAction,
    floatingActionPlacement = 'end',
    overlay,
    drawerOpen,
    onDrawerOpenChange,
    drawerSwipe = false,
    drawerOpenLabel: drawerOpenLabelProp,
    drawerCloseLabel: drawerCloseLabelProp,
    scroll = 'document',
    style,
    testID,
  }) => {
    const { messages } = useMessages(APP_SHELL_MESSAGES);
    const drawerOpenLabel = drawerOpenLabelProp ?? messages.openNavigation;
    const drawerCloseLabel = drawerCloseLabelProp ?? messages.closeNavigation;
    const theme = useTheme();
    const paintColors = useThemePaint();
    const backgroundRecipe = useThemeRecipe((palette) => palette.colors.background);
    const cardRecipe = useThemeRecipe((palette) => palette.colors.card);
    const navigationRecipe = useThemeRecipe(resolvePanelChrome);
    const navigationChrome = navigationRecipe.paint;
    const { height: viewportHeight } = useShellViewport();
    const [asideHeight, setAsideHeight] = useState(0);
    const { width, onLayout } = useShellWidth();
    const insets = useShellInsets();
    const platformWindow = useWindow();
    // A shell inside another region that holds the window's corner (a nested
    // shell, a pane) is not at the corner: it is laid out as without windows.
    const appWindow = useWindowCornerTaken() ? null : platformWindow;
    // A desktop window is a desktop at every size it can take: its navigation
    // stays in the window (it hides by its dock, or collapses to icons, never
    // into a phone's drawer) and its panels stay framed. An explicit tier wins.
    const navFrom = navFromProp ?? (appWindow != null ? 0 : undefined);
    const framedFrom = framedFromProp ?? (appWindow != null ? 0 : undefined);
    // A window's panels with nothing of the shell's own above them (no top bar
    // or header, and a region that starts at the corner or beside a sidebar
    // flush to the window): they are the window's title area, as a desktop
    // application's panes are. They start AT the window's top edge (no top
    // frame inset; the start, end and bottom insets stay), so each pane's
    // toolbar row is the window's toolbar, centred on the controls. Decided
    // from the props alone, so the web's CSS frame and the native one agree.
    const windowPanels =
      appWindow != null &&
      !appWindow.fullscreen &&
      windowControls === 'auto' &&
      panels &&
      variant !== 'canvas' &&
      (variant === 'focus' ||
        sidebar == null ||
        flushSidebarAtEveryWidth(sidebar, navFrom, navigationAlign)) &&
      topBar == null &&
      (header !== undefined
        ? header == null
        : title == null && breadcrumb == null && actions == null) &&
      (contentMaxWidth === 'none' || !(variant === 'feed' || variant === 'focus'));
    const shellFrameInset = useMemo(
      () => (windowPanels ? { ...frameInset, top: 0 } : frameInset),
      [windowPanels, frameInset],
    );
    const ownsSafeArea = safeArea && Platform.OS !== 'web';
    const mode = resolveScrollMode(variant, scroll);
    const doc = mode === 'document';
    const fixed = mode === 'fixed';
    const cssScope = useContext(PanelCssContext);
    const cssLayout = useContext(PanelCssLayoutContext);

    // `dashboard` keeps the 12/16 pair it shipped with; one number drives both
    // for every other shape.
    const gutter = gutterProp ?? (variant === 'dashboard' ? D.dashboardGutter : D.gutter);
    const columnGap = variant === 'dashboard' ? D.dashboardColumnGap : gutter;
    // Historical reveal geometry stays the default; an explicit gutter owns
    // every frame edge, including the old extra top gap at wider breakpoints.
    const revealGutter = gutterProp ?? 12;

    // Explicit navigation tiers keep their existing contract. Otherwise the
    // shell supplies a tablet rail before a desktop panel; collapse is a
    // separate capacity decision, never a different navigation component.
    const automaticNavigation =
      navFrom === undefined && navExpandedFrom === undefined && sidebar?.variant === undefined;
    const panelFrom = navExpandedFrom ?? (automaticNavigation ? 'lg' : undefined);
    const nativeNavVariant =
      panelFrom !== undefined
        ? width >= breakpointPx(panelFrom)
          ? ('panel' as const)
          : ('rail' as const)
        : sidebar?.variant;
    const navTier =
      navFrom ??
      (automaticNavigation
        ? 'md'
        : panelFrom !== undefined || nativeNavVariant === 'rail'
          ? 'sm'
          : 'lg');
    const sidebarMetrics = useAppShellSidebarMetrics(sidebar);
    const revealOffset = sidebarMetrics.expanded + 12;
    // How far `reveal`'s moving part travels from closed to open, which is how
    // far a `drawerSwipe` finger travels: the PAGE (feed's a further 12).
    const revealTravel = variant === 'feed' ? revealOffset + 12 : revealOffset;
    const [userCollapsed, setUserCollapsed] = useState(sidebar?.defaultCollapsed ?? false);
    const cssShell = useCssShellLayout(cssScope, {
      sidebar,
      navFrom,
      navExpandedFrom,
      framedFrom,
      panels,
      variant,
      navigationAlign,
      topBar,
      topBarVisibility,
      frameInset: shellFrameInset,
      metrics: sidebarMetrics,
      layout: cssLayout?.layout ?? { panels: [] },
      gap: cssLayout?.gap ?? gutter,
      gutter,
      navigationGap: Math.max(0, navigationGap ?? columnGap),
      contentWidth,
      userCollapsed,
      fillWidth: contentMaxWidth === 'none',
    });
    const navVariant = cssShell ? (cssShell.mode === 'rail' ? 'rail' : 'panel') : nativeNavVariant;
    const wide = cssShell ? cssShell.mode !== 'drawer' : width >= breakpointPx(navTier);
    const small = cssShell ? cssShell.small : width >= BREAKPOINTS.sm;
    const revealTopGutter = gutterProp ?? (small ? 24 : 12);
    // `focus` is the one shape with no navigation at all.
    const hasNav = variant !== 'focus' && sidebar != null;
    const navInFlow = hasNav && wide;
    // `panels`: ONE rule decides whether the routes' panels are framed (rounded,
    // the gutter around and between them) or compact (full-bleed, no gutter at
    // all) — read off the shell's own width, whatever the mode or the route.
    // By default it follows the navigation, so a frameless panel never sits
    // beside a rail that is still in flow. `canvas` is the screen itself and
    // hosts no panels.
    const panelHost = panels && variant !== 'canvas';
    const framed =
      cssShell?.framed ??
      (panelHost &&
        (framedFrom !== undefined
          ? width >= breakpointPx(framedFrom)
          : hasNav
            ? navInFlow
            : width >= BREAKPOINTS.md));
    const compactRegion = panelHost && !framed;
    const stretchReading = compactRegion || contentMaxWidth === 'none';
    // Reveal keeps its page host mounted across compact/desktop changes.
    const drawerStyle = variant === 'dashboard' || variant === 'feed' ? drawer : 'overlay';
    const centred = variant === 'feed' || variant === 'focus';
    const canvas = variant === 'canvas';
    // `focus` is a single column by definition, so it takes no aside in EITHER
    // position — beside or stacked.
    const hasAside = aside != null && variant !== 'focus';
    const asideBeside = hasAside && width >= breakpointPx(asideFrom);
    // A canvas has no scrolling column to stack an aside into — the screen IS the
    // canvas — so below `asideFrom` the aside is dropped whatever `asideCollapse`
    // says, rather than being rendered where nothing can reach it.
    const spanAside = variant === 'feed' && contentSpan === 'content-aside';
    const asideStacked =
      hasAside && !asideBeside && asideCollapse === 'stack' && !canvas && !spanAside;
    // An aside built from widgets that each render nothing when they have
    // nothing to show takes no room: its content is measured, and a zero-height
    // result releases the column (width AND gap) or the stacked slot. The slot is
    // reserved until the first measurement, so the common non-empty aside never
    // jumps; an empty one shows its reserved space for that one layout pass. The
    // content stays mounted (invisible, out of flow) so it comes back as soon as
    // anything renders.
    const [asideEmpty, setAsideEmpty] = useState(false);
    const measureAside = useCallback(
      (event: LayoutChangeEvent) => setAsideEmpty(event.nativeEvent.layout.height === 0),
      [],
    );
    const asideContent = (
      <View testID={testID ? `${testID}-aside-content` : undefined} onLayout={measureAside}>
        {aside}
      </View>
    );
    // The empty aside, still measured at the width it would take. Absolutely
    // positioned, so no row or column gap is spent on it.
    const asideProbe = (width: number | '100%') => (
      <View
        testID={testID ? `${testID}-aside-probe` : undefined}
        pointerEvents="none"
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          top: 0,
          insetInlineStart: 0,
          width,
          opacity: 0,
        }}
      >
        {asideContent}
      </View>
    );
    const asideShown = asideBeside && !asideEmpty;
    // Reserve the reading measure and the aside actually drawn, rather than
    // measuring the already-shrunk content (which would oscillate on resize).
    const preferredContent = contentWidth;
    const expandedRequired =
      sidebarMetrics.expanded +
      preferredContent +
      (asideShown ? asideWidth + Math.max(0, asideGap ?? columnGap) : 0) +
      Math.max(0, navigationGap ?? columnGap) +
      gutter * 2;
    const capacityCollapsed =
      cssShell?.capacityCollapsed ?? (navVariant !== 'rail' && width < expandedRequired);
    const flowSidebar = sidebar
      ? {
          ...sidebar,
          variant: navVariant,
          collapsed:
            cssShell?.collapsed ?? sidebar.collapsed ?? (capacityCollapsed || userCollapsed),
          collapseDisabled:
            sidebar.collapseDisabled ?? (sidebar.collapsed === undefined && capacityCollapsed),
          onCollapsedChange: (collapsed: boolean) => {
            setUserCollapsed(collapsed);
            sidebar.onCollapsedChange?.(collapsed);
          },
        }
      : undefined;

    // The in-flow navigation's own width in its current form, which is what a
    // dock slides out and back in (the slot around it animates; this does not).
    const navContentWidth = !flowSidebar
      ? 0
      : navVariant === 'rail'
        ? sidebar?.railWidth === undefined || !Number.isFinite(sidebar.railWidth)
          ? SIDEBAR_RAIL_WIDTH
          : Math.max(64, sidebar.railWidth)
        : flowSidebar.collapsed
          ? resolveSidebarGeometry(
              sidebarMetrics,
              sidebar?.surface ?? 'card',
              !!sidebar?.primaryAction,
              sidebar?.content != null,
            ).collapsedWidth
          : sidebarMetrics.expanded;
    const navDock = useEdgeDock(sidebar?.dock, navInFlow, DOCK_VARS.start.dock);
    const navDocked = navDock.resolved != null && navInFlow;
    // A document's top bar is sticky in the page's flow; only a bounded frame
    // can take it out of the layout.
    const topDock = useEdgeDock(
      topBarDock,
      !doc && topBar != null && (topBarVisibility === 'always' || !navInFlow),
      DOCK_VARS.top.dock,
    );
    useDockProperties(navDock.resolved != null || topDock.resolved != null);

    const stackedAside = asideStacked ? (
      asideEmpty ? (
        asideProbe('100%')
      ) : (
        <View testID={testID ? `${testID}-aside` : undefined}>{asideContent}</View>
      )
    ) : null;

    const reducedMotion = useReducedMotion();
    const spanProgress = useSharedValue(spanAside ? 1 : 0);
    useEffect(() => {
      animateMotion(spanProgress, spanAside ? 1 : 0, 'expand', reducedMotion);
    }, [spanAside, spanProgress, reducedMotion]);
    const readingGap = Math.max(0, asideGap ?? columnGap);
    const readingGapStyle = useAnimatedStyle(
      () => ({
        gap: readingGap * (1 - spanProgress.value),
      }),
      [readingGap, spanProgress],
    );
    const asideSpanStyle = useAnimatedStyle(
      () => ({
        width: asideWidth * (1 - spanProgress.value),
        opacity: 1 - spanProgress.value,
        overflow: spanProgress.value > 0 ? ('hidden' as const) : ('visible' as const),
        maxHeight: spanProgress.value >= 1 ? 0 : UNSET,
      }),
      [asideWidth, spanProgress],
    );

    // Insets here are logical; a `translateX` sign and a `transformOrigin` are
    // not, so the reveal reads the direction once here.
    const rtl = useIsRtl();
    const dir = rtl ? -1 : 1;
    const railOrigin = rtl ? 'right center' : 'left center';
    // react-native-web resolves logical insets against its OWN direction context
    // (a `dir` prop), not `<html dir>` — every root and the portaled drawer hand
    // it on.
    const dirProps = useDirectionProps();
    const [open, setOpen] = useControllableState<boolean>({
      value: drawerOpen,
      defaultValue: false,
      onChange: onDrawerOpenChange,
    });
    // The drawer always opens the full panel, whatever the in-flow variant.
    const drawerSidebar = sidebar
      ? { ...closingOnChoice(sidebar, () => setOpen(false)), variant: 'panel' as const }
      : undefined;
    const drawerAvailable = hasNav && !wide;
    const isOpen = open && drawerAvailable;
    // `drawerSwipe` is a native gesture: the web keeps its press-only drawer.
    const swipeEnabled = drawerSwipe && hasNav && Platform.OS !== 'web';
    const swipeOverlay = swipeEnabled && drawerStyle === 'overlay';

    const revealInteractionOpen = isOpen && drawerStyle === 'reveal';
    const revealDrawerRef = usePanelInteraction(revealInteractionOpen, revealInteractionOpen, () =>
      setOpen(false),
    );

    const revealAvailable = drawerStyle === 'reveal' && drawerAvailable;
    const feedRevealAvailable = variant === 'feed' && revealAvailable;
    const feedRevealed = feedRevealAvailable && isOpen;

    const shell = useMemo(
      () => ({
        drawerAvailable,
        drawerDisplay: cssScope && hasNav ? 'var(--bloom-drawer-trigger-display, none)' : undefined,
        drawerOpen: isOpen,
        openDrawer: () => setOpen(true),
        closeDrawer: () => setOpen(false),
        toggleDrawer: () => setOpen(!isOpen),
        navigationDock: navDock.state,
        topBarDock: topDock.state,
      }),
      [drawerAvailable, isOpen, setOpen, cssScope, hasNav, navDock.state, topDock.state],
    );

    /**
     * Closing the drawer hands focus back to whatever opened it.
     *
     * The drawer is a PORTAL, so when it closes the focused node leaves the
     * document and the browser drops focus to `<body>` — a keyboard user is
     * returned to the top of the page, and a screen reader announces nothing.
     * Remembering `activeElement` at open time is what makes "Escape" land back
     * on the hamburger. It reads the opener rather than a ref to Bloom's own
     * button so a page that opens the drawer from its own control
     * (`useAppShell().openDrawer`) gets the same behaviour.
     *
     * WEB ONLY, and the native gap is recorded rather than faked: the equivalent
     * there is `useRestoreAccessibilityFocus`, which needs a ref to the trigger,
     * and `Button` forwards none. See `docs/app-shell.mdx`.
     */
    const opener = useRef<HTMLElement | null>(null);
    useEffect(() => {
      if (drawerStyle === 'reveal' || Platform.OS !== 'web' || typeof document === 'undefined')
        return;
      if (isOpen) {
        opener.current = document.activeElement as HTMLElement | null;
        return;
      }
      const previous = opener.current;
      opener.current = null;
      if (previous && typeof previous.focus === 'function' && document.contains(previous))
        previous.focus();
    }, [isOpen, drawerStyle]);

    // `transparent`: the window's own backdrop shows between the regions.
    const background = backgroundMode === 'transparent' ? 'transparent' : paintColors.background;

    // ---- pinned slots -------------------------------------------------------
    // `compact` is the phone case the slot exists for: the bar appears exactly
    // where the nav became a drawer.
    const barActive = (visibility: 'compact' | 'always') => visibility === 'always' || !navInFlow;
    const showTopBar = topBar != null && barActive(topBarVisibility);
    const showBottomBar = bottomBar != null && barActive(bottomBarVisibility);
    // The bounded web viewport gives up the actual slot height through flex
    // layout, including SSR. Measuring an overlay cannot reserve its first frame.
    const flowBottomBar = !!cssScope && !doc && reserveBottomBarSpace && bottomBar != null;
    const showFloatingAction = floatingAction != null;
    // Preserve the real device insets for fullscreen dialogs and portals. Only
    // the bounded shell consumes these edges; bottom chrome keeps its own inset.
    const bottomChrome = showBottomBar || showFloatingAction;
    const frameBottomInset = ownsSafeArea && !bottomChrome ? insets.bottom : 0;
    const navigationBottomInset = ownsSafeArea && bottomChrome ? insets.bottom : 0;
    const safeFrame = (node: React.ReactElement) =>
      ownsSafeArea ? (
        <View
          {...dirProps}
          testID={testID ? `${testID}-safe-area` : undefined}
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            paddingTop: insets.top,
            paddingInlineStart: rtl ? insets.right : insets.left,
            paddingInlineEnd: rtl ? insets.left : insets.right,
            paddingBottom: frameBottomInset,
            backgroundColor: background,
          }}
        >
          {node}
        </View>
      ) : (
        node
      );

    // The shell's root. Descendants are not at the window's corner while this
    // shell holds it.
    const shellRoot = (node: React.ReactElement) =>
      appWindow != null ? (
        <WindowCornerProvider value>{safeFrame(node)}</WindowCornerProvider>
      ) : (
        safeFrame(node)
      );

    const safeNavigation = (node: React.ReactElement) =>
      navigationBottomInset ? (
        <View style={{ flexShrink: 0, paddingBottom: navigationBottomInset }}>{node}</View>
      ) : (
        node
      );
    const [topBarHeight, setTopBarHeight] = useState(0);
    const [bottomBarHeight, setBottomBarHeight] = useState(0);
    const [floatingActionHeight, setFloatingActionHeight] = useState(0);
    // Both slots are MEASURED rather than assumed: a bar's height is its
    // content's, and a guess is what leaves the last row of a feed under it.
    const bottomEdge = showBottomBar ? bottomBarHeight : insets.bottom;
    const contentReserve =
      showBottomBar || showFloatingAction
        ? (reserveBottomBarSpace && !flowBottomBar ? bottomEdge : 0) +
          (showFloatingAction ? floatingActionHeight + gutter : 0)
        : 0;
    // `scroll="page"` on native: each route's `ScreenScrollView` is the
    // scroller, so the shell pads nothing and hands the occupied bottom edge to
    // the routes' Screens instead — their content scrolls under the bar and its
    // last row still clears it.
    const pageNative = scroll === 'page' && mode === 'fixed' && Platform.OS !== 'web';
    const pageReserve = pageNative ? 0 : contentReserve;
    // The routes share the shell's navigation state wherever the shell's bar
    // follows the screen in front: native `scroll="page"`, and the web document,
    // whose screens collapse from the window's own scroll. Pressing on into a
    // screen that does not scroll the document (a full-screen reel) never
    // collapses it, and the screen taking over expands it again.
    const sharedNavigation = pageNative || (Platform.OS === 'web' && mode === 'document');
    const inheritedNavigation = useContext(ScreenNavigationContext);
    const pageProgress = useSharedValue(0);
    const pageTarget = useSharedValue(0);
    const pageScroller = useSharedValue<string | null>(null);
    const pageNavigation = useMemo<ScreenNavigationState>(
      () => ({
        ...(inheritedNavigation ?? {
          collapseProgress: pageProgress,
          collapseTarget: pageTarget,
          activeScrollerId: pageScroller,
        }),
        // The document reserves the bar itself; only native routes scroll
        // under it and pad their own end clear.
        bottomInset: pageNative
          ? Math.max(
              inheritedNavigation?.bottomInset ?? PAGE_CLEARANCE,
              contentReserve + PAGE_CLEARANCE,
            )
          : inheritedNavigation?.bottomInset,
      }),
      [inheritedNavigation, pageProgress, pageTarget, pageScroller, contentReserve, pageNative],
    );
    // The active screen's collapse also minimizes the shell's bottom bar, so an
    // app's bar follows the screen it covers without a scroll handler of its own.
    const barMinimize = useMemo(
      () =>
        sharedNavigation
          ? { progress: pageNavigation.collapseProgress, target: pageNavigation.collapseTarget }
          : undefined,
      [sharedNavigation, pageNavigation],
    );
    // Always the same element, whatever the mode: switching `scroll` on a mounted
    // shell must not remount the routes under it.
    const pageChildren = (
      <ScreenNavigationContext.Provider
        value={sharedNavigation ? pageNavigation : inheritedNavigation}
      >
        {children}
      </ScreenNavigationContext.Provider>
    );

    // ---- the panel region ---------------------------------------------------
    // Where the shell's gutter goes. A plain, content-aligned or a docked nav
    // runs the full height flush to the start edge, so the row keeps no top,
    // bottom or start padding and the region states its own; every other frame
    // pads the row. With `panels` the END side gets the same gutter in every
    // case — the edge that a content-aligned row once forgot — and a compact
    // region gets none on any side, whatever the mode.
    const contentAligned =
      navigationAlign === 'content' && centred && (!!cssScope || !compactRegion);
    const plainFrame = contentAligned && flowSidebar?.surface === 'plain' && !showTopBar;
    const dockedNav = navInFlow && flowSidebar?.surface === 'docked';
    const navFlush = navInFlow && (dockedNav || plainFrame);
    const regionOuter = framed || (navInFlow && !navFlush) ? gutter : 0;
    // `frameInset` moves the framed region's window edges, one at a time; the
    // gutter between the regions and around the panels stays `gutter`.
    const frameEdge = (edge: AppShellEdge) => {
      const declared = shellFrameInset?.[edge];
      return panelHost && regionOuter > 0 && declared !== undefined && Number.isFinite(declared)
        ? Math.max(0, declared)
        : regionOuter;
    };
    const outerTop = frameEdge('top');
    const outerBottom = frameEdge('bottom');
    const outerStart = frameEdge('start');
    const outerEnd = frameEdge('end');
    const externalTopHeight = showTopBar ? topBarHeight : 0;
    // A DOCKED nav is flush to the window: it takes the shell's whole height and
    // its own hairline is the separator, so the shell gives up its start and
    // vertical padding around that column rather than framing it like a card
    // (`dockedNav`, above).
    // Where the row places its first child, from the window's edges: a docked
    // navigation's peek floats `inset` from the window, not from its slot.
    const rowPadStart = panelHost
      ? navFlush
        ? 0
        : outerStart
      : dockedNav || canvas || plainFrame
        ? 0
        : gutter;
    const rowPadTop = panelHost
      ? navFlush
        ? 0
        : outerTop
      : dockedNav || canvas || plainFrame
        ? 0
        : gutter;
    const rowPadBottom = panelHost
      ? navFlush
        ? 0
        : outerBottom
      : dockedNav || canvas || plainFrame
        ? 0
        : gutter;
    const canvasNavPad = !doc && canvas && !dockedNav;
    // Hidden, a flush navigation leaves the frame's own start inset behind,
    // so the content's edge lands where it would with no navigation at all.
    const navHiddenExtent = navFlush && panelHost && framed ? outerStart : 0;

    // ---- the window's controls ---------------------------------------------
    // With the platform's `window` capability the controls sit in the window's
    // top leading corner, always in the same place, and ONE region keeps their
    // room: a top bar in flow above everything, else a sidebar in flow (its
    // content below the room, its top band the drag region), else the header
    // (after the room, and itself the drag region). `overlay` keeps none and
    // floats the controls on a plate; a full-screen window has neither.
    const windowChrome = appWindow != null && !appWindow.fullscreen;
    const room = windowChrome && windowControls === 'auto' ? appWindow.metrics.room : null;
    const topBarRoom = room != null && showTopBar;
    const topBarKeepsRoom = topBarRoom && !topDock.hidden;
    // The same mounted sidebar is the one that peeks, so it keeps the room
    // while its dock hides it; the header keeps it then.
    const navRoom =
      room != null && navInFlow && !topBarKeepsRoom
        ? Math.max(0, room.top - rowPadTop - (canvasNavPad ? gutter : 0))
        : 0;
    const rowGap = canvas
      ? 0
      : dockedNav
        ? panelHost
          ? regionOuter
          : 0
        : Math.max(0, navigationGap ?? columnGap);
    const visibleNavigationExtent =
      navInFlow && !navDock.hidden
        ? navContentWidth + rowGap + (canvasNavPad ? gutter : 0)
        : navInFlow
          ? navHiddenExtent
          : 0;
    const headerRoom =
      room != null && !topBarKeepsRoom
        ? Math.max(0, room.leading - rowPadStart - visibleNavigationExtent)
        : 0;
    // CSS owns responsive navigation width on web. The registered length
    // interpolates on the frame, so navigation and header share each frame's room.
    const navigationRoomCss =
      room != null && !topBarKeepsRoom && navInFlow && cssScope
        ? `max(0px, ${room.leading}px - var(--bloom-frame-alignment, var(--bloom-frame-start, 0px)) - var(--bloom-nav-width, 0px) - var(--bloom-nav-gap, 0px))`
        : undefined;
    const navSidebar =
      flowSidebar && navRoom > 0 ? { ...flowSidebar, windowControlsRoom: navRoom } : flowSidebar;
    // The window's panels (`windowPanels`, above) hold the window's chrome:
    // the shell hands it to its panel layout, which gives it to the panels
    // along the window's top edge; the first one keeps the controls' room in
    // its header, measured from where the panel already starts. The frame and
    // the panels do not move by the room. The checks the props alone cannot
    // answer (a navigation in flow, a top bar or header shown) leave it to
    // whoever is at the corner instead.
    const shellHeaderShown =
      header !== undefined
        ? header != null
        : title != null ||
          breadcrumb != null ||
          actions != null ||
          (drawerAvailable && !showTopBar);
    // Beside a flush sidebar the panels are along the window's top edge too:
    // the sidebar holds the controls (no room in the panels' headers) until
    // its dock hides it, when the first panel is at the corner and keeps the
    // room from where its frame now starts, as the header would.
    const contentChromeLeading =
      windowPanels &&
      room != null &&
      panelHost &&
      !showTopBar &&
      !(navInFlow && !navFlush) &&
      !shellHeaderShown &&
      (stretchReading || !centred)
        ? navInFlow && !navDock.hidden
          ? 0
          : Math.max(0, room.leading - rowPadStart - (navInFlow ? navHiddenExtent : 0))
        : null;
    const sidebarContentClearance =
      room != null && navInFlow && panelHost && !topBarKeepsRoom && !shellHeaderShown;
    const contentChrome = useMemo<WindowChrome | null>(
      () =>
        contentChromeLeading != null
          ? {
              leading: navInFlow ? headerRoom : contentChromeLeading,
              leadingCss: navInFlow ? navigationRoomCss : undefined,
            }
          : sidebarContentClearance && (headerRoom > 0 || navigationRoomCss != null)
            ? { leading: headerRoom, leadingCss: navigationRoomCss, topEdge: false }
            : null,
      [contentChromeLeading, sidebarContentClearance, headerRoom, navigationRoomCss, navInFlow],
    );
    const windowControlsNode =
      windowChrome && appWindow.controls === 'bloom' ? (
        // The window's own corner: the shell is the window's content. A
        // document scrolls the shell, so there the corner is the viewport's.
        <View
          pointerEvents="box-none"
          style={{
            position: doc ? WEB_POSITION_FIXED : 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: Z_INDEX.floating,
          }}
        >
          <WindowControls
            plate={windowControls === 'overlay'}
            testID={testID ? `${testID}-window-controls` : undefined}
          />
        </View>
      ) : null;
    // The reveal drawer insets the sliding page by 12 while it is open.
    const regionInsetTop = feedRevealed ? 12 : outerTop;
    const regionInsetBottom = feedRevealed ? 12 : outerBottom;
    const regionFlow: AppShellRegionValue['flow'] =
      mode === 'document' ? 'document' : mode === 'container' ? 'container' : 'bounded';
    const region = useMemo<AppShellRegionValue>(
      () => ({
        flow: regionFlow,
        framed,
        gutter,
        viewportInset: {
          top: externalTopHeight + regionInsetTop,
          bottom: regionInsetBottom,
        },
        // A bounded panel's content owns its edge (`useBottomEdgeInset`); a
        // growing one reserves the bar under its last row.
        bottomReserve: mode === 'fixed' ? 0 : contentReserve,
        underBottomBar: !reserveBottomBarSpace,
        revealed: feedRevealed,
        maskColor: background,
      }),
      [
        regionFlow,
        framed,
        gutter,
        externalTopHeight,
        regionInsetTop,
        regionInsetBottom,
        mode,
        contentReserve,
        feedRevealed,
        background,
        reserveBottomBarSpace,
      ],
    );
    // Native animates a numeric reading envelope. Web uses NativeWind CSS flex
    // transitions against its actual siblings, with no navigation measurement.
    // Both keep the same alignment, gutter ownership and mounted host tree.
    const [measuredNavigationWidth, setMeasuredNavigationWidth] = useState<number | null>(null);
    const navigationWidth = navInFlow ? (measuredNavigationWidth ?? sidebarMetrics.expanded) : 0;
    // The row's gap after the navigation. Panels keep their gutter off a docked
    // nav's hairline; a canvas runs to the edge.
    const rowNavigationGap = !navInFlow
      ? 0
      : canvas && !dockedNav
        ? Math.max(0, navigationGap ?? columnGap)
        : rowGap;
    // The frame's own start and end edges (`frameInset`, else the gutter): a
    // flush navigation owns the start edge.
    const rowHorizontalPadding = panelHost
      ? (navFlush ? 0 : outerStart) + outerEnd
      : canvas
        ? 0
        : gutter * (dockedNav ? 1 : 2);
    const availableReadingWidth = Math.max(
      0,
      width - navigationWidth - rowNavigationGap - rowHorizontalPadding,
    );
    const numericReading = Platform.OS !== 'web' && panelHost && centred && !compactRegion;
    // A docked navigation's slot closes from its width (and the row gap it
    // carries) to what it leaves of the frame: hidden, a filling envelope takes
    // that room too. It moves on the dock's own motion, from the same moment as
    // the slot's, so the content's edge and the navigation's far side stay
    // together, as the web's flex keeps them.
    const navDockRoom =
      navDocked && stretchReading && navDock.hidden
        ? Math.max(0, navigationWidth + rowNavigationGap - navHiddenExtent)
        : 0;
    const asideReadingWidth = asideShown ? asideWidth + readingGap : 0;
    const targetReadingWidth = stretchReading ? availableReadingWidth + navDockRoom : contentWidth;
    const readingWidth = useSharedValue(targetReadingWidth);
    // The shell resized (its window or container): the envelope lands at once, as
    // the panels do (`useRoomChanged`); the navigation or a reading width changing
    // still moves it. `resized` is read, not followed.
    const resized = useRoomChanged(String(width));
    const docking = useRoomChanged(String(navDock.hidden));
    const dockSpec =
      docking && navDock.resolved
        ? navDock.hidden
          ? navDock.resolved.motion.hide
          : navDock.resolved.motion.show
        : null;
    // biome-ignore lint/correctness/useExhaustiveDependencies: `resized` and the dock's motion qualify the change
    useEffect(() => {
      if (dockSpec && !resized) {
        animateWithSpec(
          readingWidth,
          targetReadingWidth,
          dockSpec,
          reducedMotion || navDock.instant,
        );
        return;
      }
      animateMotion(readingWidth, targetReadingWidth, 'expand', reducedMotion || resized);
    }, [readingWidth, targetReadingWidth, reducedMotion]);
    const readingEnvelopeStyle = useAnimatedStyle(
      () =>
        numericReading && contentAligned
          ? {
              flexGrow: 0,
              flexBasis: readingWidth.value + asideReadingWidth,
              maxWidth: readingWidth.value + asideReadingWidth,
            }
          : {},
      [numericReading, contentAligned, readingWidth, asideReadingWidth],
    );
    const contentSpanStyle = useAnimatedStyle(() => {
      const extra = asideReadingWidth * spanProgress.value;
      return numericReading
        ? {
            flexGrow: 0,
            flexBasis: readingWidth.value + extra,
            maxWidth: readingWidth.value + extra,
          }
        : {
            flexBasis: stretchReading ? ('100%' as const) : contentWidth + extra,
            maxWidth: stretchReading
              ? compactRegion
                ? UNSET
                : ('100%' as const)
              : contentWidth + extra,
          };
    }, [
      numericReading,
      compactRegion,
      readingWidth,
      asideReadingWidth,
      spanProgress,
      stretchReading,
      contentWidth,
    ]);

    const regionChildren = panelHost ? (
      <AppShellRegionContext.Provider value={region}>
        {platformWindow != null ? (
          <WindowChromeProvider value={contentChrome}>{pageChildren}</WindowChromeProvider>
        ) : (
          pageChildren
        )}
      </AppShellRegionContext.Provider>
    ) : (
      pageChildren
    );

    const bars = (
      <SurfaceLevelProvider
        level={compactRegion ? 1 : 0}
        fill={compactRegion ? theme.colors.card : theme.colors.background}
        fillModes={compactRegion ? cardRecipe : backgroundRecipe}
      >
        {Platform.OS === 'web' && doc ? (
          <ScrollBar target="document" insets={{ start: gutter, end: bottomEdge + gutter }} />
        ) : null}
        {(cssScope ? bottomBar != null : showBottomBar) ? (
          <AppShellBottomBar
            inFlow={flowBottomBar}
            visibility={bottomBarVisibility}
            doc={doc && !revealAvailable}
            onHeightChange={setBottomBarHeight}
            testID={testID ? `${testID}-bottom-bar` : undefined}
          >
            {barMinimize ? (
              <TabBarMinimizeProvider state={barMinimize}>{bottomBar}</TabBarMinimizeProvider>
            ) : (
              bottomBar
            )}
          </AppShellBottomBar>
        ) : null}
        {showFloatingAction ? (
          <AppShellFloatingAction
            doc={doc && !revealAvailable}
            offset={bottomEdge + gutter}
            gutter={gutter}
            placement={floatingActionPlacement}
            onHeightChange={setFloatingActionHeight}
            testID={testID ? `${testID}-floating-action` : undefined}
          >
            {floatingAction}
          </AppShellFloatingAction>
        ) : null}
      </SurfaceLevelProvider>
    );

    const topBarContent = (cssScope ? topBar != null : showTopBar) ? (
      <AppShellTopBar
        visibility={topBarVisibility}
        insetTop={ownsSafeArea ? 0 : undefined}
        doc={doc}
        onHeightChange={setTopBarHeight}
        testID={testID ? `${testID}-top-bar` : undefined}
      >
        {topBarRoom ? (
          <WindowDragRegion
            testID={testID ? `${testID}-top-bar-drag` : undefined}
            style={{ paddingInlineStart: room.leading }}
          >
            {topBar}
          </WindowDragRegion>
        ) : (
          topBar
        )}
      </AppShellTopBar>
    ) : null;
    const topDocked = topDock.enabled && topBarContent != null;
    const topSlotStyle = useDockSlotStyle(
      'top',
      topDock,
      topDocked && topBarHeight > 0 ? topBarHeight : null,
      0,
    );
    const topBarNode = topDocked ? (
      <Animated.View
        testID={testID ? `${testID}-top-bar-slot` : undefined}
        style={[
          { flexShrink: 0 },
          topSlotStyle ?? (topDock.hidden ? { height: 0 } : null),
          topDock.hidden || topDock.phase !== 'closed' ? { zIndex: 1 } : null,
        ]}
      >
        <DockHost
          axis="top"
          dock={topDock}
          size={topBarHeight > 0 ? topBarHeight : null}
          origin={{ start: 0, top: 0, bottom: 0 }}
          chrome={navigationChrome}
          testID={testID ? `${testID}-top-bar-host` : undefined}
        >
          {topBarContent}
        </DockHost>
        <DockEdgeStrip
          axis="top"
          dock={topDock}
          testID={testID ? `${testID}-top-bar-edge` : undefined}
        />
      </Animated.View>
    ) : (
      topBarContent
    );

    // The default header renders whenever it has something to show — a menu
    // button alone counts, so a page without a title can still open the drawer.
    //
    // Unless there is a `topBar`: that bar is where a phone's navigation control
    // belongs, so the header does not add a SECOND hamburger under it. (Put an
    // `AppShellMenuButton` in the bar; it renders itself only when there is a
    // drawer to open.)
    const menuInHeader = drawerAvailable && !showTopBar;
    // `header={null}` is an ANSWER, not an absence: the page says it wants no
    // header at all (it draws its own bar, or its own nav control). `??` would
    // have taken `null` as "nothing given" and drawn the default one under the
    // page's own — which is how a second hamburger appeared on a phone.
    const shellHeader =
      header !== undefined ? (
        header
      ) : title != null || breadcrumb != null || actions != null || menuInHeader ? (
        <AppShellHeader
          title={title}
          breadcrumb={breadcrumb}
          actions={actions}
          menuOpen={isOpen}
          showMenu={menuInHeader}
          menuLabel={drawerOpenLabel}
          onMenuPress={menuInHeader ? shell.toggleDrawer : undefined}
          testID={testID ? `${testID}-header` : undefined}
        />
      ) : null;
    // Without a sidebar in flow the header is the window's toolbar.
    const headerNode =
      shellHeader != null &&
      navInFlow &&
      !navDock.hidden &&
      (headerRoom > 0 || navigationRoomCss != null) ? (
        <View
          testID={testID ? `${testID}-header-clearance` : undefined}
          style={{ paddingInlineStart: navigationRoomCss ?? headerRoom } as WebCssStyle}
        >
          {shellHeader}
        </View>
      ) : shellHeader != null && headerRoom > 0 ? (
        <WindowDragRegion
          testID={testID ? `${testID}-header-drag` : undefined}
          style={{ paddingInlineStart: headerRoom }}
        >
          {shellHeader}
        </WindowDragRegion>
      ) : (
        shellHeader
      );

    // Longhands: the nodes carrying `fill` keep their DOM node across a `scroll`
    // switch, and some also spell flex longhands of their own (`flexFill`).
    const fill = fixed ? { ...flexFill, minHeight: 0 } : null;
    const column = (
      <View
        testID={testID ? `${testID}-content` : undefined}
        style={[
          {
            width: '100%',
            maxWidth: contentMaxWidth === 'none' ? undefined : contentMaxWidth,
            alignSelf: 'center',
            gap: panelHost ? (framed ? gutter : 0) : 10,
          },
          fill,
        ]}
      >
        {headerNode}
        <View
          style={[
            {
              width: '100%',
              gap: 16,
              paddingBottom: drawer === 'overlay' && !panelHost ? 16 : 0,
            },
            fill,
          ]}
        >
          {regionChildren}
          {stackedAside}
        </View>
      </View>
    );

    // Document asides grow naturally. A tall aside first travels with the page
    // until its bottom is visible, then sticks; wheel events keep scrolling the
    // document rather than getting trapped in a second scroll container.
    const asideColumn = (inset: WebCssStyle) =>
      asideBeside && asideEmpty ? (
        asideProbe(asideWidth)
      ) : asideBeside ? (
        <AnimatedLayoutView
          testID={testID ? `${testID}-aside` : undefined}
          pointerEvents={spanAside ? 'none' : 'auto'}
          aria-hidden={spanAside || undefined}
          accessibilityElementsHidden={spanAside}
          importantForAccessibility={spanAside ? 'no-hide-descendants' : 'auto'}
          {...(Platform.OS === 'web' && spanAside ? { inert: true } : {})}
          onLayout={(event) => setAsideHeight(event.nativeEvent.layout.height)}
          style={[
            { width: asideWidth, flexShrink: 0 },
            doc
              ? {
                  position: WEB_POSITION_STICKY,
                  top: Math.min(gutter, viewportHeight - asideHeight - gutter),
                  alignSelf: 'flex-start',
                }
              : { alignSelf: 'stretch' },
            inset,
            variant === 'feed' ? asideSpanStyle : undefined,
          ]}
        >
          <View
            style={
              variant === 'feed'
                ? {
                    width: asideWidth,
                    minHeight: 0,
                    ...(doc ? {} : { flexGrow: 1, flexShrink: 1, flexBasis: 0 }),
                  }
                : {
                    minHeight: 0,
                    ...(doc ? {} : { flexGrow: 1, flexShrink: 1, flexBasis: 0 }),
                  }
            }
          >
            {doc ? (
              asideContent
            ) : (
              <ScrollArea
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
              >
                {asideContent}
              </ScrollArea>
            )}
          </View>
        </AnimatedLayoutView>
      ) : null;

    // Modular web roots establish a percentage-height chain. Unlike dvh,
    // this uses the viewport left above a classic document scrollbar.
    const frame =
      cssScope && mode === 'fixed'
        ? { ...rootFrame(mode), height: '100%' as const }
        : rootFrame(mode);

    // ---- the drawer's open amount ------------------------------------------
    // `reveal` always animates it; the `overlay` drawer only under
    // `drawerSwipe`, where a finger drives the same value (below) — without the
    // swipe it mounts open and unmounts closed, exactly as it always has.
    const reveal = useSharedValue(isOpen ? 1 : 0);
    // The `overlay` drawer's travel is its whole box sliding in from
    // off-screen: the panel, 12 either side, and the device's side insets when
    // the shell owns the safe area.
    const overlayTravel =
      sidebarMetrics.expanded + 24 + (ownsSafeArea ? insets.left + insets.right : 0);
    const swipeStart = useSharedValue(0);
    // Crossing to desktop immediately restores its ordinary layout, including
    // while a native compact reveal was still settling.
    const revealAmount = useDerivedValue(
      () => (revealAvailable ? reveal.value : 0),
      [revealAvailable, reveal],
    );
    // A swiped `overlay` drawer stays mounted while it is visible but not open:
    // dragged out from the edge before the release lands, or sliding away after
    // it closed. Set during render on the closing edge, so no frame unmounts it.
    const [overlayHeld, setOverlayHeld] = useState(false);
    const [wasOpen, setWasOpen] = useState(isOpen);
    if (swipeOverlay && wasOpen !== isOpen) {
      setWasOpen(isOpen);
      if (!isOpen) setOverlayHeld(true);
    }
    // Bumped by every settled swipe, so the effect below re-reads the state the
    // swipe asked for — and slides back when a controlled parent declined it.
    const [swipeSettles, setSwipeSettles] = useState(0);
    useEffect(() => {
      const target = isOpen && (drawerStyle === 'reveal' || swipeOverlay) ? 1 : 0;
      // The browser interpolates web frames; native keeps its UI-thread timing.
      if (Platform.OS === 'web' || reducedMotion || (swipeOverlay && reveal.value === target)) {
        reveal.value = target;
        if (swipeOverlay && target === 0) setOverlayHeld(false);
        return;
      }
      reveal.value = withTiming(
        target,
        { duration: REVEAL_MS, easing: REVEAL_EASE },
        swipeOverlay && target === 0
          ? (finished) => {
              'worklet';
              if (finished) runOnJS(setOverlayHeld)(false);
            }
          : undefined,
      );
    }, [isOpen, drawerStyle, swipeOverlay, reducedMotion, reveal, swipeSettles]);
    const settleSwipe = useCallback(
      (next: boolean) => {
        if (next !== isOpen) setOpen(next);
        setSwipeSettles((count) => count + 1);
      },
      [isOpen, setOpen],
    );
    const holdOverlay = useCallback(() => {
      if (swipeOverlay) setOverlayHeld(true);
    }, [swipeOverlay]);
    const swipeGestures = useDrawerSwipe({
      swipe: swipeEnabled,
      available: drawerAvailable,
      open: isOpen,
      closeOnFrame: drawerStyle === 'reveal',
      rtl,
      frameWidth: width,
      travel: drawerStyle === 'reveal' ? revealTravel : overlayTravel,
      progress: reveal,
      start: swipeStart,
      reducedMotion,
      onOpenDragStart: holdOverlay,
      onSettle: settleSwipe,
    });
    const overlayDrawerStyle = useAnimatedStyle(
      () =>
        swipeOverlay
          ? { transform: [{ translateX: -dir * overlayTravel * (1 - reveal.value) }] }
          : {},
      [swipeOverlay, dir, overlayTravel, reveal],
    );
    // The frame's gesture wraps the shell's own root, so the touch's `x` is
    // measured against the box the start-edge strip belongs to.
    const withFrameSwipe = (node: React.ReactElement) =>
      swipeGestures.frame ? (
        <GestureDetector gesture={swipeGestures.frame} touchAction="pan-y">
          {node}
        </GestureDetector>
      ) : (
        node
      );
    // Clip immediately on open; release overflow after the closing transition.
    // A bounded Deck still owns document horizontal scrolling while at rest.
    const revealTransition: WebCssStyle | null =
      Platform.OS === 'web'
        ? {
            transitionProperty:
              'transform, border-radius, opacity, padding-top, padding-bottom, top, bottom, overflow',
            transitionDuration: `${Array(7)
              .fill(!revealAvailable || reducedMotion ? '0ms' : `${REVEAL_MS}ms`)
              .join(
                ',',
              )},${!revealAvailable || isOpen || reducedMotion ? '0ms' : `${REVEAL_MS}ms`}`,
            transitionTimingFunction: `${Array(7).fill('cubic-bezier(0.42, 0, 0.58, 1)').join(',')},steps(1,end)`,
            transitionBehavior: 'allow-discrete',
          }
        : null;
    const feedPageStyle = useAnimatedStyle(
      () => ({
        transform:
          revealAmount.value === 0
            ? []
            : [{ translateX: dir * (revealOffset + 12) * revealAmount.value }],
      }),
      [revealAmount, dir, revealOffset],
    );

    const feedChromeTransition: WebCssStyle =
      Platform.OS === 'web'
        ? {
            '--bloom-panel-inset-duration':
              !revealAvailable || reducedMotion ? '0ms' : `${REVEAL_MS}ms`,
          }
        : {};
    const feedInsetsStyle = useAnimatedStyle(
      () => ({
        paddingTop: 12 * revealAmount.value,
        paddingBottom: 12 * revealAmount.value,
      }),
      [revealAmount],
    );
    const feedBarsStyle = useAnimatedStyle(
      () => ({
        top: 12 * revealAmount.value,
        bottom: 12 * revealAmount.value,
        borderRadius: 28 * revealAmount.value,
      }),
      [revealAmount],
    );

    const railStyle = useAnimatedStyle(
      () => ({
        opacity: revealAmount.value,
        transform: [{ scale: 0.94 + 0.06 * revealAmount.value }],
      }),
      [revealAmount],
    );
    const pageStyle = useAnimatedStyle(
      () => ({
        transform:
          revealAmount.value === 0 ? [] : [{ translateX: dir * revealOffset * revealAmount.value }],
        borderRadius: 32 * revealAmount.value,
      }),
      [revealAmount, dir, revealOffset],
    );
    const veilStyle = useAnimatedStyle(() => ({ opacity: revealAmount.value }), [revealAmount]);

    const navHostWidth = navContentWidth + (canvasNavPad ? gutter : 0);
    const navSlotStyle = useDockSlotStyle(
      'start',
      navDock,
      navDocked ? navHostWidth + rowGap : null,
      navHiddenExtent,
    );
    const navPeekLayer =
      navDocked && (navDock.hidden || navDock.phase !== 'closed') ? { zIndex: 1 } : null;
    const navOrigin = { start: rowPadStart, top: rowPadTop, bottom: rowPadBottom };
    const dockedNavigation = (content: React.ReactNode, size: number | string) => (
      <>
        <DockHost
          axis="start"
          dock={navDock}
          size={size}
          origin={navOrigin}
          chrome={navigationChrome}
          testID={testID ? `${testID}-navigation-host` : undefined}
        >
          {content}
        </DockHost>
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: -rowPadTop,
            bottom: -rowPadBottom,
            insetInlineStart: -rowPadStart,
          }}
        >
          <DockEdgeStrip
            axis="start"
            dock={navDock}
            testID={testID ? `${testID}-navigation-edge` : undefined}
          />
        </View>
      </>
    );
    // Only the modes the compiled CSS can reach are rendered: a navigation with
    // an explicit variant and no expanded tier is that variant at every width,
    // so it mounts its content once instead of once per mode.
    const reachableNavModes: readonly ('panel' | 'rail')[] =
      panelFrom !== undefined
        ? ['panel', 'rail']
        : [sidebar?.variant === 'rail' ? 'rail' : 'panel'];
    const cssNavigationModes =
      cssScope && flowSidebar ? (
        <>
          {reachableNavModes.map((mode) => (
            <View
              key={mode}
              {...{ dataSet: { bloomShellNavMode: mode } }}
              aria-hidden={cssShell?.mode !== mode}
              {...(cssShell?.mode !== mode ? { inert: true } : {})}
              style={{ width: '100%', flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0 }}
            >
              {safeNavigation(<SidebarSlot {...navSidebar} variant={mode} />)}
            </View>
          ))}
        </>
      ) : null;
    const navRegion =
      cssScope && hasNav && flowSidebar ? (
        <View
          testID={testID ? `${testID}-navigation` : undefined}
          {...{ dataSet: { bloomShellNav: cssScope } }}
          style={[
            {
              flexShrink: 0,
              '--bloom-nav-overlay-surface': navigationChrome.surface,
              '--bloom-nav-overlay-border': navigationChrome.border,
              '--bloom-nav-overlay-shadow': navigationChrome.shadow,
            } as WebCssStyle,
            doc ? stickyRail(dockedNav || plainFrame ? 0 : gutter) : null,
            navPeekLayer,
          ]}
        >
          {navDock.resolved
            ? dockedNavigation(cssNavigationModes, 'var(--bloom-nav-content-width)')
            : cssNavigationModes}
        </View>
      ) : navInFlow && flowSidebar && navDocked ? (
        // Only a docked navigation's slot animates; every other one stays a plain view.
        <Animated.View
          testID={testID ? `${testID}-navigation` : undefined}
          style={[
            { flexShrink: 0 },
            doc ? stickyRail(dockedNav || plainFrame ? 0 : gutter) : null,
            navSlotStyle,
            navPeekLayer,
          ]}
        >
          {dockedNavigation(
            canvasNavPad ? (
              <View
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 0,
                  minHeight: 0,
                  paddingTop: gutter,
                  paddingBottom: gutter,
                  paddingInlineStart: gutter,
                }}
              >
                {safeNavigation(<SidebarSlot {...navSidebar} />)}
              </View>
            ) : (
              safeNavigation(<SidebarSlot {...navSidebar} />)
            ),
            navHostWidth,
          )}
        </Animated.View>
      ) : navInFlow && flowSidebar ? (
        <View
          testID={testID ? `${testID}-navigation` : undefined}
          onLayout={
            Platform.OS === 'web'
              ? undefined
              : (event) => setMeasuredNavigationWidth(event.nativeEvent.layout.width)
          }
          style={[
            { flexShrink: 0 },
            doc ? stickyRail(dockedNav || plainFrame ? 0 : gutter) : null,
            canvasNavPad
              ? {
                  paddingTop: gutter,
                  paddingBottom: gutter,
                  paddingInlineStart: gutter,
                }
              : null,
          ]}
        >
          {safeNavigation(<SidebarSlot {...navSidebar} />)}
        </View>
      ) : null;

    // ---- the page region, per variant ---------------------------------------
    /** `feed` / `focus`: a fixed reading column, centred in what the nav leaves. */
    const readingGroupWidth = contentWidth + (asideShown ? asideWidth + readingGap : 0);
    // The region's own vertical gutter, when the row gives it none (a flush nav).
    // A property of the NAVIGATION, not of who scrolls: native resolves every
    // shell to container scroll, and gating this on `document` left native
    // phones with an 8px frame around the reading column that the same layout
    // on the web does not draw.
    const bodyInset = panelHost
      ? navFlush
        ? { paddingTop: outerTop, paddingBottom: outerBottom }
        : {}
      : plainFrame
        ? { paddingTop: gutter, paddingBottom: gutter }
        : {};
    const centredBody = (
      <AnimatedLayoutView
        className={READING_TRANSITION}
        {...(Platform.OS === 'web'
          ? { dataSet: { bloomReadingEnvelope: cssScope ?? 'legacy' } }
          : {})}
        style={[
          {
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 0,
            minWidth: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: readingGap,
            // Document scroll: each column carries its own height (the centre
            // grows the page, the aside is sticky). Bounded: they stretch.
            alignItems: doc ? 'flex-start' : 'stretch',
            ...(contentAligned
              ? {
                  flexGrow: stretchReading ? 1 : 0,
                  flexBasis: stretchReading ? '100%' : readingGroupWidth,
                  maxWidth: stretchReading ? '100%' : readingGroupWidth,
                }
              : {}),
            ...bodyInset,
          },
          fixed ? { minHeight: 0 } : null,
          readingGapStyle,
          readingEnvelopeStyle,
        ]}
      >
        <AnimatedLayoutView
          className={READING_TRANSITION}
          {...(Platform.OS === 'web'
            ? { dataSet: { bloomReadingContent: cssScope ?? 'legacy' } }
            : {})}
          testID={testID ? `${testID}-content` : undefined}
          style={[
            // `flexBasis` is the reading width and `flexShrink: 1` is what keeps a
            // 600px column inside a 360px phone — a `width` would overflow.
            {
              flexGrow: stretchReading ? 1 : 0,
              flexShrink: 1,
              flexBasis: stretchReading ? 'auto' : contentWidth,
              maxWidth: stretchReading ? undefined : contentWidth,
              minWidth: 0,
            },
            doc ? null : { alignSelf: 'stretch' },
            contentSpanStyle,
          ]}
        >
          {panelHost ? (
            // ONE tree for every mode — the Scroller is the same node in
            // `document` and `fixed` — so switching `scroll` per route never
            // remounts the routes: the panels inside read the new region.
            <Scroller
              mode={mode}
              testID={testID ? `${testID}-page` : undefined}
              style={{}}
              contentStyle={mode === 'container' ? { flexGrow: 1 } : {}}
            >
              {headerNode ? (
                <View style={{ paddingBottom: framed ? gutter : 0 }}>{headerNode}</View>
              ) : null}
              {regionChildren}
              {stackedAside}
            </Scroller>
          ) : (
            <Scroller
              mode={mode}
              testID={testID ? `${testID}-page` : undefined}
              style={{}}
              contentStyle={{ paddingBottom: pageReserve }}
            >
              <View style={[{ gap: 16 }, fill]}>
                {headerNode}
                {pageChildren}
              </View>
              {stackedAside}
            </Scroller>
          )}
        </AnimatedLayoutView>
        {asideColumn({})}
      </AnimatedLayoutView>
    );

    const dashboardBody = (
      <>
        <Scroller
          mode={mode}
          testID={testID ? `${testID}-page` : undefined}
          style={{ ...flexFill, minWidth: 0, backgroundColor: background }}
          contentStyle={
            panelHost ? bodyInset : { paddingTop: small ? 12 : 0, paddingBottom: pageReserve }
          }
        >
          {column}
        </Scroller>
        {asideColumn(panelHost ? bodyInset : {})}
      </>
    );

    /**
     * `canvas`: the content IS the screen. One area, edge to edge — no reading
     * column, no max width, no padding — with the header (if any) above it in
     * flow, because a toolbar over a map belongs to the map. The `topBar`,
     * `bottomBar`, `floatingAction` and `overlay` slots float over it as they do
     * everywhere else, which is how a canvas gets its chrome without the canvas
     * giving up its area.
     *
     * The shell's own padding moves OUT of the row and onto the regions here
     * (below), so the nav is still a card with a gutter around it while the
     * canvas runs to the window's edge. No negative margins: each region states
     * its own inset.
     */
    const canvasBody = (
      <>
        <View
          testID={testID ? `${testID}-page` : undefined}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            backgroundColor: background,
          }}
        >
          {headerNode}
          <View style={{ flex: 1, minHeight: 0, minWidth: 0 }}>{pageChildren}</View>
        </View>
        {asideColumn(
          canvas
            ? {
                paddingTop: gutter,
                paddingBottom: gutter,
                paddingInlineEnd: gutter,
              }
            : {},
        )}
      </>
    );

    // The bar still publishes its outer-edge claim for sibling overlays. Inside
    // the smaller viewport, translate remaining outer claims by the actual
    // occupied height. Unrelated overlays and local claims remain effective.
    const body = (
      <BottomEdgeProvider
        inherit={!flowBottomBar}
        consume={flowBottomBar ? bottomBarHeight : undefined}
      >
        {canvas ? canvasBody : centred ? centredBody : dashboardBody}
      </BottomEdgeProvider>
    );

    // The drawer is PORTALED to the app root, full screen, so the device insets
    // are its own to clear whoever owns the page frame. Keyed on `ownsSafeArea`
    // it cleared nothing in an app whose Screens own their insets (Allo): the
    // panel ran under the status bar, the clock over its logo.
    const overlayFrameStyle: ViewStyle = {
      position: 'absolute',
      top: 0,
      bottom: 0,
      insetInlineStart: 0,
      flexDirection: 'row',
      paddingTop: 12 + insets.top,
      paddingBottom: 12 + insets.bottom,
      paddingInlineStart: 12 + (rtl ? insets.right : insets.left),
      paddingInlineEnd: 12 + (rtl ? insets.left : insets.right),
    };
    const overlayPanel = drawerSidebar ? (
      <View pointerEvents={isOpen ? 'auto' : 'none'} style={{ height: '100%' }}>
        <SidebarSlot {...drawerSidebar} mobile onClose={() => setOpen(false)} />
      </View>
    ) : null;
    const overlayFrameProps = {
      ...dirProps,
      testID: testID ? `${testID}-navigation-drawer` : undefined,
    };
    const overlayDrawer = (
      <>
        <Backdrop
          onPress={() => setOpen(false)}
          disabled={!isOpen}
          progress={swipeOverlay ? reveal : undefined}
          blurIntensity={0}
          dimOpacity={0.4}
          accessibilityLabel={drawerCloseLabel}
        />
        {/* Under `drawerSwipe` the drawer slides on the open amount, and stays
            mounted while it is visible but not yet (or no longer) open. Without
            it the same nodes mount open and unmount closed, as they always have. */}
        {swipeOverlay ? (
          <Animated.View
            {...overlayFrameProps}
            pointerEvents="box-none"
            style={[overlayFrameStyle, overlayDrawerStyle]}
          >
            {overlayPanel}
          </Animated.View>
        ) : (
          <View {...overlayFrameProps} pointerEvents="box-none" style={overlayFrameStyle}>
            {overlayPanel}
          </View>
        )}
      </>
    );
    const drawerRegion =
      drawerAvailable && (isOpen || (swipeOverlay && overlayHeld)) && drawerSidebar ? (
        <Portal>
          <OverlayRoot>
            {swipeGestures.drawer ? (
              // The open drawer and its backdrop close under a pan toward the
              // start edge. A host box, because the detector attaches to its
              // child's native view.
              <GestureDetector gesture={swipeGestures.drawer} touchAction="pan-y">
                <View
                  pointerEvents="box-none"
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                >
                  {overlayDrawer}
                </View>
              </GestureDetector>
            ) : (
              overlayDrawer
            )}
          </OverlayRoot>
        </Portal>
      ) : null;

    const rowStyle: WebCssStyle = {
      flexDirection: 'row',
      ...(contentAligned ? { justifyContent: 'center' } : {}),
      // A docked navigation carries the gap in its own slot, so it closes with it.
      gap: navDocked ? 0 : rowGap,
      // A canvas runs to the window's edge, so the row keeps no padding at all
      // and each region carries its own (the nav below, the aside in `canvasBody`).
      // A docked nav keeps only the END padding. Spelled in longhands, never the
      // `padding` shorthand plus a logical override: react-native-web expands the
      // shorthand to physical sides, and which of two declarations for one edge
      // wins is then a matter of declaration order rather than intent.
      ...(panelHost
        ? navFlush
          ? {
              paddingTop: 0,
              paddingBottom: 0,
              paddingInlineStart: 0,
              paddingInlineEnd: outerEnd,
            }
          : outerTop === outerBottom && outerTop === outerStart && outerTop === outerEnd
            ? { padding: outerTop }
            : {
                paddingTop: outerTop,
                paddingBottom: outerBottom,
                paddingInlineStart: outerStart,
                paddingInlineEnd: outerEnd,
              }
        : dockedNav
          ? {
              paddingTop: 0,
              paddingBottom: 0,
              paddingInlineStart: 0,
              paddingInlineEnd: canvas || plainFrame ? 0 : gutter,
            }
          : { padding: canvas || plainFrame ? 0 : gutter }),
      backgroundColor: background,
    };

    const docks = [
      { axis: 'start' as const, dock: navDock },
      { axis: 'top' as const, dock: topDock },
    ];
    // While a dock moves, the regions it resizes follow its one progress
    // property frame by frame; their own layout transitions would chase it.
    const dockMoving = Platform.OS === 'web' && (navDock.moving || topDock.moving);
    // The reveal root owns its own immediate-open / delayed-close clipping.
    // The document-deck override belongs only to roots with the fixed clip.
    const revealRoot =
      (variant === 'feed' || variant === 'dashboard') && drawerStyle === 'reveal' && hasNav;
    const rootData = (frameScope: string | null) =>
      frameScope || dockMoving || (cssScope && !revealRoot)
        ? {
            dataSet: {
              ...(frameScope ? { bloomShellFrame: frameScope } : {}),
              ...(cssScope && !revealRoot ? { bloomShellHost: cssScope } : {}),
              ...(dockMoving ? { bloomDockMoving: 'true' } : {}),
            },
          }
        : {};

    if (revealRoot) {
      return shellRoot(
        <AppShellProvider value={shell}>
          {navigationRecipe.sheet}
          <ServerStyleSheet id={`${cssScope}-shell`} css={cssShell?.css ?? ''} />
          {withFrameSwipe(
            <View
              {...dirProps}
              {...rootData(null)}
              testID={testID}
              onLayout={onLayout}
              style={[
                frame,
                dockRootStyle(docks, revealTransition) ?? revealTransition,
                {
                  overflow:
                    Platform.OS === 'web' ? (isOpen ? WEB_OVERFLOW_CLIP : 'visible') : 'hidden',
                  backgroundColor: background,
                },
                style,
              ]}
            >
              {drawerAvailable && drawerSidebar ? (
                <View
                  ref={revealDrawerRef}
                  tabIndex={-1}
                  testID={testID ? `${testID}-navigation-drawer` : undefined}
                  aria-hidden={!isOpen}
                  accessibilityViewIsModal={isOpen}
                  // The page and its veil are hidden from VoiceOver while this is
                  // modal, so its escape gesture is the way out.
                  onAccessibilityEscape={() => setOpen(false)}
                  accessibilityElementsHidden={!isOpen}
                  importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
                  {...(Platform.OS === 'web' && !isOpen ? { inert: true } : {})}
                  pointerEvents={isOpen ? 'auto' : 'none'}
                  style={{
                    position: doc ? WEB_POSITION_FIXED : 'absolute',
                    top: 0,
                    bottom: 0,
                    insetInlineStart: 0,
                    width: revealOffset,
                    paddingTop: revealGutter,
                    paddingBottom: revealGutter + navigationBottomInset,
                    paddingInlineStart: revealGutter / 2,
                  }}
                >
                  <Animated.View
                    style={[
                      {
                        height: '100%',
                        width: sidebarMetrics.expanded,
                        transformOrigin: railOrigin,
                      },
                      revealTransition,
                      railStyle,
                    ]}
                  >
                    {drawerSidebar && (
                      <SidebarSlot
                        {...drawerSidebar}
                        mobile
                        surface="plain"
                        onClose={() => setOpen(false)}
                      />
                    )}
                  </Animated.View>
                </View>
              ) : null}
              <Animated.View
                testID={testID ? `${testID}-reveal-page` : undefined}
                style={[
                  {
                    // Bounded shells must shrink this retained reveal host;
                    // otherwise a long sidebar makes every panel document-tall.
                    ...(doc ? { flexGrow: 1 } : flexFill),
                    minHeight: 0,
                    minWidth: 0,
                    overflow:
                      Platform.OS === 'web' ? (isOpen ? WEB_OVERFLOW_CLIP : 'visible') : 'hidden',
                    backgroundColor: background,
                  },
                  revealTransition,
                  feedChromeTransition,
                  variant === 'feed' ? feedPageStyle : pageStyle,
                  variant === 'feed' ? feedInsetsStyle : null,
                ]}
              >
                <View
                  aria-hidden={isOpen}
                  accessibilityElementsHidden={isOpen}
                  importantForAccessibility={isOpen ? 'no-hide-descendants' : 'auto'}
                  {...(Platform.OS === 'web' && isOpen ? { inert: true } : {})}
                  style={{ ...(doc ? { flexGrow: 1 } : flexFill), minHeight: 0, minWidth: 0 }}
                >
                  {topBarNode}
                  <StyledView className={doc ? undefined : 'flex-1 min-h-0'}>
                    <View
                      {...(cssScope ? { dataSet: { bloomShellFrame: cssScope } } : {})}
                      style={[
                        rowStyle,
                        { ...(doc ? { flexGrow: 1 } : flexFill), minHeight: 0, minWidth: 0 },
                      ]}
                    >
                      {navRegion}
                      {body}
                    </View>
                  </StyledView>
                </View>
                <Animated.View
                  pointerEvents={isOpen ? 'auto' : 'none'}
                  style={[
                    {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    },
                    revealTransition,
                    veilStyle,
                  ]}
                >
                  <Pressable
                    role="button"
                    accessibilityLabel={drawerCloseLabel}
                    focusable={isOpen}
                    tabIndex={isOpen ? 0 : -1}
                    aria-hidden={!isOpen}
                    onPress={() => setOpen(false)}
                    testID={testID ? `${testID}-veil` : undefined}
                    style={{
                      flex: 1,
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </Animated.View>
              </Animated.View>
              <Animated.View
                pointerEvents={isOpen ? 'none' : 'box-none'}
                testID={testID ? `${testID}-reveal-bars` : undefined}
                aria-hidden={isOpen}
                accessibilityElementsHidden={isOpen}
                importantForAccessibility={isOpen ? 'no-hide-descendants' : 'auto'}
                {...(Platform.OS === 'web' && isOpen ? { inert: true } : {})}
                style={[
                  {
                    position: flowBottomBar ? 'relative' : doc ? WEB_POSITION_FIXED : 'absolute',
                    flexShrink: 0,
                    left: flowBottomBar ? undefined : 0,
                    right: flowBottomBar ? undefined : 0,
                    overflow: flowBottomBar ? 'visible' : 'hidden',
                  },
                  revealTransition,
                  variant === 'feed' ? feedPageStyle : pageStyle,
                  flowBottomBar ? null : variant === 'feed' ? feedBarsStyle : { top: 0, bottom: 0 },
                ]}
              >
                {bars}
                {isOpen && (
                  <StyledView
                    pointerEvents="none"
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: contentReserve,
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.1)',
                    }}
                  />
                )}
              </Animated.View>
              {overlay}
              {windowControlsNode}
            </View>,
          )}
        </AppShellProvider>,
      );
    }

    // The top bar is a SIBLING above the columns, so it spans the shell edge to
    // edge without escaping the frame's padding. Without one the root stays the
    // row it has always been, so nothing about an existing shell moves.
    if (topBarNode || (Platform.OS === 'web' && cssLayout != null)) {
      return shellRoot(
        <AppShellProvider value={shell}>
          {navigationRecipe.sheet}
          <ServerStyleSheet id={`${cssScope}-shell`} css={cssShell?.css ?? ''} />
          {withFrameSwipe(
            <View
              {...dirProps}
              {...rootData(null)}
              testID={testID}
              onLayout={onLayout}
              style={[
                frame,
                { flexDirection: 'column', backgroundColor: background },
                dockRootStyle(docks),
                style,
              ]}
            >
              {topBarNode}
              <View
                {...(cssScope ? { dataSet: { bloomShellFrame: cssScope } } : {})}
                style={[rowStyle, { flexGrow: 1, flexShrink: 1, minHeight: 0 }]}
              >
                {navRegion}
                {drawerRegion}
                {body}
              </View>
              {overlay}
              {bars}
              {windowControlsNode}
            </View>,
          )}
        </AppShellProvider>,
      );
    }

    return shellRoot(
      <AppShellProvider value={shell}>
        {navigationRecipe.sheet}
        <ServerStyleSheet id={`${cssScope}-shell`} css={cssShell?.css ?? ''} />
        {withFrameSwipe(
          <View
            {...dirProps}
            {...rootData(cssScope)}
            testID={testID}
            onLayout={cssScope ? undefined : onLayout}
            style={[frame, rowStyle, dockRootStyle(docks), style]}
          >
            {navRegion}
            {drawerRegion}
            {body}
            {overlay}
            {bars}
            {windowControlsNode}
          </View>,
        )}
      </AppShellProvider>,
    );
  };

  const AppShellEngine = memo(AppShellComponent);
  AppShellEngine.displayName = 'AppShellEngine';

  return AppShellEngine;
}
