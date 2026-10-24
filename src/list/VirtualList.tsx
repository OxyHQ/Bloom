/**
 * `VirtualList` — the canonical cross-platform virtualized list for the Oxy
 * ecosystem. Every app uses this ONE implementation for grouped/stacked row
 * lists (who-to-follow, starter packs, connections, settings rows, …) so the
 * virtualization behaviour is identical everywhere.
 *
 * NATIVE variant: a thin, correctly-typed wrapper over `@shopify/flash-list`
 * (v2) when the app installs that optional peer, and over React Native
 * `FlatList` otherwise. FlashList recycles row views instead of mounting and
 * unmounting them, which is what a long feed needs; a short list loses nothing
 * on `FlatList`. Both take the same props, the same Screen binding and the same
 * imperative handle, so a consumer never knows which one it got.
 *
 * WEB variant (`VirtualList.web.tsx`, selected via the `"browser"` export
 * condition): a virtualizer built on `@tanstack/react-virtual` against the
 * scroller of the Screen in front.
 *
 * This default file has NO platform-only imports, so consumer `tsc` and web
 * bundlers resolve it cleanly (mirrors the `../scroll` / `../content-panel`
 * fork pattern). The public API is shared via `./types`, so both forks expose
 * an identical, generic, strongly-typed surface.
 */
import * as React from 'react';
import Animated from 'react-native-reanimated';
import { useScreenScroll } from '../screen/use-screen-scroll';
import { mergeRefs } from '../hooks/merge-refs';
import { useHeaderDockInset } from '../layout/header-dock';
import { useNativeScrollIndicator } from '../layout/use-native-scroll-indicator';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import { FlatList, RefreshControl, StyleSheet, type FlatListProps } from 'react-native';

import { loadFlashList, type FlashListLikeProps, type ListScrollHandle } from './flash-list-module';
import type { VirtualListHandle, VirtualListProps, VirtualListSlot } from './types';

/** What both engines take; each adds only the tuning knobs it understands. */
type SharedListProps<T> = Omit<
  FlashListLikeProps<T>,
  | 'getItemType'
  | 'maintainVisibleContentPosition'
  | 'overrideItemLayout'
  | 'stickyHeaderConfig'
  | 'drawDistance'
  | 'maxItemsInRecyclePool'
>;
type FlatListLikeProps<T> = SharedListProps<T> &
  Pick<
    FlatListProps<T>,
    'initialNumToRender' | 'maxToRenderPerBatch' | 'windowSize' | 'removeClippedSubviews'
  >;

// Built once at module scope: `createAnimatedComponent` returns a new component
// type per call, and a new type per render would remount the list.
const flashList = loadFlashList();
const AnimatedFlashList = flashList
  ? (Animated.createAnimatedComponent(
      flashList as unknown as React.ComponentType<FlashListLikeProps<unknown>>,
    ) as unknown as typeof flashList)
  : null;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as <T>(
  props: FlatListLikeProps<T>,
) => React.ReactElement;

function renderSlot(slot: VirtualListSlot): React.ReactElement | undefined {
  if (!slot) return undefined;
  return (typeof slot === 'function' ? slot() : slot) ?? undefined;
}

/**
 * `FlatList` counts `ListHeaderComponent` as its first cell and a grid's rows as
 * cells, where FlashList and the web count `data`; map one onto the other.
 */
function flatListStickyIndices(
  indices: number[] | undefined,
  numColumns: number,
  hasHeader: boolean,
): number[] | undefined {
  if (!indices) return undefined;
  const offset = hasHeader ? 1 : 0;
  return [...new Set(indices.map((index) => Math.floor(index / numColumns) + offset))];
}

function VirtualListNativeInner<T>(
  props: VirtualListProps<T> & { screenBinding?: ReturnType<typeof useScreenScroll> },
  ref: React.ForwardedRef<VirtualListHandle>,
) {
  const {
    data,
    renderItem,
    keyExtractor,
    ListHeaderComponent,
    ListHeaderComponentStyle,
    ListEmptyComponent,
    ListFooterComponent,
    style,
    contentContainerStyle,
    onEndReached,
    onEndReachedThreshold,
    stickyHeaderIndices,
    numColumns = 1,
    overrideItemLayout,
    refreshing,
    onRefresh,
    scrollbar,
    keyboardShouldPersistTaps,
    keyboardDismissMode,
    initialNumToRender,
    maxToRenderPerBatch,
    windowSize,
    removeClippedSubviews,
    getItemType,
    maintainVisibleContentPosition,
    drawDistance,
    maxItemsInRecyclePool,
    testID,
  } = props;

  // Optional: a list must work outside a provider, with the platform's spinner.
  const primary = React.useContext(BloomThemeContext)?.theme.colors.primary;
  const indicator = useNativeScrollIndicator(scrollbar);
  const stickyHeaderOffset = useHeaderDockInset();
  const header = renderSlot(ListHeaderComponent);

  const listRef = React.useRef<ListScrollHandle>(null);

  React.useImperativeHandle(
    ref,
    () => ({
      scrollToOffset: (params) =>
        listRef.current?.scrollToOffset({
          offset: params?.offset ?? 0,
          animated: params?.animated ?? true,
        }),
      scrollTo: (params) =>
        listRef.current?.scrollToOffset({
          offset: params?.y ?? 0,
          animated: params?.animated ?? true,
        }),
    }),
    [],
  );

  const renderListItem = React.useCallback(
    (info: { item: T; index: number }) =>
      renderItem ? renderItem({ item: info.item, index: info.index }) : null,
    [renderItem],
  );

  const shared: SharedListProps<T> = {
    ref: listRef,
    data: data ?? undefined,
    renderItem: renderListItem,
    keyExtractor,
    ListHeaderComponent: header,
    ListHeaderComponentStyle,
    ListEmptyComponent: renderSlot(ListEmptyComponent),
    ListFooterComponent: renderSlot(ListFooterComponent),
    style,
    onScroll: props.screenBinding?.onScroll,
    scrollEventThrottle: 16,
    contentContainerStyle,
    numColumns,
    onEndReached: onEndReached ? () => onEndReached() : undefined,
    onEndReachedThreshold,
    // The spinner rests below the Screen's header rather than behind it.
    refreshControl: onRefresh ? (
      <RefreshControl
        refreshing={refreshing ?? false}
        onRefresh={onRefresh}
        tintColor={primary}
        colors={primary ? [primary] : undefined}
        progressViewOffset={props.screenBinding?.contentInsets.top}
      />
    ) : undefined,
    keyboardShouldPersistTaps,
    keyboardDismissMode,
    ...indicator,
    testID,
  };

  return AnimatedFlashList ? (
    <AnimatedFlashList<T>
      {...shared}
      stickyHeaderIndices={stickyHeaderIndices}
      stickyHeaderConfig={stickyHeaderIndices ? { offset: stickyHeaderOffset } : undefined}
      overrideItemLayout={overrideItemLayout}
      drawDistance={drawDistance}
      maxItemsInRecyclePool={maxItemsInRecyclePool}
      getItemType={getItemType}
      maintainVisibleContentPosition={
        maintainVisibleContentPosition === false ? { disabled: true } : undefined
      }
    />
  ) : (
    <AnimatedFlatList<T>
      // `FlatList` cannot change `numColumns` in place: a new count is a new list.
      key={numColumns}
      {...shared}
      stickyHeaderIndices={flatListStickyIndices(stickyHeaderIndices, numColumns, header != null)}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
    />
  );
}

const PlainVirtualList = React.forwardRef(VirtualListNativeInner) as <T>(
  props: VirtualListProps<T> & {
    screenBinding?: ReturnType<typeof useScreenScroll>;
    ref?: React.Ref<VirtualListHandle>;
  },
) => React.ReactElement;
function ScreenVirtualList<T>({
  forwardedRef,
  ...props
}: VirtualListProps<T> & { forwardedRef: React.ForwardedRef<VirtualListHandle> }) {
  // The list is its screen's scroller, so it answers the screen's reselect.
  const handle = React.useRef<VirtualListHandle>(null);
  const binding = useScreenScroll({
    ...props.screen,
    scrollToOffset: (offset) => handle.current?.scrollToOffset({ offset, animated: true }),
  });
  const ref = React.useMemo(() => mergeRefs([handle, forwardedRef]), [forwardedRef]);
  const padding = StyleSheet.flatten(props.contentContainerStyle);
  return (
    <PlainVirtualList
      {...props}
      ref={ref}
      screenBinding={binding}
      style={[props.style, props.screen?.restoration?.restorePending ? { opacity: 0 } : null]}
      contentContainerStyle={[
        props.contentContainerStyle,
        {
          paddingTop:
            binding.contentInsets.top + Number(padding?.paddingTop ?? padding?.padding ?? 0),
          paddingBottom:
            binding.contentInsets.bottom + Number(padding?.paddingBottom ?? padding?.padding ?? 0),
        },
      ]}
    />
  );
}
const VirtualList = React.forwardRef(function VirtualList<T>(
  props: VirtualListProps<T>,
  ref: React.ForwardedRef<VirtualListHandle>,
) {
  return props.screen ? (
    <ScreenVirtualList {...props} forwardedRef={ref} />
  ) : (
    <PlainVirtualList {...props} ref={ref} />
  );
}) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<VirtualListHandle> },
) => React.ReactElement;
export default VirtualList;
export { VirtualList };
