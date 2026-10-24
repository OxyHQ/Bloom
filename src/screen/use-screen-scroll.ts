import { animateMotion } from '../motion/recipes';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useCallback, useEffect, useId, useMemo } from 'react';
import {
  runOnJS,
  useAnimatedScrollHandler,
  useComposedEventHandler,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useScrollMetricsValue } from '../layout/scroll-metrics';
import { recordScrollMetrics } from '../layout/scroll-metrics-events';
import { useScreenContext, type ScreenContextValue } from './context';
import { useRegisterScreenScroller } from './reselect';
import type { ScreenScrollOptions } from './types';

type ScreenScrollState = Pick<
  ScreenContextValue,
  | 'active'
  | 'scrollY'
  | 'collapseProgress'
  | 'collapseTarget'
  | 'activeScrollerId'
  | 'contentInsetsHandled'
  | 'bottomInsetHandled'
  | 'topInset'
  | 'bottomInset'
>;

/**
 * Bind an animated ScrollView or virtualized list without moving frame work to JS.
 * Outside a Screen the list scrolls like any list: no chrome to drive, no insets.
 */
export function useScreenScroll({
  active: requestedActive = true,
  handler = null,
  restoration,
  scrollToOffset,
}: ScreenScrollOptions = {}) {
  const context = useScreenContext();
  const ownScrollY = useSharedValue(0);
  const ownProgress = useSharedValue(0);
  const ownTarget = useSharedValue(0);
  const ownScroller = useSharedValue<string | null>(null);
  const standalone = useMemo<ScreenScrollState>(
    () => ({
      active: true,
      scrollY: ownScrollY,
      collapseProgress: ownProgress,
      collapseTarget: ownTarget,
      activeScrollerId: ownScroller,
      contentInsetsHandled: true,
      bottomInsetHandled: true,
      topInset: 0,
      bottomInset: 0,
    }),
    [ownScrollY, ownProgress, ownTarget, ownScroller],
  );
  const screen: ScreenScrollState = context ?? standalone;
  const metrics = useScrollMetricsValue();
  const active = requestedActive && screen.active;
  const restoring = restoration?.restorePending ?? false;
  const id = useId();
  const previousY = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!active) return;
    screen.activeScrollerId.value = id;
    // Screens sharing one navigation state (a panel's routes) share its offset:
    // the scroller taking over publishes its own, never the previous screen's,
    // and at its top the chrome is expanded, as `onScroll` below would leave it.
    const y = previousY.value;
    screen.scrollY.value = y;
    if (y < 24 && screen.collapseTarget.value !== 0) {
      screen.collapseTarget.value = 0;
      animateMotion(screen.collapseProgress, 0, 'expand', reducedMotion);
    }
    return () => {
      if (screen.activeScrollerId.value === id) screen.activeScrollerId.value = null;
    };
  }, [active, id, screen, previousY, reducedMotion]);
  useRegisterScreenScroller(
    scrollToOffset ? { offset: () => previousY.value, scrollToOffset } : null,
    active && context !== null,
  );
  const record = useCallback(
    (event: NativeScrollEvent) =>
      restoration?.onScroll({ nativeEvent: event } as NativeSyntheticEvent<NativeScrollEvent>),
    [restoration?.onScroll],
  );
  const hasRestoration = restoration != null;
  const ownHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        if (!active || screen.activeScrollerId.value !== id) return;
        recordScrollMetrics(metrics, event);
        if (hasRestoration) runOnJS(record)(event);
        const y = Math.min(
          Math.max(0, event.contentOffset.y),
          Math.max(0, event.contentSize.height - event.layoutMeasurement.height),
        );
        const delta = y - previousY.value;
        previousY.value = y;
        screen.scrollY.value = y;
        if (restoring) return;
        const target = y < 24 ? 0 : delta > 3 ? 1 : delta < -3 ? 0 : screen.collapseTarget.value;
        if (target !== screen.collapseTarget.value) {
          screen.collapseTarget.value = target;
          animateMotion(screen.collapseProgress, target, 'expand', reducedMotion);
        }
      },
    },
    [screen, metrics, active, id, previousY, reducedMotion, hasRestoration, record, restoring],
  );
  const onScroll = useComposedEventHandler([ownHandler, active ? handler : null]);
  return {
    onScroll,
    scrollerId: id,
    contentInsets: {
      top: screen.contentInsetsHandled ? 0 : screen.topInset,
      bottom: (screen.bottomInsetHandled ?? screen.contentInsetsHandled) ? 0 : screen.bottomInset,
    },
    scrollY: screen.scrollY,
    collapseProgress: screen.collapseProgress,
  };
}
