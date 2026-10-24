import type { ComponentType } from 'react';
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
export const ScrollArea: ComponentType<ScrollAreaProps> = function ScrollArea({
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
  return (
    <ScrollViewport
      {...indicator}
      {...props}
      className={[containerClassName, className].filter(Boolean).join(' ') || undefined}
      onScroll={onScroll}
      onLayout={onLayout}
      onContentSizeChange={onContentSizeChange}
      scrollEventThrottle={scrollEventThrottle}
      ref={ref}
    />
  );
};
