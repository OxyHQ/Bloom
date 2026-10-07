import React, { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { ScrollOffsetProvider } from './scroll-offset';

export interface ScrollMetrics {
  scrollY: SharedValue<number>;
  contentHeight: SharedValue<number>;
  viewportHeight: SharedValue<number>;
}

/** Internal scope boundary; overlay screens must not follow the page beneath them. */
export const ScrollMetricsContext = createContext<ScrollMetrics | null>(null);

/** Pair one scroller with its surrounding header/footer without adding a layout box. */
export function ScrollMetricsProvider({ children }: PropsWithChildren) {
  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(-1);
  const viewportHeight = useSharedValue(0);
  const value = useMemo(() => ({ scrollY, contentHeight, viewportHeight }), [scrollY, contentHeight, viewportHeight]);
  return <ScrollMetricsContext.Provider value={value}>
    <ScrollOffsetProvider value={scrollY}>{children}</ScrollOffsetProvider>
  </ScrollMetricsContext.Provider>;
}

export function useScrollMetricsValue(): ScrollMetrics | null {
  return useContext(ScrollMetricsContext);
}

/** Unmeasured and non-scrollable content has no hidden bottom edge. */
export function remainingScrollDistance(metrics: ScrollMetrics | null): number {
  'worklet';
  if (!metrics || metrics.viewportHeight.value <= 0 || metrics.contentHeight.value < 0) return 0;
  const max = Math.max(0, metrics.contentHeight.value - metrics.viewportHeight.value);
  return Math.max(0, max - Math.max(0, metrics.scrollY.value));
}
