import type { ReactElement } from 'react';
import type { ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import type { ScrollAreaScrollbar } from '../layout/types';

/** Info passed to {@link VirtualListProps.renderItem} for each row. */
export interface VirtualListRenderItemInfo<T> {
  item: T;
  index: number;
}

/** Row renderer. Returns the element for a single item (or `null` to skip). */
export type VirtualListRenderItem<T> = (info: VirtualListRenderItemInfo<T>) => ReactElement | null;

/**
 * A header / empty / footer slot. Either a ready element or a thunk that
 * produces one — both `<X />` and `() => <X />` call sites are supported,
 * matching React Native `FlatList` slot ergonomics.
 */
export type VirtualListSlot = ReactElement | (() => ReactElement | null) | null | undefined;

/**
 * Props for {@link VirtualList} — the canonical cross-platform virtualized list
 * for the Oxy ecosystem. The shape is a precise drop-in for the `FlatList` /
 * `@legendapp/list` call sites it replaces: every accepted prop is listed
 * explicitly (no index signature, no `any`).
 */
export interface VirtualListProps<T> {
  /** Opt into the nearest Screen geometry/motion without wrapping this list in a ScrollView. */
  screen?: import('../screen/types').ScreenScrollOptions;
  /**
   * Web: retain measured row sizes across route unmounts in the nearest scroll
   * restoration scope. Use the same viewer/content identity as scroll offsets.
   * Combined with the route content id; native accepts it without extra behavior.
   */
  restorationKey?: string;
  /** Row data. */
  data?: readonly T[] | null;
  /** Renders one row. */
  renderItem?: VirtualListRenderItem<T>;
  /** Stable key for a row; strongly recommended for correct virtualization. */
  keyExtractor?: (item: T, index: number) => string;
  /** Rendered above the rows; scrolls away with the content. */
  ListHeaderComponent?: VirtualListSlot;
  /** Style for the view around `ListHeaderComponent`. */
  ListHeaderComponentStyle?: StyleProp<ViewStyle>;
  /** Rendered (in place of rows) when `data` is empty. */
  ListEmptyComponent?: VirtualListSlot;
  /** Rendered below the rows. */
  ListFooterComponent?: VirtualListSlot;
  /** Style for the outer list container. */
  style?: StyleProp<ViewStyle>;
  /** Style for the inner content wrapper (e.g. padding). */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * First-paint row-height estimate (px) used before a row is measured. On web
   * each row is measured after mount and this is only the initial guess; native
   * FlashList v2 measures without one.
   */
  estimatedItemSize?: number;
  /** Web: extra rows mounted beyond the viewport (virtualization overscan). */
  overscan?: number;
  /**
   * Called once each time the end of the list (footer included) comes within
   * `onEndReachedThreshold` viewports — native from the list's own scroller, web
   * from the Screen's (the window, or an element-kind panel's own element). Re-arms when the user scrolls back out of range or the row
   * count changes; never fires while `data` is empty. Guard on your own
   * in-flight flag: a second approach can come before the first page lands.
   */
  onEndReached?: () => void;
  /** Viewport-relative distance from the end that fires `onEndReached`. Default 2, as `FlatList`. */
  onEndReachedThreshold?: number;
  /**
   * Indices into `data` (`ListHeaderComponent` is not counted) of the rows that
   * stay pinned once scrolled past, until the next one takes their place. They
   * pin below the header that overlaps the list (`useHeaderDockInset()`), not
   * under it. Native FlashList and web; the `FlatList` fallback pins at its top
   * edge.
   */
  stickyHeaderIndices?: number[];
  /** Lays rows out as a grid of this many equal columns. Default 1. */
  numColumns?: number;
  /**
   * Sets `layout.span`: how many of the `numColumns` an item takes (1 by
   * default), so a full-width header row can sit in a grid. An item that does
   * not fit the rest of its row starts the next one. FlashList and web; the
   * `FlatList` fallback gives every item one column.
   */
  overrideItemLayout?: (
    layout: { span?: number },
    item: T,
    index: number,
    maxColumns: number,
  ) => void;
  /** Pull-to-refresh active flag (native). */
  refreshing?: boolean;
  /** Pull-to-refresh handler (native). Its spinner takes the theme's primary colour. */
  onRefresh?: () => void;
  /**
   * When the native scroll indicator shows (`never` hides it), as `ScrollArea`.
   * Web: the list scrolls its Screen's scroller, which owns the bar.
   */
  scrollbar?: ScrollAreaScrollbar;
  /** Native: whether a tap outside a focused input reaches the row or dismisses the keyboard. */
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  /** Native: whether dragging the list dismisses the keyboard. */
  keyboardDismissMode?: ScrollViewProps['keyboardDismissMode'];
  /** Test id applied to the outer container. */
  testID?: string;

  // --- FlashList / FlatList / @legendapp/list tuning knobs ---------------------
  // Honored by the native engine that understands them (FlashList when the app
  // installs it, `FlatList` otherwise); accepted-but-ignored elsewhere, and on
  // web, where the virtualizer manages its own mounted-row budget. Declared so
  // one call site type-checks on every platform and engine.
  removeClippedSubviews?: boolean;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  initialNumToRender?: number;
  recycleItems?: boolean;
  /** FlashList keeps it on by default; `false` turns it off. */
  maintainVisibleContentPosition?: boolean;
  /** FlashList: rows of one type recycle into each other. Give each row shape its own. */
  getItemType?: (item: T, index: number) => string | number | undefined;
  /** FlashList: how far beyond the viewport (px) rows are drawn ahead of scrolling. */
  drawDistance?: number;
  /** FlashList: the most row views kept for recycling. */
  maxItemsInRecyclePool?: number;
}

/** Imperative handle exposed via `ref`. */
export interface VirtualListHandle {
  /** Scroll to an absolute offset (px). Web scrolls the Screen's scroller: the document or its panel. */
  scrollToOffset: (params?: { offset?: number; animated?: boolean }) => void;
  /** Scroll to a coordinate. Web scrolls the Screen's scroller to `y`. */
  scrollTo: (params?: { x?: number; y?: number; animated?: boolean }) => void;
}
