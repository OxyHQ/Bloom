/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos).
 *
 * The platform-agnostic body of the floating tab bar: gestures, springs, every
 * animated style, the highlight geometry and the button. The only pieces that
 * differ per platform are injected as component props — the capsule `Surface`
 * (liquid glass on iOS 26, backdrop-filter on web, a solid fill everywhere
 * else), the `Blur` behind the bar, and the `Glyph` (SF Symbol on iOS, the
 * item's own icon node elsewhere). Same shape as `BottomSheetBase`'s `Shell`.
 *
 * Nothing here imports expo-glass-effect, expo-symbols, expo-router or
 * react-native-screens, so this file is safe in a web bundle and in a
 * consumer's type-check.
 */
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ComponentType,
} from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHaptics } from '../hooks/use-haptics';
import { useClaimBottomEdge } from '../layout/bottom-edge';
import { windowEdgeGap } from '../layout/edge';
import type { ProgressiveBlurProps } from '../progressive-blur/types';
import { setMinimized, useMinimizeState } from './context';
import {
  BAR_MARGIN,
  BLUR_BLEED,
  EXPANDED_HEIGHT,
  HIGHLIGHT_EXPANDED,
  HIGHLIGHT_FADE,
  HIGHLIGHT_MINIMIZED,
  ICON_SIZE,
  ITEM_GAP,
  ITEM_PAD_V,
  LABEL_FONT_SIZE,
  LONG_PRESS_MIN_DURATION,
  MINIMIZED_HEIGHT,
  MINIMIZED_INSET,
  ROW_PAD_H,
  SLIDE_SPRING,
  useTabBarTheme,
  type TabBarGlyphProps,
  type TabBarSurfaceProps,
} from './shared';
import type { TabBarButtonProps, TabBarProps, TabBarTheme } from './types';

/**
 * What a `TabBarButton` needs from the bar it sits in. `null` when a button is
 * rendered standalone, which keeps a lone button usable (it just falls back to
 * its own `isFocused` for tinting and has no highlight to drive).
 */
type BarContextValue = {
  /** Live highlight position, in tab units. Fractional while scrubbing. */
  slideIndex: SharedValue<number>;
  /**
   * Highlight visibility, 0–1. Below 1 only when the bar has NO selection (an
   * `activeIndex` that names no tab). Buttons fold it into their own active
   * tint so a faded-out capsule leaves no glyph and no label lit.
   */
  highlightOpacity: SharedValue<number>;
  /** True while a scrub is in progress — the finger owns the highlight. */
  isDragging: SharedValue<boolean>;
  theme: TabBarTheme;
  /** Set only on the CONTROLLED path (see `TabBarProps.activeIndex`). */
  activeIndex: number | undefined;
  /**
   * True while a driver owns the highlight's POSITION (see
   * `TabBarProps.activeProgress`). Buttons read it to stand down: their focus
   * effect and their press must not spring `slideIndex` out from under a pager
   * mid-gesture. It says nothing about visibility, which stays where it was.
   */
  driven: boolean;
  /** Report a selection made by a button press. */
  selectIndex: (index: number) => void;
};

const BarContext = createContext<BarContextValue | null>(null);

interface TabBarBodyProps extends TabBarProps {
  Surface: ComponentType<TabBarSurfaceProps>;
  Blur: ComponentType<ProgressiveBlurProps>;
}

/**
 * Floating tab bar with Revolut-style minimize-on-scroll, a sliding highlight
 * and finger scrubbing.
 */
function TabBarBody({
  Surface,
  Blur,
  children,
  activeIndex,
  activeProgress,
  onIndexChange,
  onIndexLongPress,
  theme: themeOverrides,
  haptics = true,
  blur = true,
  maxWidth,
  style,
  ...viewProps
}: TabBarBodyProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const minimized = useMinimizeState();
  const progress = minimized.progress;
  const tabCount = Math.max(Children.count(children), 1);

  // Is a tab selected at all?
  //
  // The two states this distinguishes are NOT the same thing, and collapsing
  // them would silently kill the highlight for every router consumer:
  //
  //   - `activeIndex === undefined` is the FOCUS-DRIVEN path. The bar is not
  //     the writer at all — each `TabBarButton` supplies `isFocused` and drives
  //     the highlight itself (that is how the adapter keeps it correct through
  //     deep links and back gestures), so from the bar's side there is always a
  //     selection and the highlight is always visible.
  //   - NO SELECTION is `activeIndex` being a number that names no tab:
  //     negative, past the last tab, or fractional. Every consumer whose route
  //     set is larger than its tab set produces one — a `usePathname()`-derived
  //     index is -1 on every screen that is not a tab — and the highlight must
  //     then be gone rather than parked outside the pill.
  const hasSelection =
    activeIndex === undefined ||
    (Number.isInteger(activeIndex) && activeIndex >= 0 && activeIndex < tabCount);

  const slideIndex = useSharedValue(0);
  // Seeded from the CURRENT state, not from 0: a bar that mounts with a
  // selection must show its highlight on the first frame exactly as it always
  // has, and one that mounts without a selection must never flash it.
  const highlightOpacity = useSharedValue(hasSelection ? 1 : 0);
  const isDragging = useSharedValue(false);
  const lastTicked = useSharedValue(-1);
  const theme = useTabBarTheme(themeOverrides);
  const impact = useHaptics();

  // The pill's OUTER width (the box the animated minimize inset is applied
  // inside), and the single source of truth for it: the wrap's own layout, the
  // highlight geometry and the `indexAtX` scrub worklet all derive from this one
  // number. They have to, or a tap lands on a tab the highlight is not under —
  // the exact failure `maxWidth` exists to prevent, since narrowing the bar from
  // the outside with a `style` override moves only the pixels.
  //
  // Unconstrained it is what the stretched wrap already measures
  // (`windowWidth - BAR_MARGIN * 2`), so an existing consumer's geometry is
  // unchanged to the pixel. `maxWidth` is a ceiling, never a floor: on a window
  // narrower than it, the bar stays full-bleed.
  const barOuterWidth =
    maxWidth === undefined
      ? windowWidth - BAR_MARGIN * 2
      : Math.min(windowWidth - BAR_MARGIN * 2, maxWidth);

  // Picker-style tick while the highlight crosses tab boundaries mid-drag.
  // `useHaptics` already no-ops on web, when the optional `expo-haptics` peer
  // is absent, and when a `BloomHapticsProvider` has haptics turned off — so
  // the only decision left here is the caller's own `haptics` prop.
  const tick = useCallback(() => {
    if (haptics) impact('light');
  }, [haptics, impact]);

  // Navigation happens only on release — switching screens live while
  // scrubbing makes the content jump under the finger.
  const selectIndex = useCallback((index: number) => onIndexChange?.(index), [onIndexChange]);

  // Long press is reported through the same shape, and deliberately does NOT
  // select: it is a secondary action on the tab under the finger.
  const longPressIndex = useCallback(
    (index: number) => onIndexLongPress?.(index),
    [onIndexLongPress],
  );
  const hasLongPress = onIndexLongPress !== undefined;

  // CONTROLLED path: the bar owns the highlight when `activeIndex` is provided,
  // so it tracks the prop even when a consumer renders custom children instead
  // of `TabBarButton`s. Syncing an imperative animation to a controlled prop is
  // a legitimate effect (external-system sync), the same shape `Tabs` uses for
  // its underline. The focus-driven path is handled per-button instead — see
  // `TabBarButtonBody`.
  // DRIVEN path: a pager owns the highlight's position and writes it every
  // frame, so the position is COPIED rather than sprung — a spring chasing a
  // per-frame value lags behind the finger, which is the whole thing this path
  // exists to avoid.
  //
  // `useAnimatedReaction` cannot be called conditionally, so an unsupplied
  // `activeProgress` is stood in for by a shared value nothing ever writes and
  // the reaction returns early. `driven` changing flips the identity of `source`
  // too, and both are in the deps array, so the reaction re-registers either
  // way.
  //
  // Scrubbing still wins: a finger on the BAR is a direct manipulation of the
  // bar and must not be fought by the pager's settle animation.
  // (Deps: see the CRITICAL note below.)
  const idleProgress = useSharedValue(0);
  const driven = activeProgress !== undefined;
  const source = activeProgress ?? idleProgress;
  useAnimatedReaction(
    () => source.value,
    (value) => {
      if (!driven) return;
      if (isDragging.value) return;
      slideIndex.value = value;
    },
    [source, driven, isDragging, slideIndex],
  );

  useEffect(() => {
    if (activeIndex === undefined) return;
    // While scrubbing the finger owns the highlight; never fight it.
    if (isDragging.value) return;
    if (!hasSelection) {
      // Fade out where it stands. `slideIndex` is deliberately left alone: it
      // is the highlight's POSITION, and there is no position that means
      // "nowhere" — springing it to a sentinel would drag the capsule across
      // the bar on its way out, dragging the active tint over every tab it
      // passed. Visibility is the thing that changed, so visibility is the only
      // thing that animates.
      highlightOpacity.value = withTiming(0, HIGHLIGHT_FADE);
      return;
    }
    // Coming back from fully hidden the capsule APPEARS at the new tab instead
    // of travelling to it: a slide says "the selection moved from here to
    // there", and while it was invisible there was no "here" — sliding from the
    // stale index would animate out of a position the user never saw, and would
    // light up every tab in between on the way. Interrupted mid-fade it is
    // still on screen, so from there it slides as it always does.
    //
    // On the DRIVEN path this effect keeps owning visibility and gives up the
    // position: the driver is already writing `slideIndex` every frame, and a
    // spring started here would drag the capsule across the bar between two of
    // its writes.
    if (!driven) {
      slideIndex.value =
        highlightOpacity.value === 0 ? activeIndex : withSpring(activeIndex, SLIDE_SPRING);
    }
    highlightOpacity.value = withTiming(1, HIGHLIGHT_FADE);
  }, [activeIndex, hasSelection, driven, slideIndex, highlightOpacity, isDragging]);

  // Scrubbing: the highlight tracks the finger 1:1 while dragging (no spring —
  // it must feel attached), haptic ticks fire on boundary crossings, and
  // navigation happens only on release. Taps are handled by a Tap gesture
  // racing the pan — the detector consumes the bar's touches, so the inner
  // Pressables never receive them.
  const gesture = useMemo(() => {
    const indexAtX = (x: number, minimizedValue: number) => {
      'worklet';
      const sideInset = interpolate(
        minimizedValue,
        [0, 1],
        [0, MINIMIZED_INSET],
        Extrapolation.CLAMP,
      );
      // `event.x` is measured from the left edge of the view the detector is
      // attached to — the animated pill itself, NOT the window and not the wrap
      // around it. Its width is therefore the outer width minus the two
      // animated margins, which is exactly what this computes, constrained or
      // not. (Margins sit outside a view's own box, so x = 0 is the pill's left
      // border edge either way.)
      const barWidth = barOuterWidth - sideInset * 2;
      const itemWidth = (barWidth - ROW_PAD_H * 2) / tabCount;
      const raw = (x - ROW_PAD_H) / itemWidth - 0.5;
      return Math.min(Math.max(raw, 0), tabCount - 1);
    };

    const pan = Gesture.Pan()
      .activeOffsetX([-6, 6])
      .failOffsetY([-14, 14])
      .onStart((event) => {
        isDragging.value = true;
        // Arming from the no-selection state: a hidden capsule has no position
        // the finger can pick up, so it starts under the finger rather than at
        // the index it faded out on — which would also make the first boundary
        // tick fire against a phantom position. Mid-fade it is still visible,
        // so it keeps the position it is at, exactly as it always has.
        if (highlightOpacity.value === 0) {
          slideIndex.value = indexAtX(event.x, progress.value);
        }
        highlightOpacity.value = withTiming(1, HIGHLIGHT_FADE);
        lastTicked.value = Math.round(slideIndex.value);
        // Scrubbing is a deliberate bar interaction — surface the labels.
        setMinimized(minimized, 0);
      })
      .onUpdate((event) => {
        const index = indexAtX(event.x, progress.value);
        slideIndex.value = index;

        const rounded = Math.round(index);
        if (rounded !== lastTicked.value) {
          lastTicked.value = rounded;
          runOnJS(tick)();
        }
      })
      .onFinalize(() => {
        // Fires on failure too (e.g. the touch was a tap) — only act when the
        // pan actually activated, or we'd stomp the tap's navigation.
        if (!isDragging.value) {
          return;
        }
        const rounded = Math.round(slideIndex.value);
        slideIndex.value = withSpring(rounded, SLIDE_SPRING);
        runOnJS(selectIndex)(rounded);
        isDragging.value = false;
      });

    const tap = Gesture.Tap()
      // Real fingers drift a few points — the default tolerance (~2pt) makes
      // ordinary taps fail. Past 6pt horizontal the pan takes over.
      .maxDistance(16)
      .maxDuration(400)
      .onEnd((event, success) => {
        if (!success) {
          return;
        }
        const index = Math.round(indexAtX(event.x, progress.value));
        // Same rule as the controlled path above: appear at the tapped tab when
        // hidden, slide to it when already on screen.
        //
        // A tap is a discrete writer, so on the DRIVEN path it stands down like
        // the others and the driver carries the highlight to the tapped tab.
        // The scrub is the one gesture that does not: a finger dragging the
        // pill is manipulating the bar itself, not asking for a page.
        if (!driven) {
          slideIndex.value =
            highlightOpacity.value === 0 ? index : withSpring(index, SLIDE_SPRING);
        }
        highlightOpacity.value = withTiming(1, HIGHLIGHT_FADE);
        setMinimized(minimized, 0);
        runOnJS(selectIndex)(index);
      });

    if (!hasLongPress) return Gesture.Race(pan, tap);

    // Long press: the ONLY path to one, because the detector consumes the
    // bar's touches and a button's inner `Pressable` therefore never sees a
    // real finger (see `TabBarButtonBody`). Added to the race only when a
    // handler was supplied — an always-armed long press would cancel the pan
    // for anyone who rests a finger before scrubbing, and no existing consumer
    // asked for that. It cannot cost a tap either: the tap gesture gives up at
    // 400ms, before this one can activate at 500ms, so the two are never
    // candidates at the same instant. Resolves its index through the same
    // `indexAtX` worklet as tap and pan, so all three agree on the geometry.
    const longPress = Gesture.LongPress()
      .minDuration(LONG_PRESS_MIN_DURATION)
      .onStart((event) => {
        runOnJS(longPressIndex)(Math.round(indexAtX(event.x, progress.value)));
      });

    return Gesture.Race(pan, tap, longPress);
  }, [
    barOuterWidth,
    tabCount,
    selectIndex,
    hasLongPress,
    longPressIndex,
    tick,
    driven,
    isDragging,
    lastTicked,
    slideIndex,
    highlightOpacity,
    minimized,
    progress,
  ]);

  // CRITICAL — every shared value and every scalar a mapper READS must appear
  // in its dependency array. On web WITHOUT the react-native-worklets babel
  // plugin (what every Oxy RN-Web app ships) reanimated cannot auto-detect a
  // worklet's reads, so it drives the mapper off the deps array instead: with a
  // missing or incomplete array the mapper runs ONCE and freezes at the first
  // frame while the shared values keep animating underneath — the bar would
  // never minimize and the highlight would never move, with no error anywhere.
  // Native (plugin present) auto-tracks and ignores the extra deps, so listing
  // them is correct on both platforms. Same rule as `BottomSheetBase` and
  // `ZoomableMediaGallery`. Do NOT strip these.
  const barStyle = useAnimatedStyle(() => {
    const height = interpolate(
      progress.value,
      [0, 1],
      [EXPANDED_HEIGHT, MINIMIZED_HEIGHT],
      Extrapolation.CLAMP,
    );
    // Revolut-style: the pill shrinks in both dimensions.
    //
    // Written as the two long-form margins, NEVER as `marginHorizontal`.
    // Reanimated's web path hands a mapper's result to react-native-web's
    // `createReactDOMStyle`, whose `STYLE_SHORT_FORM_EXPANSIONS` map covers
    // `marginInline` but NOT React Native's `marginHorizontal` (verified absent
    // from the whole file in RNW 0.21.2). An unexpanded shorthand is written
    // straight onto the DOM node as `style.marginHorizontal`, which is not a CSS
    // property, so the browser drops it silently: the bar keeps its full width
    // while `highlightStyle` still subtracts `MINIMIZED_INSET` from `barWidth`,
    // leaving the highlight narrower than the tab it sits under. Static styles
    // are unaffected — they take RNW's own StyleSheet path, which does handle
    // the shorthand — so this only bites inside a mapper.
    const inset = interpolate(progress.value, [0, 1], [0, MINIMIZED_INSET], Extrapolation.CLAMP);
    return { height, marginLeft: inset, marginRight: inset };
  }, [progress]);

  // The capsule shape lives on the surface itself: iOS 26 glass renders its own
  // native corner configuration (true squircle + rim lighting). Clipping a
  // rectangular glass with an RN mask breaks that.
  const shapeStyle = useAnimatedStyle(() => {
    const height = interpolate(
      progress.value,
      [0, 1],
      [EXPANDED_HEIGHT, MINIMIZED_HEIGHT],
      Extrapolation.CLAMP,
    );
    return { borderRadius: height / 2 };
  }, [progress]);

  // One shared highlight that slides between tabs (transform-only → GPU). All
  // geometry derives from shared values, never from layout callbacks.
  const highlightStyle = useAnimatedStyle(() => {
    const barHeight = interpolate(
      progress.value,
      [0, 1],
      [EXPANDED_HEIGHT, MINIMIZED_HEIGHT],
      Extrapolation.CLAMP,
    );
    const height = interpolate(
      progress.value,
      [0, 1],
      [HIGHLIGHT_EXPANDED, HIGHLIGHT_MINIMIZED],
      Extrapolation.CLAMP,
    );
    const sideInset = interpolate(
      progress.value,
      [0, 1],
      [0, MINIMIZED_INSET],
      Extrapolation.CLAMP,
    );
    // Same `barOuterWidth` the scrub worklet resolves an index from — see the
    // note where it is computed.
    const barWidth = barOuterWidth - sideInset * 2;
    const itemWidth = (barWidth - ROW_PAD_H * 2) / tabCount;
    return {
      height,
      width: itemWidth,
      borderRadius: height / 2,
      top: (barHeight - height) / 2,
      // With no selection there is nothing to highlight, and the capsule has to
      // stop being drawn: `slideIndex` is a position in tab units, so an
      // out-of-range one is a real place — one item-width to the LEFT of the
      // first tab, i.e. half outside the pill — not an absence.
      opacity: highlightOpacity.value,
      transform: [{ translateX: ROW_PAD_H + itemWidth * slideIndex.value }],
    };
  }, [progress, slideIndex, highlightOpacity, barOuterWidth, tabCount]);

  // Shared with `useTabBarFootprint`, so a consumer accounting for the bar in
  // its own layout can never drift from where the bar actually sits.
  const bottomOffset = windowEdgeGap(insets.bottom);

  // Publish what the bar occupies so anything else at this edge stacks above it
  // rather than behind it. Same number `useTabBarFootprint` reports, derived from
  // the same two values, so a consumer reading either can never disagree with
  // where the bar actually sits. The EXPANDED height on purpose: the bar
  // minimizes on scroll and re-expands, so claiming the minimized height would
  // drop a FAB onto the pill the moment the user scrolled back up.
  useClaimBottomEdge(bottomOffset + EXPANDED_HEIGHT);

  // How centring and the animated inset compose: centring is STATIC and belongs
  // to the wrap, the inset stays ANIMATED on the pill inside it. The wrap is
  // centred once by layout at a definite width, and the pill's two equal
  // margins keep it centred within that wrap at every point of the minimize
  // animation — neither has to know about the other. Centring the animated view
  // itself would instead mean `alignSelf: 'center'` on a node with no width of
  // its own (its width comes from those margins), which Yoga then sizes from its
  // CONTENT rather than from the constraint.
  //
  // Applied only when `maxWidth` is set: with no width and no `alignSelf` the
  // wrap stretches, which is the original full-bleed behaviour.
  const constrainedWrapStyle: ViewStyle | null =
    maxWidth === undefined ? null : { width: barOuterWidth, alignSelf: 'center' };
  const barContext = useMemo(
    () => ({ slideIndex, highlightOpacity, isDragging, theme, activeIndex, driven, selectIndex }),
    [slideIndex, highlightOpacity, isDragging, theme, activeIndex, driven, selectIndex],
  );

  return (
    <View {...viewProps} pointerEvents="box-none" style={[styles.root, style]}>
      {/* Progressive blur rising from the screen's bottom edge behind the pill.
          Rendered CONDITIONALLY, and as nothing at all when off: the band is
          full-bleed and 114pt tall at a zero bottom inset, so it blurs whatever
          a screen floats near the bottom edge (a scrubber, a FAB), and leaving
          an empty absolutely-positioned view behind would keep a node — and a
          rect — that exists to do nothing. Stays full-bleed under `maxWidth`:
          it is the screen-edge scrim content dissolves into, not part of the
          pill. */}
      {blur !== false && (
        <Blur
          direction="bottom"
          intensity={typeof blur === 'object' ? blur.intensity : undefined}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: bottomOffset + EXPANDED_HEIGHT + BLUR_BLEED,
          }}
        />
      )}
      <View pointerEvents="box-none" style={[styles.barWrap, { marginBottom: bottomOffset }, constrainedWrapStyle]}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={barStyle}>
            <Surface theme={theme} style={shapeStyle} />
            <Animated.View
              style={[styles.highlight, { backgroundColor: theme.highlight }, highlightStyle]}
            />
            <View accessibilityRole="tablist" style={styles.itemRow}>
              <BarContext.Provider value={barContext}>{children}</BarContext.Provider>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

interface TabBarButtonBodyProps extends TabBarButtonProps {
  Glyph: ComponentType<TabBarGlyphProps>;
}

/** One tab trigger: icon + label that fades out when the bar minimizes. */
function TabBarButtonBody({
  Glyph,
  item,
  index,
  isFocused,
  onPress,
  style,
  ...pressableProps
}: TabBarButtonBodyProps) {
  const minimized = useMinimizeState();
  const progress = minimized.progress;
  const bar = useContext(BarContext);
  // Resolved outside the bar too, so a standalone button still themes itself.
  const standaloneTheme = useTabBarTheme();
  const theme = bar?.theme ?? standaloneTheme;
  const slideIndex = bar?.slideIndex;
  const highlightOpacity = bar?.highlightOpacity;
  // The two paths meet here: an explicit `isFocused` (router adapter) wins;
  // otherwise focus comes from the bar's controlled `activeIndex`.
  const focused = isFocused ?? (bar?.activeIndex === index);

  // FOCUS-DRIVEN path only. Covers programmatic navigation too (deep links,
  // back gestures) — the trigger re-renders focused and the highlight follows.
  // While scrubbing, the finger owns the highlight; never fight it with a
  // spring. On the controlled path the BAR drives the highlight instead, so
  // this stays out of the way to avoid two writers on one shared value.
  useEffect(() => {
    if (isFocused === undefined || !isFocused || !bar) return;
    if (bar.isDragging.value) return;
    // A driver owns the position — see `TabBarProps.activeProgress`. It is
    // already tracking this same focus change; springing from here as well would
    // be a second writer on one shared value.
    if (bar.driven) return;
    bar.slideIndex.value = withSpring(index, SLIDE_SPRING);
  }, [isFocused, index, bar]);

  // Tint follows the sliding highlight, not navigation focus: whatever the pill
  // is over lights up — live while scrubbing, traveling on taps. Without a bar
  // there is nothing to follow, so it falls back to plain focus.
  //
  // Scaled by the highlight's own visibility, so a bar with NO selection leaves
  // nothing lit: distance alone would keep the tab the capsule faded out on
  // fully tinted, which is the same bug as a stray capsule wearing a different
  // hat — a tab that looks selected while nothing is.
  // (Deps: see the CRITICAL note in `TabBarBody`.)
  const activeGlyphStyle = useAnimatedStyle(() => {
    if (!slideIndex || !highlightOpacity) return { opacity: focused ? 1 : 0 };
    const proximity = 1 - Math.min(Math.abs(slideIndex.value - index), 1);
    return { opacity: highlightOpacity.value * proximity };
  }, [slideIndex, highlightOpacity, index, focused]);

  const labelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP);
    if (!slideIndex || !highlightOpacity) {
      return { opacity, color: focused ? theme.activeTint : theme.inactiveTint };
    }
    // Same quantity as the glyph crossfade above, so a label can never disagree
    // with the icon it sits under.
    const proximity = 1 - Math.min(Math.abs(slideIndex.value - index), 1);
    return {
      opacity,
      color: interpolateColor(
        highlightOpacity.value * proximity,
        [0, 1],
        [theme.inactiveTint, theme.activeTint],
      ),
    };
  }, [progress, slideIndex, highlightOpacity, index, focused, theme]);

  // Height is animated EXPLICITLY (not derived from children) so the icon stays
  // perfectly centered every frame — layout-driven sizing lags a frame behind
  // UI-thread animation.
  const boxStyle = useAnimatedStyle(
    () => ({
      height: interpolate(
        progress.value,
        [0, 1],
        [HIGHLIGHT_EXPANDED, HIGHLIGHT_MINIMIZED],
        Extrapolation.CLAMP,
      ),
    }),
    [progress],
  );

  return (
    <Pressable
      // Accessibility defaults come BEFORE the spread so an explicit prop — or
      // one injected by a router trigger — still wins.
      accessibilityRole="tab"
      // `aria-selected` is the state ARIA defines for `role="tab"`, and the one
      // spelling both platforms read: react-native-web ignores
      // `accessibilityState`, React Native folds `aria-selected` into it.
      aria-selected={focused}
      accessibilityLabel={item.label}
      {...pressableProps}
      onPress={(event) => {
        // The bar's GestureDetector normally consumes touches; this still fires
        // for assistive-technology activation (VoiceOver) and keyboard focus.
        if (bar) {
          // Appear at the tab when hidden, slide to it when visible — the same
          // rule the tap gesture and the controlled path follow. Skipped on the
          // driven path, where the position belongs to the driver and this
          // press will reach it as an ordinary selection.
          if (!bar.driven) {
            bar.slideIndex.value =
              bar.highlightOpacity.value === 0 ? index : withSpring(index, SLIDE_SPRING);
          }
          bar.highlightOpacity.value = withTiming(1, HIGHLIGHT_FADE);
        }
        setMinimized(minimized, 0);
        // Controlled path only. On the focus-driven path the trigger's own
        // `onPress` below performs the navigation, so reporting the selection
        // here as well would navigate twice.
        if (isFocused === undefined) bar?.selectIndex(index);
        onPress?.(event);
      }}
      // `Pressable`'s `style` also accepts a function of the press state; both
      // forms are composed on top of the flex-share base so a caller can tint
      // or scale a tab on press without losing the layout.
      style={
        typeof style === 'function'
          ? (state) => [styles.button, style(state)]
          : [styles.button, style]
      }
    >
      <Animated.View style={[styles.itemBox, boxStyle]}>
        {/* Inactive glyph underneath, active glyph crossfading on top. `active`
            tells each layer which one it is, so an item with an `activeIcon`
            crossfades between two different nodes and not just two tints. */}
        <View>
          <Glyph item={item} tint={theme.inactiveTint} size={ICON_SIZE} active={false} />
          <Animated.View style={[StyleSheet.absoluteFill, styles.glyphLayer, activeGlyphStyle]}>
            <Glyph item={item} tint={theme.activeTint} size={ICON_SIZE} active />
          </Animated.View>
        </View>
        {/* Fades out and is clipped by the shrinking box — no layout anim. */}
        <Animated.Text numberOfLines={1} style={[styles.label, labelStyle]}>
          {item.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Bind the platform `Surface` + `Blur` to the shared body, once per entry
 * module. The returned component is created at module scope, so its identity is
 * stable across renders. `index.ts` binds the native/neutral pieces and
 * `index.web.tsx` binds the web pieces explicitly — the same split
 * `BottomSheet` makes with its `Shell`.
 */
export function createTabBar(
  Surface: ComponentType<TabBarSurfaceProps>,
  Blur: ComponentType<ProgressiveBlurProps>,
) {
  const TabBar = (props: TabBarProps) => <TabBarBody {...props} Surface={Surface} Blur={Blur} />;
  TabBar.displayName = 'TabBar';
  return TabBar;
}

/** Bind the platform `Glyph` to the shared button body. See `createTabBar`. */
export function createTabBarButton(Glyph: ComponentType<TabBarGlyphProps>) {
  const TabBarButton = (props: TabBarButtonProps) => <TabBarButtonBody {...props} Glyph={Glyph} />;
  TabBarButton.displayName = 'TabBarButton';
  return TabBarButton;
}

const styles = StyleSheet.create({
  root: {
    // `pointerEvents="box-none"` is passed as a PROP on the views using these
    // styles, NOT as a style entry: react-native-web resolves the RN-only
    // `box-none` value only from the prop path, so as a style it silently does
    // nothing and this full-width bottom band swallows every click in it. RNW
    // logs a deprecation notice for the prop exactly once per session — the
    // trade against a dead strip across the bottom of every page is not close.
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  barWrap: {
    marginHorizontal: BAR_MARGIN,
  },
  highlight: {
    position: 'absolute',
    left: 0,
    borderCurve: 'continuous',
  },
  itemRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ROW_PAD_H,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: ITEM_PAD_V,
    overflow: 'hidden',
  },
  glyphLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: LABEL_FONT_SIZE,
    fontWeight: '600',
    marginTop: ITEM_GAP,
  },
});
