import type { ScrollHandlerProcessed } from 'react-native-reanimated';
import type { ComponentRef, Ref, RefObject } from 'react';
import type { ScrollView, ScrollViewProps, StyleProp, ViewStyle } from 'react-native';

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
  /** Reanimated scroll handler, composed on the UI thread with Bloom metrics. onScroll remains a plain JS observer. */
  animatedHandler?: ScrollHandlerProcessed<Record<string, unknown>>;
  /** Utilities for the scrolling viewport, resolved by Bloom's own interop. */
  className?: string;
  /** Utilities for the outer sized area on web; shares the viewport on native. */
  containerClassName?: string;
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
  /** Existing scroll owner: DOM element, ScrollView or virtualized list ref. No extra viewport is created. */
  target: RefObject<unknown> | 'document';
  /** Cross-axis clearance for persistent viewport chrome (document bars). */
  offset?: number;
  /** When the bar shows. Default `'scroll'`. */
  scrollbar?: Exclude<ScrollAreaScrollbar, 'never'>;
  /** The bar's thickness: `sm` 4px (default) or `md` 6px. */
  size?: 'sm' | 'md';
  /** The bar lies along the bottom edge instead of the inline end. */
  horizontal?: boolean;
  /** Room kept free at the track's ends, for chrome that floats over the scroller. */
  insets?: { start?: number; end?: number };
}

export interface ResizeHandleProps {
  /** Separator orientation; horizontal separators resize panel heights. */
  orientation?: 'vertical' | 'horizontal';
  /** Pointer went down on the grip. */
  onResizeStart?: () => void;
  /** Distance along the resize axis from the drag start, px. */
  onResize: (dx: number) => void;
  onResizeEnd?: () => void;
  /** Names the separator. `'Resize panels'` in English. */
  label?: string;
  /** Keyboard nudge (web: ←/→ move by 16). */
  onNudge?: (dx: number) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** A self-contained scroll viewport with shared scroll-edge effects. */
export interface ScrollSurfaceProps extends ScrollAreaProps {
  contentClassName?: string;
  surface?: 'primary' | 'secondary' | 'full';
  scrollRef?: Ref<ComponentRef<typeof ScrollView>>;
  label?: string;
  fadeBottom?: boolean;
  /** @deprecated No effect. Use Screen restoration for persistent scroll position. */
  chatId?: string;
}

/** A responsive command row: tools scroll while primary actions stay reachable. */
export interface ToolbarProps {
  children?: React.ReactNode;
  actions?: React.ReactNode;
  /** A summary or secondary row below the tools. */
  accessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}
