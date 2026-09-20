import React, { forwardRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useScreenScroll } from './use-screen-scroll';
import type { ScreenScrollViewProps } from './types';

export const ScreenScrollView = forwardRef<ScrollView, ScreenScrollViewProps>(function ScreenScrollView({ active, handler, restoration, contentContainerStyle, children, style, ...props }, ref) {
  const scroll = useScreenScroll({ active, handler, restoration });
  const contentStyle = StyleSheet.flatten(contentContainerStyle);
  return <Animated.ScrollView {...props} ref={ref} style={[style, restoration?.restorePending ? { opacity: 0 } : null]} onScroll={scroll.onScroll} scrollEventThrottle={16} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} contentContainerStyle={[contentContainerStyle, { paddingTop: scroll.contentInsets.top + Number(contentStyle?.paddingTop ?? contentStyle?.paddingVertical ?? contentStyle?.padding ?? 0), paddingBottom: scroll.contentInsets.bottom + Number(contentStyle?.paddingBottom ?? contentStyle?.paddingVertical ?? contentStyle?.padding ?? 0) }]}>{children}</Animated.ScrollView>;
});
