import type { ScrollViewProps } from 'react-native';
import { useAnimatedScrollHandler, useComposedEventHandler, type ScrollHandlerProcessed } from 'react-native-reanimated';
import { useScrollMetricsValue } from './scroll-metrics';
import { recordScrollMetrics } from './scroll-metrics-events';
import { useScrollMetricsBinding } from './use-scroll-metrics-binding';

export interface AnimatedScrollMetricsBindingOptions<Context extends Record<string, unknown> = Record<string, unknown>>
  extends Pick<ScrollViewProps, 'onLayout' | 'onContentSizeChange'> {
  /** Existing Reanimated handler, including tab-bar minimize or other animated scroll handlers. */
  handler?: ScrollHandlerProcessed<Context> | null;
}

/**
 * Bind an Animated ScrollView / virtualized list with metrics updated on the UI
 * thread. Composition preserves consumer drag and momentum subscriptions.
 */
export function useAnimatedScrollMetricsBinding<Context extends Record<string, unknown> = Record<string, unknown>>({
  handler = null, onLayout, onContentSizeChange,
}: AnimatedScrollMetricsBindingOptions<Context> = {}) {
  const metrics = useScrollMetricsValue();
  const measurements = useScrollMetricsBinding({ onLayout, onContentSizeChange });
  const ownHandler = useAnimatedScrollHandler<Context>({
    onScroll: event => { recordScrollMetrics(metrics, event); },
  }, [metrics]);
  const onScroll = useComposedEventHandler([ownHandler, handler]);
  return { ...measurements, onScroll };
}
