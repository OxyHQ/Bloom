import { useContext } from 'react';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import type { ScrollAreaScrollbar } from './types';

/**
 * A native scroller's indicator props for Bloom's `scrollbar` vocabulary. The system's indicator
 * already floats over the content and hides itself, so `never` hides it, `always` keeps it on
 * Android, and iOS's `indicatorStyle` follows the theme. Shared by `ScrollArea` and the native
 * `VirtualList`, the scrollers that draw the system's bar rather than Bloom's own.
 */
export function useNativeScrollIndicator(scrollbar: ScrollAreaScrollbar = 'scroll') {
  // Optional: a scroller must work outside a provider, with the system's own indicator.
  const isDark = useContext(BloomThemeContext)?.theme.isDark;
  return {
    indicatorStyle: isDark === undefined ? 'default' : isDark ? 'white' : 'black',
    persistentScrollbar: scrollbar === 'always',
    showsVerticalScrollIndicator: scrollbar !== 'never',
    showsHorizontalScrollIndicator: scrollbar !== 'never',
  } as const;
}
