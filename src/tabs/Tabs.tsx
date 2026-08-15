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
import { usePressAnimation } from '../hooks/use-press-animation';
import { useInteractionState } from '../hooks/use-interaction-state';
import { pressedSurface } from '../theme/press-colors';
import { animation, borderRadius, space } from '../styles/tokens';
import { bloomShadowStyle } from '../design-tokens/shadows';
import type { TabsProps, TabsTriggerProps, TabsContentProps, TabsVariant } from './types';

type TriggerLayout = Pick<LayoutRectangle, 'x' | 'width'>;

/**
 * Re-read ONE trigger's geometry from the platform and report it back.
 *
 * A callback rather than a return value because measuring is asynchronous on
 * both platforms: react-native-web defers to a `setTimeout(0)` inside
 * `UIManager.measure`, and native hops to the UI thread. Each trigger keeps its
 * own host ref and hands the strip this instead, so the registry says exactly
 * what it needs — a position on demand — and nothing about what a trigger
 * renders.
 */
type TriggerMeasure = (report: (layout: TriggerLayout) => void) => void;

/**
 * Underline travel. The same spring the floating `TabBar` highlight uses, so the
 * two strips read as one motion language; stated here rather than imported
 * because they are separate component families and a shared constant would tie
 * their feel together permanently.
 */
const SLIDE_SPRING = { duration: 420, dampingRatio: 0.82 };

/** Visibility, not travel — the underline fades, it does not slide, in and out. */
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
  /**
   * A trigger hands the strip a way to RE-READ its own geometry, and takes it
   * back on unmount. See `remeasureTriggers` for why the strip cannot simply
   * keep whatever `onLayout` last reported.
   */
  registerTrigger: (value: string, measure: TriggerMeasure) => () => void;
  /** A trigger reports the geometry its own `onLayout` just handed it. */
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
  // How to ask each trigger where it is NOW, keyed by value. Registration order
  // carries no meaning — everything that consumes the geometry orders itself by
  // measured `x`, which is the only ordering that survives a reorder.
  const triggerMeasuresRef = useRef(new Map<string, TriggerMeasure>());
  const remeasureScheduledRef = useRef(false);
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
      // Reveal only while something IS selected. Geometry keeps arriving while
      // a non-tab sibling route is showing — the measurement pass below is
      // precisely what makes it arrive — and fading the underline back in there
      // would re-assert a tab the reader has left. Read from the closure rather
      // than a ref: a ref written in an effect is still stale at this point,
      // because a child's effect runs before its parent's.
      if (!hasSelection) return;
      indicatorOpacity.value = withTiming(1, HIGHLIGHT_FADE);
    },
    [indicatorX, indicatorWidth, indicatorOpacity, hasSelection],
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

  /**
   * Record where a trigger is, from whichever source measured it, and keep the
   * underline glued to it.
   *
   * Placement here never animates: the tab did not become SELECTED, it MOVED,
   * and it moved instantly because nothing animates a strip's reflow. Sliding
   * the underline across would read as a selection change that never happened.
   */
  const applyTriggerLayout = useCallback(
    (tabValue: string, layout: TriggerLayout) => {
      const previous = triggerLayoutsRef.current[tabValue];
      // Unchanged geometry must be a no-op, not a re-place: a measurement pass
      // runs after every render, and re-placing would cancel a selection slide
      // mid-flight for no reason.
      if (previous !== undefined && previous.x === layout.x && previous.width === layout.width) {
        return;
      }
      triggerLayoutsRef.current[tabValue] = layout;
      if (tabValue !== selectedValueRef.current) return;
      moveIndicator(layout, false);
      revealTrigger(layout, false);
      indicatorPlacedRef.current = true;
    },
    [moveIndicator, revealTrigger],
  );

  /**
   * Re-read EVERY trigger's position from the platform.
   *
   * This exists because `onLayout` cannot be trusted to report a MOVE. On
   * react-native-web it is backed by a single `ResizeObserver`
   * (`modules/useElementLayout`), which fires for a SIZE change and never for a
   * position-only one — so a trigger inserted, removed or reordered after first
   * layout shifts every trigger after it while not one of them re-reports, and
   * the underline stays where the stale numbers put it: silently, one tab off,
   * only on the first paint after an async tab list lands. A tab whose own
   * width changes has the same effect on its neighbours.
   *
   * So `onLayout` is demoted to a change SIGNAL and the geometry is read back
   * explicitly, through the `measure` both platforms put on a host view ref. It
   * answers in the view's PARENT coordinate space, which is the space the
   * underline is positioned in and the same one `onLayout` reports — the two
   * sources cannot disagree about what they mean.
   */
  const remeasureTriggers = useCallback(() => {
    for (const [tabValue, measure] of triggerMeasuresRef.current) {
      measure((layout) => {
        // A strip that is mounted but not laid out — a `display: none` ancestor
        // on web, an unmeasured subtree on native — measures as zero, and a
        // trigger cannot genuinely be zero-wide (it always carries horizontal
        // padding). Recording that would collapse the underline and throw away
        // the real geometry, so the last known position stands until it is on
        // screen again.
        if (layout.width <= 0) return;
        applyTriggerLayout(tabValue, layout);
      });
    }
  }, [applyTriggerLayout]);

  const scheduleRemeasure = useCallback(() => {
    // One pass per turn, however many signals arrive: a mount registers N
    // triggers and reports N layouts, which is N+1 reasons to measure the same
    // frame. A microtask, so the pass is queued before the browser paints the
    // frame the change landed in.
    if (remeasureScheduledRef.current) return;
    remeasureScheduledRef.current = true;
    queueMicrotask(() => {
      remeasureScheduledRef.current = false;
      remeasureTriggers();
    });
  }, [remeasureTriggers]);

  const registerTrigger = useCallback((tabValue: string, measure: TriggerMeasure) => {
    triggerMeasuresRef.current.set(tabValue, measure);
    return () => {
      triggerMeasuresRef.current.delete(tabValue);
      // A tab that is gone must not keep a position in the geometry the drag
      // controller orders itself by, or a swipe can commit to a trigger that is
      // no longer on screen.
      delete triggerLayoutsRef.current[tabValue];
    };
  }, []);

  const reportTriggerLayout = useCallback(
    (tabValue: string, layout: TriggerLayout) => {
      // Snap onto the active trigger the moment it is first measured (mount), or
      // when its size changes — never slide in from the origin.
      applyTriggerLayout(tabValue, layout);
      // One trigger changing size moves every trigger after it, and not one of
      // them will say so.
      scheduleRemeasure();
    },
    [applyTriggerLayout, scheduleRemeasure],
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

  // Every render of the strip is a render in which its contents may have MOVED:
  // a trigger inserted, removed or reordered, or one re-rendered at a new size.
  // Unconditional on purpose, rather than keyed on a signature of `children` —
  // any such signature has to be built from React keys or child props, both of
  // which the caller controls and neither of which is obliged to change on a
  // reorder. A pass writes nothing when nothing moved, so being wrong in this
  // direction costs a handful of reads and being wrong in the other direction
  // is the bug.
  useEffect(scheduleRemeasure);

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
      registerTrigger,
      reportTriggerLayout,
      reportFocused,
    }),
    [
      value,
      onValueChange,
      variant,
      fullWidth,
      registerTrigger,
      reportTriggerLayout,
      reportFocused,
    ],
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
    registerTrigger,
    reportTriggerLayout,
    reportFocused,
  } = useTabsContext('TabsTrigger');
  // The two paths meet here: an explicit `isFocused` (router adapter) wins;
  // otherwise selection comes from the bar's controlled `value`.
  const isSelected = isFocused ?? value === selectedValue;
  const { scaleAnim, onPressIn: onScaleIn, onPressOut: onScaleOut } =
    usePressAnimation(animation.pressScale);
  // Driven separately from the scale — see `Chip` for why.
  const { state: pressed, onIn: onPressedIn, onOut: onPressedOut } = useInteractionState();
  const onPressIn = () => { onScaleIn(); onPressedIn(); };
  const onPressOut = () => { onScaleOut(); onPressedOut(); };
  const resolvedCount = count ?? 0;
  const showCount = resolvedCount > 0;

  // The trigger's own host view. It stays here rather than in the strip because
  // the strip has no way to reach a child it did not create — it receives them
  // as `children` — and because a trigger is the only thing that knows its own
  // value, which is what the geometry has to be keyed by.
  const nodeRef = useRef<View | null>(null);
  const measureSelf = useCallback<TriggerMeasure>((report) => {
    nodeRef.current?.measure((x, _y, width) => {
      report({ x, width });
    });
  }, []);

  // Registration IS the insertion/removal signal the strip acts on, so it must
  // outlive nothing: the cleanup drops both the measure hook and the geometry.
  useEffect(
    () => registerTrigger(value, measureSelf),
    [registerTrigger, value, measureSelf],
  );

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

  const tabStyle = useMemo((): ViewStyle & { backgroundColor: string } => {
    const base: ViewStyle & { backgroundColor: string } = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.lg,
      paddingVertical: space.sm,
      gap: space.xs,
      // The rest fill, narrowed to a required `string` so the press resolver can
      // read it straight off. Only the two SELECTED states below overwrite it.
      backgroundColor: 'transparent',
      // Every trigger, selected or not, in every variant — not just the two that
      // paint a fill. Invisible on a transparent background, and it is what gives
      // the press wash a shape: without it an `underline` tab answers a press
      // with a hard-edged rectangle while its `filled` sibling answers with a
      // rounded one. Same rung the two filled states already use.
      borderRadius: borderRadius.xs + 2,
    };

    switch (variant) {
      case 'underline':
        // Active state is drawn by the shared sliding indicator, not a
        // per-trigger border — nothing to add here.
        break;
      case 'filled':
        if (isSelected) {
          base.backgroundColor = theme.colors.card;
          // Subtle raise (`shadow-s`) — `boxShadow` on web, RN shadow/elevation on native.
          Object.assign(base, bloomShadowStyle('s'));
        }
        break;
      case 'outlined':
        if (isSelected) {
          base.backgroundColor = theme.colors.primary;
        }
        break;
    }

    return base;
  }, [variant, isSelected, theme]);

  const labelColor = useMemo((): string => {
    if (variant === 'outlined' && isSelected) return theme.colors.primaryForeground;
    if (isSelected) return theme.colors.primary;
    return theme.colors.textSecondary;
  }, [variant, isSelected, theme]);

  const labelStyle = useMemo(
    (): TextStyle => ({
      fontSize: 14,
      fontWeight: isSelected ? '600' : '500',
      color: labelColor,
    }),
    [isSelected, labelColor],
  );

  // An unselected trigger has no fill, so its press IS the fill and it takes the
  // neutral wash. A SELECTED one keeps its fill and gains a state layer of its
  // own label colour, so pressing the current tab still says something instead
  // of repainting it as one of its neighbours.
  const pressedBackground = useMemo(
    () => pressedSurface(theme.colors, tabStyle.backgroundColor, labelColor),
    [theme.colors, tabStyle.backgroundColor, labelColor],
  );

  return (
    <RNAnimated.View
      ref={nodeRef}
      onLayout={(e) => {
        const { x, width } = e.nativeEvent.layout;
        reportTriggerLayout(value, { x, width });
      }}
      style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { flex: 1 }]}
    >
      <Pressable
        style={[
          tabStyle,
          fullWidth && { flex: 1 },
          disabled && { opacity: 0.4 },
          // Before the caller's `style`, so `style` still wins the array.
          pressed && !disabled && { backgroundColor: pressedBackground },
          style,
        ]}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="tab"
        accessibilityLabel={showCount ? `${label}, ${resolvedCount}` : label}
        // `aria-selected`, and NOT a web-only spelling of `accessibilityState`.
        // react-native-web's `createDOMProps` reads `aria-selected` (or the
        // deprecated `accessibilitySelected`) and does not look at
        // `accessibilityState` at all, so a strip that set only the latter
        // announced no selection on web at all — every tab equally current.
        // React Native's own `Pressable` folds `aria-selected` back into
        // `accessibilityState.selected`, so this one prop serves both platforms
        // and there is no second place for the answer to disagree. `disabled`
        // needs no counterpart: both Pressables already derive that state from
        // the `disabled` prop above.
        aria-selected={isSelected}
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
