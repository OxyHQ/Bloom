import type { ComponentRef, Ref, RefObject } from 'react';
import type { ScrollView, ScrollViewProps } from 'react-native';

/**
 * When the scrollbar is drawn:
 * - `scroll` (default): while the content is scrolling and a moment after, and while the pointer
 *   is on the bar;
 * - `hover`: while the pointer is anywhere over the area;
 * - `always`: whenever there is something to scroll;
 * - `never`: not at all — the area still scrolls.
 */
export type ScrollAreaScrollbar = 'scroll' | 'hover' | 'always' | 'never';

export interface ScrollAreaProps extends ScrollViewProps {
  /** Utilities for the scrolling viewport, resolved by Bloom's own interop. */
  className?: string;
  /** Utilities for the inner content container. */
  contentContainerClassName?: string;
  /** When the scrollbar shows. Default `'scroll'`. */
  scrollbar?: ScrollAreaScrollbar;
  /** The bar's thickness: `sm` 4px (default) or `md` 6px, each growing 2px under the pointer. */
  size?: 'sm' | 'md';
  /** The underlying `ScrollView`: `scrollTo`, `scrollToEnd` and the rest work on it. */
  ref?: Ref<ComponentRef<typeof ScrollView>>;
}

export interface ScrollBarProps {
  /** The scroller this bar belongs to: a `ScrollView` ref (a reanimated one works). */
  target: RefObject<Pick<ComponentRef<typeof ScrollView>, 'getScrollableNode'> | null>;
  /** When the bar shows. Default `'scroll'`. */
  scrollbar?: Exclude<ScrollAreaScrollbar, 'never'>;
  /** The bar's thickness: `sm` 4px (default) or `md` 6px. */
  size?: 'sm' | 'md';
  /** The bar lies along the bottom edge instead of the inline end. */
  horizontal?: boolean;
  /** Room kept free at the track's ends, for chrome that floats over the scroller. */
  insets?: { start?: number; end?: number };
}
