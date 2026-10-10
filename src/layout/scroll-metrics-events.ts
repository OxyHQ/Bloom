import type { NativeScrollEvent } from 'react-native';
import type { ScrollMetrics } from './scroll-metrics';

/** Shared by ordinary RN events and UI-thread animated events. */
export function recordScrollMetrics(metrics: ScrollMetrics | null, event: NativeScrollEvent): void {
  'worklet';
  if (!metrics) return;
  const contentHeight = Number.isFinite(event.contentSize.height)
    ? Math.max(0, event.contentSize.height)
    : metrics.contentHeight.value;
  const viewportHeight = Number.isFinite(event.layoutMeasurement.height)
    ? Math.max(0, event.layoutMeasurement.height)
    : metrics.viewportHeight.value;
  metrics.contentHeight.value = contentHeight;
  metrics.viewportHeight.value = viewportHeight;
  const max = Math.max(0, contentHeight - viewportHeight);
  if (Number.isFinite(event.contentOffset.y))
    metrics.scrollY.value = Math.min(max, Math.max(0, event.contentOffset.y));
}
