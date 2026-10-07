import React, { forwardRef } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { useScrollMetricsBinding } from './use-scroll-metrics-binding';

/** A normal ScrollView that publishes its measurements to surrounding page chrome. */
export const ScrollArea = forwardRef<ScrollView, ScrollViewProps>(function ScrollArea({ onScroll, onLayout, onContentSizeChange, scrollEventThrottle, ...props }, ref) {
  const binding = useScrollMetricsBinding({ onScroll, onLayout, onContentSizeChange });
  return <ScrollView {...props} {...binding} scrollEventThrottle={scrollEventThrottle ?? binding.scrollEventThrottle} ref={ref} />;
});
