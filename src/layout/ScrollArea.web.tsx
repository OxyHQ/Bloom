import { useCallback, useRef } from 'react';
import type { ComponentRef, ComponentType } from 'react';
import type { ScrollView } from 'react-native';
import { StyledScrollView, StyledView } from '../styles/styled-primitives';
import { ScrollBar } from './ScrollBar.web';
import type { ScrollAreaProps } from './types';
import { useScrollAreaEvents } from './use-scroll-area-events';

/**
 * A ScrollView that publishes its measurements to surrounding page chrome, with Bloom's
 * scrollbar (`ScrollBar`): themed, compact, drawn OVER the content, hidden when not needed.
 * Wheel, touch, keyboard and `scrollTo` are the browser's. `ref` is the `ScrollView`; `style`
 * and `testID` are the area's (give it the size), the rest belongs to the scroller.
 */
export const ScrollArea: ComponentType<ScrollAreaProps> = function ScrollArea({
  onScroll,
  onLayout,
  onContentSizeChange,
  scrollEventThrottle,
  scrollbar = 'scroll',
  size = 'sm',
  horizontal = false,
  scrollIndicatorInsets,
  style,
  testID,
  ref,
  ...props
}: ScrollAreaProps) {
  const events = useScrollAreaEvents({
    onScroll,
    onLayout,
    onContentSizeChange,
    scrollEventThrottle,
  });
  const scroller = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const attach = useCallback(
    (node: ComponentRef<typeof ScrollView> | null) => {
      scroller.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  return (
    <StyledView
      className="relative min-h-0 min-w-0"
      style={[{ flexShrink: 1 }, style]}
      testID={testID}
    >
      <StyledScrollView
        {...props}
        {...events}
        ref={attach}
        {...(horizontal ? { horizontal: true } : null)}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 1, flexShrink: 1, minHeight: 0 }}
      />
      {scrollbar === 'never' ? null : (
        <ScrollBar
          target={scroller}
          scrollbar={scrollbar}
          size={size}
          horizontal={Boolean(horizontal)}
          insets={
            horizontal
              ? { start: scrollIndicatorInsets?.left, end: scrollIndicatorInsets?.right }
              : { start: scrollIndicatorInsets?.top, end: scrollIndicatorInsets?.bottom }
          }
        />
      )}
    </StyledView>
  );
};
