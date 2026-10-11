import { useCallback } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollViewProps } from 'react-native';
import {
  runOnJS,
  useAnimatedScrollHandler,
  useComposedEventHandler,
  type ScrollHandlerProcessed,
} from 'react-native-reanimated';
import { useScrollMetricsValue } from './scroll-metrics';
import { recordScrollMetrics } from './scroll-metrics-events';
import { useScrollMetricsBinding } from './use-scroll-metrics-binding';

export interface AnimatedScrollMetricsBindingOptions<
  Context extends Record<string, unknown> = Record<string, unknown>,
> extends Pick<ScrollViewProps, 'onLayout' | 'onContentSizeChange'> {
  /** Optional ordinary RN observer, bridged to JS only when supplied (e.g. restoration.onScroll). */
  onScroll?: ScrollViewProps['onScroll'];
  /** Existing Reanimated handler, including tab-bar minimize or other animated scroll handlers. */
  handler?: ScrollHandlerProcessed<Context> | null;
}

/**
 * Bind an Animated ScrollView / virtualized list with metrics updated on the UI
 * thread. Composition preserves consumer drag and momentum subscriptions.
 */
export function useAnimatedScrollMetricsBinding<
  Context extends Record<string, unknown> = Record<string, unknown>,
>({
  handler = null,
  onScroll: observeScroll,
  onLayout,
  onContentSizeChange,
}: AnimatedScrollMetricsBindingOptions<Context> = {}) {
  const metrics = useScrollMetricsValue();
  if (observeScroll != null && typeof observeScroll !== 'function') {
    throw new Error(
      'Bloom useAnimatedScrollMetricsBinding onScroll expects a plain RN callback; pass a Reanimated handler through the handler option.',
    );
  }
  // The optional ordinary RN observer (for example scroll restoration) runs on
  // JS. Metrics and composed animated consumers remain on the UI thread.
  const reportScroll = useCallback(
    (event: NativeScrollEvent) => {
      observeScroll?.({ nativeEvent: event } as NativeSyntheticEvent<NativeScrollEvent>);
    },
    [observeScroll],
  );
  const reportsScroll = observeScroll != null;
  const measurements = useScrollMetricsBinding({ onLayout, onContentSizeChange });
  const ownHandler = useAnimatedScrollHandler<Context>(
    {
      onScroll: (event) => {
        recordScrollMetrics(metrics, event);
        if (reportsScroll) runOnJS(reportScroll)(event);
      },
    },
    [metrics, reportsScroll, reportScroll],
  );
  const onScroll = useComposedEventHandler([ownHandler, handler]);
  return { ...measurements, onScroll };
}
