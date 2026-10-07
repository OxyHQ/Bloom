import { useCallback } from 'react';
import type { ScrollViewProps } from 'react-native';
import { useScrollMetricsValue } from './scroll-metrics';

/** Events accepted by ordinary RN ScrollView, FlatList and SectionList. */
export type ScrollMetricsBindingOptions = Pick<ScrollViewProps, 'onScroll' | 'onLayout' | 'onContentSizeChange'>;

/** Bind one scrolling owner to the nearest ScrollMetricsProvider. No React updates per frame. */
export function useScrollMetricsBinding({ onScroll, onLayout, onContentSizeChange }: ScrollMetricsBindingOptions = {}) {
  const metrics = useScrollMetricsValue();
  const handleScroll = useCallback<NonNullable<ScrollViewProps['onScroll']>>(event => {
    if (metrics) {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      if (Number.isFinite(contentSize.height)) metrics.contentHeight.value = Math.max(0, contentSize.height);
      if (Number.isFinite(layoutMeasurement.height)) metrics.viewportHeight.value = Math.max(0, layoutMeasurement.height);
      const max = Math.max(0, metrics.contentHeight.value - metrics.viewportHeight.value);
      if (Number.isFinite(contentOffset.y)) metrics.scrollY.value = Math.min(max, Math.max(0, contentOffset.y));
    }
    onScroll?.(event);
  }, [metrics, onScroll]);
  const handleLayout = useCallback<NonNullable<ScrollViewProps['onLayout']>>(event => {
    const height = event.nativeEvent.layout.height;
    if (metrics && Number.isFinite(height)) {
      metrics.viewportHeight.value = Math.max(0, height);
      if (metrics.contentHeight.value >= 0) metrics.scrollY.value = Math.min(metrics.scrollY.value, Math.max(0, metrics.contentHeight.value - height));
    }
    onLayout?.(event);
  }, [metrics, onLayout]);
  const handleContentSizeChange = useCallback<NonNullable<ScrollViewProps['onContentSizeChange']>>((width, height) => {
    if (metrics && Number.isFinite(height)) {
      metrics.contentHeight.value = Math.max(0, height);
      metrics.scrollY.value = Math.min(metrics.scrollY.value, Math.max(0, height - metrics.viewportHeight.value));
    }
    onContentSizeChange?.(width, height);
  }, [metrics, onContentSizeChange]);
  return { onScroll: handleScroll, onLayout: handleLayout, onContentSizeChange: handleContentSizeChange, scrollEventThrottle: 16 };
}
