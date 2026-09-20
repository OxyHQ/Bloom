import React, { forwardRef, useCallback, useRef, useState } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { EdgeScrim } from '../page-header/EdgeScrim';
import { parseRgba } from '../theme/color-utils';

interface SidebarScrollAreaProps extends ScrollViewProps {
  /** Actual opaque surface behind this scroll region. */
  fadeColor: string;
  fadeHeight?: number;
}

const EDGE_THRESHOLD = 1;

/** Internal scroll viewport: fades describe content beyond the visible edges. */
export const SidebarScrollArea = forwardRef<ScrollView, SidebarScrollAreaProps>(function SidebarScrollArea(
  { fadeColor, fadeHeight = 40, style, children, testID, onLayout, onContentSizeChange, onScroll, scrollEventThrottle = 16, ...props },
  ref,
) {
  const topFade = useSharedValue(0);
  const bottomFade = useSharedValue(0);
  const metrics = useRef({ height: 0, content: 0, offset: 0 });
  const [edges, setEdges] = useState({ top: false, bottom: false });
  const updateEdges = useCallback(() => {
    const { height, content, offset } = metrics.current;
    const range = Math.max(0, content - height);
    const y = Math.max(0, Math.min(offset, range));
    const overflow = height > 0 && range > EDGE_THRESHOLD;
    const top = overflow && y > EDGE_THRESHOLD;
    const bottom = overflow && range - y > EDGE_THRESHOLD;
    topFade.value = overflow ? Math.min(1, y / Math.max(1, fadeHeight)) : 0;
    bottomFade.value = overflow ? Math.min(1, (range - y) / Math.max(1, fadeHeight)) : 0;
    setEdges(previous => previous.top === top && previous.bottom === bottom ? previous : { top, bottom });
  }, [topFade, bottomFade, fadeHeight]);
  // SVG never receives alpha inside stopColor; it travels on the containing view.
  const parsed = parseRgba(fadeColor);
  const color = parsed ? `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})` : fadeColor;
  const opacity = parsed?.a ?? 1;
  const topStyle = useAnimatedStyle(() => ({ opacity: topFade.value * opacity }), [topFade, opacity]);
  const bottomStyle = useAnimatedStyle(() => ({ opacity: bottomFade.value * opacity }), [bottomFade, opacity]);
  const prefix = testID ?? 'sidebar-scroll';
  return <View testID={`${prefix}-viewport`} style={[{ minHeight: 0, position: 'relative' }, style]}>
    <ScrollView {...props} ref={ref} testID={testID} style={{ flexGrow: 1, flexShrink: 1, minHeight: 0 }}
      scrollEventThrottle={scrollEventThrottle}
      onLayout={event => { metrics.current.height = event.nativeEvent.layout.height; updateEdges(); onLayout?.(event); }}
      onContentSizeChange={(width, height) => { metrics.current.content = height; updateEdges(); onContentSizeChange?.(width, height); }}
      onScroll={event => { metrics.current.offset = event.nativeEvent.contentOffset.y; metrics.current.height = event.nativeEvent.layoutMeasurement.height; metrics.current.content = event.nativeEvent.contentSize.height; updateEdges(); onScroll?.(event); }}>
      {children}
    </ScrollView>
    {edges.top && <Animated.View testID={`${prefix}-fade-top`} pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: fadeHeight }, topStyle]}><EdgeScrim color={color} /></Animated.View>}
    {edges.bottom && <Animated.View testID={`${prefix}-fade-bottom`} pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height: fadeHeight, transform: [{ rotate: '180deg' }] }, bottomStyle]}><EdgeScrim color={color} /></Animated.View>}
  </View>;
});
SidebarScrollArea.displayName = 'SidebarScrollArea';
