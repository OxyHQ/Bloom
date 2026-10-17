import type { Direction } from '../direction/types';

/** Modern browser scrollLeft is negative in RTL; return distance from inline start. */
export function inlineScrollOffset(scrollLeft: number, direction: Direction): number {
  return Math.max(0, direction === 'rtl' ? -scrollLeft : scrollLeft);
}
interface Bounds { left: number; right: number; width: number }
/** Geometry is physical; this works for unequal slide widths and either alignment. */
export function scrollOffsetForItem(track: Bounds, item: Bounds, scrollLeft: number, direction: Direction, align: 'start' | 'center' = 'start'): number {
  if (align === 'center') return scrollLeft + (item.left + item.right - track.left - track.right) / 2;
  return scrollLeft + (direction === 'rtl' ? item.right - track.right : item.left - track.left);
}
