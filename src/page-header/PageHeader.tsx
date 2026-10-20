import { pointerEventsStyle } from '../styles/pointer-events';
import { StyledView } from '../styles/styled-primitives';
import { memo, useContext, useEffect, useInsertionEffect, useMemo, useRef, useState } from 'react';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { dataHook } from '../styles/data-hook';
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
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
import { useSurfaceFill } from '../styles/surface-levels';
import { ScreenHeaderContext, useScreenContext } from '../screen/context';
import { Button } from '../button';
import { BUTTON_SHADOW } from '../button/shared';
import { BloomScope } from '../appearance';
import { BlurIsland } from '../blur';
import { RiArrowLeftLine } from '../icons/remix/RiArrowLeftLine';
import { useScrollMetricsValue } from '../layout/scroll-metrics';
import { useClaimTopEdge, useScrollOffset } from '../layout';
import { BREAKPOINTS } from '../styles/breakpoints';
import {
  WEB_POSITION_STICKY,
  WEB_SURFACE_STICKY_TOP,
  type WebCssStyle,
} from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';
import { Title, Subtitle } from '../typography';
import { EdgeScrim, SCRIM_TAIL_RATIO } from './EdgeScrim';
import type { PageHeaderProps } from './types';
import { useCommonMessages } from '../locale/common-messages';
import { useCssSafeAreaInsets } from '../hooks/use-css-safe-area-insets';
import { useDirectionProps } from '../hooks/use-is-rtl';

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
 * a `ButtonGroup` placed there becomes one island with no prop written on it,
 * and two `ButtonGroup`s become two islands. That is a declaration the consumer
 * makes, which is the only way the header can be right about which actions
 * belong together.
 *
 *              floating                      bar
 *   chrome     islands + gradient            opaque strip + hairline + shadow
 *   back       36 capsule, island            secondary medium icon `Button`
 *   title      headline-medium, no capsule   headline-medium
 *   scroll     drives the scrim              drives border, background, shadow
 *
 * The geometry both share:
 *
 *   bar         min-height 56, side inset 16 (below `sm`) / 24
 *   islands     36 tall (34 + hairline), 8 apart
 *   title       headline-medium, text-primary, one line
 *   subtitle    body-2-regular, secondary, one line
 *
 * Scroll-linked, not timed: everything interpolates over `[0, scrollThreshold]`
 * of the resolved scroll offset. No press scale.
 */

const BAR_HEIGHT = 56;
const INSET_COMPACT = 16;
const INSET_WIDE = 24;
const START_GAP = 6;
const ROW_GAP = 8;
const ACTIONS_GAP = 10;
const FLOATING_ACTIONS_GAP = 8;
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

/** Container queries own continuous web width changes; React only measures content. */
const PAGE_HEADER_LAYOUT_CSS = `
[data-bloom-page-header-bar], [data-bloom-page-header-accessory] {
  --bloom-page-header-inset: ${INSET_COMPACT}px;
  padding-left: var(--bloom-page-header-inset) !important;
  padding-right: var(--bloom-page-header-inset) !important;
}
@container bloom-page-header (min-width: ${BREAKPOINTS.sm}px) {
  [data-bloom-page-header-bar], [data-bloom-page-header-accessory] { --bloom-page-header-inset: ${INSET_WIDE}px; }
}
[data-bloom-page-header-density="compact"] > [data-bloom-page-header-bar],
[data-bloom-page-header-density="compact"] > [data-bloom-page-header-accessory] {
  --bloom-page-header-inset: 12px;
}
[data-bloom-page-header-start="center"] {
  inset-inline-start: var(--bloom-page-header-inset) !important;
}
[data-bloom-page-header-end] {
  inset-inline-end: var(--bloom-page-header-inset) !important;
}
[data-bloom-page-header-center] {
  margin-left: clamp(0px, calc(var(--bloom-page-header-side-width, 0px) + ${ROW_GAP}px), max(0px, calc(50% - ${MIN_CENTERED_TITLE_WIDTH / 2}px))) !important;
  margin-right: clamp(0px, calc(var(--bloom-page-header-side-width, 0px) + ${ROW_GAP}px), max(0px, calc(50% - ${MIN_CENTERED_TITLE_WIDTH / 2}px))) !important;
}
`;

/** 44pt touch target from a 36pt capsule. Only for an island that stands alone. */
const CAPSULE_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 } as const;

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

function PageHeaderComponent({
  title,
  subtitle,
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
  leading,
  actions: screenActions,
  accessory,
  border = 'auto',
  transparent = false,
  scrim = 'auto',
  scrimColor,
  scrollY: externalScrollY,
  scrollThreshold = DEFAULT_THRESHOLD,
  sticky = true,
  safeArea,
  style,
  testID,
}: PageHeaderProps) {
  const common = useCommonMessages();
  const directionProps = useDirectionProps();
  const backLabel = backLabelProp ?? common.back;
  const isWeb = Platform.OS === 'web';
  const floating = presentation === 'floating';
  const overlay = placement === 'overlay';
  const theme = useTheme();
  const surfaceFill = useSurfaceFill() ?? theme.colors.background;
  const insets = useCssSafeAreaInsets(useContext(SafeAreaInsetsContext) ?? NO_INSETS);
  const padTop = (safeArea ?? !isWeb) ? insets.top : 0;

  // Web container queries own width, including during divider drags. Native
  // measures its own box; the window is its first-render seed only.
  const windowWidth = useWindowDimensions().width;
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const lastHeight = useRef(0);
  const width = measuredWidth || windowWidth;
  const compact = density === 'compact';
  const height = measuredHeight || padTop + (compact ? 32 : BAR_HEIGHT);
  const sideInset = compact ? 12 : width >= BREAKPOINTS.sm ? INSET_WIDE : INSET_COMPACT;

  const onContainerLayout = (e: LayoutChangeEvent) => {
    if (!isWeb) setMeasuredWidth(e.nativeEvent.layout.width);
    const nextHeight = e.nativeEvent.layout.height;
    if (lastHeight.current !== nextHeight) {
      lastHeight.current = nextHeight;
      setMeasuredHeight(nextHeight);
    }
  };

  useInsertionEffect(() => {
    if (isWeb) adoptStyleSheet('bloom-page-header-layout', PAGE_HEADER_LAYOUT_CSS);
  }, [isWeb]);

  // An overlaying header occupies no layout, so it declares what it covers and
  // the content reads it back. Measured rather than computed: a second title
  // line, an enlarged font or a notch all move it, and every one of those is a
  // case a constant was written to survive and does not.
  const dock = useHeaderDockContext();
  const dockProgress = dock?.progress;
  useClaimTopEdge(overlay || placement === 'overlap' || dock ? height : 0);
  useEffect(() => {
    if (!dock) return;
    dock.headerHeight.value = height;
    dock.overlay.value = overlay || placement === 'overlap';
    dock.setOverlaps(overlay || placement === 'overlap');
    return () => {
      dock.headerHeight.value = 0;
    };
  }, [dock, height, overlay, placement]);

  const paint = useMemo(() => {
    return {
      background: surfaceFill,
      separator: theme.colors.borderLight,
      textSecondary: theme.colors.textSecondary,
      shadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'],
    };
  }, [theme, surfaceFill]);

  // ── The scroll owner ──────────────────────────────────────────────────────
  //
  // Explicit offset, dock, local metrics, Screen, legacy offset, then the web document.
  // The context step is the one that matters for a Bloom composition: without
  // it a header inside a scrolling panel followed `window.scrollY`, which on a
  // desktop shell never moves, so the header looked deliberately inert.
  const screen = useScreenContext();
  const headerScreen = useContext(ScreenHeaderContext);
  const positionedByScreen = screen != null && headerScreen === screen;
  const host = useContext(ScreenHostContext);
  const hostActions = positionedByScreen ? host.headerActions : undefined;
  const navigation = positionedByScreen ? host.navigation : undefined;
  const onBack = screenOnBack ?? (navigation?.canGoBack ? navigation.back : undefined);
  const actions = hostActions ? (
    <>
      {screenActions}
      <View
        testID={testID ? `${testID}-host-actions` : undefined}
        style={[styles.actions, { gap: floating ? FLOATING_ACTIONS_GAP : ACTIONS_GAP }]}
      >
        {hostActions}
      </View>
    </>
  ) : (
    screenActions
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

  const scrimStyle = useAnimatedStyle(
    () => ({
      opacity:
        (1 - (dockProgress?.value ?? 0)) *
        (scrim === 'always'
          ? 1
          : scrim === 'none'
            ? 0
            : interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP)),
    }),
    [scrollY, threshold, scrim, dockProgress],
  );

  // Separate from the background's: a header can be transparent and still name
  // its screen, and one over a hero photo can do the opposite.
  const titleStyle = useAnimatedStyle(
    () => ({
      opacity:
        titleReveal.value === 'always'
          ? 1
          : titleReveal.value === 'onDock'
            ? (dockProgress?.value ?? 0)
            : Math.min(1, Math.max(0, (scrollY.value - revealOffset.value) / revealDistance.value)),
    }),
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
  const hasStart = onBack != null || leading != null;
  const hasEnd = actions != null;
  const startWidth = hasStart ? startMeasure : 0;
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
  const centerInset = Math.min(
    Math.max(startWidth, endWidth) + ROW_GAP,
    Math.max(0, (width - 2 * sideInset - MIN_CENTERED_TITLE_WIDTH) / 2),
  );

  const titleBlock =
    title != null || subtitle != null ? (
      <Animated.View
        aria-hidden={titleHidden}
        accessibilityElementsHidden={titleHidden}
        importantForAccessibility={titleHidden ? 'no-hide-descendants' : 'auto'}
        {...(isWeb && titleHidden ? { inert: true } : {})}
        style={[
          [
            styles.titleBlock,
            centered ? styles.titleBlockCentered : styles.titleBlockStart,
            titleStyle,
          ],
          pointerEventsStyle(titleHidden ? 'none' : 'auto'),
        ]}
        testID={testID ? `${testID}-title-block` : undefined}
      >
        {typeof title === 'string' || typeof title === 'number' ? (
          <Title
            role="heading"
            aria-level={headingLevel}
            variant="headline-medium"
            numberOfLines={1}
            style={{
              color: tone === 'onImage' ? '#FFFFFF' : theme.colors.text,
              textAlign: centered ? 'center' : 'left',
              maxWidth: '100%',
            }}
            testID={testID ? `${testID}-title` : undefined}
          >
            {title}
          </Title>
        ) : (
          title
        )}
        {typeof subtitle === 'string' || typeof subtitle === 'number' ? (
          <Subtitle
            variant="body-2-regular"
            numberOfLines={1}
            style={{
              color: tone === 'onImage' ? 'rgba(255,255,255,0.82)' : paint.textSecondary,
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
      </Animated.View>
    ) : null;

  const backButton = onBack ? (
    floating ? (
      // Its own island: a back action is not a member of the page's action
      // group, and a `role="group"` of one is noise a screen reader reads out.
      // One shared pane; the back action is plain so it adds no second material.
      <BlurIsland testID={testID ? `${testID}-back-island` : undefined}>
        <Button
          appearance="outline"
          material="shared"
          tone="neutral"
          size="md"
          iconOnly
          iconSize={16}
          style={{
            width: 34,
            minWidth: 34,
            height: 34,
            paddingLeft: 0,
            paddingRight: 0,
            borderWidth: 0,
            boxShadow: 'none',
          }}
          leadingIcon={RiArrowLeftLine}
          accessibilityLabel={backLabel}
          onPress={onBack}
          hitSlop={CAPSULE_HIT_SLOP}
          testID={testID ? `${testID}-back` : undefined}
        />
      </BlurIsland>
    ) : (
      <Button
        appearance="outline"
        material="shared"
        tone="neutral"
        size="md"
        icon={RiArrowLeftLine}
        accessibilityLabel={backLabel}
        onPress={onBack}
        testID={testID ? `${testID}-back` : undefined}
      />
    )
  ) : null;

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
        color={scrimColor ?? surfaceFill}
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

  const actionsSlot = actions ? (
    <View
      style={[
        [styles.actions, { gap: floating ? FLOATING_ACTIONS_GAP : ACTIONS_GAP }],
        pointerEventsStyle(floating ? 'box-none' : undefined),
      ]}
      onLayout={centered ? onEndLayout : undefined}
      testID={testID ? `${testID}-actions` : undefined}
    >
      {floating ? <BloomScope>{actions}</BloomScope> : actions}
    </View>
  ) : null;

  return (
    <View
      {...directionProps}
      {...dataHook('bloomPageHeader')}
      {...dataHook('bloomPageHeaderDensity', density)}
      testID={testID}
      onLayout={onContainerLayout}
      style={[
        [
          styles.container,
          webLayout,
          { paddingTop: padTop },
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
            [StyleSheet.absoluteFill, { backgroundColor: surfaceFill }, dockFillStyle],
            pointerEventsStyle('none'),
          ]}
        />
      ) : null}
      <StyledView
        {...dataHook('bloomPageHeaderBar')}
        className={compact ? 'min-h-8 py-0' : 'min-h-14 py-2'}
        style={[
          [styles.bar, !isWeb && { paddingLeft: sideInset, paddingRight: sideInset }],
          pointerEventsStyle(floating ? 'box-none' : undefined),
        ]}
        testID={testID ? `${testID}-bar` : undefined}
      >
        <View
          {...dataHook('bloomPageHeaderStart', centered ? 'center' : 'start')}
          style={[
            [
              styles.start,
              centered
                ? { position: 'absolute', ...(!isWeb ? { insetInlineStart: sideInset } : {}) }
                : styles.startFill,
            ],
            pointerEventsStyle(floating ? 'box-none' : undefined),
          ]}
          onLayout={centered ? onStartLayout : undefined}
          testID={testID ? `${testID}-start` : undefined}
        >
          {backButton}
          {floating && leading ? <BloomScope>{leading}</BloomScope> : leading}
          {centered ? null : titleBlock}
        </View>
        {centered && titleBlock ? (
          <View
            {...dataHook('bloomPageHeaderCenter')}
            style={[
              [styles.centerSlot, !isWeb && { marginLeft: centerInset, marginRight: centerInset }],
              pointerEventsStyle('box-none'),
            ]}
            testID={testID ? `${testID}-center` : undefined}
          >
            {titleBlock}
          </View>
        ) : null}
        {centered ? (
          <View
            {...dataHook('bloomPageHeaderEnd')}
            style={[
              { position: 'absolute', ...(!isWeb ? { insetInlineEnd: sideInset } : {}) },
              pointerEventsStyle('box-none'),
            ]}
          >
            {actionsSlot}
          </View>
        ) : (
          actionsSlot
        )}
      </StyledView>
      {accessory ? (
        <View
          {...dataHook('bloomPageHeaderAccessory')}
          testID={testID ? `${testID}-accessory` : undefined}
          style={[
            { minWidth: 0, paddingBottom: 8 },
            !isWeb ? { paddingLeft: sideInset, paddingRight: sideInset } : undefined,
          ]}
        >
          {accessory}
        </View>
      ) : null}
    </View>
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
