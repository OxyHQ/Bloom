import { Platform } from 'react-native';

export const IS_WEB = Platform.OS === 'web';

/** Default gap between shelf items: 16 on web, 12 on native. */
export const SHELF_GAP = IS_WEB ? 16 : 12;

export interface ShelfScroll {
  /** Scroll offset. */
  x: number;
  /** Visible width. */
  viewport: number;
  /** Scrollable content width. */
  content: number;
}

/** Whether there is more to scroll to each side. 1px slack for fractional offsets. */
export function shelfOverflow({ x, viewport, content }: ShelfScroll): {
  previous: boolean;
  next: boolean;
} {
  if (viewport <= 0 || content <= viewport + 1) return { previous: false, next: false };
  return { previous: x > 1, next: x < content - viewport - 1 };
}

/**
 * The offset a prev/next button scrolls to: most of a viewport (90%), so the
 * item cut at the edge becomes the first one of the next page, clamped to the
 * track. The web track then snaps to the nearest item start.
 */
export function shelfPageTarget(scroll: ShelfScroll, direction: -1 | 1): number {
  const page = Math.max(1, Math.round(scroll.viewport * 0.9));
  const max = Math.max(0, scroll.content - scroll.viewport);
  return Math.min(max, Math.max(0, scroll.x + direction * page));
}

/**
 * The grid geometry for a container `width`: as many columns as fit at
 * `minItemWidth` or wider, at least one, and the width each column gets.
 * Returns `{ columns: 0, itemWidth: 0 }` before the container is measured.
 */
export function shelfGridColumns(
  width: number,
  minItemWidth: number,
  gap: number,
): { columns: number; itemWidth: number } {
  if (!(width > 0)) return { columns: 0, itemWidth: 0 };
  const min = Math.max(1, minItemWidth);
  const columns = Math.max(1, Math.floor((width + gap) / (min + gap)));
  const itemWidth = Math.floor(((width - gap * (columns - 1)) / columns) * 100) / 100;
  return { columns, itemWidth };
}

// ---------------------------------------------------------------------------
//  Web CSS — a hidden scrollbar and item snapping, neither of which an inline
//  style can carry through react-native-web. Hooks are `dataSet` attributes.
// ---------------------------------------------------------------------------

export const MEDIA_SHELF_STYLE_ID = 'bloom-media-shelf-web-css';

const TRACK = '[data-bloom-shelf-track]';
const ITEM = '[data-bloom-shelf-item]';

export const MEDIA_SHELF_CSS = `
${TRACK} {
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--bloom-shelf-inset, 0px);
}
${TRACK}::-webkit-scrollbar {
  display: none;
}
${ITEM} {
  scroll-snap-align: start;
}
@media (hover: none) {
  [data-bloom-shelf-arrows] {
    display: none;
  }
}
[data-bloom-shelf-link] {
  cursor: pointer;
  outline: none;
}
[data-bloom-shelf-link]:focus-visible {
  outline: 2px solid var(--bloom-shelf-ring, currentColor);
  outline-offset: 2px;
  border-radius: 4px;
}
`;

