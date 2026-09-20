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
import Animated from 'react-native-reanimated';
import { useScreenScroll } from '../screen/use-screen-scroll';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';

import type {
  VirtualListHandle,
  VirtualListProps,
  VirtualListSlot,
} from './types';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList;

function renderSlot(slot: VirtualListSlot): React.ReactElement | null {
  if (!slot) return null;
  return typeof slot === 'function' ? slot() : slot;
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
    <AnimatedFlatList<T>
      ref={listRef}
      data={data ?? undefined}
      renderItem={renderFlatItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={renderSlot(ListHeaderComponent)}
      ListEmptyComponent={renderSlot(ListEmptyComponent)}
      ListFooterComponent={renderSlot(ListFooterComponent)}
      style={style}
      onScroll={props.screenBinding?.onScroll}
      scrollEventThrottle={16}
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

const PlainVirtualList = React.forwardRef(VirtualListNativeInner) as <T>(props: VirtualListProps<T> & { screenBinding?: ReturnType<typeof useScreenScroll>; ref?: React.Ref<VirtualListHandle> }) => React.ReactElement;
function ScreenVirtualList<T>({ forwardedRef, ...props }: VirtualListProps<T> & { forwardedRef: React.ForwardedRef<VirtualListHandle> }) {
  const binding = useScreenScroll(props.screen);
  const padding = StyleSheet.flatten(props.contentContainerStyle);
  return <PlainVirtualList {...props} ref={forwardedRef} screenBinding={binding} style={[props.style, props.screen?.restoration?.restorePending ? { opacity: 0 } : null]} contentContainerStyle={[props.contentContainerStyle, { paddingTop: binding.contentInsets.top + Number(padding?.paddingTop ?? padding?.padding ?? 0), paddingBottom: binding.contentInsets.bottom + Number(padding?.paddingBottom ?? padding?.padding ?? 0) }]} />;
}
const VirtualList = React.forwardRef(function VirtualList<T>(props: VirtualListProps<T>, ref: React.ForwardedRef<VirtualListHandle>) {
  return props.screen ? <ScreenVirtualList {...props} forwardedRef={ref} /> : <PlainVirtualList {...props} ref={ref} />;
}) as <T>(props: VirtualListProps<T> & { ref?: React.Ref<VirtualListHandle> }) => React.ReactElement;
export default VirtualList;
export { VirtualList };
