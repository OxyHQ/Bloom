import { useContext, type ComponentType } from 'react';
import { StyledScrollView } from '../styles/styled-primitives';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import type { ScrollAreaProps } from './types';
import { useScrollAreaEvents } from './use-scroll-area-events';

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
  scrollbar = 'scroll',
  size: _size,
  ref,
  ...props
}: ScrollAreaProps) {
  // Optional: a scroller must work outside a provider, with the system's own indicator.
  const isDark = useContext(BloomThemeContext)?.theme.isDark;
  const events = useScrollAreaEvents({
    onScroll,
    onLayout,
    onContentSizeChange,
    scrollEventThrottle,
  });
  return (
    <StyledScrollView
      indicatorStyle={isDark === undefined ? 'default' : isDark ? 'white' : 'black'}
      persistentScrollbar={scrollbar === 'always'}
      showsVerticalScrollIndicator={scrollbar !== 'never'}
      showsHorizontalScrollIndicator={scrollbar !== 'never'}
      {...props}
      {...events}
      ref={ref}
    />
  );
};
