import { StyledView } from '../styles/styled-primitives';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { ContentPanelProps } from '../content-panel/types';
import type { BloomColorScopeProps } from '../theme/color-scope/ColorScope';
import { useControllableState } from '../hooks/use-controllable-state';
import { Backdrop, OverlayRoot } from '../overlay';
import { Portal } from '../portal';
import { Sidebar } from '../sidebar';
import { BREAKPOINTS } from '../styles/breakpoints';
import { webViewportHeightMinus, WEB_OVERFLOW_CLIP, WEB_POSITION_FIXED, WEB_POSITION_STICKY, type WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { AppShellBottomBar, AppShellFloatingAction, AppShellTopBar, useShellInsets } from './AppShellBars';
import { AppShellHeader } from './AppShellHeader';
import { AppShellSplitPanes } from './AppShellSplit';
import { APP_SHELL_DEFAULTS as D, breakpointPx } from './constants';
import { AppShellProvider } from './context';
import { resolveScrollMode, rootFrame, stickyRail, type ScrollMode } from './layout';
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
 *              by `gutter`, `reveal` sits the rail 12 from the top-left
 *   page       `dashboard` one fluid column capped at `contentMaxWidth`;
 *              `feed`/`focus` a `contentWidth` reading column centred in what
 *              the nav leaves; `split` a column of header over three panes
 *   aside      optional right column, `asideWidth` (320) wide from `asideFrom`
 *              (xl), pinned like the rail; below it stacked after the content
 *   slots      `topBar` above the columns, `bottomBar` pinned to the bottom
 *              with the safe-area inset, `floatingAction` above that bar —
 *              each measured, so the content reserves exactly their height
 *   below nav  the header grows a hamburger (also with no title — see
 *              `useAppShell` / `AppShellMenuButton`). `overlay` opens the rail
 *              as a drawer (12 inset) over a 40% black backdrop; `reveal`
 *              slides the page 272 right and rounds it to 32 while the rail,
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
  if (mode === 'document') return <View testID={testID} style={[style, contentStyle]}>{children}</View>;
  if (mode === 'fixed') {
    return <View testID={testID} style={[{ flex: 1, minHeight: 0 }, style, contentStyle]}>{children}</View>;
  }
  return (
    <ScrollView testID={testID} style={[{ flex: 1 }, style]} contentContainerStyle={contentStyle}>
      {children}
    </ScrollView>
  );
}

export function createAppShellEngine(
  ContentPanel: React.ComponentType<ContentPanelProps>,
  BloomColorScope: React.ComponentType<Pick<BloomColorScopeProps, 'colorPreset' | 'asChild' | 'children'>>,
) {
const AppShellComponent: React.FC<AppShellEngineProps> = ({
  variant = 'dashboard',
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
  panel = false,
  panelColorPreset,
  framedFrom,
  list,
  info,
  pane = 'list',
  listWidth = D.listWidth,
  listMinWidth = D.listMinWidth,
  listMaxWidth = D.listMaxWidth,
  onListWidthChange,
  infoWidth = D.infoWidth,
  splitFrom = D.splitFrom,
  infoFrom = D.infoFrom,
  resizable = true,
  resizeLabel = 'Resize panes',
  paneScroll = true,
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
  scroll = 'document',
  style,
  testID,
}) => {
  const theme = useTheme();
  const { height: viewportHeight } = useWindowDimensions();
  const [asideHeight, setAsideHeight] = useState(0);
  const { width, onLayout } = useShellWidth();
  const insets = useShellInsets();
  const mode = resolveScrollMode(variant, scroll);
  const doc = mode === 'document';
  const fixed = mode === 'fixed';
  const small = width >= BREAKPOINTS.sm;

  // `dashboard` keeps the 12/16 pair it shipped with; one number drives both
  // for every other shape.
  const gutter = gutterProp ?? (variant === 'dashboard' ? D.dashboardGutter : D.gutter);
  const columnGap = variant === 'dashboard' ? D.dashboardColumnGap : gutter;

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
  // One responsive owner: a shell panel follows its in-flow navigation unless
  // the caller explicitly requests an independent framing breakpoint.
  const managedPanel = panel === true && hasNav && framedFrom === undefined;
  const compactPanel = managedPanel && !navInFlow;
  const panelFramed = managedPanel ? navInFlow : undefined;
  const flowSidebar = sidebar ? { ...sidebar, variant: navVariant } : undefined;
  // The drawer always opens the full panel, whatever the in-flow variant.
  const drawerSidebar = sidebar ? { ...sidebar, variant: 'panel' as const } : undefined;

  // A feed may reveal its navigation while compact; its desktop column layout
  // remains on the normal path below.
  const drawerStyle = variant === 'dashboard' || variant === 'feed' ? drawer : 'overlay';
  const centred = variant === 'feed' || variant === 'focus';
  const canvas = variant === 'canvas';
  // `focus` is a single column by definition and `split` has its `info` pane
  // instead, so neither takes an aside in EITHER position — beside or stacked.
  const hasAside = aside != null && variant !== 'focus' && variant !== 'split';
  const asideBeside = hasAside && width >= breakpointPx(asideFrom);
  // A canvas has no scrolling column to stack an aside into — the screen IS the
  // canvas — so below `asideFrom` the aside is dropped whatever `asideCollapse`
  // says, rather than being rendered where nothing can reach it.
  const asideStacked = hasAside && !asideBeside && asideCollapse === 'stack' && !canvas;

  const reducedMotion = useReducedMotion();
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
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
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
    if (previous && typeof previous.focus === 'function' && document.contains(previous)) previous.focus();
  }, [isOpen]);

  const background = theme.colors.background;

  // ---- pinned slots -------------------------------------------------------
  // `compact` is the phone case the slot exists for: the bar appears exactly
  // where the nav became a drawer.
  const barActive = (visibility: 'compact' | 'always') => visibility === 'always' || !navInFlow;
  const showTopBar = topBar != null && barActive(topBarVisibility);
  const showBottomBar = bottomBar != null && barActive(bottomBarVisibility);
  const showFloatingAction = floatingAction != null;
  const [topBarHeight, setTopBarHeight] = useState(0);
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  const [floatingActionHeight, setFloatingActionHeight] = useState(0);
  // Both slots are MEASURED rather than assumed: a bar's height is its
  // content's, and a guess is what leaves the last row of a feed under it.
  const bottomEdge = showBottomBar ? bottomBarHeight : insets.bottom;
  const contentReserve =
    showBottomBar || showFloatingAction
      ? (reserveBottomBarSpace ? bottomEdge : 0) + (showFloatingAction ? floatingActionHeight + gutter : 0)
      : 0;

  const bars = (
    <SurfaceLevelProvider level={compactPanel ? 1 : 0} fill={compactPanel ? theme.colors.card : background}>
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
    <AppShellTopBar doc={doc} onHeightChange={setTopBarHeight} testID={testID ? `${testID}-top-bar` : undefined}>
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
    header !== undefined
      ? header
      : title != null || breadcrumb != null || actions != null || menuInHeader ? (
        <AppShellHeader
          title={title}
          breadcrumb={breadcrumb}
          actions={actions}
          menuOpen={isOpen}
          showMenu={menuInHeader}
          onMenuPress={menuInHeader ? shell.toggleDrawer : undefined}
          testID={testID ? `${testID}-header` : undefined}
        />
      ) : null;

  const fill = fixed ? { flex: 1, minHeight: 0 } : null;
  const column = (
    <View style={[{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 10 }, fill]}>
      {headerNode}
      <View
        style={[
          { width: '100%', gap: 16, paddingBottom: drawer === 'overlay' ? 16 : 0 },
          fill,
        ]}
      >
        {children}
        {asideStacked ? <View testID={testID ? `${testID}-aside` : undefined}>{aside}</View> : null}
      </View>
    </View>
  );

  // Document asides grow naturally. A tall aside first travels with the page
  // until its bottom is visible, then sticks; wheel events keep scrolling the
  // document rather than getting trapped in a second scroll container.
  const asideColumn = (inset: WebCssStyle) =>
    asideBeside ? (
      <View
        testID={testID ? `${testID}-aside` : undefined}
        onLayout={event => setAsideHeight(event.nativeEvent.layout.height)}
        style={[
          { width: asideWidth, flexShrink: 0 },
          doc ? { position: WEB_POSITION_STICKY, top: Math.min(gutter, viewportHeight - asideHeight - gutter), alignSelf: 'flex-start' } : { alignSelf: 'stretch' },
          inset,
        ]}
      >
        {doc ? aside : <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {aside}
        </ScrollView>}
      </View>
    ) : null;

  const frame = rootFrame(mode);

  // ---- the reveal drawer (dashboard's whole-page slide) -------------------
  const reveal = useSharedValue(isOpen ? 1 : 0);
  useEffect(() => {
    const target = isOpen && drawerStyle === 'reveal' ? 1 : 0;
    reveal.value = reducedMotion ? target : withTiming(target, { duration: REVEAL_MS, easing: REVEAL_EASE });
  }, [isOpen, drawerStyle, reducedMotion, reveal]);
  const feedPageStyle = useAnimatedStyle(() => ({
    transform: reveal.value === 0 ? [] : [{ translateX: (REVEAL_OFFSET + 12) * reveal.value }],
  }), [reveal]);

  const feedChromeTransition: WebCssStyle = Platform.OS === 'web'
    ? { '--bloom-panel-inset-duration': reducedMotion ? '0ms' : `${REVEAL_MS}ms` } : {};
  const feedInsetsStyle = useAnimatedStyle(() => ({
    paddingTop: 12 * reveal.value,
    paddingBottom: 12 * reveal.value,
  }), [reveal]);
  const feedBarsStyle = useAnimatedStyle(() => ({
    top: 12 * reveal.value,
    bottom: 12 * reveal.value,
    borderRadius: 28 * reveal.value,
  }), [reveal]);

  const railStyle = useAnimatedStyle(
    () => ({ opacity: reveal.value, transform: [{ scale: 0.94 + 0.06 * reveal.value }] }),
    [reveal],
  );
  const pageStyle = useAnimatedStyle(
    () => ({ transform: reveal.value === 0 ? [] : [{ translateX: REVEAL_OFFSET * reveal.value }], borderRadius: 32 * reveal.value }),
    [reveal],
  );
  const veilStyle = useAnimatedStyle(() => ({ opacity: reveal.value }), [reveal]);

  if (drawerStyle === 'reveal' && variant === 'dashboard') {
    return (
      <AppShellProvider value={shell}>
        <View
          testID={testID}
          onLayout={onLayout}
          style={[frame, doc ? { overflow: WEB_OVERFLOW_CLIP } : null, { flexDirection: 'row', backgroundColor: background }, style]}
        >
          {navInFlow && flowSidebar ? (
            <View
              style={[
                flowSidebar.surface === 'docked'
                  ? { flexShrink: 0 }
                  : { paddingTop: 12, paddingBottom: 12, paddingLeft: 12, flexShrink: 0 },
                doc ? stickyRail(0) : null,
              ]}
            >
              <Sidebar {...flowSidebar} />
            </View>
          ) : null}
          {drawerAvailable && drawerSidebar ? (
            <View
              aria-hidden={!isOpen}
              pointerEvents={isOpen ? 'auto' : 'none'}
              // Fixed on web in document mode: the rail waits beneath the VIEWPORT,
              // wherever the page is scrolled to.
              style={{ position: doc ? WEB_POSITION_FIXED : 'absolute', top: 0, bottom: 0, left: 0, width: 272, paddingTop: 12, paddingBottom: 12, paddingLeft: 6 }}
            >
              <Animated.View style={[{ height: '100%', width: 260, transformOrigin: 'left center' }, railStyle]}>
                <Sidebar {...drawerSidebar} mobile surface="plain" onClose={() => setOpen(false)} />
              </Animated.View>
            </View>
          ) : null}
          <Animated.View
            style={[
              { flex: 1, minWidth: 0, flexDirection: 'row', overflow: doc ? WEB_OVERFLOW_CLIP : 'hidden', backgroundColor: background },
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
              style={{ flex: doc ? undefined : 1, flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }}
              // `padding: 12` is a SHORTHAND, and react-native-web ranks its CSS
              // shorthand against `padding-bottom` by sheet order rather than by
              // the array's — so the reserve is spelled in longhands instead of
              // layered over the shorthand, and only when there is one.
              contentStyle={
                contentReserve
                  ? { paddingLeft: 12, paddingRight: 12, paddingTop: small ? 24 : 12, paddingBottom: 12 + contentReserve }
                  : { padding: 12, paddingTop: small ? 24 : 12 }
              }
            >
              {column}
            </Scroller>
            {asideColumn({ paddingTop: small ? 24 : 12, paddingBottom: 12, paddingRight: 12 })}
            {!wide ? (
              <Animated.View
                pointerEvents={isOpen ? 'auto' : 'none'}
                style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, veilStyle]}
              >
                <Pressable
                  role="button"
                  accessibilityLabel="Close navigation"
                  focusable={isOpen}
                  onPress={() => setOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
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
              style={[{ position: doc ? WEB_POSITION_FIXED : 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }, pageStyle]}
            >
              {bars}
            </Animated.View>
          ) : bars}
        </View>
      </AppShellProvider>
    );
  }

  // A `panel` only FILLS when the shell was ASKED to bound it — `fixed` or
  // `container`. With document scroll the page itself is the scroller and there
  // is no height to fill, so the panel keeps growing with its content (and the
  // frame is its own box, which is what stops it drifting under scroll).
  //
  // The test is the PROP, not the resolved mode: native resolves `document` to
  // `container` because it has no document, and a page that asked for document
  // scroll still wants its header to travel with the content there.
  const panelFills = panel === true && scroll !== 'document' && mode !== 'document';

  // ---- the page region, per variant ---------------------------------------
  /** `feed` / `focus`: a fixed reading column, centred in what the nav leaves. */
  const contentAligned = navigationAlign === 'content' && centred;
  // Plain navigation belongs to the viewport; only the reading surfaces are inset.
  const documentPanelInset = feedRevealed ? 12 : compactPanel ? 0 : gutter;
  const externalTopHeight = showTopBar ? topBarHeight : 0;
  const plainDocumentFrame = doc && contentAligned && flowSidebar?.surface === 'plain' && !topBarNode;
  const readingGap = Math.max(0, asideGap ?? columnGap);
  const readingGroupWidth = contentWidth + (asideBeside ? asideWidth + readingGap : 0);
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
          ...(contentAligned ? { flexGrow: compactPanel ? 1 : 0, flexBasis: compactPanel ? 'auto' : readingGroupWidth, maxWidth: compactPanel ? undefined : readingGroupWidth } : {}),
          ...(plainDocumentFrame ? { paddingTop: compactPanel ? 0 : gutter, paddingBottom: compactPanel ? 0 : gutter } : {}),
        },
        fill,
      ]}
    >
      <View
        testID={testID ? `${testID}-content` : undefined}
        style={[
          // `flexBasis` is the reading width and `flexShrink: 1` is what keeps a
          // 600px column inside a 360px phone — a `width` would overflow.
          { flexGrow: compactPanel ? 1 : 0, flexShrink: 1, flexBasis: compactPanel ? 'auto' : contentWidth, maxWidth: compactPanel ? undefined : contentWidth, minWidth: 0 },
          doc ? null : { alignSelf: 'stretch' },
        ]}
      >
        {panelFills ? (
          // A bounded panel fills the screen. Container mode scrolls its body;
          // fixed mode leaves scrolling to the child navigator/list.
          <BloomColorScope colorPreset={panelColorPreset} asChild>
          <ContentPanel
            maskColor={background}
            framed={panelFramed}
            framedFrom={framedFrom}
            fill
            // The panel's box already IS the visible area here, so the frame is
            // that box — no viewport maths, nothing to line up.
            overlaySizing="panel"
            surfaceStyle={{ flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minHeight: 0 }}
            contentStyle={{ flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minHeight: 0 }}
          >
            <View style={{ flex: 1, minHeight: 0 }}>
              {headerNode}
              <Scroller
                mode={mode}
                testID={testID ? `${testID}-page` : undefined}
                style={{ flex: 1, minHeight: 0 }}
                // A fixed page owns its list and edge clearance. Padding its
                // navigator here would charge the same occupied edge twice.
                contentStyle={mode === 'fixed' ? {} : { paddingBottom: contentReserve }}
              >
                {children}
              </Scroller>
            </View>
          </ContentPanel>
          </BloomColorScope>
        ) : (
        <Scroller
          mode={mode}
          testID={testID ? `${testID}-page` : undefined}
          style={{}}
          contentStyle={{ paddingBottom: panel ? 0 : contentReserve }}
        >
          <BloomColorScope colorPreset={panelColorPreset} asChild>
          {panel ? (
            <ContentPanel
            maskColor={background}
              framed={feedRevealed || panelFramed}
              chrome={feedRevealed ? "none" : undefined}
              framedFrom={framedFrom}
              // The sticky frame is pinned at the shell's OWN gutter, which is
              // exactly where the panel starts. Left at the 8px default it
              // would sit 8px above the panel's real top edge and snap down on
              // the first scroll — the panel appearing to breathe.
              overlayInset={{ top: externalTopHeight + documentPanelInset, bottom: documentPanelInset }}
              // The panel's own `flex-1` (basis 0) would collapse to nothing in
              // a document-flow column, which has no free space to distribute.
              surfaceStyle={{ flexGrow: 1, flexShrink: 1, flexBasis: 'auto',
                // The viewport frame must have a painted surface even when the
                // page is short. A minimum still lets long documents grow.
                minHeight: webViewportHeightMinus(externalTopHeight + documentPanelInset * 2) }}
              contentStyle={{ flexGrow: 1, flexShrink: 1, flexBasis: 'auto' }}
            >
              {/* Header chrome spans the panel. Its own title/action insets
                  belong to PageHeader; the screen owns all body padding. */}
              {headerNode}
              <View style={[{ paddingBottom: contentReserve }, fill]}>
                {children}
              </View>
              {feedRevealed && <StyledView pointerEvents="none" className="absolute inset-0 z-20"
                style={{ backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)' }} />}
            </ContentPanel>
          ) : (
            <View style={[{ gap: 16 }, fill]}>
              {headerNode}
              {children}
            </View>
          )}
          </BloomColorScope>
          {asideStacked ? <View testID={testID ? `${testID}-aside` : undefined}>{aside}</View> : null}
        </Scroller>
        )}
      </View>
      {asideColumn({})}
    </View>
  );

  const splitWide = width >= breakpointPx(splitFrom);
  // Below the breakpoint exactly one pane renders — the one `pane` names, or
  // the detail pane when that one was never given any content.
  const solePane = (pane === 'list' && list == null) || (pane === 'info' && info == null) ? 'detail' : pane;
  const splitBody = (
    <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, minHeight: 0 }}>
      {headerNode ? <View style={{ paddingBottom: gutter }}>{headerNode}</View> : null}
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1,
          minHeight: 0,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          overflow: 'hidden',
        }}
      >
        <AppShellSplitPanes
          list={list}
          detail={children}
          info={info}
          showList={splitWide ? list != null : solePane === 'list'}
          showDetail={splitWide ? true : solePane === 'detail'}
          showInfo={splitWide ? info != null && width >= breakpointPx(infoFrom) : solePane === 'info'}
          listWidth={listWidth}
          listMinWidth={listMinWidth}
          listMaxWidth={listMaxWidth}
          onListWidthChange={onListWidthChange}
          infoWidth={infoWidth}
          resizable={resizable}
          paneScroll={paneScroll}
          resizeLabel={resizeLabel}
          testID={testID}
        />
      </View>
    </View>
  );

  const dashboardBody = (
    <>
      <Scroller
        mode={mode}
        testID={testID ? `${testID}-page` : undefined}
        style={{ flex: 1, minWidth: 0, backgroundColor: background }}
        contentStyle={{ paddingTop: small ? 12 : 0, paddingBottom: contentReserve }}
      >
        {column}
      </Scroller>
      {asideColumn({})}
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
        <View style={{ flex: 1, minHeight: 0, minWidth: 0 }}>{children}</View>
      </View>
      {asideColumn(canvas ? { padding: gutter, paddingLeft: 0 } : {})}
    </>
  );

  const body =
    variant === 'split'
      ? splitBody
      : canvas
        ? canvasBody
        : centred
          ? centredBody
          : dashboardBody;

  // A DOCKED nav is flush to the window: it takes the shell's whole height and
  // its own hairline is the separator, so the shell gives up its left and
  // vertical padding around that column rather than framing it like a card.
  const dockedNav = navInFlow && flowSidebar?.surface === 'docked';
  const navRegion =
    navInFlow && flowSidebar ? (
      doc ? (
        <View testID={testID ? `${testID}-navigation` : undefined} style={stickyRail(dockedNav || plainDocumentFrame ? 0 : gutter)}>
          <Sidebar {...flowSidebar} />
        </View>
      ) : canvas && !dockedNav ? (
        // The canvas row has no padding of its own, so the nav states its.
        <View style={{ padding: gutter, paddingRight: 0, flexShrink: 0 }}>
          <Sidebar {...flowSidebar} />
        </View>
      ) : (
        <Sidebar {...flowSidebar} />
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
            accessibilityLabel="Close navigation"
          />
          <View
            pointerEvents="box-none"
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row', padding: 12 }}
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
    gap: dockedNav || canvas ? 0 : Math.max(0, navigationGap ?? columnGap),
    // A canvas runs to the window's edge, so the row keeps no padding at all
    // and each region carries its own (the nav below, the aside in `canvasBody`).
    padding: canvas || plainDocumentFrame ? 0 : gutter,
    ...(dockedNav ? { paddingLeft: 0, paddingTop: 0, paddingBottom: 0 } : null),
    backgroundColor: background,
  };

  if (variant === 'feed' && drawerStyle === 'reveal' && drawerAvailable) {
    return (
      <AppShellProvider value={shell}>
        <View testID={testID} onLayout={onLayout}
          style={[frame, { overflow: doc ? WEB_OVERFLOW_CLIP : 'hidden', backgroundColor: background }, style]}>
          <View aria-hidden={!isOpen} pointerEvents={isOpen ? 'auto' : 'none'}
            style={{ position: doc ? WEB_POSITION_FIXED : 'absolute', top: 0, bottom: 0, left: 0, width: 272, paddingTop: 12, paddingBottom: 12, paddingLeft: 6 }}>
            <Animated.View style={[{ height: '100%', width: 260, transformOrigin: 'left center' }, railStyle]}>
              {drawerSidebar && <Sidebar {...drawerSidebar} mobile surface="plain" onClose={() => setOpen(false)} />}
            </Animated.View>
          </View>
          <Animated.View testID={testID ? `${testID}-reveal-page` : undefined}
            style={[{ flexGrow: 1, minWidth: 0, overflow: doc ? WEB_OVERFLOW_CLIP : 'hidden', backgroundColor: background }, feedChromeTransition, feedPageStyle, feedInsetsStyle]}>
            {topBarNode}
            <StyledView className={doc ? undefined : "flex-1 min-h-0"}>
              <View style={[rowStyle, { flexGrow: 1, minWidth: 0 }]}>{body}</View>
            </StyledView>
            <Animated.View pointerEvents={isOpen ? 'auto' : 'none'}
              style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, veilStyle]}>
              <Pressable role="button" accessibilityLabel="Close navigation" focusable={isOpen}
                onPress={() => setOpen(false)} testID={testID ? `${testID}-veil` : undefined}
                style={{ flex: 1 }} />
            </Animated.View>
          </Animated.View>
          <Animated.View pointerEvents={isOpen ? 'none' : 'box-none'}
            testID={testID ? `${testID}-reveal-bars` : undefined}
            style={[{ position: doc ? WEB_POSITION_FIXED : 'absolute', left: 0, right: 0, overflow: 'hidden' }, feedPageStyle, feedBarsStyle]}>
            {bars}
            {isOpen && <StyledView pointerEvents="none" className="absolute bottom-0 left-0 right-0"
              style={{ height: contentReserve, backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)' }} />}
          </Animated.View>
          {overlay}
        </View>
      </AppShellProvider>
    );
  }

  // The top bar is a SIBLING above the columns, so it spans the shell edge to
  // edge without escaping the frame's padding. Without one the root stays the
  // row it has always been, so nothing about an existing shell moves.
  if (topBarNode) {
    return (
      <AppShellProvider value={shell}>
        <View
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
      </AppShellProvider>
    );
  }

  return (
    <AppShellProvider value={shell}>
      <View testID={testID} onLayout={onLayout} style={[frame, rowStyle, style]}>
        {navRegion}
        {drawerRegion}
        {body}
        {overlay}
        {bars}
      </View>
    </AppShellProvider>
  );
};

const AppShellEngine = memo(AppShellComponent);
AppShellEngine.displayName = 'AppShellEngine';

return AppShellEngine;
}
