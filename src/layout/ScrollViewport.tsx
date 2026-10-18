import { ScrollMetricsContext, useScrollMetricsValue } from './scroll-metrics';
import Animated from 'react-native-reanimated';
import { StyledScrollView } from '../styles/styled-primitives';
import type { ScrollAreaProps } from './types';
import { useScrollAreaEvents } from './use-scroll-area-events';
import { useAnimatedScrollMetricsBinding } from './use-animated-scroll-metrics-binding';

const AnimatedViewport = Animated.createAnimatedComponent(StyledScrollView);

/** One native scroll owner; animated handlers stay on the UI thread. */
export function ScrollViewport(props: ScrollAreaProps) {
  const metrics = useScrollMetricsValue();
  // Horizontal strips never own the vertical page chrome, even when nested
  // under its provider. Isolate layout, content-size and animated events alike.
  return (
    <ScrollMetricsContext.Provider value={props.horizontal ? null : metrics}>
      {props.animatedHandler === undefined ? (
        <PlainViewport {...props} />
      ) : (
        <AnimatedScrollViewport {...props} />
      )}
    </ScrollMetricsContext.Provider>
  );
}

function PlainViewport({
  animatedHandler: _handler,
  onScroll,
  onLayout,
  onContentSizeChange,
  scrollEventThrottle,
  ...props
}: ScrollAreaProps) {
  const events = useScrollAreaEvents({
    onScroll,
    onLayout,
    onContentSizeChange,
    scrollEventThrottle,
  });
  return <StyledScrollView {...props} {...events} />;
}

function AnimatedScrollViewport({
  animatedHandler,
  onScroll,
  onLayout,
  onContentSizeChange,
  scrollEventThrottle,
  ...props
}: ScrollAreaProps) {
  const events = useAnimatedScrollMetricsBinding({
    handler: animatedHandler,
    onScroll,
    onLayout,
    onContentSizeChange,
  });
  return (
    <AnimatedViewport {...props} {...events} scrollEventThrottle={scrollEventThrottle ?? 16} />
  );
}
