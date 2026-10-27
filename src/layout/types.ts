import type { BloomSize } from '../appearance';
import type { ScrollHandlerProcessed } from 'react-native-reanimated';
import type { ComponentRef, ReactNode, Ref, RefObject } from 'react';
import type { MotionSpec } from '../motion/spec';
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
  /** Layout of the outer host. `style` continues to size its inner ScrollArea. */
  hostStyle?: StyleProp<ViewStyle>;
  /** Actual backing fill when the semantic surface is composited by a parent. */
  fadeColor?: string;
  /** Depth of each scroll-edge fade, in pixels. Defaults to 24. */
  fadeHeight?: number;
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
  /** App-scale spacing; omitted size inherits BloomScope. */
  size?: BloomSize;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  /** A summary or secondary row below the tools. */
  accessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export interface AutoHideBarMotion {
  /** Collapsing. Default ease-out-quad over 150ms. */
  hide?: MotionSpec;
  /** Coming back, revealed or peeked. Default ease-out-cubic over 200ms. */
  show?: MotionSpec;
}

export interface AutoHideBarProps {
  /** The full bar (a `Toolbar`, a browser's address row). Drawn at `height`. */
  bar: ReactNode;
  /** What the collapsed strip shows: a page's host, a document's name. Strings are drawn muted. */
  summary?: ReactNode;
  /**
   * The owner's decision that the bar should step aside (a page scrolled down,
   * a reader mode). Hovering only peeks it; pressing the strip calls
   * `onReveal`, and the owner clears this to bring it back.
   */
  collapsed: boolean;
  /** The bar's height. Default 41. */
  height?: number;
  /** The strip left while collapsed. Default 20. */
  collapsedHeight?: number;
  /** The collapsed strip was pressed. */
  onReveal?: () => void;
  /** Hovering the strip shows the whole bar over the body for a while. Default true. */
  peek?: boolean;
  /** How long the pointer rests on the strip before the bar peeks, ms. Default 150. */
  peekDelay?: number;
  /** How long after the pointer leaves a peeked bar it collapses again, ms. Default 250. */
  unpeekDelay?: number;
  motion?: AutoHideBarMotion;
  /** The band behind the bar. Default: the fill of the surface it sits on. */
  background?: string;
  /** Names the strip's button. `"Show toolbar"` in English. */
  revealLabel?: string;
  /** The body under the bar: laid out once per change, never per frame. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
