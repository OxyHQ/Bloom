/**
 * `VirtualList` — WEB variant. A virtualizer built on `@tanstack/react-virtual`
 * against whatever the Screen in front scrolls: the WINDOW for a document-flow
 * screen (or outside any Screen), or the panel's own element for an
 * element-kind panel (`useScreenViewport()`). It creates no scroll container of
 * its own, and only the rows in the virtual window are mounted, so the DOM stays
 * bounded.
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
 *  1. `scrollMargin` (the wrapper's offset from the top of the scrolled content)
 *     is measured in a layout effect AND re-synced whenever the wrapper's box
 *     could have moved (see `measureScrollMargin`).
 *  2. The virtualizer observes its viewport and each mounted row. Origin
 *     re-syncs preserve measured heights: `measure()` invalidates the entire
 *     size cache and does not remeasure rows whose boxes have not changed.
 *  3. The measured spacer is `Math.max(totalSize, lastItemEnd)`, so it always
 *     contains every absolutely-positioned row even when `scrollMargin` is
 *     momentarily stale; the document therefore always grows to the full content
 *     height (keeping sticky side rails pinned) and the scroll geometry the
 *     virtualizer reads stays consistent.
 *  4. Per-row `measureElement` refs are STABLE (cached per key), so rows are not
 *     detached/re-measured on every render.
 *
 * Native bundlers use `./VirtualList.tsx` (FlashList or `FlatList`); web
 * bundlers select this file via the `"browser"` export condition in
 * `package.json`.
 */
import * as React from 'react';
import {
  useOptionalScrollRestorationContext,
  type ScrollRestorationContextValue,
} from '../scroll/context';
import { deriveScrollKey, type ScrollOffsetStore } from '../scroll/store';
import { useScreenViewport } from '../screen/context';
import { useScreenWindowScroll } from '../screen/use-screen-window-scroll';
import { useDocumentEndReached } from '../screen/use-document-end-reached';
import { DEFAULT_END_REACHED_THRESHOLD } from '../screen/use-end-reached';
import { useHeaderDockInset } from '../layout/header-dock';
import { Z_INDEX } from '../styles/z-index';
import type { CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  defaultRangeExtractor,
  useVirtualizer,
  useWindowVirtualizer,
  type Range,
} from '@tanstack/react-virtual';

import type { VirtualListHandle, VirtualListProps, VirtualListSlot } from './types';

// Rows in these lists (user rows, pack cards) are short and fairly uniform; a
// small estimate + per-row measurement keeps the mounted node count bounded.
const DEFAULT_ESTIMATED_ITEM_SIZE = 72;
const DEFAULT_OVERSCAN = 8;

// Bound the per-key ref-callback cache so a very long scroll session does not
// accumulate one closure per key forever.
const ROW_REF_CACHE_CAP = 500;

// The list's last pixel, out of the flow so it adds no height and no gap.
const END_MARKER_STYLE: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: 1,
  pointerEvents: 'none',
};

const NO_ROWS: readonly number[] = [];

/** One grid row: its items, each with the columns it spans. */
type GridRow = { index: number; span: number }[];

function renderSlot(slot: VirtualListSlot): React.ReactElement | null {
  if (!slot) return null;
  return typeof slot === 'function' ? slot() : slot;
}

/**
 * Packs items into rows of `numColumns` as FlashList does: an item spans
 * `overrideItemLayout`'s `span` columns (1 by default), and one that does not fit
 * the rest of its row starts the next.
 */
function packGrid<T>(
  items: readonly T[],
  numColumns: number,
  overrideItemLayout: VirtualListProps<T>['overrideItemLayout'],
): GridRow[] {
  const rows: GridRow[] = [];
  let row: GridRow | undefined;
  let used = 0;
  items.forEach((item, index) => {
    const layout: { span?: number } = {};
    overrideItemLayout?.(layout, item, index, numColumns);
    const span = Math.min(Math.max(layout.span ?? 1, 1), numColumns);
    if (!row || used + span > numColumns) {
      row = [];
      rows.push(row);
      used = 0;
    }
    row.push({ index, span });
    used += span;
  });
  return rows;
}

type RestorableListProps<T> = VirtualListProps<T> & {
  measurementRestoration?: { store: ScrollOffsetStore; key: string };
};

function VirtualListWebInner<T>(
  props: RestorableListProps<T>,
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
    estimatedItemSize,
    overscan,
    onEndReached,
    onEndReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
    stickyHeaderIndices,
    numColumns = 1,
    overrideItemLayout,
    testID,
    measurementRestoration,
  } = props;

  const items = data ?? [];
  const count = items.length;

  // A grid virtualizes rows of cells; a plain list, one item per row.
  const grid = React.useMemo(
    () => (numColumns > 1 ? packGrid(items, numColumns, overrideItemLayout) : null),
    [items, numColumns, overrideItemLayout],
  );
  const rowCount = grid?.length ?? count;
  const firstItemOf = (row: number) => grid?.[row]?.[0]?.index ?? row;

  // The rows holding a sticky item, ascending. They pin below the header that
  // overlaps the list, as FlashList's `stickyHeaderConfig.offset`.
  const stickyRows = React.useMemo(() => {
    if (!stickyHeaderIndices?.length) return NO_ROWS;
    if (!grid) return [...new Set(stickyHeaderIndices)].sort((a, b) => a - b);
    const sticky = new Set(stickyHeaderIndices);
    return grid.flatMap((cells, row) =>
      cells.some((cell) => sticky.has(cell.index)) ? [row] : [],
    );
  }, [stickyHeaderIndices, grid]);
  const stickyTop = useHeaderDockInset();
  // TanStack's sticky pattern: the last sticky row at or above the viewport stays
  // mounted while the rows after it scroll, so it can stay pinned.
  const rangeExtractor = React.useCallback(
    (range: Range) => {
      const indexes = defaultRangeExtractor(range);
      let pinned: number | undefined;
      for (const row of stickyRows) {
        if (row > range.startIndex) break;
        pinned = row;
      }
      return pinned === undefined || indexes.includes(pinned) ? indexes : [pinned, ...indexes];
    },
    [stickyRows],
  );

  // The Screen in front decides the scroller: its own element in an
  // element-kind panel, the window otherwise. A retained screen that is not in
  // front stays idle: rows measured at `display: none` would move a scroller
  // the reader is still using in another panel.
  const viewport = useScreenViewport();
  const scroller = viewport?.kind === 'element' ? viewport.scrollRef : null;
  const active = viewport?.active !== false;
  const [scrollElement, setScrollElement] = React.useState<HTMLElement | null>(null);
  // Parent host refs attach after child layout effects. Publish the resolved
  // element after commit so TanStack binds it even without another app render.
  // Recheck each commit for replacement nodes and Activity resumes; unchanged
  // elements retain the same state and all measured row sizes.
  React.useEffect(() => {
    setScrollElement((scroller?.current as HTMLElement | null | undefined) ?? null);
  });

  // Pagination against that scroller: an end marker after the footer, observed
  // `onEndReachedThreshold` viewports early. A new row count re-arms it, so a
  // page that still leaves the end in range asks for the next one; an empty
  // list never asks.
  const endRef = useDocumentEndReached({
    onEndReached,
    threshold: onEndReachedThreshold,
    enabled: active && count > 0,
    rootRef: scroller ?? undefined,
    rearmKey: count,
  });

  // Wrapper element used as the virtualizer's measurement origin.
  // `scrollMargin` is its offset from the top of the scrolled content
  // (everything above the rows), so virtual offsets map to scroll offsets.
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollMargin, setScrollMargin] = React.useState(0);

  const measureScrollMargin = React.useCallback(() => {
    const node = wrapperRef.current;
    if (!node || typeof window === 'undefined') return;
    const rect = node.getBoundingClientRect();
    // No box: a retained screen at `display: none`. Its reading would be the
    // visible screen's scroll offset, stored as this list's origin.
    if (rect.width === 0 && rect.height === 0) return;
    const owner = scroller ? scrollElement : null;
    const top = owner
      ? rect.top - owner.getBoundingClientRect().top - owner.clientTop + owner.scrollTop
      : rect.top + window.scrollY;
    setScrollMargin((prev) => (prev !== top ? top : prev));
  }, [scroller, scrollElement]);

  // Read the wrapper's top offset synchronously after layout so the first
  // virtual frame already positions rows correctly. Re-run when the row count
  // changes (content above/below the window shifts the wrapper).
  React.useLayoutEffect(() => {
    measureScrollMargin();
  }, [measureScrollMargin, count]);

  // Seed before the first virtual range and before scroll restoration runs.
  // The outer boundary remounts only when restoration identity changes.
  const [initialMeasurements] = React.useState(() => {
    const snapshot = measurementRestoration?.store.readMeasurements(measurementRestoration.key);
    return snapshot?.columns === numColumns ? snapshot.items : [];
  });

  const estimate = estimatedItemSize ?? DEFAULT_ESTIMATED_ITEM_SIZE;
  const itemKey = (index: number) => {
    const item = items[index];
    return keyExtractor && item !== undefined ? keyExtractor(item, index) : index;
  };
  // `useFlushSync: false`: by default every scroll event re-renders the list
  // synchronously before the browser can paint; overscan covers the frame an
  // ordinary batched render lags.
  const options = {
    count: rowCount,
    initialMeasurementsCache: initialMeasurements,
    estimateSize: () => estimate,
    overscan: overscan ?? DEFAULT_OVERSCAN,
    scrollMargin,
    useFlushSync: false,
    rangeExtractor,
    getItemKey: keyExtractor ? (row: number) => itemKey(firstItemOf(row)) : undefined,
  };
  // Enable only the model matching the scroller. Inactivity detaches its scroll
  // owner instead of disabling it: TanStack clears offscreen measurements when
  // disabled, which moves the saved reading position when a screen returns.
  // A null owner disconnects its observers while preserving the layout model.
  const windowVirtualizer = useWindowVirtualizer<HTMLDivElement>({
    ...options,
    enabled: !scroller,
    getScrollElement: () => (active && !scroller && typeof window !== 'undefined' ? window : null),
  });
  const elementVirtualizer = useVirtualizer<HTMLElement, HTMLDivElement>({
    ...options,
    enabled: scroller !== null,
    getScrollElement: () => (active ? scrollElement : null),
  });
  const virtualizer = scroller ? elementVirtualizer : windowVirtualizer;
  React.useLayoutEffect(
    () => () => {
      if (!measurementRestoration) return;
      const items = virtualizer.takeSnapshot();
      if (items.length)
        measurementRestoration.store.saveMeasurements(measurementRestoration.key, {
          columns: numColumns,
          items,
        });
    },
    [measurementRestoration, virtualizer, numColumns],
  );

  // Re-sync the list origin after mount and resize, including Activity effect
  // resumes. Do not clear row measurements: unchanged boxes do not produce new
  // ResizeObserver entries, so resetting their sizes leaves estimate-sized gaps
  // or overlaps. The virtualizer's own observers update viewport and row sizes.
  const hasRows = count > 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: `hasRows` is the trigger — the wrapper the observer watches exists only while there are rows.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    measureScrollMargin();
    window.addEventListener('resize', measureScrollMargin);
    // The wrapper gains its box when a retained screen is shown again, and moves
    // without resizing when content above it grows (a header, an embed).
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measureScrollMargin);
    const wrapper = wrapperRef.current;
    if (wrapper) observer?.observe(wrapper);
    if (wrapper?.parentElement) observer?.observe(wrapper.parentElement);
    observer?.observe((scroller ? scrollElement : null) ?? document.body);
    return () => {
      window.removeEventListener('resize', measureScrollMargin);
      observer?.disconnect();
    };
  }, [measureScrollMargin, scroller, scrollElement, hasRows]);

  React.useImperativeHandle(ref, () => {
    const scrollOwner = (top: number, animated?: boolean) => {
      if (typeof window === 'undefined') return;
      const owner = scroller ? (scroller.current as HTMLElement | null) : window;
      owner?.scrollTo({ top, behavior: animated === false ? 'auto' : 'smooth' });
    };
    return {
      scrollToOffset: (params) => scrollOwner(params?.offset ?? 0, params?.animated),
      scrollTo: (params) => scrollOwner(params?.y ?? 0, params?.animated),
    };
  }, [scroller]);

  // Stable per-key ref factory wiring the virtualizer's measurement ref. A fresh
  // inline arrow each render would make React detach/re-attach (and re-measure)
  // every row on every render; the cached callback is reused for the same key so
  // the ref only fires on real mount/unmount.
  const measureElement = virtualizer.measureElement;
  const getRowRef = React.useMemo(() => {
    // A different scroll owner uses a different virtualizer. Its rows must
    // attach to that instance, even when their keys and DOM nodes are retained.
    const cache = new Map<string, (node: HTMLDivElement | null) => void>();
    return (key: string) => {
      const existing = cache.get(key);
      if (existing) return existing;
      if (cache.size > ROW_REF_CACHE_CAP) cache.clear();
      const cb = (node: HTMLDivElement | null) => {
        // Hidden rows may still receive data updates. Never measure their
        // collapsed boxes; active refs reattach and observe real sizes on return.
        if (!node || active) measureElement(node);
      };
      cache.set(key, cb);
      return cb;
    };
  }, [measureElement, active]);

  const flatStyle = StyleSheet.flatten(style);
  const flatContentStyle = StyleSheet.flatten(contentContainerStyle) as CSSProperties | undefined;

  const renderCell = (index: number) => {
    const item = items[index];
    return item !== undefined && renderItem ? renderItem({ item, index }) : null;
  };

  const slot = renderSlot(ListHeaderComponent);
  const header =
    slot && ListHeaderComponentStyle ? <View style={ListHeaderComponentStyle}>{slot}</View> : slot;
  const footer = renderSlot(ListFooterComponent);

  if (count === 0) {
    return (
      <View style={[{ minHeight: 0 }, flatStyle]} testID={testID}>
        <div style={flatContentStyle}>
          {header}
          {renderSlot(ListEmptyComponent)}
          {footer}
        </div>
      </View>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const endMarker = onEndReached ? <div ref={endRef} aria-hidden style={END_MARKER_STYLE} /> : null;
  const totalSize = virtualizer.getTotalSize();

  // The measured spacer MUST contain every absolutely-positioned row; size it to
  // the MAX of `totalSize` and the rows' real extent so the document always
  // grows to full content height even when `scrollMargin` is momentarily stale.
  const lastItem = virtualItems.length > 0 ? virtualItems[virtualItems.length - 1] : undefined;
  const lastItemEnd = lastItem
    ? lastItem.start + lastItem.size - virtualizer.options.scrollMargin
    : 0;
  const spacerHeight = Math.max(totalSize, lastItemEnd);
  // Where the last in-flow (sticky) row ends, measured from the top of the rows.
  let flowEnd = 0;

  return (
    <View style={[{ minHeight: 0 }, flatStyle]} testID={testID}>
      {/* Like FlatList's, the content container wraps the header, the rows and
          the footer, so its padding (a Screen's header and bar clearance) clears
          the whole list rather than the rows alone. */}
      <div style={flatContentStyle}>
        {header}
        {/* A column, so a sticky row's top margin never collapses through it. */}
        <div
          ref={wrapperRef}
          style={{
            height: spacerHeight,
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {virtualItems.map((virtualRow) => {
            if (items[firstItemOf(virtualRow.index)] === undefined) return null;
            const offset = virtualRow.start - virtualizer.options.scrollMargin;
            let placement: CSSProperties;
            if (stickyRows.includes(virtualRow.index)) {
              // In flow at its own offset, so `position: sticky` pins it at the
              // header's edge once scrolled past, over the rows that follow.
              placement = {
                position: 'sticky',
                top: stickyTop,
                marginTop: offset - flowEnd,
                flexShrink: 0,
                zIndex: Z_INDEX.raised,
              };
              flowEnd = offset + virtualRow.size;
            } else {
              placement = {
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translateY(${offset}px)`,
              };
            }
            const cells = grid?.[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                ref={getRowRef(String(virtualRow.key))}
                data-index={virtualRow.index}
                style={{
                  ...placement,
                  width: '100%',
                  ...(cells ? { display: 'flex', flexDirection: 'row' } : null),
                }}
              >
                {cells
                  ? cells.map((cell) => (
                      <div
                        key={itemKey(cell.index)}
                        style={{ width: `${(cell.span / numColumns) * 100}%` }}
                      >
                        {renderCell(cell.index)}
                      </div>
                    ))
                  : renderCell(virtualRow.index)}
              </div>
            );
          })}
        </div>
        {footer}
        {endMarker}
      </div>
    </View>
  );
}

const PlainVirtualList = React.forwardRef(VirtualListWebInner) as <T>(
  props: RestorableListProps<T> & { ref?: React.Ref<VirtualListHandle> },
) => React.ReactElement;
function ScreenVirtualList<T>({
  forwardedRef,
  ...props
}: RestorableListProps<T> & { forwardedRef: React.ForwardedRef<VirtualListHandle> }) {
  // A Screen that owns its viewport already drives chrome from it; the list
  // binds the window only for a document-flow Screen without one.
  const viewport = useScreenViewport();
  const binding = useScreenWindowScroll({
    ...props.screen,
    active: !viewport && props.screen?.active !== false,
    restoration: viewport ? undefined : props.screen?.restoration,
  });
  const padding = StyleSheet.flatten(props.contentContainerStyle);
  return (
    <PlainVirtualList
      {...props}
      ref={forwardedRef}
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
function RestoredVirtualList<T>({
  context,
  forwardedRef,
  ...props
}: VirtualListProps<T> & {
  context: ScrollRestorationContextValue;
  forwardedRef: React.ForwardedRef<VirtualListHandle>;
}) {
  const contentId = context.adapter.useScreenContentId();
  const key = deriveScrollKey(contentId, props.restorationKey);
  const measurementRestoration = React.useMemo(
    () => (key ? { store: context.store, key } : undefined),
    [context.store, key],
  );
  return props.screen ? (
    <ScreenVirtualList
      key={JSON.stringify([key, props.numColumns ?? 1])}
      {...props}
      forwardedRef={forwardedRef}
      measurementRestoration={measurementRestoration}
    />
  ) : (
    <PlainVirtualList
      key={JSON.stringify([key, props.numColumns ?? 1])}
      {...props}
      ref={forwardedRef}
      measurementRestoration={measurementRestoration}
    />
  );
}
const VirtualList = React.forwardRef(function VirtualList<T>(
  props: VirtualListProps<T>,
  ref: React.ForwardedRef<VirtualListHandle>,
) {
  const context = useOptionalScrollRestorationContext();
  if (context && props.restorationKey !== undefined) {
    return <RestoredVirtualList {...props} context={context} forwardedRef={ref} />;
  }
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
