import { StyledView } from '../styles/styled-primitives';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useControllableState } from '../hooks/use-controllable-state';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { Backdrop, OverlayRoot } from '../overlay';
import { Portal } from '../portal';
import { Sidebar } from '../sidebar';
import { BREAKPOINTS } from '../styles/breakpoints';
import {
  WEB_OVERFLOW_CLIP,
  WEB_POSITION_FIXED,
  WEB_POSITION_STICKY,
  type WebCssStyle,
} from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
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
import { ScreenNavigationContext, type ScreenNavigationState } from '../screen/context';
import { AppShellRegionContext, type AppShellRegionValue } from '../layout/app-shell-region';
import { flexFill, resolveScrollMode, rootFrame, stickyRail, type ScrollMode } from './layout';
import type { AppShellEngineProps } from './types';
import { useShellWidth } from './use-shell-width';

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

const REVEAL_EASE = Easing.bezier(0.42, 0, 0.58, 1);
const REVEAL_MS = 325;
const REVEAL_OFFSET = 272;

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
    <ScrollView testID={testID} style={[flexFill, style]} contentContainerStyle={contentStyle}>
      {children}
    </ScrollView>
  );
}

/** A route Screen's own clearance beyond the occupied bottom edge (Screen's default). */
const PAGE_CLEARANCE = 16;

export function createAppShellEngine() {
  const AppShellComponent: React.FC<AppShellEngineProps> = ({
    variant = 'dashboard',
    safeArea = false,
    navigationAlign = 'edge',
    navigationGap,
    asideGap,
    sidebar,
    drawer = 'overlay',
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
    gutter: gutterProp,
    navFrom,
    navExpandedFrom,
    panels = false,
    framedFrom,
    topBar,
    topBarVisibility = 'compact',
    bottomBar,
    bottomBarVisibility = 'compact',
    reserveBottomBarSpace = true,
    floatingAction,
    floatingActionPlacement = 'end',
    overlay,
    drawerOpen,
    onDrawerOpenChange,
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
    const { height: viewportHeight } = useWindowDimensions();
    const [asideHeight, setAsideHeight] = useState(0);
    const { width, onLayout } = useShellWidth();
    const insets = useShellInsets();
    const ownsSafeArea = safeArea && Platform.OS !== 'web';
    const mode = resolveScrollMode(variant, scroll);
    const doc = mode === 'document';
    const fixed = mode === 'fixed';
    const small = width >= BREAKPOINTS.sm;

    // `dashboard` keeps the 12/16 pair it shipped with; one number drives both
    // for every other shape.
    const gutter = gutterProp ?? (variant === 'dashboard' ? D.dashboardGutter : D.gutter);
    const columnGap = variant === 'dashboard' ? D.dashboardColumnGap : gutter;
    // Historical reveal geometry stays the default; an explicit gutter owns
    // every frame edge, including the old extra top gap at wider breakpoints.
    const revealGutter = gutterProp ?? 12;
    const revealTopGutter = gutterProp ?? (small ? 24 : 12);

    // The nav: `navExpandedFrom` decides which sidebar variant is drawn, and the
    // variant decides how early it can sit in flow (a rail is narrow enough at
    // `sm`; the panel needs `lg`). `navFrom` overrides the tier outright.
    const navVariant = navExpandedFrom
      ? width >= breakpointPx(navExpandedFrom)
        ? ('panel' as const)
        : ('rail' as const)
      : sidebar?.variant;
    const navTier = navFrom ?? (navExpandedFrom || navVariant === 'rail' ? 'sm' : 'lg');
    const wide = width >= breakpointPx(navTier);
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
      panelHost &&
      (framedFrom !== undefined
        ? width >= breakpointPx(framedFrom)
        : hasNav
          ? navInFlow
          : width >= BREAKPOINTS.md);
    const compactRegion = panelHost && !framed;
    const flowSidebar = sidebar ? { ...sidebar, variant: navVariant } : undefined;
    // The drawer always opens the full panel, whatever the in-flow variant.
    const drawerSidebar = sidebar ? { ...sidebar, variant: 'panel' as const } : undefined;

    // A feed may reveal its navigation while compact; its desktop column layout
    // remains on the normal path below.
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
    const asideStacked = hasAside && !asideBeside && asideCollapse === 'stack' && !canvas;
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
        style={{ position: 'absolute', top: 0, insetInlineStart: 0, width, opacity: 0 }}
      >
        {asideContent}
      </View>
    );
    const asideShown = asideBeside && !asideEmpty;
    const stackedAside = asideStacked ? (
      asideEmpty ? (
        asideProbe('100%')
      ) : (
        <View testID={testID ? `${testID}-aside` : undefined}>{asideContent}</View>
      )
    ) : null;

    const reducedMotion = useReducedMotion();
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
    const drawerAvailable = hasNav && !wide;
    const isOpen = open && drawerAvailable;

    useEffect(() => {
      if (Platform.OS !== 'web' || !isOpen || drawerStyle !== 'reveal') return;
      const dismiss = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setOpen(false);
        }
      };
      document.addEventListener('keydown', dismiss);
      return () => document.removeEventListener('keydown', dismiss);
    }, [isOpen, drawerStyle, setOpen]);

    const revealAvailable = drawerStyle === 'reveal' && drawerAvailable;
    const feedRevealAvailable = variant === 'feed' && revealAvailable;
    const feedRevealed = feedRevealAvailable && isOpen;

    const shell = useMemo(
      () => ({
        drawerAvailable,
        drawerOpen: isOpen,
        openDrawer: () => setOpen(true),
        closeDrawer: () => setOpen(false),
        toggleDrawer: () => setOpen(!isOpen),
      }),
      [drawerAvailable, isOpen, setOpen],
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
      if (Platform.OS !== 'web' || typeof document === 'undefined') return;
      if (isOpen) {
        opener.current = document.activeElement as HTMLElement | null;
        return;
      }
      const previous = opener.current;
      opener.current = null;
      if (previous && typeof previous.focus === 'function' && document.contains(previous))
        previous.focus();
    }, [isOpen]);

    const background = theme.colors.background;

    // ---- pinned slots -------------------------------------------------------
    // `compact` is the phone case the slot exists for: the bar appears exactly
    // where the nav became a drawer.
    const barActive = (visibility: 'compact' | 'always') => visibility === 'always' || !navInFlow;
    const showTopBar = topBar != null && barActive(topBarVisibility);
    const showBottomBar = bottomBar != null && barActive(bottomBarVisibility);
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
        ? (reserveBottomBarSpace ? bottomEdge : 0) +
          (showFloatingAction ? floatingActionHeight + gutter : 0)
        : 0;
    // `scroll="page"` on native: each route's `ScreenScrollView` is the
    // scroller, so the shell pads nothing and hands the occupied bottom edge to
    // the routes' Screens instead — their content scrolls under the bar and its
    // last row still clears it.
    const pageNative = scroll === 'page' && mode === 'fixed' && Platform.OS !== 'web';
    const pageReserve = pageNative ? 0 : contentReserve;
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
        bottomInset: Math.max(
          inheritedNavigation?.bottomInset ?? PAGE_CLEARANCE,
          contentReserve + PAGE_CLEARANCE,
        ),
      }),
      [inheritedNavigation, pageProgress, pageTarget, pageScroller, contentReserve],
    );
    const pageChildren = pageNative ? (
      <ScreenNavigationContext.Provider value={pageNavigation}>
        {children}
      </ScreenNavigationContext.Provider>
    ) : (
      children
    );

    // ---- the panel region ---------------------------------------------------
    // Where the shell's gutter goes. A plain, content-aligned or a docked nav
    // runs the full height flush to the start edge, so the row keeps no top,
    // bottom or start padding and the region states its own; every other frame
    // pads the row. With `panels` the END side gets the same gutter in every
    // case — the edge that a content-aligned row once forgot — and a compact
    // region gets none on any side, whatever the mode.
    const contentAligned = navigationAlign === 'content' && centred;
    const plainFrame = contentAligned && flowSidebar?.surface === 'plain' && !showTopBar;
    const dockedNav = navInFlow && flowSidebar?.surface === 'docked';
    const navFlush = navInFlow && (dockedNav || plainFrame);
    const regionOuter = framed || (navInFlow && !navFlush) ? gutter : 0;
    const externalTopHeight = showTopBar ? topBarHeight : 0;
    // The reveal drawer insets the sliding page by 12 while it is open.
    const regionInset = feedRevealed ? 12 : regionOuter;
    const regionFlow: AppShellRegionValue['flow'] =
      mode === 'document' ? 'document' : mode === 'container' ? 'container' : 'bounded';
    const region = useMemo<AppShellRegionValue>(
      () => ({
        flow: regionFlow,
        framed,
        gutter,
        viewportInset: { top: externalTopHeight + regionInset, bottom: regionInset },
        // A bounded panel's content owns its edge (`useBottomEdgeInset`); a
        // growing one reserves the bar under its last row.
        bottomReserve: mode === 'fixed' ? 0 : contentReserve,
        revealed: feedRevealed,
        maskColor: background,
      }),
      [
        regionFlow,
        framed,
        gutter,
        externalTopHeight,
        regionInset,
        mode,
        contentReserve,
        feedRevealed,
        background,
      ],
    );
    const regionChildren = panelHost ? (
      <AppShellRegionContext.Provider value={region}>{pageChildren}</AppShellRegionContext.Provider>
    ) : (
      pageChildren
    );

    const bars = (
      <SurfaceLevelProvider
        level={compactRegion ? 1 : 0}
        fill={compactRegion ? theme.colors.card : background}
      >
        {showBottomBar ? (
          <AppShellBottomBar
            doc={doc && !revealAvailable}
            onHeightChange={setBottomBarHeight}
            testID={testID ? `${testID}-bottom-bar` : undefined}
          >
            {bottomBar}
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

    const topBarNode = showTopBar ? (
      <AppShellTopBar
        insetTop={ownsSafeArea ? 0 : undefined}
        doc={doc}
        onHeightChange={setTopBarHeight}
        testID={testID ? `${testID}-top-bar` : undefined}
      >
        {topBar}
      </AppShellTopBar>
    ) : null;

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
    const headerNode =
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
        <View
          testID={testID ? `${testID}-aside` : undefined}
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
          ]}
        >
          {doc ? (
            asideContent
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {asideContent}
            </ScrollView>
          )}
        </View>
      ) : null;

    const frame = rootFrame(mode);

    // ---- the reveal drawer (dashboard's whole-page slide) -------------------
    const reveal = useSharedValue(isOpen ? 1 : 0);
    useEffect(() => {
      const target = isOpen && drawerStyle === 'reveal' ? 1 : 0;
      reveal.value = reducedMotion
        ? target
        : withTiming(target, { duration: REVEAL_MS, easing: REVEAL_EASE });
    }, [isOpen, drawerStyle, reducedMotion, reveal]);
    const feedPageStyle = useAnimatedStyle(
      () => ({
        transform:
          reveal.value === 0 ? [] : [{ translateX: dir * (REVEAL_OFFSET + 12) * reveal.value }],
      }),
      [reveal, dir],
    );

    const feedChromeTransition: WebCssStyle =
      Platform.OS === 'web'
        ? { '--bloom-panel-inset-duration': reducedMotion ? '0ms' : `${REVEAL_MS}ms` }
        : {};
    const feedInsetsStyle = useAnimatedStyle(
      () => ({
        paddingTop: 12 * reveal.value,
        paddingBottom: 12 * reveal.value,
      }),
      [reveal],
    );
    const feedBarsStyle = useAnimatedStyle(
      () => ({
        top: 12 * reveal.value,
        bottom: 12 * reveal.value,
        borderRadius: 28 * reveal.value,
      }),
      [reveal],
    );

    const railStyle = useAnimatedStyle(
      () => ({ opacity: reveal.value, transform: [{ scale: 0.94 + 0.06 * reveal.value }] }),
      [reveal],
    );
    const pageStyle = useAnimatedStyle(
      () => ({
        transform: reveal.value === 0 ? [] : [{ translateX: dir * REVEAL_OFFSET * reveal.value }],
        borderRadius: 32 * reveal.value,
      }),
      [reveal, dir],
    );
    const veilStyle = useAnimatedStyle(() => ({ opacity: reveal.value }), [reveal]);

    if (drawerStyle === 'reveal' && variant === 'dashboard') {
      return safeFrame(
        <AppShellProvider value={shell}>
          <View
            {...dirProps}
            testID={testID}
            onLayout={onLayout}
            style={[
              frame,
              doc ? { overflow: WEB_OVERFLOW_CLIP } : null,
              { flexDirection: 'row', backgroundColor: background },
              style,
            ]}
          >
            {navInFlow && flowSidebar ? (
              <View
                style={[
                  flowSidebar.surface === 'docked'
                    ? { flexShrink: 0 }
                    : {
                        paddingTop: revealGutter,
                        paddingBottom: revealGutter,
                        paddingInlineStart: revealGutter,
                        flexShrink: 0,
                      },
                  doc ? stickyRail(0) : null,
                ]}
              >
                {safeNavigation(<Sidebar {...flowSidebar} />)}
              </View>
            ) : null}
            {drawerAvailable && drawerSidebar ? (
              <View
                testID={testID ? `${testID}-navigation-drawer` : undefined}
                aria-hidden={!isOpen}
                pointerEvents={isOpen ? 'auto' : 'none'}
                // Fixed on web in document mode: the rail waits beneath the VIEWPORT,
                // wherever the page is scrolled to.
                style={{
                  position: doc ? WEB_POSITION_FIXED : 'absolute',
                  top: 0,
                  bottom: 0,
                  insetInlineStart: 0,
                  width: 272,
                  paddingTop: revealGutter,
                  paddingBottom: revealGutter + navigationBottomInset,
                  paddingInlineStart: revealGutter / 2,
                }}
              >
                <Animated.View
                  style={[{ height: '100%', width: 260, transformOrigin: railOrigin }, railStyle]}
                >
                  <Sidebar
                    {...drawerSidebar}
                    mobile
                    surface="plain"
                    onClose={() => setOpen(false)}
                  />
                </Animated.View>
              </View>
            ) : null}
            <Animated.View
              style={[
                {
                  flex: 1,
                  minWidth: 0,
                  flexDirection: 'row',
                  overflow: doc ? WEB_OVERFLOW_CLIP : 'hidden',
                  backgroundColor: background,
                },
                wide ? null : pageStyle,
              ]}
            >
              {/*
              Basis 0 and shrink 1: with only `flexGrow` the column's basis is its
              content's max-content width (react-native-web defaults `flexShrink`
              to 0), so one long unwrapped line of text pushed the page past a
              phone's edge in document mode.
            */}
              <Scroller
                mode={mode}
                testID={testID ? `${testID}-page` : undefined}
                style={{ ...flexFill, minWidth: 0 }}
                // `padding: 12` is a SHORTHAND, and react-native-web ranks its CSS
                // shorthand against `padding-bottom` by sheet order rather than by
                // the array's — so the reserve is spelled in longhands instead of
                // layered over the shorthand, and only when there is one.
                contentStyle={
                  panelHost
                    ? {
                        paddingLeft: regionOuter,
                        paddingRight: regionOuter,
                        paddingTop: regionOuter,
                        paddingBottom: regionOuter,
                      }
                    : pageReserve
                      ? {
                          paddingLeft: revealGutter,
                          paddingRight: revealGutter,
                          paddingTop: revealTopGutter,
                          paddingBottom: revealGutter + pageReserve,
                        }
                      : { padding: revealGutter, paddingTop: revealTopGutter }
                }
              >
                {column}
              </Scroller>
              {asideColumn(
                panelHost
                  ? {
                      paddingTop: regionOuter,
                      paddingBottom: regionOuter,
                      paddingInlineEnd: regionOuter,
                    }
                  : {
                      paddingTop: revealTopGutter,
                      paddingBottom: revealGutter,
                      paddingInlineEnd: revealGutter,
                    },
              )}
              {!wide ? (
                <Animated.View
                  pointerEvents={isOpen ? 'auto' : 'none'}
                  style={[
                    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
                    veilStyle,
                  ]}
                >
                  <Pressable
                    role="button"
                    accessibilityLabel={drawerCloseLabel}
                    focusable={isOpen}
                    onPress={() => setOpen(false)}
                    style={{
                      flex: 1,
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.1)',
                    }}
                    testID={testID ? `${testID}-veil` : undefined}
                  />
                </Animated.View>
              ) : null}
            </Animated.View>
            {overlay}
            {drawerAvailable ? (
              <Animated.View
                testID={testID ? `${testID}-reveal-bars` : undefined}
                pointerEvents={isOpen ? 'none' : 'box-none'}
                style={[
                  {
                    position: doc ? WEB_POSITION_FIXED : 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    overflow: 'hidden',
                  },
                  pageStyle,
                ]}
              >
                {bars}
              </Animated.View>
            ) : (
              bars
            )}
          </View>
        </AppShellProvider>,
      );
    }

    // ---- the page region, per variant ---------------------------------------
    /** `feed` / `focus`: a fixed reading column, centred in what the nav leaves. */
    const readingGap = Math.max(0, asideGap ?? columnGap);
    const readingGroupWidth = contentWidth + (asideShown ? asideWidth + readingGap : 0);
    // The region's own vertical gutter, when the row gives it none (a flush nav).
    // A property of the NAVIGATION, not of who scrolls: native resolves every
    // shell to container scroll, and gating this on `document` left native
    // phones with an 8px frame around the reading column that the same layout
    // on the web does not draw.
    const bodyInset = panelHost
      ? navFlush
        ? { paddingTop: regionOuter, paddingBottom: regionOuter }
        : {}
      : plainFrame
        ? { paddingTop: gutter, paddingBottom: gutter }
        : {};
    const centredBody = (
      <View
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
                  flexGrow: compactRegion ? 1 : 0,
                  flexBasis: compactRegion ? 'auto' : readingGroupWidth,
                  maxWidth: compactRegion ? undefined : readingGroupWidth,
                }
              : {}),
            ...bodyInset,
          },
          fill,
        ]}
      >
        <View
          testID={testID ? `${testID}-content` : undefined}
          style={[
            // `flexBasis` is the reading width and `flexShrink: 1` is what keeps a
            // 600px column inside a 360px phone — a `width` would overflow.
            {
              flexGrow: compactRegion ? 1 : 0,
              flexShrink: 1,
              flexBasis: compactRegion ? 'auto' : contentWidth,
              maxWidth: compactRegion ? undefined : contentWidth,
              minWidth: 0,
            },
            doc ? null : { alignSelf: 'stretch' },
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
        </View>
        {asideColumn({})}
      </View>
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
          style={{ flex: 1, minWidth: 0, minHeight: 0, backgroundColor: background }}
        >
          {headerNode}
          <View style={{ flex: 1, minHeight: 0, minWidth: 0 }}>{pageChildren}</View>
        </View>
        {asideColumn(
          canvas ? { paddingTop: gutter, paddingBottom: gutter, paddingInlineEnd: gutter } : {},
        )}
      </>
    );

    const body = canvas ? canvasBody : centred ? centredBody : dashboardBody;

    // A DOCKED nav is flush to the window: it takes the shell's whole height and
    // its own hairline is the separator, so the shell gives up its start and
    // vertical padding around that column rather than framing it like a card
    // (`dockedNav`, above).
    const navRegion =
      navInFlow && flowSidebar ? (
        doc ? (
          <View
            testID={testID ? `${testID}-navigation` : undefined}
            style={stickyRail(dockedNav || plainFrame ? 0 : gutter)}
          >
            {safeNavigation(<Sidebar {...flowSidebar} />)}
          </View>
        ) : canvas && !dockedNav ? (
          // The canvas row has no padding of its own, so the nav states its.
          <View
            style={{
              paddingTop: gutter,
              paddingBottom: gutter,
              paddingInlineStart: gutter,
              flexShrink: 0,
            }}
          >
            {safeNavigation(<Sidebar {...flowSidebar} />)}
          </View>
        ) : (
          safeNavigation(<Sidebar {...flowSidebar} />)
        )
      ) : null;

    const drawerRegion =
      drawerAvailable && isOpen && drawerSidebar ? (
        <Portal>
          <OverlayRoot>
            <Backdrop
              onPress={() => setOpen(false)}
              blurIntensity={0}
              dimOpacity={0.4}
              accessibilityLabel={drawerCloseLabel}
            />
            <View
              {...dirProps}
              pointerEvents="box-none"
              testID={testID ? `${testID}-navigation-drawer` : undefined}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                insetInlineStart: 0,
                flexDirection: 'row',
                ...(ownsSafeArea
                  ? {
                      paddingTop: 12 + insets.top,
                      paddingBottom: 12 + insets.bottom,
                      paddingInlineStart: 12 + (rtl ? insets.right : insets.left),
                      paddingInlineEnd: 12 + (rtl ? insets.left : insets.right),
                    }
                  : { padding: 12 }),
              }}
            >
              <View pointerEvents="auto" style={{ height: '100%' }}>
                <Sidebar {...drawerSidebar} mobile onClose={() => setOpen(false)} />
              </View>
            </View>
          </OverlayRoot>
        </Portal>
      ) : null;

    const rowStyle: WebCssStyle = {
      flexDirection: 'row',
      ...(contentAligned ? { justifyContent: 'center' } : {}),
      gap: canvas
        ? 0
        : dockedNav
          ? // Panels keep their gutter off a docked nav's hairline.
            panelHost
            ? regionOuter
            : 0
          : Math.max(0, navigationGap ?? columnGap),
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
              paddingInlineEnd: regionOuter,
            }
          : { padding: regionOuter }
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

    if (variant === 'feed' && drawerStyle === 'reveal' && drawerAvailable) {
      return safeFrame(
        <AppShellProvider value={shell}>
          <View
            {...dirProps}
            testID={testID}
            onLayout={onLayout}
            style={[
              frame,
              { overflow: doc ? WEB_OVERFLOW_CLIP : 'hidden', backgroundColor: background },
              style,
            ]}
          >
            <View
              testID={testID ? `${testID}-navigation-drawer` : undefined}
              aria-hidden={!isOpen}
              pointerEvents={isOpen ? 'auto' : 'none'}
              style={{
                position: doc ? WEB_POSITION_FIXED : 'absolute',
                top: 0,
                bottom: 0,
                insetInlineStart: 0,
                width: 272,
                paddingTop: revealGutter,
                paddingBottom: revealGutter + navigationBottomInset,
                paddingInlineStart: revealGutter / 2,
              }}
            >
              <Animated.View
                style={[{ height: '100%', width: 260, transformOrigin: railOrigin }, railStyle]}
              >
                {drawerSidebar && (
                  <Sidebar
                    {...drawerSidebar}
                    mobile
                    surface="plain"
                    onClose={() => setOpen(false)}
                  />
                )}
              </Animated.View>
            </View>
            <Animated.View
              testID={testID ? `${testID}-reveal-page` : undefined}
              style={[
                {
                  flexGrow: 1,
                  minWidth: 0,
                  overflow: doc ? WEB_OVERFLOW_CLIP : 'hidden',
                  backgroundColor: background,
                },
                feedChromeTransition,
                feedPageStyle,
                feedInsetsStyle,
              ]}
            >
              {topBarNode}
              <StyledView className={doc ? undefined : 'flex-1 min-h-0'}>
                <View style={[rowStyle, { flexGrow: 1, minWidth: 0 }]}>{body}</View>
              </StyledView>
              <Animated.View
                pointerEvents={isOpen ? 'auto' : 'none'}
                style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, veilStyle]}
              >
                <Pressable
                  role="button"
                  accessibilityLabel={drawerCloseLabel}
                  focusable={isOpen}
                  onPress={() => setOpen(false)}
                  testID={testID ? `${testID}-veil` : undefined}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </Animated.View>
            <Animated.View
              pointerEvents={isOpen ? 'none' : 'box-none'}
              testID={testID ? `${testID}-reveal-bars` : undefined}
              style={[
                {
                  position: doc ? WEB_POSITION_FIXED : 'absolute',
                  left: 0,
                  right: 0,
                  overflow: 'hidden',
                },
                feedPageStyle,
                feedBarsStyle,
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
          </View>
        </AppShellProvider>,
      );
    }

    // The top bar is a SIBLING above the columns, so it spans the shell edge to
    // edge without escaping the frame's padding. Without one the root stays the
    // row it has always been, so nothing about an existing shell moves.
    if (topBarNode) {
      return safeFrame(
        <AppShellProvider value={shell}>
          <View
            {...dirProps}
            testID={testID}
            onLayout={onLayout}
            style={[frame, { flexDirection: 'column', backgroundColor: background }, style]}
          >
            {topBarNode}
            <View style={[rowStyle, { flexGrow: 1, flexShrink: 1, minHeight: 0 }]}>
              {navRegion}
              {drawerRegion}
              {body}
            </View>
            {overlay}
            {bars}
          </View>
        </AppShellProvider>,
      );
    }

    return safeFrame(
      <AppShellProvider value={shell}>
        <View {...dirProps} testID={testID} onLayout={onLayout} style={[frame, rowStyle, style]}>
          {navRegion}
          {drawerRegion}
          {body}
          {overlay}
          {bars}
        </View>
      </AppShellProvider>,
    );
  };

  const AppShellEngine = memo(AppShellComponent);
  AppShellEngine.displayName = 'AppShellEngine';

  return AppShellEngine;
}
