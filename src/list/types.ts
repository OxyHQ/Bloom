import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** Info passed to {@link VirtualListProps.renderItem} for each row. */
export interface VirtualListRenderItemInfo<T> {
  item: T;
  index: number;
}

/** Row renderer. Returns the element for a single item (or `null` to skip). */
export type VirtualListRenderItem<T> = (
  info: VirtualListRenderItemInfo<T>,
) => ReactElement | null;

/**
 * A header / empty / footer slot. Either a ready element or a thunk that
 * produces one — both `<X />` and `() => <X />` call sites are supported,
 * matching React Native `FlatList` slot ergonomics.
 */
export type VirtualListSlot =
  | ReactElement
  | (() => ReactElement | null)
  | null
  | undefined;

/**
 * Props for {@link VirtualList} — the canonical cross-platform virtualized list
 * for the Oxy ecosystem. The shape is a precise drop-in for the `FlatList` /
 * `@legendapp/list` call sites it replaces: every accepted prop is listed
 * explicitly (no index signature, no `any`).
 */
export interface VirtualListProps<T> {
  /** Row data. */
  data?: readonly T[] | null;
  /** Renders one row. */
  renderItem?: VirtualListRenderItem<T>;
  /** Stable key for a row; strongly recommended for correct virtualization. */
  keyExtractor?: (item: T, index: number) => string;
  /** Rendered above the rows; scrolls away with the content. */
  ListHeaderComponent?: VirtualListSlot;
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
   * each row is measured after mount and this is only the initial guess.
   */
  estimatedItemSize?: number;
  /** Web: extra rows mounted beyond the viewport (virtualization overscan). */
  overscan?: number;
  /** Called when the end of the list is approached (native pagination). */
  onEndReached?: () => void;
  /** Native: viewport-relative distance from the end that fires `onEndReached`. */
  onEndReachedThreshold?: number;
  /** Pull-to-refresh active flag (native). */
  refreshing?: boolean;
  /** Pull-to-refresh handler (native). */
  onRefresh?: () => void;
  /** Test id applied to the outer container. */
  testID?: string;

  // --- FlatList / @legendapp/list tuning knobs --------------------------------
  // Honored on native where applicable; accepted-but-ignored on web (the window
  // virtualizer manages its own mounted-row budget). Declared so the type stays
  // a precise drop-in for the existing call sites.
  removeClippedSubviews?: boolean;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  initialNumToRender?: number;
  recycleItems?: boolean;
  maintainVisibleContentPosition?: boolean;
}

/** Imperative handle exposed via `ref`. */
export interface VirtualListHandle {
  /** Scroll to an absolute offset (px). Web scrolls the document. */
  scrollToOffset: (params?: { offset?: number; animated?: boolean }) => void;
  /** Scroll to a coordinate. Web scrolls the document to `y`. */
  scrollTo: (params?: { x?: number; y?: number; animated?: boolean }) => void;
}
