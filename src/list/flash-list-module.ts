/**
 * The optional-peer boundary for `@shopify/flash-list` (v2).
 *
 * An app that never draws a long list must not be made to install another
 * native list, so FlashList is an OPTIONAL peer: the native `VirtualList`
 * recycles rows through it when the app has it, and stays on `FlatList`
 * otherwise. It is loaded in the one shape Metro treats as optional: a
 * `require()` of a string literal as a DIRECT statement of a `try` block (the
 * `typeof require` guard stays outside it). Same boundary as
 * `tab-pager/expo-router/pager-view-module.ts`.
 *
 * Only the native `VirtualList` reaches this file; the web fork windows with
 * `@tanstack/react-virtual`, so the package never enters a web bundle.
 */
import type { ReactElement, Ref } from 'react';
import type { FlatListProps } from 'react-native';

declare const require: (moduleName: string) => unknown;

/** What a list ref answers, as far as Bloom calls it — FlashList's and FlatList's alike. */
export interface ListScrollHandle {
  scrollToOffset(params: { offset: number; animated?: boolean }): void;
}

/**
 * The slice of `FlashListProps` Bloom passes: the props it shares with
 * `FlatList`, plus its own recycling knobs. Hand-written rather than imported so
 * no flash-list type reaches Bloom's emitted declarations: an app that skips the
 * optional peer must not inherit a missing-module error from them.
 */
export type FlashListLikeProps<T> = Pick<
  FlatListProps<T>,
  | 'data'
  | 'keyExtractor'
  | 'ListHeaderComponent'
  | 'ListEmptyComponent'
  | 'ListFooterComponent'
  | 'style'
  | 'contentContainerStyle'
  | 'scrollEventThrottle'
  | 'onEndReached'
  | 'onEndReachedThreshold'
  | 'refreshControl'
  | 'stickyHeaderIndices'
  | 'numColumns'
  | 'ListHeaderComponentStyle'
  | 'keyboardShouldPersistTaps'
  | 'keyboardDismissMode'
  | 'indicatorStyle'
  | 'persistentScrollbar'
  | 'showsVerticalScrollIndicator'
  | 'showsHorizontalScrollIndicator'
  | 'testID'
> & {
  ref?: Ref<ListScrollHandle>;
  renderItem: (info: { item: T; index: number }) => ReactElement | null;
  /** A reanimated event handler, attached to the native scroller on the UI thread. */
  onScroll?: unknown;
  getItemType?: (item: T, index: number) => string | number | undefined;
  maintainVisibleContentPosition?: { disabled?: boolean };
  overrideItemLayout?: (
    layout: { span?: number },
    item: T,
    index: number,
    maxColumns: number,
  ) => void;
  stickyHeaderConfig?: { offset?: number };
  drawDistance?: number;
  maxItemsInRecyclePool?: number;
};

export type FlashListLike = <T>(props: FlashListLikeProps<T>) => ReactElement | null;

let flashList: FlashListLike | null | undefined;

/** `FlashList`, or `null` when the optional peer is not installed. */
export function loadFlashList(): FlashListLike | null {
  if (flashList !== undefined) return flashList;
  flashList = null;
  if (typeof require === 'undefined') return flashList;
  try {
    const loaded = require('@shopify/flash-list') as { FlashList?: unknown } | null | undefined;
    // A `memo(forwardRef())` object, not a function.
    if (loaded?.FlashList != null) flashList = loaded.FlashList as FlashListLike;
  } catch {
    // Not installed: `VirtualList` renders through `FlatList`, which needs no warning.
  }
  return flashList;
}
