/**
 * `VirtualList` — the canonical cross-platform virtualized list for the Oxy
 * ecosystem. Every app uses this ONE implementation for grouped/stacked row
 * lists (who-to-follow, starter packs, connections, settings rows, …) so the
 * virtualization behaviour is identical everywhere.
 *
 * NATIVE variant: a thin, correctly-typed wrapper over React Native `FlatList`.
 * The consumer lists this component replaces are short and uniform, so the
 * platform's own virtualization is the simplest robust choice — no
 * `@legendapp/list`, no app-specific scroll bridge, nothing for a consumer to
 * wire up. Bloom stays app-agnostic.
 *
 * WEB variant (`index.web.tsx`, selected via the `"browser"` export condition):
 * a document-scroll window virtualizer built on `@tanstack/react-virtual`.
 *
 * This default file has NO platform-only imports, so consumer `tsc` and web
 * bundlers resolve it cleanly (mirrors the `../scroll` / `../content-panel`
 * fork pattern). The public API is shared via `./types`, so both forks expose
 * an identical, generic, strongly-typed surface.
 */
import * as React from 'react';
import { FlatList, type ListRenderItemInfo } from 'react-native';

import type {
  VirtualListHandle,
  VirtualListProps,
  VirtualListSlot,
} from './types';

export type {
  VirtualListHandle,
  VirtualListProps,
  VirtualListRenderItem,
  VirtualListRenderItemInfo,
  VirtualListSlot,
} from './types';

function renderSlot(slot: VirtualListSlot): React.ReactElement | null {
  if (!slot) return null;
  return typeof slot === 'function' ? slot() : slot;
}

function VirtualListNativeInner<T>(
  props: VirtualListProps<T>,
  ref: React.ForwardedRef<VirtualListHandle>,
) {
  const {
    data,
    renderItem,
    keyExtractor,
    ListHeaderComponent,
    ListEmptyComponent,
    ListFooterComponent,
    style,
    contentContainerStyle,
    onEndReached,
    onEndReachedThreshold,
    refreshing,
    onRefresh,
    initialNumToRender,
    maxToRenderPerBatch,
    windowSize,
    removeClippedSubviews,
    testID,
  } = props;

  const listRef = React.useRef<FlatList<T>>(null);

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

  const renderFlatItem = React.useCallback(
    (info: ListRenderItemInfo<T>) =>
      renderItem ? renderItem({ item: info.item, index: info.index }) : null,
    [renderItem],
  );

  return (
    <FlatList<T>
      ref={listRef}
      data={data ?? undefined}
      renderItem={renderFlatItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={renderSlot(ListHeaderComponent)}
      ListEmptyComponent={renderSlot(ListEmptyComponent)}
      ListFooterComponent={renderSlot(ListFooterComponent)}
      style={style}
      contentContainerStyle={contentContainerStyle}
      onEndReached={onEndReached ? () => onEndReached() : undefined}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshing={refreshing}
      onRefresh={onRefresh}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      testID={testID}
    />
  );
}

const VirtualList = React.forwardRef(VirtualListNativeInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<VirtualListHandle> },
) => React.ReactElement;

export { VirtualList };
export default VirtualList;
