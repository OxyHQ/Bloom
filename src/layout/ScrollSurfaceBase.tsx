import { useRef, useState, type ComponentType, type ComponentRef } from 'react';
import { Platform, StyleSheet, type View } from 'react-native';
import { WEB_POSITION_STICKY } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { usePaintedSurfaceFill } from '../surface/use-painted-surface-fill';
import {
  canStickScrollChrome,
  stickyFooterTranslation,
  scrollChromeFadeHeight,
} from './scroll-surface-sticky';
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
    stickyHeader,
    stickyFooter,
    className,
    contentClassName,
    hostStyle,
    fadeColor,
    matchSurfacePaint = false,
    fadeHeight = 24,
    testID,
    surface = 'secondary',
    scrollRef,
    label,
    fadeBottom = false,
    animatedHandler,
    contentContainerStyle,
    onLayout,
    ...props
  }: ScrollSurfaceProps) {
    const { colors } = useTheme();
    const host = useRef<ComponentRef<typeof View>>(null);
    const [viewport, setViewport] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [footerHeight, setFooterHeight] = useState(0);
    const hasChrome = stickyHeader != null || stickyFooter != null;
    const sticky = hasChrome && canStickScrollChrome(viewport, headerHeight, footerHeight);
    const color =
      fadeColor ??
      (surface === 'full'
        ? colors.background
        : surface === 'primary'
          ? colors.card
          : colors.backgroundSecondary);
    const paintedColor = usePaintedSurfaceFill(host, color, matchSurfacePaint);
    const edgeDepth = hasChrome
      ? scrollChromeFadeHeight(fadeHeight, viewport, sticky ? headerHeight + footerHeight : 0)
      : fadeHeight;
    const radius = StyleSheet.flatten(hostStyle)?.borderRadius;
    // Select the UI-thread metrics binding on native, without a JS observer.
    const handler = useAnimatedScrollHandler({}, []);
    const viewportOverlay = (
      <StyledView
        pointerEvents="none"
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          overflow: 'hidden',
          borderRadius: radius,
        }}
      >
        <ScrollSurfaceEdge
          inset={sticky ? headerHeight : 0}
          color={paintedColor}
          height={edgeDepth}
          testID={testID ? `${testID}-fade-top` : undefined}
        />
        {fadeBottom ? (
          <ScrollSurfaceEdge
            inset={sticky ? footerHeight : 0}
            color={paintedColor}
            height={edgeDepth}
            testID={testID ? `${testID}-fade-bottom` : undefined}
            bottom
          />
        ) : null}
      </StyledView>
    );
    return (
      <StyledView
        ref={host}
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
          viewportOverlay={viewportOverlay}
          contentContainerStyle={
            hasChrome ? [{ flexGrow: 1 }, contentContainerStyle] : contentContainerStyle
          }
          onLayout={(event) => {
            if (hasChrome) setViewport(event.nativeEvent.layout.height);
            onLayout?.(event);
          }}
          {...(hasChrome
            ? {
                removeClippedSubviews: false,
                stickyHeaderIndices:
                  Platform.OS !== 'web' && sticky && stickyHeader != null ? [0] : [],
              }
            : {})}
          animatedHandler={animatedHandler ?? handler}
        >
          {hasChrome
            ? [
                <ScrollChrome
                  key="header"
                  edge="top"
                  enabled={sticky}
                  color={paintedColor}
                  testID={testID ? `${testID}-sticky-header` : undefined}
                  onHeight={setHeaderHeight}
                >
                  {stickyHeader}
                </ScrollChrome>,
                <StyledView key="body" style={{ flexGrow: 1, flexShrink: 0 }}>
                  {children}
                </StyledView>,
                <ScrollChrome
                  key="footer"
                  edge="bottom"
                  enabled={sticky}
                  color={paintedColor}
                  testID={testID ? `${testID}-sticky-footer` : undefined}
                  onHeight={setFooterHeight}
                >
                  {stickyFooter}
                </ScrollChrome>,
              ]
            : children}
        </ScrollArea>
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

const AnimatedChrome = Animated.createAnimatedComponent(StyledView);
function ScrollChrome({
  children,
  edge,
  enabled,
  color,
  testID,
  onHeight,
}: {
  children: React.ReactNode;
  edge: 'top' | 'bottom';
  enabled: boolean;
  color: string;
  testID?: string;
  onHeight: (height: number) => void;
}) {
  const metrics = useScrollMetricsValue();
  const footerStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY:
            edge === 'bottom'
              ? stickyFooterTranslation(
                  metrics?.scrollY.value ?? 0,
                  metrics?.viewportHeight.value ?? 0,
                  metrics?.contentHeight.value ?? -1,
                  enabled,
                )
              : 0,
        },
      ],
    }),
    [edge, enabled, metrics?.scrollY, metrics?.viewportHeight, metrics?.contentHeight],
  );
  const baseStyle = {
    flexShrink: 0,
    zIndex: enabled ? Z_INDEX.raised : 0,
    backgroundColor: enabled ? color : 'transparent',
  };
  const layout = (event: import('react-native').LayoutChangeEvent) =>
    onHeight(event.nativeEvent.layout.height);
  return Platform.OS === 'web' ? (
    <StyledView
      testID={testID}
      onLayout={layout}
      style={[baseStyle, enabled ? { position: WEB_POSITION_STICKY, [edge]: 0 } : undefined]}
    >
      {children}
    </StyledView>
  ) : (
    <AnimatedChrome testID={testID} onLayout={layout} style={[baseStyle, footerStyle]}>
      {children}
    </AnimatedChrome>
  );
}

function ScrollSurfaceEdge({
  color,
  height,
  testID,
  bottom = false,
  inset = 0,
}: {
  color: string;
  height: number;
  testID?: string;
  bottom?: boolean;
  inset?: number;
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
        { position: 'absolute', left: 0, right: 0, [bottom ? 'bottom' : 'top']: inset, height },
        style,
      ]}
    >
      <EdgeScrim color={opaqueColor} edge={bottom ? 'bottom' : 'top'} />
    </Animated.View>
  );
}
