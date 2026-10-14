import type { ScrollBarProps } from './types';

/**
 * The overlay scrollbar for a scroller of your own. On native the system's indicator already
 * floats over the content and hides itself, so there is nothing to draw: this renders nothing
 * and the scroller keeps its indicator. The web fork draws Bloom's bar over the scroller.
 */
export function ScrollBar(_props: ScrollBarProps) {
  return null;
}
