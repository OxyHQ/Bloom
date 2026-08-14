/**
 * `VirtualList` — WEB variant. A document-scroll (window) virtualizer built on
 * `@tanstack/react-virtual`'s `useWindowVirtualizer`, mirroring the proven
 * Mention feed virtualizer. The BODY scrolls (so scrolling works from anywhere,
 * including over sticky side columns) and only the rows in the virtual window
 * are mounted, so the DOM stays bounded.
 *
 * Why this exists (the bug it fixes): a previous app-local list used the same
 * hook but rendered ZERO rows in production — the wrapper grew to the right
 * height (`getTotalSize()` was correct) yet `getVirtualItems()` came back empty,
 * so only the header painted. Root cause: `useWindowVirtualizer` can latch an
 * initial frame in which the window rect measured as `0` (or `scrollMargin` was
 * still stale), which leaves the computed range empty; a STATIC, finite list
 * re-renders too few times to self-correct and sticks on that bad frame. (The
 * feed only survived by incidental re-render churn — data/loading updates and
 * scroll/intersection observers — which a plain list does not have.)
 *
 * This implementation is SELF-SUFFICIENT and does not rely on incidental churn:
 *
 *  1. `scrollMargin` (the wrapper's offset from the document top) is measured in
 *     a layout effect AND re-synced on window `resize`.
 *  2. An explicit post-mount recompute (`virtualizer.measure()`) forces the
 *     range to be recomputed once the real viewport height + offset are known —
 *     guaranteeing a short list mounts EVERY row in the first viewport even with
 *     zero further re-renders. Re-run on resize.
 *  3. The measured spacer is `Math.max(totalSize, lastItemEnd)`, so it always
 *     contains every absolutely-positioned row even when `scrollMargin` is
 *     momentarily stale; the document therefore always grows to the full content
 *     height (keeping sticky side rails pinned) and the window-scroll geometry
 *     the virtualizer reads stays consistent.
 *  4. Per-row `measureElement` refs are STABLE (cached per key), so rows are not
 *     detached/re-measured on every render.
 *
 * Native bundlers use `./index.tsx` (a `FlatList` wrapper); web bundlers select
 * this file via the `"browser"` export condition in `package.json`.
 */
import * as React from 'react';
import { type CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

import type {
  VirtualListHandle,
  VirtualListProps,
  VirtualListSlot,
} from './types';

// Rows in these lists (user rows, pack cards) are short and fairly uniform; a
// small estimate + per-row measurement keeps the mounted node count bounded.
const DEFAULT_ESTIMATED_ITEM_SIZE = 72;
const DEFAULT_OVERSCAN = 8;

// Bound the per-key ref-callback cache so a very long scroll session does not
// accumulate one closure per key forever.
const ROW_REF_CACHE_CAP = 500;

function renderSlot(slot: VirtualListSlot): React.ReactElement | null {
  if (!slot) return null;
  return typeof slot === 'function' ? slot() : slot;
}

function VirtualListWebInner<T>(
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
    estimatedItemSize,
    overscan,
    testID,
  } = props;

  const items = data ?? [];
  const count = items.length;

  // Wrapper element used as the virtualizer's measurement origin. The window is
  // the scroller; `scrollMargin` is the wrapper's offset from the document top
  // (everything above the rows), so virtual offsets map to page offsets.
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollMargin, setScrollMargin] = React.useState(0);

  const measureScrollMargin = React.useCallback(() => {
    const node = wrapperRef.current;
    if (!node || typeof window === 'undefined') return;
    const top = node.getBoundingClientRect().top + window.scrollY;
    setScrollMargin((prev) => (prev !== top ? top : prev));
  }, []);

  // Read the wrapper's top offset synchronously after layout so the first
  // virtual frame already positions rows correctly. Re-run when the row count
  // changes (content above/below the window shifts the wrapper).
  React.useLayoutEffect(() => {
    measureScrollMargin();
  }, [measureScrollMargin, count]);

  const estimate = estimatedItemSize ?? DEFAULT_ESTIMATED_ITEM_SIZE;

  const virtualizer = useWindowVirtualizer<HTMLDivElement>({
    count,
    estimateSize: () => estimate,
    overscan: overscan ?? DEFAULT_OVERSCAN,
    scrollMargin,
    getItemKey: keyExtractor
      ? (index) => {
          const item = items[index];
          return item !== undefined ? keyExtractor(item, index) : index;
        }
      : undefined,
  });

  // Explicit post-mount recompute + resize re-sync. `useWindowVirtualizer` can
  // latch a frame where the window rect read as 0 / `scrollMargin` was stale,
  // leaving `getVirtualItems()` empty even though rows exist. A static list does
  // not re-render enough to self-correct, so we force the range to recompute
  // once the real viewport + offset are known — and again on every resize.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => {
      measureScrollMargin();
      virtualizer.measure();
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [measureScrollMargin, virtualizer]);

  React.useImperativeHandle(
    ref,
    () => ({
      scrollToOffset: (params) => {
        if (typeof window === 'undefined') return;
        window.scrollTo({
          top: params?.offset ?? 0,
          behavior: params?.animated === false ? 'auto' : 'smooth',
        });
      },
      scrollTo: (params) => {
        if (typeof window === 'undefined') return;
        window.scrollTo({
          top: params?.y ?? 0,
          behavior: params?.animated === false ? 'auto' : 'smooth',
        });
      },
    }),
    [],
  );

  // Stable per-key ref factory wiring the virtualizer's measurement ref. A fresh
  // inline arrow each render would make React detach/re-attach (and re-measure)
  // every row on every render; the cached callback is reused for the same key so
  // the ref only fires on real mount/unmount.
  const measureElement = virtualizer.measureElement;
  const rowRefCallbacks = React.useRef(
    new Map<string, (node: HTMLDivElement | null) => void>(),
  );
  const getRowRef = React.useCallback(
    (key: string) => {
      const cache = rowRefCallbacks.current;
      const existing = cache.get(key);
      if (existing) return existing;
      if (cache.size > ROW_REF_CACHE_CAP) cache.clear();
      const cb = (node: HTMLDivElement | null) => measureElement(node);
      cache.set(key, cb);
      return cb;
    },
    [measureElement],
  );

  const flatStyle = StyleSheet.flatten(style);
  const flatContentStyle = StyleSheet.flatten(contentContainerStyle) as
    | CSSProperties
    | undefined;

  const header = renderSlot(ListHeaderComponent);
  const footer = renderSlot(ListFooterComponent);

  if (count === 0) {
    return (
      <View style={[{ minHeight: 0 }, flatStyle]} testID={testID}>
        {header}
        {renderSlot(ListEmptyComponent)}
        {footer}
      </View>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // The measured spacer MUST contain every absolutely-positioned row; size it to
  // the MAX of `totalSize` and the rows' real extent so the document always
  // grows to full content height even when `scrollMargin` is momentarily stale.
  const lastItem =
    virtualItems.length > 0
      ? virtualItems[virtualItems.length - 1]
      : undefined;
  const lastItemEnd = lastItem
    ? lastItem.start + lastItem.size - virtualizer.options.scrollMargin
    : 0;
  const spacerHeight = Math.max(totalSize, lastItemEnd);

  return (
    <View style={[{ minHeight: 0 }, flatStyle]} testID={testID}>
      {header}
      <div style={flatContentStyle}>
        <div
          ref={wrapperRef}
          style={{ height: spacerHeight, width: '100%', position: 'relative' }}
        >
          {virtualItems.map((virtualRow) => {
            const item = items[virtualRow.index];
            if (item === undefined) return null;
            return (
              <div
                key={virtualRow.key}
                ref={getRowRef(String(virtualRow.key))}
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${
                    virtualRow.start - virtualizer.options.scrollMargin
                  }px)`,
                }}
              >
                {renderItem
                  ? renderItem({ item, index: virtualRow.index })
                  : null}
              </div>
            );
          })}
        </div>
      </div>
      {footer}
    </View>
  );
}

const VirtualList = React.forwardRef(VirtualListWebInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<VirtualListHandle> },
) => React.ReactElement;

export default VirtualList;

export { VirtualList };
