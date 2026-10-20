import { type ComponentType } from 'react';
import Animated, { useAnimatedStyle, useAnimatedScrollHandler } from 'react-native-reanimated';
import { EdgeScrim } from '../page-header/EdgeScrim';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { parseRgba } from '../theme/color-utils';
import { ScrollMetricsProvider, useScrollMetricsValue } from './scroll-metrics';
import type { ScrollAreaProps, ScrollSurfaceProps } from './types';

/** A nested scroll surface owns its metrics; it never drives an enclosing screen's chrome. */
export function createScrollSurface(ScrollArea: ComponentType<ScrollAreaProps>) {
  function Content({
    children,
    className,
    contentClassName,
    hostStyle,
    fadeColor,
    fadeHeight = 24,
    testID,
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
      fadeColor ??
      (surface === 'full'
        ? colors.background
        : surface === 'primary'
          ? colors.card
          : colors.backgroundSecondary);
    // Select the UI-thread metrics binding on native, without a JS observer.
    const handler = useAnimatedScrollHandler({}, []);
    return (
      <StyledView
        className={`relative min-h-0 ${className ?? ''}`}
        style={hostStyle}
        testID={testID ? `${testID}-viewport` : undefined}
      >
        <ScrollArea
          ref={scrollRef}
          testID={testID}
          accessibilityLabel={label}
          className="overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring"
          style={{ height: '100%' }}
          contentContainerClassName={contentClassName}
          {...props}
          animatedHandler={animatedHandler ?? handler}
        >
          {children}
        </ScrollArea>
        <ScrollSurfaceEdge
          color={color}
          height={fadeHeight}
          testID={testID ? `${testID}-fade-top` : undefined}
        />
        {fadeBottom ? (
          <ScrollSurfaceEdge
            color={color}
            height={fadeHeight}
            testID={testID ? `${testID}-fade-bottom` : undefined}
            bottom
          />
        ) : null}
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

function ScrollSurfaceEdge({
  color,
  height,
  testID,
  bottom = false,
}: {
  color: string;
  height: number;
  testID?: string;
  bottom?: boolean;
}) {
  const metrics = useScrollMetricsValue();
  const viewportHeight = metrics?.viewportHeight;
  const contentHeight = metrics?.contentHeight;
  const scrollY = metrics?.scrollY;
  // EdgeScrim accepts an opaque color; preserve a caller's alpha on the layer.
  const parsed = parseRgba(color);
  const opaqueColor = parsed ? `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})` : color;
  const alpha = parsed?.a ?? 1;
  const style = useAnimatedStyle(() => {
    const viewport = viewportHeight?.value ?? 0;
    const content = contentHeight?.value ?? -1;
    const range = Math.max(0, content - viewport);
    const offset = Math.max(0, Math.min(scrollY?.value ?? 0, range));
    const distance = bottom ? range - offset : offset;
    return {
      opacity:
        viewport > 0 && content >= 0 && range > 1 && distance > 1
          ? Math.min(1, distance / Math.max(1, height)) * alpha
          : 0,
    };
  }, [viewportHeight, contentHeight, scrollY, bottom, height, alpha]);
  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { position: 'absolute', left: 0, right: 0, [bottom ? 'bottom' : 'top']: 0, height },
        style,
      ]}
    >
      <EdgeScrim color={opaqueColor} edge={bottom ? 'bottom' : 'top'} />
    </Animated.View>
  );
}
