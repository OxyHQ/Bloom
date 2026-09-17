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
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  type LayoutRectangle,
  type TextStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { useInteractionState } from '../hooks/use-interaction-state';
import { borderRadius } from '../styles/tokens';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { mixColor, resolveButtonRamps } from '../button/shared';
import type {
  TabsContentProps,
  TabsIconComponent,
  TabsProps,
  TabsTriggerProps,
  TabsVariant,
} from './types';

/**
 * Tabs and its pill tab switcher.
 * Colours are Bloom's theme through the button recipe (`button/shared.ts`
 * ramps).
 *
 * `underline` — `Tab`:
 *   strip      gap 4, 1px separator baseline (neutral-200 / dark neutral-800)
 *   trigger    px 10, py 8, gap 10 (label group ↔ count)
 *   label      gap 6 with a 16px icon; selected body-medium accent-600,
 *              idle body-regular text-primary. The icon takes the label colour.
 *   count      radius 4, px 4, py 1, caption-1-medium.
 *              selected: accent-100 (dark accent-800 @60%) on accent-600.
 *              idle:     black/10 on text-primary, the whole badge at 50%.
 *   underline  2px accent-600 laid OVER the baseline, sliding 200ms `ease`.
 *
 * `pill` / `filled` — `PillTab` blue / gray:
 *   strip      gap 4, no chrome
 *   trigger    px 8, py 5, gap 4, 20px icon, body-medium label
 *   idle       label + icon neutral-500; a hover layer fades in over 200ms
 *              (blue: neutral-100 / dark neutral-800; gray: neutral-100 /
 *              dark neutral-700 @60%)
 *   selected   a thumb slides between pills over 300ms with a small overshoot
 *              (`cubic-bezier(0.34, 1.2, 0.64, 1)`).
 *              blue: accent-50 (dark accent-950 @60%), label + icon accent-500
 *              gray: neutral-200 (dark neutral-800), label + icon text-primary
 *
 * `outlined` is kept for existing call sites and renders as `pill`.
 *
 * Both pill variants are FULL pills (Bloom's rule for button-like controls);
 * the gray one is not given a smaller corner radius. No press scale; press
 * borrows the hover paint on native. Every slide and fade is skipped under
 * reduced motion.
 */

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

/** The underline: `transition-[transform,width] duration-200 ease`. */
const UNDERLINE_TIMING = { duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

/** The pill thumb: 300ms with a spring-like settle. */
const PILL_TIMING = { duration: 300, easing: Easing.bezier(0.34, 1.2, 0.64, 1) };

/** Visibility, not travel — the indicator fades, it does not slide, in and out. */
const HIGHLIGHT_FADE = { duration: 160 };

/** `transition-colors duration-150 ease` on a trigger's label. */
const COLOR_TRANSITION_MS = 150;

/** The pill hover layer, `transition-opacity duration-200 ease-out`. */
const HOVER_FADE_MS = 200;

/**
 * How long after an animated selection a re-measured trigger keeps animating
 * instead of snapping. A selection changes the label WEIGHT (regular → medium),
 * which resizes the trigger a frame after the slide started; snapping on that
 * report would cut the slide off mid-flight. Covers the longer of the two
 * timings.
 */
const SELECTION_SETTLE_MS = 320;

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

/** `outlined` is a legacy alias and renders as the accent pill. */
type ResolvedVariant = 'underline' | 'pill' | 'filled';

function resolveVariant(variant: TabsVariant): ResolvedVariant {
  return variant === 'outlined' ? 'pill' : variant;
}

export interface TabsPaint {
  /** The strip's 1px baseline (`underline`). */
  separator: string;
  /** The 2px underline. */
  underline: string;
  /** The sliding pill thumb. */
  thumb: string;
  /** The idle pill's hover layer. */
  hover: string;
  selectedLabel: string;
  selectedIcon: string;
  idleLabel: string;
  idleIcon: string;
  countSelectedBackground: string;
  countSelectedForeground: string;
  countIdleBackground: string;
  countIdleForeground: string;
  /** Keyboard focus ring (`border-focus-ring`, accent-500). */
  ring: string;
}

/**
 * Every colour a strip paints, per variant. Pure — takes the theme rather than
 * calling `useTheme()`, so it can be walked over presets and modes.
 */
export function resolveTabsPaint(theme: Theme, variant: TabsVariant): TabsPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const c = theme.colors;
  const dark = theme.isDark;
  const count = {
    countSelectedBackground: dark ? mixColor(c.background, accent[800], 0.6) : accent[100],
    countSelectedForeground: accent[600],
    // `bg-black/10` in both modes.
    countIdleBackground: 'rgba(0, 0, 0, 0.1)',
    countIdleForeground: c.text,
    separator: dark ? n[800] : n[200],
    underline: accent[600],
    ring: accent[500],
  };
  switch (resolveVariant(variant)) {
    case 'underline':
      return {
        ...count,
        thumb: 'transparent',
        hover: 'transparent',
        selectedLabel: accent[600],
        selectedIcon: accent[600],
        idleLabel: c.text,
        idleIcon: c.text,
      };
    case 'pill':
      return {
        ...count,
        thumb: dark ? mixColor(c.background, accent[950], 0.6) : accent[50],
        hover: dark ? n[800] : n[100],
        selectedLabel: accent[500],
        selectedIcon: accent[500],
        idleLabel: n[500],
        idleIcon: n[500],
      };
    case 'filled':
    default:
      return {
        ...count,
        thumb: dark ? n[800] : n[200],
        hover: dark ? mixColor(c.background, n[700], 0.6) : n[100],
        selectedLabel: c.text,
        selectedIcon: c.text,
        idleLabel: n[500],
        idleIcon: n[500],
      };
  }
}

/** Per-variant trigger geometry (`Tab` vs `PillTab`). */
const GEOMETRY = {
  underline: { paddingHorizontal: 10, paddingVertical: 8, gap: 10, labelGap: 6, icon: 16, radius: 4 },
  pill: { paddingHorizontal: 8, paddingVertical: 5, gap: 4, labelGap: 4, icon: 20, radius: borderRadius.full },
  filled: { paddingHorizontal: 8, paddingVertical: 5, gap: 4, labelGap: 4, icon: 20, radius: borderRadius.full },
} as const;

/** The strip's gap between triggers (`gap-1`), both variants. */
const STRIP_GAP = 4;

const IS_WEB = Platform.OS === 'web';

function webData(data: Record<string, string>): Record<string, unknown> {
  return IS_WEB ? ({ dataSet: data } as Record<string, unknown>) : {};
}

// ---------------------------------------------------------------------------
//  Web: keyboard focus ring, colour transitions, disabled cursor
//
//  A trigger is a react-native-web `Pressable`, so no inline style can carry
//  `:focus-visible` or a transition keyed to a state change. The hook is a
//  `data-*` attribute through `dataSet` because a class never reaches the DOM
//  (react-native-css consumes `className`). `base` puts the LAYOUT half of the
//  shared reset back, which is written for a raw `<button>`.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-tabs-web-css';
const TRIGGER = '[data-bloom-tabs-trigger]';

const BLOOM_TABS_CSS = interactiveWebCss({
  selector: TRIGGER,
  varPrefix: 'bloom-tabs',
  base: `
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    position: relative;
    white-space: nowrap;
  `,
  transition: 'none',
  hover: { declarations: 'opacity: 1;' },
  outlineOffset: 0,
  extraRules: `${TRIGGER}:disabled,
${TRIGGER}[aria-disabled="true"] {
  cursor: not-allowed;
}
${TRIGGER} [data-bloom-tabs-label],
${TRIGGER} [data-bloom-tabs-icon] {
  transition: color ${COLOR_TRANSITION_MS}ms ease;
}
[data-bloom-tabs-hover] {
  transition: opacity ${HOVER_FADE_MS}ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
${TRIGGER} [data-bloom-tabs-label],
${TRIGGER} [data-bloom-tabs-icon],
[data-bloom-tabs-hover] {
  transition: none;
}
}`,
});

interface TabsContextValue {
  /**
   * The selected value on the CONTROLLED path, `undefined` on the focus-driven
   * one. Which of the two is in play is the whole discriminator — see
   * {@link TabsProps.value} — and it decides who may write the underline's
   * shared values, so there is never more than one writer.
   */
  selectedValue: string | undefined;
  onValueChange: ((value: string) => void) | undefined;
  variant: ResolvedVariant;
  paint: TabsPaint;
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
  useInteractiveWebCss(STYLE_ID, BLOOM_TABS_CSS);
  const resolvedVariant = resolveVariant(variant);
  const isUnderline = resolvedVariant === 'underline';
  const paint = useMemo(() => resolveTabsPaint(theme, variant), [theme, variant]);
  const reducedMotion = useReducedMotion();
  const slideTiming = isUnderline ? UNDERLINE_TIMING : PILL_TIMING;

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

  // Until when a re-measure of the selection should keep animating rather than
  // snap — see `SELECTION_SETTLE_MS`.
  const settleUntilRef = useRef(0);

  const moveIndicator = useCallback(
    (target: TriggerLayout, animate: boolean) => {
      if (animate && !reducedMotion) {
        indicatorX.value = withTiming(target.x, slideTiming);
        indicatorWidth.value = withTiming(target.width, slideTiming);
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
    [indicatorX, indicatorWidth, indicatorOpacity, hasSelection, reducedMotion, slideTiming],
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
      if (animate) settleUntilRef.current = Date.now() + SELECTION_SETTLE_MS;
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
      // The one exception: a selection that is still sliding. Selecting changes
      // the label's weight, so the trigger re-reports a new width a frame into
      // the slide — retarget it rather than cutting it off.
      moveIndicator(layout, Date.now() < settleUntilRef.current);
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
          dragOffset.value = reducedMotion ? 0 : withTiming(0, slideTiming);
          dragWidthDelta.value = reducedMotion ? 0 : withTiming(0, slideTiming);
          return;
        }
        // Fold, do not zero — see `TabsDragController.release`.
        indicatorX.value += dragOffset.value;
        indicatorWidth.value += dragWidthDelta.value;
        dragOffset.value = 0;
        dragWidthDelta.value = 0;
      },
    }),
    [dragOffset, dragWidthDelta, indicatorX, indicatorWidth, reducedMotion, slideTiming],
  );

  const contextValue = useMemo(
    (): TabsContextValue => ({
      selectedValue: value,
      onValueChange,
      variant: resolvedVariant,
      paint,
      fullWidth,
      registerTrigger,
      reportTriggerLayout,
      reportFocused,
    }),
    [
      value,
      onValueChange,
      resolvedVariant,
      paint,
      fullWidth,
      registerTrigger,
      reportTriggerLayout,
      reportFocused,
    ],
  );

  const containerStyle = useMemo(
    (): WebCssStyle => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: STRIP_GAP,
      // The strip is `w-full`: the baseline runs the container's whole
      // width even when the triggers do not fill it. As a scroll view's content
      // this is a floor, so an overflowing strip still scrolls.
      flexGrow: 1,
      // `border-b border-separator-border` — underline only; the pill
      // strips carry no chrome of their own.
      ...(isUnderline ? { borderBottomWidth: 1, borderBottomColor: paint.separator } : null),
    }),
    [isUnderline, paint.separator],
  );

  // The underline sits OVER the baseline: it is `bottom-0` of a wrapper whose
  // child carries the border. An absolute child is placed inside the border,
  // so it is pulled down by the baseline's own width — read from the caller's
  // `style` too, so a strip that zeroes the border (a published consumer
  // does) does not get an underline hanging 1px below the strip.
  const baselineWidth = isUnderline
    ? (StyleSheet.flatten(style)?.borderBottomWidth ?? 1)
    : 0;

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
  const indicator = (
    <Animated.View
      pointerEvents="none"
      testID={testID ? `${testID}-indicator` : undefined}
      style={[
        isUnderline
          ? {
              position: 'absolute',
              left: 0,
              bottom: -baselineWidth,
              height: 2,
              backgroundColor: paint.underline,
            }
          : {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              borderRadius: borderRadius.full,
              backgroundColor: paint.thumb,
            },
        indicatorStyle,
      ]}
    />
  );

  return (
    <TabsContext.Provider value={contextValue}>
      {fullWidth ? (
        <View style={[containerStyle, style]} testID={testID}>
          {isUnderline ? null : indicator}
          {children}
          {isUnderline ? indicator : null}
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
          {isUnderline ? null : indicator}
          {children}
          {isUnderline ? indicator : null}
        </ScrollView>
      )}
    </TabsContext.Provider>
  );
});

const TabComponent: React.FC<TabsTriggerProps> = ({
  value,
  label,
  icon,
  leadingIcon: LeadingIcon,
  count,
  isFocused,
  disabled = false,
  onPress: onPressProp,
  style,
  textStyle,
}) => {
  const {
    selectedValue,
    onValueChange,
    variant,
    paint,
    fullWidth,
    registerTrigger,
    reportTriggerLayout,
    reportFocused,
  } = useTabsContext('TabsTrigger');
  // The two paths meet here: an explicit `isFocused` (router adapter) wins;
  // otherwise selection comes from the bar's controlled `value`.
  const isSelected = isFocused ?? value === selectedValue;
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  // Native has no hover, so a held press borrows the hover paint — the only
  // other state defined. No press scale.
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const resolvedCount = count ?? 0;
  const showCount = resolvedCount > 0;
  const geometry = GEOMETRY[variant];
  const isUnderline = variant === 'underline';

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

  const labelColor = isSelected ? paint.selectedLabel : paint.idleLabel;
  const iconColor = isSelected ? paint.selectedIcon : paint.idleIcon;

  const triggerStyle = useMemo(
    (): WebCssStyle => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: geometry.paddingHorizontal,
      paddingRight: geometry.paddingHorizontal,
      paddingTop: geometry.paddingVertical,
      paddingBottom: geometry.paddingVertical,
      gap: geometry.gap,
      borderRadius: geometry.radius,
      // `ring-2`, no offset — read by the adopted sheet's `:focus-visible` rule.
      '--bloom-tabs-ring': paint.ring,
    }),
    [geometry, paint.ring],
  );

  const labelTextStyle = useMemo(
    (): TextStyle => ({
      // Selected underline tabs go medium, idle ones regular; pill labels are
      // medium in both states.
      ...TYPE_SCALE[isUnderline && !isSelected ? 'body-regular' : 'body-medium'],
      color: labelColor,
    }),
    [isUnderline, isSelected, labelColor],
  );

  const renderedIcon = LeadingIcon ? (
    <View {...webData({ bloomTabsIcon: '' })} style={{ flexShrink: 0 }}>
      <LeadingIcon width={geometry.icon} height={geometry.icon} fill={iconColor} />
    </View>
  ) : (
    (icon ?? null)
  );

  const showHoverLayer = !isUnderline && !isSelected && !disabled;

  return (
    <View
      ref={nodeRef}
      onLayout={(e) => {
        const { x, width } = e.nativeEvent.layout;
        reportTriggerLayout(value, { x, width });
      }}
      style={fullWidth ? { flex: 1 } : undefined}
    >
      <Pressable
        {...webData({ bloomTabsTrigger: variant })}
        style={[
          triggerStyle,
          fullWidth && { flex: 1 },
          disabled && { opacity: 0.5 },
          style,
        ]}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
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
        {showHoverLayer ? (
          <View
            pointerEvents="none"
            {...webData({ bloomTabsHover: '' })}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              borderRadius: geometry.radius,
              backgroundColor: paint.hover,
              opacity: hovered || pressed ? 1 : 0,
            }}
          />
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: geometry.labelGap }}>
          {renderedIcon}
          <Text
            {...webData({ bloomTabsLabel: '' })}
            numberOfLines={1}
            style={[labelTextStyle, textStyle]}
          >
            {label}
          </Text>
        </View>
        {showCount ? (
          <View
            style={{
              borderRadius: 4,
              paddingLeft: 4,
              paddingRight: 4,
              paddingTop: 1,
              paddingBottom: 1,
              backgroundColor: isSelected
                ? paint.countSelectedBackground
                : paint.countIdleBackground,
              opacity: isSelected ? 1 : 0.5,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                ...TYPE_SCALE['caption-1-medium'],
                color: isSelected ? paint.countSelectedForeground : paint.countIdleForeground,
              }}
            >
              {formatCount(resolvedCount)}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
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
