import type { ComponentType, ReactNode } from 'react';
import Animated, { useAnimatedStyle, useAnimatedScrollHandler } from 'react-native-reanimated';
import { ScrollMetricsProvider, useScrollMetricsValue } from './scroll-metrics';
import { ScrollViewport } from './ScrollViewport';
import { useNativeScrollIndicator } from './use-native-scroll-indicator';
import type { ScrollAreaProps } from './types';

/**
 * A ScrollView that publishes its measurements to surrounding page chrome, with a scrollbar
 * drawn for the theme. On native the system's indicator already floats over the content and
 * hides itself, so this maps `scrollbar` onto what the platform offers (`never` hides it,
 * `always` keeps it on Android) and sets iOS's `indicatorStyle` for the theme; `size` has no
 * native meaning. The web fork (`ScrollArea.web.tsx`) draws Bloom's own overlay bar.
 */
export const ScrollArea: ComponentType<ScrollAreaProps> = function ScrollArea(props) {
  const metrics = useScrollMetricsValue();
  return props.viewportOverlay != null && !metrics ? (
    <ScrollMetricsProvider>
      <NativeScrollArea {...props} />
    </ScrollMetricsProvider>
  ) : (
    <NativeScrollArea {...props} />
  );
};
function NativeScrollArea({
  viewportOverlay,
  children,
  animatedHandler,
  onScroll,
  onLayout,
  onContentSizeChange,
  scrollEventThrottle,
  scrollbar,
  size: _size,
  ref,
  className,
  containerClassName,
  ...props
}: ScrollAreaProps) {
  const indicator = useNativeScrollIndicator(scrollbar);
  const handler = useAnimatedScrollHandler({}, []);
  return (
    <ScrollViewport
      {...indicator}
      {...props}
      removeClippedSubviews={viewportOverlay != null ? false : props.removeClippedSubviews}
      animatedHandler={viewportOverlay != null ? (animatedHandler ?? handler) : animatedHandler}
      className={[containerClassName, className].filter(Boolean).join(' ') || undefined}
      onScroll={onScroll}
      onLayout={onLayout}
      onContentSizeChange={onContentSizeChange}
      scrollEventThrottle={scrollEventThrottle}
      ref={ref}
    >
      {viewportOverlay != null
        ? [
            children,
            <NativeViewportOverlay key="viewport-overlay">{viewportOverlay}</NativeViewportOverlay>,
          ]
        : children}
    </ScrollViewport>
  );
}

/** Inside scroll content, the OS indicator paints above this inert decorative cell. */
function NativeViewportOverlay({ children }: { children: ReactNode }) {
  const metrics = useScrollMetricsValue();
  const pinned = useAnimatedStyle(
    () => ({
      height: metrics?.viewportHeight.value ?? 0,
      transform: [{ translateY: metrics?.scrollY.value ?? 0 }],
    }),
    [metrics?.viewportHeight, metrics?.scrollY],
  );
  return (
    <Animated.View
      pointerEvents="none"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="scroll-viewport-decoration"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, pinned]}
    >
      {children}
    </Animated.View>
  );
}
