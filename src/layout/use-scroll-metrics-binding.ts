import { useCallback } from 'react';
import type { ScrollViewProps } from 'react-native';
import { recordScrollMetrics } from './scroll-metrics-events';
import { useScrollMetricsValue } from './scroll-metrics';

/** Events accepted by ordinary RN ScrollView, FlatList and SectionList. */
export type ScrollMetricsBindingOptions = Pick<
  ScrollViewProps,
  'onScroll' | 'onLayout' | 'onContentSizeChange'
>;

/** Bind one scrolling owner to the nearest ScrollMetricsProvider. No React updates per frame. */
export function useScrollMetricsBinding({
  onScroll,
  onLayout,
  onContentSizeChange,
}: ScrollMetricsBindingOptions = {}) {
  const metrics = useScrollMetricsValue();
  // Reanimated types its processed handler as a function, but returns an object.
  // Reject that mismatch before an event instead of attempting to call it on JS.
  if (onScroll != null && typeof onScroll !== 'function') {
    throw new Error(
      'Bloom useScrollMetricsBinding expects a plain RN onScroll callback. Use useAnimatedScrollMetricsBinding({ handler }) for Reanimated handlers.',
    );
  }
  const handleScroll = useCallback<NonNullable<ScrollViewProps['onScroll']>>(
    (event) => {
      recordScrollMetrics(metrics, event.nativeEvent);
      onScroll?.(event);
    },
    [metrics, onScroll],
  );
  const handleLayout = useCallback<NonNullable<ScrollViewProps['onLayout']>>(
    (event) => {
      const height = event.nativeEvent.layout.height;
      if (metrics && Number.isFinite(height)) {
        metrics.viewportHeight.value = Math.max(0, height);
        if (metrics.contentHeight.value >= 0)
          metrics.scrollY.value = Math.min(
            metrics.scrollY.value,
            Math.max(0, metrics.contentHeight.value - height),
          );
      }
      onLayout?.(event);
    },
    [metrics, onLayout],
  );
  const handleContentSizeChange = useCallback<NonNullable<ScrollViewProps['onContentSizeChange']>>(
    (width, height) => {
      if (metrics && Number.isFinite(height)) {
        metrics.contentHeight.value = Math.max(0, height);
        metrics.scrollY.value = Math.min(
          metrics.scrollY.value,
          Math.max(0, height - metrics.viewportHeight.value),
        );
      }
      onContentSizeChange?.(width, height);
    },
    [metrics, onContentSizeChange],
  );
  return {
    onScroll: handleScroll,
    onLayout: handleLayout,
    onContentSizeChange: handleContentSizeChange,
    scrollEventThrottle: 16,
  };
}
