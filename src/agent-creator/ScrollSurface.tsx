import { useId, useState, type ComponentType, type ReactNode } from 'react';
import { Platform, ScrollView, type ScrollViewProps } from 'react-native';
import { styled } from 'react-native-css';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { StyledView } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';

const ScrollSurfaceBase: ComponentType<Pick<ScrollViewProps, 'style' | 'contentContainerStyle'>> =
  ScrollView;
const StyledScrollView: ComponentType<ScrollViewProps & { contentContainerClassName?: string }> =
  styled(ScrollSurfaceBase, {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle',
  });

/** Source scroll surface: independent 24px edge fades; the header stays outside. */
export function ScrollSurface({
  children,
  className,
  contentClassName,
  surface = 'secondary',
  label,
  fadeBottom = false,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  surface?: 'primary' | 'secondary' | 'full';
  label?: string;
  fadeBottom?: boolean;
}) {
  const { colors } = useTheme();
  const id = useId().replace(/:/g, '');
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const fade = Math.min(1, Math.max(0, scrollTop) / 24);
  const bottomFade = fadeBottom
    ? Math.min(1, Math.max(0, contentHeight - viewportHeight - scrollTop) / 24)
    : 0;
  const background =
    surface === 'full'
      ? colors.background
      : surface === 'secondary'
        ? colors.backgroundSecondary
        : colors.card;
  const scroller: WebCssStyle = {
    flex: 1,
    height: '100%',
    scrollbarWidth: 'none',
    overscrollBehavior: 'contain',
  };
  const edge = (bottom: boolean, opacity: number) => {
    const mask = `linear-gradient(to ${bottom ? 'top' : 'bottom'}, black, transparent)`;
    const gradient: WebCssStyle = {
      opacity,
      backgroundImage: `linear-gradient(to ${bottom ? 'top' : 'bottom'}, ${background}, transparent)`,
    };
    const blur1: WebCssStyle = {
      opacity,
      backdropFilter: 'blur(1px)',
      maskImage: mask,
    };
    const blur4: WebCssStyle = {
      opacity,
      backdropFilter: 'blur(4px)',
      maskImage: mask,
    };
    return (
      <StyledView
        aria-hidden
        pointerEvents="none"
        className={`pointer-events-none absolute inset-x-0 ${bottom ? 'bottom-0' : 'top-0'} z-10`}
        style={{ height: 24 }}
      >
        {Platform.OS === 'web' ? (
          <>
            <StyledView
              className={`absolute inset-x-0 ${bottom ? 'bottom-0' : 'top-0'} h-6 backdrop-blur-[1px]`}
              style={blur1}
            />
            <StyledView
              className={`absolute inset-x-0 ${bottom ? 'bottom-0' : 'top-0'} h-4 backdrop-blur-[4px]`}
              style={blur4}
            />
            <StyledView
              className={`absolute inset-x-0 ${bottom ? 'bottom-0' : 'top-0'} h-6`}
              style={gradient}
            />
          </>
        ) : (
          <Svg width="100%" height={24} accessible={false} opacity={opacity}>
            <Defs>
              <LinearGradient
                id={`${id}-${bottom ? 'bottom' : 'top'}`}
                x1="0"
                y1={bottom ? '1' : '0'}
                x2="0"
                y2={bottom ? '0' : '1'}
              >
                <Stop offset="0" stopColor={background} />
                <Stop offset="1" stopColor={background} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height={24} fill={`url(#${id}-${bottom ? 'bottom' : 'top'})`} />
          </Svg>
        )}
      </StyledView>
    );
  };
  return (
    <StyledView className={`relative min-h-0 ${className ?? ''}`} style={{ flex: 1, minHeight: 0 }}>
      <StyledScrollView
        className="h-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring [scrollbar-width:none]"
        contentContainerClassName={contentClassName}
        accessibilityLabel={label}
        tabIndex={label ? 0 : undefined}
        showsVerticalScrollIndicator={false}
        style={Platform.OS === 'web' ? scroller : { flex: 1 }}
        contentContainerStyle={{
          paddingBottom: contentClassName === 'pb-4' ? 16 : 0,
        }}
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
        onContentSizeChange={(_width, height) => setContentHeight(height)}
        onScroll={(event) => setScrollTop(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {children}
      </StyledScrollView>
      {edge(false, fade)}
      {fadeBottom && edge(true, bottomFade)}
    </StyledView>
  );
}
