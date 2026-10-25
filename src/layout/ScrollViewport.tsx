import { useContext, useEffect } from 'react';
import { SwipeRowScrollContext } from '../swipe-row/context';
import { webDataSet } from '../styles/web-data';
import { ScrollMetricsContext, useScrollMetricsValue } from './scroll-metrics';
import Animated from 'react-native-reanimated';
import { StyledScrollView } from '../styles/styled-primitives';
import type { ScrollAreaProps } from './types';
import { useScrollAreaEvents } from './use-scroll-area-events';
import { useAnimatedScrollMetricsBinding } from './use-animated-scroll-metrics-binding';

const AnimatedViewport = Animated.createAnimatedComponent(StyledScrollView);

/**
 * Taps on a control inside a scroller reach it while the keyboard is open.
 *
 * React Native's default (`never`) lets EVERY ancestor scroller take the first
 * tap to dismiss the keyboard, and a tap swallowed by any one of them never
 * reaches the control. Allo's composer sits inside three of Bloom's (panel,
 * pager, page): with the keyboard up, Send only closed the keyboard and the
 * message stayed in the field. `handled` still dismisses on a tap that no
 * control takes. A caller's own value wins.
 */
const PERSIST_TAPS = 'handled' as const;

/** One native scroll owner; animated handlers stay on the UI thread. */
export function ScrollViewport(props: ScrollAreaProps) {
  const metrics = useScrollMetricsValue();
  const swipe = useContext(SwipeRowScrollContext);
  const owner = props.horizontal ? swipe : null;
  useEffect(() => owner?.register(), [owner]);
  const ScrollGate = owner?.ScrollGate;
  const viewport =
    props.animatedHandler === undefined ? (
      <PlainViewport {...props} {...(owner ? webDataSet({ bloomSwipeScroll: '' }) : {})} />
    ) : (
      <AnimatedScrollViewport {...props} {...(owner ? webDataSet({ bloomSwipeScroll: '' }) : {})} />
    );
  // Horizontal strips never own the vertical page chrome, even when nested
  // under its provider. Isolate layout, content-size and animated events alike.
  return (
    <ScrollMetricsContext.Provider value={props.horizontal ? null : metrics}>
      {ScrollGate ? <ScrollGate>{viewport}</ScrollGate> : viewport}
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
  return <StyledScrollView keyboardShouldPersistTaps={PERSIST_TAPS} {...props} {...events} />;
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
    <AnimatedViewport
      keyboardShouldPersistTaps={PERSIST_TAPS}
      {...props}
      {...events}
      scrollEventThrottle={scrollEventThrottle ?? 16}
    />
  );
}
