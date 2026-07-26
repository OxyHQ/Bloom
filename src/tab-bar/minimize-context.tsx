/**
 * Ported from expo-glass-tabs v0.1.1 — src/minimize-context.tsx
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
 *
 * The shared 0..1 "minimize" progress the tab bar interpolates on, plus the
 * scroll handler that drives it. Reanimated only — no platform imports.
 */
import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import {
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Spring, not timing: scroll direction flips mid-animation constantly, and a
 * spring retargets while preserving velocity — a timing curve would restart
 * from zero and feel mechanical. Critically damped (ratio 1): no overshoot and
 * no long settling tail, which matters because the bar animates layout.
 */
export const MINIMIZE_SPRING = { duration: 380, dampingRatio: 1 };

/** Scroll offset below which the bar is always expanded (px). */
const TOP_ZONE = 24;
/** Per-event scroll delta that counts as a deliberate direction change (px). */
const DIRECTION_THRESHOLD = 3;

export type MinimizeState = {
  /** 0 = expanded (icons + labels), 1 = minimized (icons only). */
  progress: SharedValue<number>;
  /** Last requested target — lets writers avoid restarting the spring. */
  target: SharedValue<number>;
};

const MinimizeContext = createContext<MinimizeState | null>(null);

/**
 * Wrap the tab tree once. Screens then call `useMinimizeOnScroll()` and the bar
 * reads the same progress, so scrolling any screen minimizes the bar.
 */
export function TabBarMinimizeProvider({ children }: PropsWithChildren) {
  const progress = useSharedValue(0);
  const target = useSharedValue(0);
  const state = useMemo(() => ({ progress, target }), [progress, target]);
  return <MinimizeContext.Provider value={state}>{children}</MinimizeContext.Provider>;
}

TabBarMinimizeProvider.displayName = 'TabBarMinimizeProvider';

/** Full minimize state — used by the bar, the buttons and the scroll hook. */
export function useMinimizeState(): MinimizeState {
  const shared = useContext(MinimizeContext);
  // Local fallback keeps screens working when rendered outside the provider
  // (e.g. a web tab layout with no floating bar). Hooks run unconditionally so
  // the order is stable whether or not a provider is present.
  const progress = useSharedValue(0);
  const target = useSharedValue(0);
  const local = useMemo(() => ({ progress, target }), [progress, target]);
  return shared ?? local;
}

/** The animated 0..1 minimize progress (what styles interpolate on). */
export function useTabBarMinimized(): SharedValue<number> {
  return useMinimizeState().progress;
}

/**
 * Retarget the minimize spring — no-op when already heading to `next`, so
 * per-frame scroll events never restart (and visibly stutter) the animation.
 * Callable from both threads.
 */
export function setMinimized(state: MinimizeState, next: 0 | 1) {
  'worklet';
  if (state.target.value !== next) {
    state.target.value = next;
    state.progress.value = withSpring(next, MINIMIZE_SPRING);
  }
}

/**
 * Scroll handler for `Animated.ScrollView`. Scrolling down minimizes the tab
 * bar, scrolling up (or being near the top) expands it. Offsets are clamped to
 * the scrollable range so rubber-band overscroll can't flip the direction for a
 * frame and flicker the bar.
 */
export function useMinimizeOnScroll() {
  const state = useMinimizeState();
  const previousY = useSharedValue(0);

  // CRITICAL — `state` and `previousY` must stay in the dependency array. On
  // web WITHOUT the react-native-worklets babel plugin (the production reality
  // for every Oxy RN-Web app) reanimated cannot auto-detect what a worklet
  // reads, so it drives the handler off its deps instead; an omitted or empty
  // array binds the handler once against the first render's values. Native
  // (plugin present) auto-tracks and ignores the extra deps, so listing them is
  // correct on both platforms. Same rule as every mapper in `TabBarBase`.
  return useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        const maxY = Math.max(event.contentSize.height - event.layoutMeasurement.height, 0);
        const y = Math.min(Math.max(event.contentOffset.y, 0), maxY);
        const dy = y - previousY.value;
        previousY.value = y;

        if (y < TOP_ZONE) {
          setMinimized(state, 0);
        } else if (dy > DIRECTION_THRESHOLD) {
          setMinimized(state, 1);
        } else if (dy < -DIRECTION_THRESHOLD) {
          setMinimized(state, 0);
        }
      },
    },
    [state, previousY],
  );
}
