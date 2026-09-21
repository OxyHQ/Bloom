import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useCallback, useEffect, useId } from 'react';
import { runOnJS, useAnimatedScrollHandler, useComposedEventHandler, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { useScreen } from './context';
import type { ScreenScrollOptions } from './types';

/** Bind an animated ScrollView or virtualized list without moving frame work to JS. */
export function useScreenScroll({ active: requestedActive = true, handler = null, restoration }: ScreenScrollOptions = {}) {
  const screen = useScreen();
  const active = requestedActive && screen.active;
  const restoring = restoration?.restorePending ?? false;
  const id = useId();
  const previousY = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!active) return;
    screen.activeScrollerId.value = id;
    return () => { if (screen.activeScrollerId.value === id) screen.activeScrollerId.value = null; };
  }, [active, id, screen.activeScrollerId]);
  const record = useCallback((event: NativeScrollEvent) => restoration?.onScroll({ nativeEvent: event } as NativeSyntheticEvent<NativeScrollEvent>), [restoration?.onScroll]);
  const hasRestoration = restoration != null;
  const ownHandler = useAnimatedScrollHandler({ onScroll: event => {
    if (!active || screen.activeScrollerId.value !== id) return;
    if (hasRestoration) runOnJS(record)(event);
    const y = Math.min(Math.max(0, event.contentOffset.y), Math.max(0, event.contentSize.height - event.layoutMeasurement.height));
    const delta = y - previousY.value;
    previousY.value = y;
    screen.scrollY.value = y;
    if (restoring) return;
    const target = y < 24 ? 0 : delta > 3 ? 1 : delta < -3 ? 0 : screen.collapseTarget.value;
    if (target !== screen.collapseTarget.value) {
      screen.collapseTarget.value = target;
      screen.collapseProgress.value = reducedMotion ? target : withSpring(target, { duration: 380, dampingRatio: 1 });
    }
  } }, [screen, active, id, previousY, reducedMotion, hasRestoration, record, restoring]);
  const onScroll = useComposedEventHandler([ownHandler, handler]);
  return { onScroll, scrollerId: id, contentInsets: { top: screen.contentInsetsHandled ? 0 : screen.topInset, bottom: screen.contentInsetsHandled ? 0 : screen.bottomInset }, scrollY: screen.scrollY, collapseProgress: screen.collapseProgress };
}
