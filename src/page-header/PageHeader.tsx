import React, { memo, useContext, useEffect, useMemo, useState } from 'react';
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
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { useScreenContext } from '../screen/context';
import { Button } from '../button';
import { BUTTON_SHADOW } from '../button/shared';
import { ButtonGroupItem } from '../button-group';
import { ControlSurface } from '../control-surface';
import { GlassIsland } from '../glass';
import { RiArrowLeftLine } from '../icons/remix/RiArrowLeftLine';
import { useClaimTopEdge, useScrollOffset } from '../layout';
import { BREAKPOINTS } from '../styles/breakpoints';
import { WEB_POSITION_STICKY, type WebCssStyle } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { EdgeScrim, SCRIM_TAIL_RATIO } from './EdgeScrim';
import type { PageHeaderProps } from './types';

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
 * `actions` slot is wrapped in a `ControlSurface` with `material: 'glass'`, so
 * a `ButtonGroup` placed there becomes one island with no prop written on it,
 * and two `ButtonGroup`s become two islands. That is a declaration the consumer
 * makes, which is the only way the header can be right about which actions
 * belong together.
 *
 *              floating                      bar
 *   chrome     islands + gradient            opaque strip + hairline + shadow
 *   back       36 capsule, glass             secondary medium icon `Button`
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

/** 44pt touch target from a 36pt capsule. Only for an island that stands alone. */
const CAPSULE_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 } as const;

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

function PageHeaderComponent({
  title,
  subtitle,
  titleAlign = 'start',
  headingLevel = 1,
  titleReveal = 'always',
  presentation = 'floating',
  placement = 'inline',
  onBack,
  backLabel = 'Back',
  leading,
  actions,
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
  const isWeb = Platform.OS === 'web';
  const floating = presentation === 'floating';
  const overlay = placement === 'overlay';
  const theme = useTheme();
  const insets = useContext(SafeAreaInsetsContext) ?? NO_INSETS;
  const padTop = (safeArea ?? !isWeb) ? insets.top : 0;

  // The header sizes itself against its CONTAINER, not the window: a desktop
  // split view puts a 380px panel next to a 1200px one, and a window-derived
  // inset gives the narrow panel the wide padding. The window is only the seed
  // for the first frame, before `onLayout` has reported.
  const windowWidth = useWindowDimensions().width;
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const width = measuredWidth || windowWidth;
  const height = measuredHeight || padTop + BAR_HEIGHT;
  const sideInset = width >= BREAKPOINTS.sm ? INSET_WIDE : INSET_COMPACT;

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setMeasuredWidth(e.nativeEvent.layout.width);
    setMeasuredHeight(e.nativeEvent.layout.height);
  };

  // An overlaying header occupies no layout, so it declares what it covers and
  // the content reads it back. Measured rather than computed: a second title
  // line, an enlarged font or a notch all move it, and every one of those is a
  // case a constant was written to survive and does not.
  useClaimTopEdge(overlay ? height : 0);

  const paint = useMemo(() => {
    return {
      background: theme.colors.background,
      separator: theme.colors.borderLight,
      textSecondary: theme.colors.textSecondary,
      shadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'],
    };
  }, [theme]);

  // ── The scroll owner ──────────────────────────────────────────────────────
  //
  // Prop, then Screen, then the nearest ScrollOffsetProvider, then the document on web.
  // The context step is the one that matters for a Bloom composition: without
  // it a header inside a scrolling panel followed `window.scrollY`, which on a
  // desktop shell never moves, so the header looked deliberately inert.
  const screen = useScreenContext();
  const contextScrollY = useScrollOffset();
  const internalScrollY = useSharedValue(0);
  const scrollY = externalScrollY ?? screen?.scrollY ?? contextScrollY ?? internalScrollY;
  const followsWindow = !externalScrollY && !screen && !contextScrollY;

  useEffect(() => {
    if (!isWeb || !followsWindow || typeof window === 'undefined') return undefined;
    const onScroll = () => {
      internalScrollY.value = window.scrollY;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isWeb, followsWindow, internalScrollY]);

  const threshold = Math.max(1, scrollThreshold);

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
  }), [scrollY, threshold]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: transparent
      ? interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP)
      : 1,
  }), [scrollY, threshold, transparent]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity:
      scrim === 'always'
        ? 1
        : scrim === 'none'
          ? 0
          : interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
  }), [scrollY, threshold, scrim]);

  // Separate from the background's: a header can be transparent and still name
  // its screen, and one over a hero photo can do the opposite.
  const titleStyle = useAnimatedStyle(() => ({
    opacity:
      titleReveal === 'always'
        ? 1
        : interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
  }), [scrollY, threshold, titleReveal]);

  const borderStyle = useAnimatedStyle(() => ({
    opacity:
      border === 'always'
        ? 1
        : border === 'none'
          ? 0
          : interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
  }), [scrollY, threshold, border]);

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
  const onStartLayout = (e: LayoutChangeEvent) => setStartMeasure(e.nativeEvent.layout.width);
  const onEndLayout = (e: LayoutChangeEvent) => setEndMeasure(e.nativeEvent.layout.width);
  const centerInset = Math.min(
    Math.max(startWidth, endWidth) + ROW_GAP,
    Math.max(0, (width - 2 * sideInset - MIN_CENTERED_TITLE_WIDTH) / 2),
  );

  const titleBlock =
    title != null || subtitle != null ? (
      <Animated.View
        style={[
          styles.titleBlock,
          centered ? styles.titleBlockCentered : styles.titleBlockStart,
          titleStyle,
        ]}
        testID={testID ? `${testID}-title-block` : undefined}
      >
        {typeof title === 'string' || typeof title === 'number' ? (
          <Text
            role="heading"
            aria-level={headingLevel}
            variant="headline-medium"
            numberOfLines={1}
            style={{ color: theme.colors.text, textAlign: centered ? 'center' : 'left' }}
            testID={testID ? `${testID}-title` : undefined}
          >
            {title}
          </Text>
        ) : (
          title
        )}
        {typeof subtitle === 'string' || typeof subtitle === 'number' ? (
          <Text
            variant="body-2-regular"
            numberOfLines={1}
            style={{ color: paint.textSecondary, textAlign: centered ? 'center' : 'left' }}
            testID={testID ? `${testID}-subtitle` : undefined}
          >
            {subtitle}
          </Text>
        ) : (
          subtitle
        )}
      </Animated.View>
    ) : null;

  const backButton = onBack ? (
    floating ? (
      // Its own island: a back action is not a member of the page's action
      // group, and a `role="group"` of one is noise a screen reader reads out.
      // The control inside is a `ButtonGroupItem` because that is Bloom's
      // island-aware control — it reads the material `GlassIsland` publishes
      // and paints flush — rather than a second implementation of the same
      // hover, press, focus and disabled behaviour.
      <GlassIsland testID={testID ? `${testID}-back-island` : undefined}>
        <ButtonGroupItem
          iconOnly
          leadingIcon={RiArrowLeftLine}
          accessibilityLabel={backLabel}
          onPress={onBack}
          hitSlop={CAPSULE_HIT_SLOP}
          testID={testID ? `${testID}-back` : undefined}
        />
      </GlassIsland>
    ) : (
      <Button
        appearance="plain"
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
    isWeb && sticky && !overlay
      ? { position: WEB_POSITION_STICKY, top: 0, zIndex: Z_INDEX.floating }
      : null;

  const chrome = floating ? (
    <Animated.View
      // A PROP: react-native-web resolves `none` from the prop path only, and
      // the scrim must never take a press meant for the content under it.
      pointerEvents="none"
      style={[styles.scrim, { height: height * (1 + SCRIM_TAIL_RATIO) }, scrimStyle]}
      testID={testID ? `${testID}-scrim` : undefined}
    >
      <EdgeScrim
        // The PAGE colour by default: the scrim's job is to fade content into
        // the surface it is leaving, so the right colour is the one that
        // surface already is. A screen that paints its own background has to
        // say so — the header cannot read the pixel behind it.
        color={scrimColor ?? theme.colors.background}
        testID={testID ? `${testID}-scrim-gradient` : undefined}
      />
    </Animated.View>
  ) : (
    <>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { boxShadow: paint.shadow }, shadowStyle]}
        testID={testID ? `${testID}-shadow` : undefined}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: paint.background }, backgroundStyle]}
        testID={testID ? `${testID}-background` : undefined}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.border, { backgroundColor: paint.separator }, borderStyle]}
        testID={testID ? `${testID}-border` : undefined}
      />
    </>
  );

  const actionsSlot = actions ? (
    <View
      style={[styles.actions, { gap: floating ? FLOATING_ACTIONS_GAP : ACTIONS_GAP }]}
      onLayout={centered ? onEndLayout : undefined}
      // `box-none` so the gaps BETWEEN islands stay transparent to touch. A
      // floating header covers content it does not own, and an invisible
      // rectangle that swallows presses across the width of the screen is the
      // defect this presentation could most easily ship.
      //
      // FLOATING ONLY, and the asymmetry is the point: a `bar` is an OPAQUE
      // strip, and letting presses through the part of it that draws no control
      // would hand a click on solid chrome to whatever list row is scrolled
      // underneath.
      pointerEvents={floating ? 'box-none' : undefined}
      testID={testID ? `${testID}-actions` : undefined}
    >
      {floating ? <ControlSurface material="glass">{actions}</ControlSurface> : actions}
    </View>
  ) : null;

  return (
    <View
      testID={testID}
      onLayout={onContainerLayout}
      pointerEvents={overlay || (floating && screen) ? 'box-none' : undefined}
      style={[
        styles.container,
        { paddingTop: padTop },
        overlay ? [styles.overlay, { zIndex: Z_INDEX.floating }] : null,
        containerWeb,
        style,
      ]}
    >
      {chrome}
      <View
        style={[styles.bar, { paddingLeft: sideInset, paddingRight: sideInset }]}
        pointerEvents={floating ? 'box-none' : undefined}
        testID={testID ? `${testID}-bar` : undefined}
      >
        <View
          style={[styles.start, !centered && styles.startFill]}
          onLayout={centered ? onStartLayout : undefined}
          pointerEvents={floating ? 'box-none' : undefined}
          testID={testID ? `${testID}-start` : undefined}
        >
          {backButton}
          {floating && leading ? (
            <ControlSurface material="glass">{leading}</ControlSurface>
          ) : (
            leading
          )}
          {centered ? null : titleBlock}
        </View>
        {centered ? <View style={styles.spacer} pointerEvents="none" /> : null}
        {actionsSlot}
        {centered && titleBlock ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.centerSlot,
              { left: sideInset + centerInset, right: sideInset + centerInset },
            ]}
            testID={testID ? `${testID}-center` : undefined}
          >
            {titleBlock}
          </View>
        ) : null}
      </View>
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
    minHeight: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ROW_GAP,
    paddingTop: 8,
    paddingBottom: 8,
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
  spacer: {
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
  },
  centerSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
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
