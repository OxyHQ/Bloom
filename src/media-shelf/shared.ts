import { IS_WEB } from '../styles/platform';

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
 * The offset a prev/next button scrolls to, clamped to the track.
 *
 * A `row` pages by most of a viewport (90%), so the item cut at the edge
 * becomes the first one of the next page, and the web track then snaps to the
 * nearest item start. A `paged` shelf passes its exact page (`columns` whole
 * columns and their gaps): from a resting page the next one starts exactly at
 * a column, and from anywhere else it lands on the nearest page boundary in
 * that direction, so a track a swipe left between columns never pages to an
 * offset no column starts at.
 */
export function shelfPageTarget(scroll: ShelfScroll, direction: -1 | 1, page?: number): number {
  const max = Math.max(0, scroll.content - scroll.viewport);
  if (page !== undefined && page > 0) {
    const index = scroll.x / page;
    // 1px of slack: a resting page's offset may be fractional.
    const nearest = Math.round(index);
    const current = Math.abs(index - nearest) * page <= 1 ? nearest : index;
    const next = direction > 0 ? Math.floor(current) + 1 : Math.ceil(current) - 1;
    return Math.min(max, Math.max(0, next * page));
  }
  const distance = Math.max(1, Math.round(scroll.viewport * 0.9));
  return Math.min(max, Math.max(0, scroll.x + direction * distance));
}

/**
 * The `paged` geometry for a track `viewport` wide: as many whole columns of at
 * least `minItemWidth` as fit in what is left after the two insets and the
 * `peek` (the slice of the next column left showing at the trailing edge), at
 * least one, and the width each column gets. `page` is the distance one page
 * scrolls: the columns and the gap after each.
 *
 * Returns zeros before the track is measured.
 */
export function shelfPageColumns(
  viewport: number,
  {
    minItemWidth,
    gap,
    inset = 0,
    peek = 0,
  }: { minItemWidth: number; gap: number; inset?: number; peek?: number },
): { columns: number; itemWidth: number; page: number } {
  if (!(viewport > 0)) return { columns: 0, itemWidth: 0, page: 0 };
  const available = Math.max(1, viewport - 2 * Math.max(0, inset) - Math.max(0, peek));
  // With a peek, the gap before the peeking column is part of the page.
  const room = peek > 0 ? available - gap : available;
  const { columns, itemWidth } = shelfGridColumns(Math.max(1, room), minItemWidth, gap);
  return { columns, itemWidth, page: columns * (itemWidth + gap) };
}

/**
 * The items of a `paged` shelf in columns of `rows`, top to bottom and then
 * across: items 0..rows-1 fill the first column. The last column may be short.
 */
export function shelfColumns<T>(items: readonly T[], rows: number): T[][] {
  const perColumn = Math.max(1, Math.floor(Number.isFinite(rows) ? rows : 1));
  const columns: T[][] = [];
  for (let index = 0; index < items.length; index += perColumn) {
    columns.push(items.slice(index, index + perColumn));
  }
  return columns;
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
