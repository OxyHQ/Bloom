import { SearchPresentationContext } from '../search/context';
import { useTouchInput } from '../styles/pointer';
import { resolvePaintMode } from '../theme/paint';
import { createHeaderActionsHost, HeaderActionsHostContext } from './context';
import { pointerEventsStyle } from '../styles/pointer-events';
import { StyledView } from '../styles/styled-primitives';
import {
  memo,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import { dataHook, dataHooks } from '../styles/data-hook';
import { Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useMeasuredSizeClass } from '../hooks/use-width-class';
import { useBorderBoxSize } from '../hooks/use-border-box-size';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
  useSharedValue,
  useDerivedValue,
} from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { ScreenHostContext } from '../screen/context';
import { useHeaderDockContext } from '../layout/header-dock';
import { ScreenHeaderContext, useScreenContext } from '../screen/context';
import { resolveScreenBack } from '../screen/use-screen-back';
import { Button } from '../button';
import {
  BUTTON_SHADOW,
  BUTTON_GEOMETRY,
  BUTTON_TOUCH_TARGET,
  buttonTouchVisualInset,
} from '../button/shared';
import { BloomScope } from '../appearance';
import { RiArrowLeftLine } from '../icons/remix/RiArrowLeftLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { useScrollMetricsValue } from '../layout/scroll-metrics';
import { useClaimTopEdge, useScrollOffset } from '../layout';
import { BREAKPOINTS } from '../styles/breakpoints';
import {
  WEB_POSITION_STICKY,
  WEB_SURFACE_STICKY_TOP,
  type WebCssStyle,
} from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { useThemeRecipe, useThemePaint } from '../theme/use-theme-paint';
import { useSurfaceFillRecipe } from '../styles/surface-levels';
import { Title, Subtitle } from '../typography';
import { Surface } from '../surface/Surface';
import { PageHeaderIdentity } from './PageHeaderIdentity';
import { EdgeScrim, SCRIM_TAIL_RATIO } from './EdgeScrim';
import type { PageHeaderProps } from './types';
import { useCommonMessages } from '../locale/common-messages';
import { useCssSafeAreaInsets } from '../hooks/use-css-safe-area-insets';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { usePlatformWindow } from '../platform-surface/context';
import { useWindowChrome } from '../window/context';
import { windowToolbarHeight } from '../window/geometry';
import { PageHeaderHistory } from './PageHeaderHistory';

/**
 * `PageHeader`: a screen's top chrome.
 *
 * ── THE DEFAULT IS FLOATING ─────────────────────────────────────────────────
 *
 * Not a bar. The back button sits in its OWN translucent capsule, the actions
 * the consumer declared as a group share ONE island, the title floats between
 * them, and the whole thing ends in a vertical gradient rather than a hairline.
 * Content passes under it.
 *
 * Three things follow from that, and each is a prop rather than an assumption:
 *
 *   `presentation`  `floating` | `bar`      — islands, or Bloom's flat strip
 *   `placement`     `inline` | `overlay`    — who reserves the space
 *   `scrim`/`titleReveal`                   — the edge effect and the title,
 *                                             separately
 *
 * The last pair used to be one flag. `transparent` faded the background in with
 * scroll AND hid the title, which is right for a header over a hero photo and
 * wrong everywhere else — and a header that inherited it got both behaviours
 * whether or not it wanted either. They are two questions with two answers now.
 *
 * ── THE ISLANDS ARE THE CONSUMER'S GROUPING ─────────────────────────────────
 *
 * The header never infers grouping by reading its children's types. The
 * `actions` slot is wrapped in a `BloomScope` with shared control defaults, so
 * a `Button.Group` placed there becomes one island with no prop written on it,
 * and two `Button.Group`s become two islands. That is a declaration the consumer
 * makes, which is the only way the header can be right about which actions
 * belong together.
 *
 *              floating                      bar
 *   chrome     islands + gradient            opaque strip + hairline + shadow
 *   back       standard icon Button          standard icon Button
 *   title      headline-medium, no capsule   headline-medium
 *   scroll     drives the scrim              drives border, background, shadow
 *
 * The geometry both share:
 *
 *   bar         min-height 56, uniform outer inset 12
 *   islands     Button geometry, 8 apart
 *   title       headline-medium, text-primary, one line
 *   subtitle    body-2-regular, secondary, one line
 *
 * Scroll-linked, not timed: everything interpolates over `[0, scrollThreshold]`
 * of the resolved scroll offset. No press scale.
 */

const BAR_HEIGHT = 56;
const NAVIGATION_HEIGHT = 44;
const OUTER_INSET = 12;
const ROW_GAP = 8;
const START_GAP = ROW_GAP;
const TITLE_PADDING = 4;
const DEFAULT_THRESHOLD = 20;

/**
 * The narrowest the centred title may be squeezed to before it stops yielding
 * to the two sides.
 *
 * Without a floor the centring inset is `max(startWidth, endWidth)` applied to
 * BOTH sides, so on a narrow container two wide sides can ask for more than the
 * container has — and `left + right > width` is a box of negative width, which
 * on web collapses the title to nothing and on native logs a layout error. The
 * title stops centring before that happens and simply sits off-centre, which is
 * the lesser of the two wrongs and the one a reader can still use.
 */
const MIN_CENTERED_TITLE_WIDTH = 96;
/** The widths where search and actions change presentation (`sm`, `xl`). */
const HEADER_WIDTHS = [BREAKPOINTS.sm, BREAKPOINTS.xl];

/** Container queries own continuous web width changes; React only measures content. */
const PAGE_HEADER_LAYOUT_CSS = `
[data-bloom-page-header-bar], [data-bloom-page-header-accessory], [data-bloom-page-header-overline] {
  --bloom-page-header-inset: calc(${OUTER_INSET}px - var(--bloom-page-header-touch-inset, 0px));
  padding-left: var(--bloom-page-header-inset) !important;
  padding-right: var(--bloom-page-header-inset) !important;
}
[data-bloom-page-header-start="center"] {
  inset-inline-start: var(--bloom-page-header-inset) !important;
}
[data-bloom-page-header-bar][data-bloom-page-header-window] {
  padding-inline-start: max(var(--bloom-page-header-inset), var(--bloom-page-header-window-room, 0px)) !important;
}
[data-bloom-page-header-window] > [data-bloom-page-header-start="center"] {
  inset-inline-start: max(var(--bloom-page-header-inset), var(--bloom-page-header-window-room, 0px)) !important;
}
[data-bloom-page-header-end] {
  inset-inline-end: var(--bloom-page-header-inset) !important;
}
[data-bloom-page-header-center] {
  margin-left: clamp(0px, calc(var(--bloom-page-header-side-width, 0px) + ${ROW_GAP}px), max(0px, calc(50% - ${MIN_CENTERED_TITLE_WIDTH / 2}px))) !important;
  margin-right: clamp(0px, calc(var(--bloom-page-header-side-width, 0px) + ${ROW_GAP}px), max(0px, calc(50% - ${MIN_CENTERED_TITLE_WIDTH / 2}px))) !important;
}
`;

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

function PageHeaderComponent({
  title,
  titleVariant,
  overline,
  subtitle,
  titleVisual,
  titleLayout = 'inline',
  titleAppearance = 'plain',
  onPressTitle,
  titleAccessibilityLabel,
  titleAlign = 'start',
  headingLevel = 1,
  titleReveal: requestedTitleReveal = 'auto',
  titleRevealOffset,
  titleRevealDistance,
  tone = 'default',
  presentation = 'floating',
  placement = 'inline',
  density = 'default',
  onBack: screenOnBack,
  backLabel: backLabelProp,
  backCount,
  leading,
  actions: screenActions,
  search,
  searchActions,
  accessory,
  border = 'auto',
  transparent = false,
  scrim = 'auto',
  scrimFalloff = 'smooth',
  scrimColor,
  scrollY: externalScrollY,
  scrollThreshold = DEFAULT_THRESHOLD,
  sticky = true,
  safeArea,
  style,
  testID,
}: PageHeaderProps) {
  const actionHost = useState(createHeaderActionsHost)[0];
  const actionGeometry = useRef({ width: 0, leading: 0 });
  const startRef = useRef<ComponentRef<typeof View>>(null);
  const [nativeLeadingPresent, setNativeLeadingPresent] = useState(false);
  const common = useCommonMessages();
  const directionProps = useDirectionProps();
  const backLabel = backLabelProp ?? common.back;
  const isWeb = Platform.OS === 'web';
  const floating = presentation === 'floating';
  const navigationPresentation = presentation === 'navigation';
  const actionGap = navigationPresentation ? 2 : ROW_GAP;
  const overlay = placement === 'overlay';
  const colors = useThemePaint();
  const surfaceRecipe = useSurfaceFillRecipe();
  const surfaceFill = surfaceRecipe.paint;
  const insets = useCssSafeAreaInsets(useContext(SafeAreaInsetsContext) ?? NO_INSETS);
  const safeTop = (safeArea ?? !isWeb) ? insets.top : 0;

  // Web container queries own width, including during divider drags. Native
  // measures its own box; the window is its first-render seed only.
  // Its width decides only at the breakpoints of its inset and its actions; a
  // resize re-renders it when it crosses one (`useMeasuredSizeClass`). A
  // centred title's insets follow the room natively (the spacers below).
  const measured = useMeasuredSizeClass(HEADER_WIDTHS);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const lastHeight = useRef(0);
  const width = measured.width;
  const touch = useTouchInput();
  const controlInset = buttonTouchVisualInset(BUTTON_GEOMETRY.md.height, touch);
  const [searchActive, setSearchActive] = useState(false);
  const searchCompact = search != null && width < BREAKPOINTS.sm;
  const searchOccupiesRow = searchCompact && searchActive;
  const controlHeight = touch ? BUTTON_TOUCH_TARGET : BUTTON_GEOMETRY.md.height;
  const searchHost = useMemo(
    () => ({ compact: searchCompact, onActiveChange: setSearchActive }),
    [searchCompact],
  );
  // Web starts conservatively until its own box is known. Continuous panel
  // resizing stays in CSS; React sees only a crossing of the action breakpoint.
  const [actionsCompact, setActionsCompact] = useState(isWeb || width < BREAKPOINTS.sm);
  const lastActionsCompact = useRef(actionsCompact);
  const [actionsSpacious, setActionsSpacious] = useState(!isWeb && width >= BREAKPOINTS.xl);
  const lastActionsSpacious = useRef(actionsSpacious);
  const compact = density === 'compact';
  // A bar with nothing in it is no bar: a header that only owns the status bar
  // (Commons' ID tab passes no title, back or actions) is the safe area and its
  // scrim. Drawn anyway, the empty bar reserved 56dp of blank band above the
  // content once its height stopped being class-only on native.
  const screen = useScreenContext();
  const headerScreen = useContext(ScreenHeaderContext);
  const positionedByScreen = screen != null && headerScreen === screen;
  const host = useContext(ScreenHostContext);
  const hostActions = positionedByScreen ? host.headerActions : undefined;
  // The window's title area (a Screen's header along the window's top edge,
  // `@oxy.so/bloom/window`). The bar is the window's toolbar row: it starts
  // at the window's top (a window has no safe area) and is as tall as the
  // toolbar, so its row is centred on the window's controls; and it keeps the
  // controls' room at its leading edge, inside its own background, as a
  // desktop toolbar does. The room already holds the gap after the controls,
  // so it replaces the side inset rather than adding to it.
  const windowChrome = useWindowChrome();
  const platformWindow = usePlatformWindow();
  // A window toolbar's history (its screen's panel `navigation`) is back AND
  // forward in one group, at its root too (both disabled), as a desktop
  // toolbar draws them; anywhere else the history is the lone Back below. An
  // explicit `onBack`, or `null`, still wins.
  const history =
    positionedByScreen && screenOnBack === undefined && windowChrome && platformWindow
      ? host.navigation
      : undefined;
  // `null` declines Back outright; an explicit callback wins over the host's.
  const onBack =
    screenOnBack === null || history
      ? undefined
      : (screenOnBack ?? (positionedByScreen ? resolveScreenBack(host) : undefined));
  const barEmpty =
    title == null &&
    subtitle == null &&
    titleVisual == null &&
    leading == null &&
    onBack == null &&
    history == null &&
    screenActions == null &&
    hostActions == null &&
    search == null &&
    searchActions == null;
  const windowToolbar =
    positionedByScreen && windowChrome && platformWindow && !barEmpty
      ? windowToolbarHeight(platformWindow.metrics)
      : 0;
  const windowRoom = positionedByScreen && windowChrome ? windowChrome.leading : 0;
  const padTop = windowToolbar > 0 ? 0 : safeTop;
  const height =
    measuredHeight ||
    padTop +
      (barEmpty
        ? 0
        : windowToolbar > 0
          ? windowToolbar
          : navigationPresentation
            ? NAVIGATION_HEIGHT
            : compact
              ? 32
              : BAR_HEIGHT);
  const sideInset = OUTER_INSET - controlInset;
  const barStart = Math.max(sideInset, windowRoom);

  const updateActionBudget = () => {
    const localWidth = actionGeometry.current.width;
    if (!onBack && !history && leading == null) actionGeometry.current.leading = 0;
    const hasTitle = title != null || subtitle != null || titleVisual != null;
    const inset = sideInset;
    const budget =
      titleAlign === 'center' && hasTitle
        ? (localWidth - MIN_CENTERED_TITLE_WIDTH) / 2 - inset - ROW_GAP
        : localWidth -
          Math.max(inset, windowRoom) -
          inset -
          actionGeometry.current.leading -
          (hasTitle ? MIN_CENTERED_TITLE_WIDTH + START_GAP : 0) -
          ROW_GAP;
    actionHost.setWidth(budget);
  };
  useLayoutEffect(updateActionBudget, [
    titleAlign,
    titleVisual,
    title,
    subtitle,
    leading,
    onBack,
    history,
    compact,
    navigationPresentation,
    windowRoom,
    sideInset,
  ]);
  // Keep web leading controls as direct flex children: a CSS-hidden menu must
  // remove its gap as well as its width. Measure those children, never a wrapper
  // that would remain as an empty flex item when a container query hides them.
  useLayoutEffect(() => {
    if (!isWeb || typeof ResizeObserver === 'undefined') return;
    const start = startRef.current as unknown as HTMLElement | null;
    if (!start) return;
    const measure = () => {
      const boxes = [...start.children]
        .filter((child) => !child.hasAttribute('data-bloom-page-header-title-block'))
        .map((child) => child.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0);
      actionGeometry.current.leading = boxes.length
        ? Math.max(...boxes.map((box) => box.right)) - Math.min(...boxes.map((box) => box.left))
        : 0;
      updateActionBudget();
    };
    const observer = new ResizeObserver(measure);
    const observe = () => {
      observer.disconnect();
      for (const child of start.children) {
        if (!child.hasAttribute('data-bloom-page-header-title-block')) observer.observe(child);
      }
      measure();
    };
    const mutations = new MutationObserver(observe);
    mutations.observe(start, { childList: true });
    observe();
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [
    isWeb,
    leading,
    history,
    onBack,
    title,
    subtitle,
    titleAlign,
    compact,
    navigationPresentation,
    windowRoom,
  ]);
  const onLeadingLayout = (e: LayoutChangeEvent) => {
    actionGeometry.current.leading = e.nativeEvent.layout.width;
    setNativeLeadingPresent(e.nativeEvent.layout.width > 0);
    updateActionBudget();
  };
  const containerSize = useBorderBoxSize(({ width: nextWidth, height: nextHeight }) => {
    actionGeometry.current.width = nextWidth;
    updateActionBudget();
    if (!isWeb)
      measured.onLayout({
        nativeEvent: { layout: { width: nextWidth, height: nextHeight, x: 0, y: 0 } },
      } as LayoutChangeEvent);
    const nextCompact = nextWidth < BREAKPOINTS.sm;
    if (lastActionsCompact.current !== nextCompact) {
      lastActionsCompact.current = nextCompact;
      setActionsCompact(nextCompact);
    }
    const nextSpacious = nextWidth >= BREAKPOINTS.xl;
    if (lastActionsSpacious.current !== nextSpacious) {
      lastActionsSpacious.current = nextSpacious;
      setActionsSpacious(nextSpacious);
    }
    if (lastHeight.current !== nextHeight) {
      lastHeight.current = nextHeight;
      setMeasuredHeight(nextHeight);
    }
  });

  // An overlaying header occupies no layout, so it declares what it covers and
  // the content reads it back. Measured rather than computed: a second title
  // line, an enlarged font or a notch all move it, and every one of those is a
  // case a constant was written to survive and does not.
  const dock = useHeaderDockContext();
  const dockProgress = dock?.progress;
  // What the header covers: its own overlay placements, and a Screen that lays
  // its header over the content (`headerPlacement="overlay"`), so a docking
  // section pins below it rather than behind it.
  const coversContent =
    overlay || placement === 'overlap' || (positionedByScreen && screen.headerOverlays === true);
  useClaimTopEdge(coversContent || dock ? height : 0);
  useEffect(() => {
    if (!dock) return;
    dock.headerHeight.value = height;
    dock.overlay.value = coversContent;
    dock.setOverlaps(coversContent);
    return () => {
      dock.headerHeight.value = 0;
    };
  }, [dock, height, coversContent]);

  const paintRecipe = useThemeRecipe(
    (theme, documentMode, documentPreset) => ({
      background: resolvePaintMode(surfaceRecipe, documentMode, documentPreset),
      separator: theme.colors.borderLight,
      textSecondary: theme.colors.textSecondary,
      shadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'],
    }),
    [surfaceRecipe],
  );
  const paint = paintRecipe.paint;

  // ── The scroll owner ──────────────────────────────────────────────────────
  //
  // Explicit offset, dock, local metrics, Screen, legacy offset, then the web document.
  // The context step is the one that matters for a Bloom composition: without
  // it a header inside a scrolling panel followed `window.scrollY`, which on a
  // desktop shell never moves, so the header looked deliberately inert.
  const resolvedActions =
    typeof screenActions === 'function'
      ? screenActions({ compact: actionsCompact, spacious: actionsSpacious })
      : screenActions;
  const actions = hostActions ? (
    <>
      {resolvedActions}
      <View
        testID={testID ? `${testID}-host-actions` : undefined}
        style={[styles.actions, { gap: actionGap }]}
      >
        {hostActions}
      </View>
    </>
  ) : (
    resolvedActions
  );
  const contextScrollY = useScrollOffset();
  const metrics = useScrollMetricsValue();
  const internalScrollY = useSharedValue(0);
  const scrollY =
    externalScrollY ??
    dock?.scrollY ??
    metrics?.scrollY ??
    screen?.scrollY ??
    contextScrollY ??
    internalScrollY;
  const followsWindow = !externalScrollY && !dock && !screen && !contextScrollY;
  // A scroll container alone does not prove that content repeats the title.
  // Only a measured heading offset or a registered docking section establishes
  // that relationship. Otherwise keep the screen's sole accessible title.
  const hasScrollOwner = !!(
    isWeb ||
    externalScrollY ||
    dock ||
    metrics ||
    screen ||
    contextScrollY
  );
  const dockTarget = dock?.sectionOffset;
  const titleReveal = useDerivedValue(() => {
    if (requestedTitleReveal !== 'auto') return requestedTitleReveal;
    if (titleRevealOffset !== undefined && hasScrollOwner) return 'onScroll';
    if (dockTarget && Number.isFinite(dockTarget.value)) return 'onDock';
    return 'always';
  }, [requestedTitleReveal, titleRevealOffset, hasScrollOwner, dockTarget]);

  useEffect(() => {
    if (!isWeb || !followsWindow || typeof window === 'undefined') return undefined;
    const onScroll = () => {
      internalScrollY.value = window.scrollY;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isWeb, followsWindow, internalScrollY]);

  const threshold = Math.max(
    1,
    Number.isFinite(scrollThreshold) ? scrollThreshold : DEFAULT_THRESHOLD,
  );
  const revealOffset = useDerivedValue(() => {
    const value =
      typeof titleRevealOffset === 'number' ? titleRevealOffset : (titleRevealOffset?.value ?? 0);
    return Math.max(0, Number.isFinite(value) ? value : 0);
  }, [titleRevealOffset]);
  const revealDistance = useDerivedValue(() => {
    const value =
      typeof titleRevealDistance === 'object'
        ? titleRevealDistance.value
        : (titleRevealDistance ?? threshold);
    return Math.max(1, Number.isFinite(value) ? value : threshold);
  }, [titleRevealDistance, threshold]);
  const [titleHidden, setTitleHidden] = useState(() =>
    titleReveal.value === 'onDock'
      ? (dockProgress?.value ?? 0) <= 0
      : titleReveal.value === 'onScroll' && scrollY.value <= revealOffset.value,
  );
  useEffect(() => {
    setTitleHidden(
      titleReveal.value === 'onDock'
        ? (dockProgress?.value ?? 0) <= 0
        : titleReveal.value === 'onScroll' && scrollY.value <= revealOffset.value,
    );
  }, [titleReveal, scrollY, revealOffset, dockProgress]);
  useAnimatedReaction(
    () =>
      titleReveal.value === 'onDock'
        ? (dockProgress?.value ?? 0) <= 0
        : titleReveal.value === 'onScroll' && scrollY.value <= revealOffset.value,
    (hidden, previous) => {
      if (hidden !== previous) runOnJS(setTitleHidden)(hidden);
    },
    [titleReveal, scrollY, revealOffset, setTitleHidden, dockProgress],
  );

  const shadowStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
    }),
    [scrollY, threshold],
  );

  const backgroundStyle = useAnimatedStyle(
    () => ({
      opacity: transparent
        ? interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP)
        : 1,
    }),
    [scrollY, threshold, transparent],
  );

  const imageScrim = tone === 'onImage' && scrimColor == null;
  const scrimStyle = useAnimatedStyle(
    () => ({
      opacity:
        (1 - (dockProgress?.value ?? 0)) *
        (imageScrim ? 0.72 : 1) *
        (scrim === 'always'
          ? 1
          : scrim === 'none'
            ? 0
            : interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP)),
    }),
    [scrollY, threshold, scrim, dockProgress, imageScrim],
  );

  // Separate from the background's: a header can be transparent and still name
  // its screen, and one over a hero photo can do the opposite.
  const titlePresence = useDerivedValue(
    () =>
      titleReveal.value === 'always'
        ? 1
        : titleReveal.value === 'onDock'
          ? (dockProgress?.value ?? 0)
          : Math.min(1, Math.max(0, (scrollY.value - revealOffset.value) / revealDistance.value)),
    [scrollY, titleReveal, revealOffset, revealDistance, dockProgress],
  );

  const borderStyle = useAnimatedStyle(
    () => ({
      opacity:
        border === 'always'
          ? 1
          : border === 'none'
            ? 0
            : interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
    }),
    [scrollY, threshold, border],
  );

  // ── Centring ──────────────────────────────────────────────────────────────
  //
  // Inset the title by the WIDER side so it sits on the container's centre
  // whatever the two sides hold. A slot that is not rendered contributes 0
  // rather than its last measurement: `onLayout` does not fire on unmount, so a
  // header that loses its actions would otherwise keep centring around them.
  const [startMeasure, setStartMeasure] = useState(0);
  const [endMeasure, setEndMeasure] = useState(0);
  const centered = titleAlign === 'center';
  const stacked = titleLayout === 'stacked';
  const stackedVisual = stacked && titleVisual != null;
  const hasStart = onBack != null || history != null || leading != null;
  const hasEnd = actions != null || search != null || searchActions != null;
  // A centred title also clears the controls' room past the side inset.
  const startWidth = (hasStart ? startMeasure : 0) + (barStart - sideInset);
  const endWidth = hasEnd ? endMeasure : 0;
  const measuredSides = useRef({ start: 0, end: 0 });
  const onStartLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    if (measuredSides.current.start !== next) {
      measuredSides.current.start = next;
      setStartMeasure(next);
    }
  };
  const onEndLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    if (measuredSides.current.end !== next) {
      measuredSides.current.end = next;
      setEndMeasure(next);
    }
  };
  const webLayout: WebCssStyle | null = isWeb
    ? {
        containerType: 'inline-size',
        containerName: 'bloom-page-header',
        '--bloom-page-header-side-width': `${Math.max(startWidth, endWidth)}px`,
      }
    : null;
  // A centred title clears the wider side, and gives that clearance up evenly
  // as the room narrows until the title has its minimum width: the web's
  // `clamp()` margins (above), as flex on native. Two spacers of the clearance
  // shrink alike around a title that keeps its minimum, so Yoga resolves it in
  // the pass that lays the window out.
  const centerClearance = Math.max(startWidth, endWidth) + ROW_GAP;
  const centerSpacer = (side: 'before' | 'after') =>
    !isWeb ? (
      <View
        testID={testID ? `${testID}-center-${side}` : undefined}
        // Its basis as a `width` (shrinking): Yoga reads a definite width on
        // every layout, where a changed `flexBasis` keeps the size it computed.
        style={{ flexGrow: 0, flexShrink: 1, width: centerClearance, minWidth: 0 }}
      />
    ) : null;

  const titleLabel =
    typeof title === 'string' || typeof title === 'number' ? (
      <Title
        role="heading"
        aria-level={headingLevel}
        variant={
          titleVariant ??
          (navigationPresentation
            ? 'body-medium'
            : titleAppearance === 'capsule'
              ? 'body-semibold'
              : 'headline-medium')
        }
        numberOfLines={1}
        style={{
          color: tone === 'onImage' && titleAppearance === 'plain' ? '#FFFFFF' : colors.text,
          textAlign: centered ? 'center' : 'left',
          maxWidth: '100%',
        }}
        testID={testID ? `${testID}-title` : undefined}
      >
        {title}
      </Title>
    ) : (
      title
    );
  const titleText = (
    <View
      style={{
        minWidth: 0,
        maxWidth: '100%',
        flexShrink: 1,
        alignItems: centered ? 'center' : 'stretch',
      }}
    >
      {onPressTitle && titleAppearance === 'capsule' ? (
        <View
          style={{
            minWidth: 0,
            maxWidth: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <View style={{ minWidth: 0, flexShrink: 1 }}>{titleLabel}</View>
          <View
            aria-hidden
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ flexShrink: 0 }}
          >
            <RiArrowRightSLine width={14} height={14} fill={paint.textSecondary} />
          </View>
        </View>
      ) : (
        titleLabel
      )}
      {typeof subtitle === 'string' || typeof subtitle === 'number' ? (
        <Subtitle
          variant="body-2-regular"
          numberOfLines={1}
          style={{
            color:
              tone === 'onImage' && titleAppearance === 'plain'
                ? 'rgba(255,255,255,0.82)'
                : paint.textSecondary,
            textAlign: centered ? 'center' : 'left',
            maxWidth: '100%',
          }}
          testID={testID ? `${testID}-subtitle` : undefined}
        >
          {subtitle}
        </Subtitle>
      ) : (
        subtitle
      )}
    </View>
  );
  const identityContent = (
    <View
      style={{
        minWidth: 0,
        maxWidth: '100%',
        flexShrink: 1,
        flexDirection: titleLayout === 'stacked' ? 'column' : 'row',
        alignItems: titleLayout === 'stacked' && !centered ? 'flex-start' : 'center',
        gap: stackedVisual ? 4 : ROW_GAP,
      }}
    >
      {titleVisual != null ? (
        <View style={{ flexShrink: 0, paddingTop: stackedVisual ? controlInset : 0 }}>
          {titleVisual}
        </View>
      ) : null}
      {title != null || subtitle != null ? (
        titleAppearance === 'capsule' ? (
          <Surface
            radius={24}
            testID={testID ? `${testID}-title-capsule` : undefined}
            style={{
              minWidth: 0,
              maxWidth: '100%',
              flexShrink: 1,
              // The whole visual + label is the hit target, not this paint layer.
              minHeight: stackedVisual ? undefined : controlHeight,
              justifyContent: 'center',
              paddingVertical: stackedVisual ? 4 : 6,
              paddingHorizontal: stackedVisual ? 10 : 14,
            }}
          >
            {titleText}
          </Surface>
        ) : (
          titleText
        )
      ) : null}
    </View>
  );
  const titleBlock =
    title != null || subtitle != null || titleVisual != null ? (
      <PageHeaderIdentity
        presence={titlePresence}
        hidden={titleHidden}
        testID={testID ? `${testID}-title-block` : undefined}
        style={[
          styles.titleBlock,
          navigationPresentation && { paddingLeft: 0, paddingRight: 0 },
          centered ? styles.titleBlockCentered : styles.titleBlockStart,
        ]}
      >
        {onPressTitle ? (
          <Button
            appearance="plain"
            material="flat"
            tone="neutral"
            onPress={onPressTitle}
            accessibilityLabel={
              titleAccessibilityLabel ?? (typeof title === 'string' ? title : undefined)
            }
            testID={testID ? `${testID}-identity` : undefined}
            style={{
              height: 'auto',
              // Each identity part owns its shape; the button's focus outline
              // encloses the composition without clipping avatar or capsule.
              borderRadius: 24,
              overflow: 'visible',
              minWidth: 0,
              maxWidth: '100%',
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              paddingRight: 0,
              flexShrink: 1,
              alignSelf: centered ? 'center' : 'flex-start',
            }}
          >
            {identityContent}
          </Button>
        ) : (
          identityContent
        )}
      </PageHeaderIdentity>
    ) : null;

  const backButton = onBack ? (
    <Button
      appearance={navigationPresentation ? 'plain' : 'outline'}
      tone="neutral"
      icon={backCount == null ? RiArrowLeftLine : undefined}
      leadingIcon={backCount != null ? RiArrowLeftLine : undefined}
      accessibilityLabel={
        backLabelProp ?? (backCount == null ? backLabel : `${backLabel}, ${backCount}`)
      }
      onPress={onBack}
      testID={testID ? `${testID}-back` : undefined}
    >
      {backCount}
    </Button>
  ) : null;

  const leadingControls = (
    <>
      {backButton}
      {history ? (
        <BloomScope>
          <PageHeaderHistory
            navigation={history}
            active={screen?.active !== false && host.active !== false}
            backLabel={backLabel}
            testID={testID ? `${testID}-history` : undefined}
          />
        </BloomScope>
      ) : null}
      {floating && leading ? <BloomScope>{leading}</BloomScope> : leading}
    </>
  );

  const containerWeb: WebCssStyle | null =
    isWeb && sticky && !overlay && !positionedByScreen
      ? {
          position: WEB_POSITION_STICKY,
          top: WEB_SURFACE_STICKY_TOP,
          zIndex: Z_INDEX.floating,
          transitionProperty: 'top',
          transitionDuration: 'var(--bloom-panel-inset-duration, 0ms)',
          transitionTimingFunction: 'ease-in-out',
        }
      : null;

  const dockFillStyle = useAnimatedStyle(
    () => ({ opacity: dockProgress?.value ?? 0 }),
    [dockProgress],
  );
  const chrome = floating ? (
    <Animated.View
      style={[
        [styles.scrim, { height: height * (1 + SCRIM_TAIL_RATIO) }, scrimStyle],
        pointerEventsStyle('none'),
      ]}
      testID={testID ? `${testID}-scrim` : undefined}
    >
      <EdgeScrim
        // Fade into the containing surface (ContentPanel publishes its fill),
        // falling back to the page. Explicit scrimColor remains an override.
        color={scrimColor ?? (imageScrim ? '#000000' : surfaceFill)}
        falloff={scrimFalloff}
        testID={testID ? `${testID}-scrim-gradient` : undefined}
      />
    </Animated.View>
  ) : (
    <>
      <Animated.View
        style={[
          [StyleSheet.absoluteFill, { boxShadow: paint.shadow }, shadowStyle],
          pointerEventsStyle('none'),
        ]}
        testID={testID ? `${testID}-shadow` : undefined}
      />
      <Animated.View
        style={[
          [StyleSheet.absoluteFill, { backgroundColor: paint.background }, backgroundStyle],
          pointerEventsStyle('none'),
        ]}
        testID={testID ? `${testID}-background` : undefined}
      />
      <Animated.View
        style={[
          [styles.border, { backgroundColor: paint.separator }, borderStyle],
          pointerEventsStyle('none'),
        ]}
        testID={testID ? `${testID}-border` : undefined}
      />
    </>
  );

  const actionsSlot =
    actions || search || searchActions ? (
      <View
        style={[
          [
            styles.actions,
            { gap: actionGap },
            Boolean(search) && { flex: 1, minWidth: 0 },
            searchCompact && !searchOccupiesRow && { flex: 0, flexBasis: 'auto', flexShrink: 0 },
          ],
          pointerEventsStyle(floating ? 'box-none' : undefined),
        ]}
        onLayout={centered ? onEndLayout : undefined}
        testID={testID ? `${testID}-actions` : undefined}
      >
        <HeaderActionsHostContext.Provider value={actionHost}>
          {search ? (
            <View
              style={{
                flexDirection: 'row',
                gap: actionGap,
                display: searchOccupiesRow ? 'none' : 'flex',
              }}
            >
              {floating ? <BloomScope>{actions}</BloomScope> : actions}
            </View>
          ) : floating ? (
            <BloomScope>{actions}</BloomScope>
          ) : (
            actions
          )}
          {search && (
            <View
              style={
                searchCompact && !searchOccupiesRow
                  ? { width: controlHeight }
                  : { flex: 1, minWidth: 0, maxWidth: searchOccupiesRow ? undefined : 360 }
              }
            >
              <SearchPresentationContext.Provider value={searchHost}>
                {search}
              </SearchPresentationContext.Provider>
            </View>
          )}
          {searchActions ? (
            <View
              style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: actionGap }}
            >
              {floating ? <BloomScope>{searchActions}</BloomScope> : searchActions}
            </View>
          ) : null}
        </HeaderActionsHostContext.Provider>
      </View>
    ) : null;

  return (
    <>
      {paintRecipe.sheet}
      {surfaceRecipe.sheet}
      {isWeb ? (
        <ServerStyleSheet id="bloom-page-header-layout" css={PAGE_HEADER_LAYOUT_CSS} />
      ) : null}
      <View
        {...directionProps}
        {...dataHooks({
          bloomPageHeader: '',
          bloomPageHeaderDensity: density,
          bloomPageHeaderPresentation: presentation,
        })}
        testID={testID}
        {...containerSize}
        style={[
          [
            styles.container,
            webLayout,
            { paddingTop: padTop },
            isWeb && ({ '--bloom-page-header-touch-inset': `${controlInset}px` } as WebCssStyle),
            overlay
              ? [
                  styles.overlay,
                  {
                    zIndex: Z_INDEX.floating,
                    // Android's native scroll surfaces also participate in elevation.
                    // Keep this local chrome above its sibling list without a portal.
                    ...(!isWeb ? { elevation: Z_INDEX.floating } : {}),
                  },
                ]
              : null,
            containerWeb,
            placement === 'overlap' ? { marginBottom: -height, zIndex: Z_INDEX.floating } : null,
            style,
          ],
          pointerEventsStyle(overlay || (floating && screen) ? 'box-none' : undefined),
        ]}
      >
        {chrome}
        {floating && dock ? (
          <Animated.View
            testID={testID ? `${testID}-docked-fill` : undefined}
            style={[
              [
                StyleSheet.absoluteFill,
                { backgroundColor: tone === 'onImage' ? '#000000' : surfaceFill },
                dockFillStyle,
              ],
              pointerEventsStyle('none'),
            ]}
          />
        ) : null}
        {overline ? (
          <View
            {...dataHook('bloomPageHeaderOverline')}
            testID={testID ? `${testID}-overline` : undefined}
            style={[
              { minWidth: 0 },
              isWeb
                ? ({ paddingTop: 'var(--bloom-page-header-inset)' } as WebCssStyle)
                : { paddingTop: sideInset, paddingLeft: sideInset, paddingRight: sideInset },
            ]}
          >
            {overline}
          </View>
        ) : null}
        {barEmpty ? null : (
          <BloomScope controlDensity={navigationPresentation ? 'compact' : undefined}>
            <StyledView
              {...(windowRoom > 0
                ? dataHooks({ bloomPageHeaderBar: '', bloomPageHeaderWindow: '' })
                : dataHook('bloomPageHeaderBar'))}
              className={
                navigationPresentation || windowToolbar > 0
                  ? 'py-0'
                  : compact
                    ? 'min-h-8 py-0'
                    : 'min-h-14'
              }
              style={[
                [
                  styles.bar,
                  stacked && { alignItems: 'flex-start' },
                  !compact &&
                    !navigationPresentation &&
                    windowToolbar === 0 &&
                    (isWeb
                      ? ({
                          paddingTop: 'var(--bloom-page-header-inset)',
                          paddingBottom: accessory ? ROW_GAP : 'var(--bloom-page-header-inset)',
                        } as WebCssStyle)
                      : { paddingTop: sideInset, paddingBottom: accessory ? ROW_GAP : sideInset }),
                  navigationPresentation
                    ? { gap: 2, minHeight: windowToolbar || NAVIGATION_HEIGHT }
                    : windowToolbar > 0 && { minHeight: windowToolbar },
                  isWeb
                    ? windowRoom > 0 &&
                      ({ '--bloom-page-header-window-room': `${windowRoom}px` } as WebCssStyle)
                    : windowRoom > 0
                      ? { paddingInlineStart: barStart, paddingInlineEnd: sideInset }
                      : { paddingLeft: sideInset, paddingRight: sideInset },
                ],
                pointerEventsStyle(floating ? 'box-none' : undefined),
              ]}
              testID={testID ? `${testID}-bar` : undefined}
            >
              <View
                ref={startRef}
                {...dataHook(
                  'bloomPageHeaderStart',
                  centered && !searchOccupiesRow ? 'center' : 'start',
                )}
                style={[
                  [
                    styles.start,
                    stacked && { alignItems: 'flex-start' },
                    !isWeb && { gap: nativeLeadingPresent ? START_GAP : 0 },
                    centered && !searchOccupiesRow
                      ? { position: 'absolute', ...(!isWeb ? { insetInlineStart: barStart } : {}) }
                      : [
                          !centered && styles.startFill,
                          Boolean(search) &&
                            title == null &&
                            subtitle == null &&
                            titleVisual == null && { flex: 0, flexBasis: 'auto', flexShrink: 0 },
                        ],
                    searchOccupiesRow && { display: 'none' },
                  ],
                  pointerEventsStyle(floating ? 'box-none' : undefined),
                ]}
                accessibilityElementsHidden={searchOccupiesRow}
                importantForAccessibility={searchOccupiesRow ? 'no-hide-descendants' : 'auto'}
                onLayout={centered ? onStartLayout : undefined}
                testID={testID ? `${testID}-start` : undefined}
              >
                {isWeb ? (
                  leadingControls
                ) : backButton || history || leading != null ? (
                  <View
                    onLayout={onLeadingLayout}
                    testID={testID ? `${testID}-leading-measure` : undefined}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: START_GAP,
                      flexShrink: 0,
                    }}
                  >
                    {leadingControls}
                  </View>
                ) : null}
                {centered ? null : titleBlock}
              </View>
              {centered && !searchOccupiesRow && titleBlock ? centerSpacer('before') : null}
              {centered && titleBlock ? (
                <View
                  {...(!searchOccupiesRow ? dataHook('bloomPageHeaderCenter') : {})}
                  style={[
                    [
                      styles.centerSlot,
                      searchOccupiesRow && { display: 'none' },
                      !isWeb &&
                        !searchOccupiesRow && {
                          flexBasis: MIN_CENTERED_TITLE_WIDTH,
                          flexGrow: 1,
                          flexShrink: 0,
                        },
                    ],
                    pointerEventsStyle('box-none'),
                  ]}
                  testID={testID ? `${testID}-center` : undefined}
                >
                  {titleBlock}
                </View>
              ) : null}
              {centered && !searchOccupiesRow && titleBlock ? centerSpacer('after') : null}
              {centered ? (
                <View
                  {...(!searchOccupiesRow ? dataHook('bloomPageHeaderEnd') : {})}
                  style={[
                    {
                      position: 'absolute',
                      ...(search
                        ? isWeb
                          ? ({
                              width: `max(0px, calc(50% - ${MIN_CENTERED_TITLE_WIDTH / 2 + ROW_GAP}px - var(--bloom-page-header-inset)))`,
                            } as WebCssStyle)
                          : {
                              width: Math.max(
                                0,
                                (width - MIN_CENTERED_TITLE_WIDTH) / 2 - sideInset - ROW_GAP,
                              ),
                            }
                        : {}),
                      ...(!isWeb ? { insetInlineEnd: sideInset } : {}),
                    },
                    searchOccupiesRow && {
                      position: 'relative',
                      width: undefined,
                      insetInlineEnd: 0,
                      flex: searchOccupiesRow ? 1 : undefined,
                    },
                    pointerEventsStyle('box-none'),
                  ]}
                >
                  {actionsSlot}
                </View>
              ) : (
                actionsSlot
              )}
            </StyledView>
          </BloomScope>
        )}
        {accessory ? (
          <View
            {...dataHook('bloomPageHeaderAccessory')}
            testID={testID ? `${testID}-accessory` : undefined}
            style={[
              { minWidth: 0 },
              isWeb
                ? ({ paddingBottom: 'var(--bloom-page-header-inset)' } as WebCssStyle)
                : { paddingBottom: sideInset },
              !isWeb ? { paddingLeft: sideInset, paddingRight: sideInset } : undefined,
            ]}
          >
            {accessory}
          </View>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  border: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ROW_GAP,
  },
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: START_GAP,
    minWidth: 0,
  },
  startFill: {
    flex: 1,
  },
  titleBlock: {
    minWidth: 0,
    paddingLeft: TITLE_PADDING,
    paddingRight: TITLE_PADDING,
  },
  titleBlockStart: {
    flex: 1,
  },
  titleBlockCentered: {
    alignItems: 'center',
    maxWidth: '100%',
  },
  centerSlot: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
});

export const PageHeader = memo(PageHeaderComponent);
PageHeader.displayName = 'PageHeader';
