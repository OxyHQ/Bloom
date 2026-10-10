import React, { useRef, useState, type ReactNode, type Ref } from 'react';
import { Platform, ScrollView, type ScrollViewProps } from 'react-native';
import { styled } from 'react-native-css';
import { EdgeScrim } from '../page-header/EdgeScrim';
import { StyledView } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
const StyledScrollView: React.ComponentType<
  ScrollViewProps & {
    className?: string;
    contentContainerClassName?: string;
    ref?: Ref<ScrollView>;
  }
> = styled(ScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});
export function ScrollSurface({
  children,
  className,
  contentClassName,
  surface = 'secondary',
  scrollRef,
  label,
  fadeBottom = false,
  chatId: _chatId,
  ...props
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  surface?: 'primary' | 'secondary' | 'full';
  scrollRef?: Ref<ScrollView>;
  label?: string;
  chatId?: string;
  fadeBottom?: boolean;
} & ScrollViewProps) {
  const { colors } = useTheme(),
    [fade, setFade] = useState(0),
    [bottomFade, setBottomFade] = useState(0),
    height = useRef(0),
    content = useRef(0),
    offset = useRef(0);
  const update = () => {
    setFade(Math.min(1, Math.max(0, offset.current) / 24));
    setBottomFade(Math.min(1, Math.max(0, content.current - height.current - offset.current) / 24));
  };
  const color =
    surface === 'full'
      ? colors.background
      : surface === 'primary'
        ? colors.card
        : colors.backgroundSecondary;
  return (
    <StyledView className={`relative min-h-0 ${className ?? ''}`}>
      <StyledScrollView
        ref={scrollRef}
        accessibilityLabel={label}
        showsVerticalScrollIndicator={false}
        className="h-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring [scrollbar-width:none]"
        contentContainerClassName={contentClassName}
        {...props}
        onLayout={(event) => {
          height.current = event.nativeEvent.layout.height;
          update();
          props.onLayout?.(event);
        }}
        onContentSizeChange={(w, h) => {
          content.current = h;
          update();
          props.onContentSizeChange?.(w, h);
        }}
        onScroll={(event) => {
          offset.current = event.nativeEvent.contentOffset.y;
          update();
          props.onScroll?.(event);
        }}
        scrollEventThrottle={16}
      >
        {children}
      </StyledScrollView>
      {[false, ...(fadeBottom ? [true] : [])].map((bottom) => (
        <StyledView
          key={String(bottom)}
          pointerEvents="none"
          aria-hidden
          style={{
            position: 'absolute',
            insetInlineStart: 0,
            insetInlineEnd: 0,
            [bottom ? 'bottom' : 'top']: 0,
            height: 24,
            opacity: bottom ? bottomFade : fade,
          }}
        >
          {Platform.OS === 'web' &&
            [1, 4].map((blur, i) => (
              <StyledView
                key={blur}
                className={`absolute inset-x-0 ${bottom ? 'bottom-0' : 'top-0'} ${i ? 'h-4 backdrop-blur-[4px]' : 'h-6 backdrop-blur-[1px]'}`}
                style={
                  {
                    backdropFilter: `blur(${blur}px)`,
                    maskImage: `linear-gradient(to ${bottom ? 'top' : 'bottom'}, black, transparent)`,
                  } as WebCssStyle
                }
              />
            ))}
          <EdgeScrim color={color} edge={bottom ? 'bottom' : 'top'} />
        </StyledView>
      ))}
    </StyledView>
  );
}
