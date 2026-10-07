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

// Narrow only the styled mapping input to avoid ScrollViewProps' recursive
// dot-path union. The public component retains the complete ScrollView contract.
const ScrollAreaBase: ComponentType<Pick<ScrollViewProps, 'style' | 'contentContainerStyle'>> = ScrollView;
const StyledScrollView: ComponentType<ScrollAreaProps & { ref?: Ref<ScrollView> }> = styled(ScrollAreaBase, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

/** A ScrollView that publishes its measurements to surrounding page chrome. */
export const ScrollArea = forwardRef<ScrollView, ScrollAreaProps>(function ScrollArea({ onScroll, onLayout, onContentSizeChange, scrollEventThrottle, ...props }, ref) {
  const binding = useScrollMetricsBinding({ onScroll, onLayout, onContentSizeChange });
  return <StyledScrollView {...props} {...binding} scrollEventThrottle={scrollEventThrottle ?? binding.scrollEventThrottle} ref={ref} />;
});
