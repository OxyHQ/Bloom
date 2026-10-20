import React, { type ComponentType } from 'react';
import Animated, { useAnimatedStyle, useAnimatedScrollHandler } from 'react-native-reanimated';
import { EdgeScrim } from '../page-header/EdgeScrim';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import {
  ScrollMetricsProvider,
  useScrollMetricsValue,
  remainingScrollDistance,
} from './scroll-metrics';
import type { ScrollAreaProps, ScrollSurfaceProps } from './types';

/** A nested scroll surface owns its metrics; it never drives an enclosing screen's chrome. */
export function createScrollSurface(ScrollArea: ComponentType<ScrollAreaProps>) {
  function Content({
    children,
    className,
    contentClassName,
    surface = 'secondary',
    scrollRef,
    label,
    fadeBottom = false,
    chatId: _chatId,
    animatedHandler,
    ...props
  }: ScrollSurfaceProps) {
    const { colors } = useTheme();
    const color =
      surface === 'full'
        ? colors.background
        : surface === 'primary'
          ? colors.card
          : colors.backgroundSecondary;
    // Select the UI-thread metrics binding on native, without a JS observer.
    const handler = useAnimatedScrollHandler({}, []);
    return (
      <StyledView className={`relative min-h-0 ${className ?? ''}`}>
        <ScrollArea
          ref={scrollRef}
          accessibilityLabel={label}
          className="overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring"
          style={{ height: '100%' }}
          contentContainerClassName={contentClassName}
          {...props}
          animatedHandler={animatedHandler ?? handler}
        >
          {children}
        </ScrollArea>
        <ScrollSurfaceEdge color={color} />
        {fadeBottom ? <ScrollSurfaceEdge color={color} bottom /> : null}
      </StyledView>
    );
  }
  return function ScrollSurface(props: ScrollSurfaceProps) {
    return (
      <ScrollMetricsProvider>
        <Content {...props} />
      </ScrollMetricsProvider>
    );
  };
}

function ScrollSurfaceEdge({ color, bottom = false }: { color: string; bottom?: boolean }) {
  const metrics = useScrollMetricsValue();
  const scrollY = metrics?.scrollY;
  const style = useAnimatedStyle(
    () => ({
      opacity: Math.min(
        1,
        (bottom ? remainingScrollDistance(metrics) : Math.max(0, scrollY?.value ?? 0)) / 24,
      ),
    }),
    [metrics, scrollY, bottom],
  );
  return (
    <Animated.View
      pointerEvents="none"
      aria-hidden
      style={[
        { position: 'absolute', left: 0, right: 0, [bottom ? 'bottom' : 'top']: 0, height: 24 },
        style,
      ]}
    >
      <EdgeScrim color={color} edge={bottom ? 'bottom' : 'top'} />
    </Animated.View>
  );
}
