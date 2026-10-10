import React, { forwardRef, type ComponentType, type Ref } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { styled } from 'react-native-css';
import { useScrollMetricsBinding } from './use-scroll-metrics-binding';

export interface ScrollAreaProps extends ScrollViewProps {
  /** Utilities for the scrolling viewport, resolved by Bloom's own interop. */
  className?: string;
  /** Utilities for the inner content container. */
  contentContainerClassName?: string;
}

// Preserve the native instance type so styled forwards the imperative ref.
const StyledScrollView: ComponentType<ScrollAreaProps & { ref?: Ref<ScrollView> }> = styled(ScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

/** A ScrollView that publishes its measurements to surrounding page chrome. */
export const ScrollArea = forwardRef<ScrollView, ScrollAreaProps>(function ScrollArea({ onScroll, onLayout, onContentSizeChange, scrollEventThrottle, ...props }, ref) {
  const binding = useScrollMetricsBinding({ onScroll, onLayout, onContentSizeChange });
  return <StyledScrollView {...props} {...binding} scrollEventThrottle={scrollEventThrottle ?? binding.scrollEventThrottle} ref={ref} />;
});
