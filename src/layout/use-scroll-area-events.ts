import type { ScrollViewProps } from 'react-native';
import { useScrollMetricsValue } from './scroll-metrics';
import { useScrollMetricsBinding } from './use-scroll-metrics-binding';

type Events = Pick<
  ScrollViewProps,
  'onScroll' | 'onLayout' | 'onContentSizeChange' | 'scrollEventThrottle'
>;

/**
 * The scroll events a `ScrollArea` hands its `ScrollView`: bound to the surrounding
 * `ScrollMetricsProvider` when there is one, and the caller's own, untouched, when there is not.
 * Without a provider there is nothing to publish to, and attaching a listener (and a 16ms
 * throttle) to a scroller nobody listens to is a cost for nothing.
 */
export function useScrollAreaEvents(events: Events): Events {
  const bound = useScrollMetricsBinding(events);
  return useScrollMetricsValue() === null ? events : { ...bound, ...throttle(events, bound) };
}

/** The caller's throttle wins over the binding's. */
function throttle(events: Events, bound: Events): Pick<Events, 'scrollEventThrottle'> {
  return { scrollEventThrottle: events.scrollEventThrottle ?? bound.scrollEventThrottle };
}
