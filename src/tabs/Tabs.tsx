import React, {
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  Pressable,
  // The press-scale comes from `usePressAnimation`, which owns an RN
  // `Animated.Value`; a reanimated `Animated.View` cannot consume one. The two
  // namespaces coexist on purpose: reanimated drives the SHARED underline (the
  // part that has to animate from a shared value, including on web), RN
  // Animated drives the per-trigger press scale it already drove.
  Animated as RNAnimated,
  ScrollView,
  type LayoutRectangle,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import { usePressAnimation } from '../hooks/usePressAnimation';
import { borderRadius, space } from '../styles/tokens';
import { bloomShadowStyle } from '../design-tokens/shadows';
import type { TabsProps, TabsTriggerProps, TabsContentProps, TabsVariant } from './types';

type TriggerLayout = Pick<LayoutRectangle, 'x' | 'width'>;

/**
 * Underline travel. The same spring the floating `TabBar` highlight uses, so the
 * two strips read as one motion language; stated here rather than imported
 * because they are separate component families and a shared constant would tie
 * their feel together permanently.
 */
const SLIDE_SPRING = { duration: 420, dampingRatio: 0.82 };

/** Visibility, not travel — see {@link TabsContextValue.indicatorOpacity}. */
const HIGHLIGHT_FADE = { duration: 160 };

/**
 * Fraction of the distance to the neighbour a drag must cover before releasing
 * commits. Below it the underline springs home and nothing navigates.
 */
const COMMIT_THRESHOLD = 0.4;

/**
 * How far the underline may stray past the first/last tab, and how heavily that
 * travel is damped. A rubber-band is reserved for the edge, where "there is
 * nothing there" is the true message; used anywhere else it would promise a
 * neighbour that is about to arrive, which is the opposite of what happens.
 */
const EDGE_RUBBER_BAND_DAMPING = 0.25;
const EDGE_RUBBER_BAND_MAX = 32;

/** Above this the count renders as "99+", so a large tally cannot stretch a tab. */
const MAX_DISPLAYED_COUNT = 99;

function formatCount(count: number): string {
  return count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : String(count);
}

interface TabsContextValue {
  /**
   * The selected value on the CONTROLLED path, `undefined` on the focus-driven
   * one. Which of the two is in play is the whole discriminator — see
   * {@link TabsProps.value} — and it decides who may write the underline's
   * shared values, so there is never more than one writer.
   */
  selectedValue: string | undefined;
  onValueChange: ((value: string) => void) | undefined;
  variant: TabsVariant;
  fullWidth: boolean;
  /** A trigger reports its measured position so the shared underline can track it. */
  reportTriggerLayout: (value: string, layout: TriggerLayout) => void;
  /** A trigger reports that the ROUTER considers it focused. */
  reportFocused: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

/**
 * The imperative surface a horizontal drag gesture drives the underline through.
 *
 * It lives here rather than in the gesture's own code because every quantity the
 * drag needs — where the neighbouring trigger is, how wide it is, whether there
 * IS a neighbour — is measured layout the strip already holds and nothing
 * outside it can see. The gesture supplies one number, the finger's delta; the
 * strip decides what that means.
 *
 * Obtained via a `ref` on `Tabs`. The gesture belongs in the LAYOUT beside the
 * strip, never inside a tab screen — a gesture mounted in a screen is destroyed
 * by the navigation it commits, mid-release.
 */
export interface TabsDragController {
  /**
   * Feed the raw horizontal finger delta (`translationX`).
   *
   * The underline travels OPPOSITE the finger, because that is where the
   * incoming tab is: dragging left reveals the NEXT tab, which sits to the
   * right. Travel is clamped at the neighbour — the underline stops exactly
   * where it would land, so it never promises more than the release delivers —
   * and at the first/last tab it rubber-bands instead.
   *
   * Returns the value that releasing NOW would commit, or `null` for "no
   * commit": either the drag has not passed the threshold, or there is no
   * neighbour in that direction.
   */
  drag(translationX: number): string | null;
  /**
   * End the drag. Pass the value `drag` last returned to keep the underline
   * where the finger left it while the caller navigates; pass `null` to spring
   * it home.
   *
   * On a commit the offset is FOLDED into the underline's base position rather
   * than zeroed, so the focus change that follows springs from where the finger
   * actually let go. Zeroing first would snap backwards for a frame and then
   * animate forwards from the wrong place.
   */
  release(committed: string | null): void;
}

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error(`${component} must be used within a Tabs`);
  }
  return ctx;
}

const TabsBarComponent = forwardRef<TabsDragController, TabsProps>(function TabsBar(
  {
    value,
    onValueChange,
    hasSelection = true,
    variant = 'underline',
    fullWidth = false,
    children,
    style,
    testID,
  },
  dragRef,
) {
  const theme = useTheme();
  const isUnderline = variant === 'underline';

  // One shared underline that translates + resizes between triggers. Triggers
  // report their measured {x, width}; whoever owns the selection drives these
  // shared values IMPERATIVELY, and `useAnimatedStyle` below only ever READS
  // them. That split is what makes the animation work on web, where returning
  // an animation from inside a mapper silently does nothing.
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  // Starts hidden: a strip whose active trigger has not been measured yet must
  // not flash an underline at the origin on its first frame.
  const indicatorOpacity = useSharedValue(0);
  // Live drag, added to the settled position/width rather than replacing them,
  // so a release can fold the delta into the base without a visible jump.
  const dragOffset = useSharedValue(0);
  const dragWidthDelta = useSharedValue(0);

  const triggerLayoutsRef = useRef<Record<string, TriggerLayout>>({});
  const indicatorPlacedRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const viewportWidthRef = useRef(0);
  // The value the underline currently belongs to, from EITHER path. A ref
  // because the layout callback below must see the latest selection without
  // being re-created — and therefore re-firing — on every selection change.
  const selectedValueRef = useRef<string | undefined>(value);

  const moveIndicator = useCallback(
    (target: TriggerLayout, animate: boolean) => {
      if (animate) {
        indicatorX.value = withSpring(target.x, SLIDE_SPRING);
        indicatorWidth.value = withSpring(target.width, SLIDE_SPRING);
      } else {
        indicatorX.value = target.x;
        indicatorWidth.value = target.width;
      }
      indicatorOpacity.value = withTiming(1, HIGHLIGHT_FADE);
    },
    [indicatorX, indicatorWidth, indicatorOpacity],
  );

  // Keep the active tab in view when the strip overflows its viewport. Centring
  // is what makes a ROUTED strip usable: arriving at a tab that is scrolled out
  // of sight — via a deep link, a Back, or simply a long tab set — must not
  // look like an empty selection.
  const revealTrigger = useCallback(
    (target: TriggerLayout, animate: boolean) => {
      const viewport = viewportWidthRef.current;
      if (fullWidth || viewport <= 0) return;
      const centred = target.x + target.width / 2 - viewport / 2;
      scrollRef.current?.scrollTo({ x: Math.max(0, centred), animated: animate });
    },
    [fullWidth],
  );

  const applySelection = useCallback(
    (tabValue: string) => {
      const target = triggerLayoutsRef.current[tabValue];
      // Not measured yet — `reportTriggerLayout` places it on arrival.
      if (!target) return;
      const animate = indicatorPlacedRef.current;
      moveIndicator(target, animate);
      revealTrigger(target, animate);
      indicatorPlacedRef.current = true;
    },
    [moveIndicator, revealTrigger],
  );

  const reportTriggerLayout = useCallback(
    (tabValue: string, layout: TriggerLayout) => {
      triggerLayoutsRef.current[tabValue] = layout;
      // Snap onto the active trigger the moment it is first measured (mount), or
      // when its size changes — never slide in from the origin.
      if (tabValue === selectedValueRef.current) {
        moveIndicator(layout, false);
        revealTrigger(layout, false);
        indicatorPlacedRef.current = true;
      }
    },
    [moveIndicator, revealTrigger],
  );

  const reportFocused = useCallback(
    (tabValue: string) => {
      selectedValueRef.current = tabValue;
      applySelection(tabValue);
    },
    [applySelection],
  );

  // CONTROLLED path only: the bar owns the underline when `value` is provided.
  // Syncing an imperative animation to a controlled prop is a legitimate effect
  // (external-system sync). On the focus-driven path each trigger reports
  // instead, so this stays out of the way and there is only ever one writer.
  useEffect(() => {
    if (value === undefined) return;
    selectedValueRef.current = value;
    applySelection(value);
  }, [value, applySelection]);

  // Nothing is focused — fade out where it stands. Position is deliberately
  // untouched: see `TabsProps.hasSelection`. Placing this AFTER the controlled
  // effect is what lets a later re-selection snap back rather than travel,
  // because `indicatorPlacedRef` is left alone here.
  useEffect(() => {
    if (hasSelection) return;
    indicatorOpacity.value = withTiming(0, HIGHLIGHT_FADE);
  }, [hasSelection, indicatorOpacity]);

  useImperativeHandle(
    dragRef,
    (): TabsDragController => ({
      drag(translationX) {
        const current = selectedValueRef.current;
        if (current === undefined) return null;
        // Ordered by measured position, so "the neighbour" means the tab next
        // to it ON SCREEN. Deriving it from child order instead would be wrong
        // the moment a caller reorders or conditionally renders a trigger.
        const ordered = Object.entries(triggerLayoutsRef.current).sort(
          (a, b) => a[1].x - b[1].x,
        );
        const index = ordered.findIndex(([tabValue]) => tabValue === current);
        const from = ordered[index]?.[1];
        if (from === undefined) return null;

        // Opposite the finger: dragging LEFT reveals the NEXT tab, which is to
        // the right, so that is where the underline goes.
        const travel = -translationX;
        const neighbour = ordered[index + (travel > 0 ? 1 : -1)];

        if (neighbour === undefined) {
          // First or last tab. Resist, never commit — the rubber-band is the
          // honest signal that there is nothing in that direction.
          const damped = Math.min(
            Math.abs(travel) * EDGE_RUBBER_BAND_DAMPING,
            EDGE_RUBBER_BAND_MAX,
          );
          dragOffset.value = Math.sign(travel) * damped;
          dragWidthDelta.value = 0;
          return null;
        }

        const [neighbourValue, to] = neighbour;
        const distance = to.x - from.x;
        // Clamped at the neighbour: the underline stops exactly where releasing
        // would leave it, so it never promises travel the commit cannot deliver.
        const progress = Math.min(Math.abs(travel) / Math.abs(distance), 1);
        dragOffset.value = distance * progress;
        dragWidthDelta.value = (to.width - from.width) * progress;
        return progress >= COMMIT_THRESHOLD ? neighbourValue : null;
      },
      release(committed) {
        if (committed === null) {
          dragOffset.value = withSpring(0, SLIDE_SPRING);
          dragWidthDelta.value = withSpring(0, SLIDE_SPRING);
          return;
        }
        // Fold, do not zero — see `TabsDragController.release`.
        indicatorX.value += dragOffset.value;
        indicatorWidth.value += dragWidthDelta.value;
        dragOffset.value = 0;
        dragWidthDelta.value = 0;
      },
    }),
    [dragOffset, dragWidthDelta, indicatorX, indicatorWidth],
  );

  const contextValue = useMemo(
    (): TabsContextValue => ({
      selectedValue: value,
      onValueChange,
      variant,
      fullWidth,
      reportTriggerLayout,
      reportFocused,
    }),
    [value, onValueChange, variant, fullWidth, reportTriggerLayout, reportFocused],
  );

  const containerStyle = useMemo((): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
    };

    switch (variant) {
      case 'underline':
        base.borderBottomWidth = 1;
        base.borderBottomColor = theme.colors.borderLight;
        break;
      case 'filled':
        base.backgroundColor = theme.colors.backgroundSecondary;
        base.borderRadius = borderRadius.sm;
        base.padding = 2;
        break;
      case 'outlined':
        base.borderWidth = 1;
        base.borderColor = theme.colors.border;
        base.borderRadius = borderRadius.sm;
        base.padding = 2;
        break;
    }

    return base;
  }, [variant, theme]);

  // Deps: every shared value the mapper READS is listed. On web WITHOUT the
  // react-native-worklets babel plugin — the production reality for Bloom's
  // Vite consumers — reanimated cannot auto-detect a worklet's reads and drives
  // the mapper off this array instead: omit one and the mapper runs ONCE and
  // freezes at the first frame while the shared value keeps animating
  // underneath, with no error anywhere. Native (plugin present) auto-tracks and
  // ignores the extras, so listing them is correct on both platforms. Same rule
  // as `TabBarBase` and `BottomSheetBase`. Do NOT strip these.
  const indicatorStyle = useAnimatedStyle(
    () => ({
      // The drag deltas ADD to the settled values rather than replacing them,
      // which is what lets a release fold them into the base with no jump.
      width: Math.max(indicatorWidth.value + dragWidthDelta.value, 0),
      opacity: indicatorOpacity.value,
      transform: [{ translateX: indicatorX.value + dragOffset.value }],
    }),
    [indicatorWidth, dragWidthDelta, indicatorOpacity, indicatorX, dragOffset],
  );

  // The underline is a sibling of the triggers INSIDE the scrollable content,
  // so the two share one coordinate space: a trigger's `onLayout` x is already
  // relative to the container the underline is absolutely positioned in. That
  // is why nothing here subtracts a scroll offset — an underline parked outside
  // the scroller would have to, and would lag by a frame on every scroll event.
  const indicator = isUnderline ? (
    <Animated.View
      pointerEvents="none"
      testID={testID ? `${testID}-indicator` : undefined}
      style={[
        {
          position: 'absolute',
          left: 0,
          bottom: 0,
          height: 2,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          backgroundColor: theme.colors.primary,
        },
        indicatorStyle,
      ]}
    />
  ) : null;

  return (
    <TabsContext.Provider value={contextValue}>
      {fullWidth ? (
        <View style={[containerStyle, style]} testID={testID}>
          {children}
          {indicator}
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[containerStyle, style]}
          onLayout={(e) => {
            viewportWidthRef.current = e.nativeEvent.layout.width;
          }}
          testID={testID}
        >
          {children}
          {indicator}
        </ScrollView>
      )}
    </TabsContext.Provider>
  );
});

const TabComponent: React.FC<TabsTriggerProps> = ({
  value,
  label,
  icon,
  count,
  isFocused,
  disabled = false,
  onPress: onPressProp,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const {
    selectedValue,
    onValueChange,
    variant,
    fullWidth,
    reportTriggerLayout,
    reportFocused,
  } = useTabsContext('TabsTrigger');
  // The two paths meet here: an explicit `isFocused` (router adapter) wins;
  // otherwise selection comes from the bar's controlled `value`.
  const isSelected = isFocused ?? value === selectedValue;
  const { scaleAnim, onPressIn, onPressOut } = usePressAnimation(0.97);
  const resolvedCount = count ?? 0;
  const showCount = resolvedCount > 0;

  // FOCUS-DRIVEN path only. This covers programmatic navigation too — a deep
  // link, a browser Back, a back gesture — because nothing here asks HOW the
  // change happened: the trigger simply re-renders focused and the underline
  // follows. On the controlled path the bar drives the underline instead, so
  // this stays out of the way to avoid two writers on one shared value.
  useEffect(() => {
    if (isFocused !== true) return;
    reportFocused(value);
  }, [isFocused, value, reportFocused]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPressProp?.();
    // On the focus-driven path navigation is the caller's job (the router
    // adapter's trigger performs it), so reporting a selection here as well
    // would fight the router for the same underline.
    if (isFocused === undefined) onValueChange?.(value);
  }, [value, disabled, onValueChange, onPressProp, isFocused]);

  const tabStyle = useMemo((): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.lg,
      paddingVertical: space.sm,
      gap: space.xs,
    };

    switch (variant) {
      case 'underline':
        // Active state is drawn by the shared sliding indicator, not a
        // per-trigger border — nothing to add here.
        break;
      case 'filled':
        if (isSelected) {
          base.backgroundColor = theme.colors.card;
          base.borderRadius = borderRadius.xs + 2;
          // Subtle raise (`shadow-s`) — `boxShadow` on web, RN shadow/elevation on native.
          Object.assign(base, bloomShadowStyle('s'));
        }
        break;
      case 'outlined':
        if (isSelected) {
          base.backgroundColor = theme.colors.primary;
          base.borderRadius = borderRadius.xs + 2;
        }
        break;
    }

    return base;
  }, [variant, isSelected, theme]);

  const labelStyle = useMemo((): TextStyle => {
    const base: TextStyle = {
      fontSize: 14,
      fontWeight: isSelected ? '600' : '500',
    };

    if (variant === 'outlined' && isSelected) {
      base.color = theme.colors.primaryForeground;
    } else if (isSelected) {
      base.color = theme.colors.primary;
    } else {
      base.color = theme.colors.textSecondary;
    }

    return base;
  }, [variant, isSelected, theme]);

  return (
    <RNAnimated.View
      onLayout={(e) => {
        const { x, width } = e.nativeEvent.layout;
        reportTriggerLayout(value, { x, width });
      }}
      style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { flex: 1 }]}
    >
      <Pressable
        style={[tabStyle, fullWidth && { flex: 1 }, disabled && { opacity: 0.4 }, style]}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="tab"
        accessibilityLabel={showCount ? `${label}, ${resolvedCount}` : label}
        accessibilityState={{ selected: isSelected, disabled }}
      >
        {icon}
        <Text style={[labelStyle, textStyle]}>{label}</Text>
        {showCount ? (
          <Text
            style={{ fontSize: 11, fontWeight: '600', color: theme.colors.textTertiary }}
            numberOfLines={1}
          >
            {formatCount(resolvedCount)}
          </Text>
        ) : null}
      </Pressable>
    </RNAnimated.View>
  );
};

const TabPanelComponent: React.FC<TabsContentProps> = ({ value, children, style }) => {
  const { selectedValue } = useTabsContext('TabsContent');
  if (value !== selectedValue) return null;

  return <View style={style}>{children}</View>;
};

export const Tabs = memo(TabsBarComponent);
Tabs.displayName = 'Tabs';

export const TabsTrigger = memo(TabComponent);
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = memo(TabPanelComponent);
TabsContent.displayName = 'TabsContent';
