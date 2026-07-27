/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
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
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHaptics } from '../hooks/useHaptics';
import type { ProgressiveBlurProps } from '../progressive-blur/types';
import { setMinimized, useMinimizeState } from './minimize-context';
import {
  BAR_MARGIN,
  BLUR_BLEED,
  EXPANDED_HEIGHT,
  HIGHLIGHT_EXPANDED,
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
  tabBarBottomGap,
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
  /** True while a scrub is in progress — the finger owns the highlight. */
  isDragging: SharedValue<boolean>;
  theme: TabBarTheme;
  /** Set only on the CONTROLLED path (see `TabBarProps.activeIndex`). */
  activeIndex: number | undefined;
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
  onIndexChange,
  onIndexLongPress,
  theme: themeOverrides,
  haptics = true,
  style,
  ...viewProps
}: TabBarBodyProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const minimized = useMinimizeState();
  const progress = minimized.progress;
  const slideIndex = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const lastTicked = useSharedValue(-1);
  const tabCount = Math.max(Children.count(children), 1);
  const theme = useTabBarTheme(themeOverrides);
  const impact = useHaptics();

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
  useEffect(() => {
    if (activeIndex === undefined) return;
    // While scrubbing the finger owns the highlight; never fight it.
    if (isDragging.value) return;
    slideIndex.value = withSpring(activeIndex, SLIDE_SPRING);
  }, [activeIndex, slideIndex, isDragging]);

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
      const barWidth = windowWidth - BAR_MARGIN * 2 - sideInset * 2;
      const itemWidth = (barWidth - ROW_PAD_H * 2) / tabCount;
      const raw = (x - ROW_PAD_H) / itemWidth - 0.5;
      return Math.min(Math.max(raw, 0), tabCount - 1);
    };

    const pan = Gesture.Pan()
      .activeOffsetX([-6, 6])
      .failOffsetY([-14, 14])
      .onStart(() => {
        isDragging.value = true;
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
        slideIndex.value = withSpring(index, SLIDE_SPRING);
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
    windowWidth,
    tabCount,
    selectIndex,
    hasLongPress,
    longPressIndex,
    tick,
    isDragging,
    lastTicked,
    slideIndex,
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
  // `ZoomableImageGallery`. Do NOT strip these.
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
    const barWidth = windowWidth - BAR_MARGIN * 2 - sideInset * 2;
    const itemWidth = (barWidth - ROW_PAD_H * 2) / tabCount;
    return {
      height,
      width: itemWidth,
      borderRadius: height / 2,
      top: (barHeight - height) / 2,
      transform: [{ translateX: ROW_PAD_H + itemWidth * slideIndex.value }],
    };
  }, [progress, slideIndex, windowWidth, tabCount]);

  // Shared with `useTabBarFootprint`, so a consumer accounting for the bar in
  // its own layout can never drift from where the bar actually sits.
  const bottomOffset = tabBarBottomGap(insets.bottom);
  const barContext = useMemo(
    () => ({ slideIndex, isDragging, theme, activeIndex, selectIndex }),
    [slideIndex, isDragging, theme, activeIndex, selectIndex],
  );

  return (
    <View {...viewProps} style={[styles.root, style]}>
      {/* Progressive blur rising from the screen's bottom edge behind the pill. */}
      <Blur
        direction="bottom"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: bottomOffset + EXPANDED_HEIGHT + BLUR_BLEED,
        }}
      />
      <View style={[styles.barWrap, { marginBottom: bottomOffset }]}>
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
    bar.slideIndex.value = withSpring(index, SLIDE_SPRING);
  }, [isFocused, index, bar]);

  // Tint follows the sliding highlight, not navigation focus: whatever the pill
  // is over lights up — live while scrubbing, traveling on taps. Without a bar
  // there is nothing to follow, so it falls back to plain focus.
  // (Deps: see the CRITICAL note in `TabBarBody`.)
  const activeGlyphStyle = useAnimatedStyle(
    () => ({
      opacity: slideIndex ? 1 - Math.min(Math.abs(slideIndex.value - index), 1) : focused ? 1 : 0,
    }),
    [slideIndex, index, focused],
  );

  const labelStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(progress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
      color: slideIndex
        ? interpolateColor(
            Math.min(Math.abs(slideIndex.value - index), 1),
            [0, 1],
            [theme.activeTint, theme.inactiveTint],
          )
        : focused
          ? theme.activeTint
          : theme.inactiveTint,
    }),
    [progress, slideIndex, index, focused, theme],
  );

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
      accessibilityState={{ selected: focused }}
      accessibilityLabel={item.label}
      {...pressableProps}
      onPress={(event) => {
        // The bar's GestureDetector normally consumes touches; this still fires
        // for assistive-technology activation (VoiceOver) and keyboard focus.
        if (bar) bar.slideIndex.value = withSpring(index, SLIDE_SPRING);
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // In the style object, not as a prop: RN-Web deprecated the `pointerEvents`
    // prop and warns on every render when it is used.
    pointerEvents: 'box-none',
  },
  barWrap: {
    marginHorizontal: BAR_MARGIN,
    pointerEvents: 'box-none',
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
