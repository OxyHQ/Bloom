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
 *  2. An explicit post-mount recompute (`virtualizer.measure()`) forces the
 *     range to be recomputed once the real viewport height + offset are known —
 *     guaranteeing a short list mounts EVERY row in the first viewport even with
 *     zero further re-renders. Re-run on resize. It also picks up a panel
 *     element whose ref attaches after this list's first layout effects.
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
import { useScreenViewport } from '../screen/context';
import { useScreenWindowScroll } from '../screen/use-screen-window-scroll';
import { useDocumentEndReached } from '../screen/use-document-end-reached';
import { DEFAULT_END_REACHED_THRESHOLD } from '../screen/use-end-reached';
import { type CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';

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
    onEndReached,
    onEndReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
    testID,
  } = props;

  const items = data ?? [];
  const count = items.length;

  // The Screen in front decides the scroller: its own element in an
  // element-kind panel, the window otherwise. A retained screen that is not in
  // front stays idle: rows measured at `display: none` would move a scroller
  // the reader is still using in another panel.
  const viewport = useScreenViewport();
  const scroller = viewport?.kind === 'element' ? viewport.scrollRef : null;
  const active = viewport?.active !== false;

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
    const owner = scroller?.current as HTMLElement | null | undefined;
    const top = owner
      ? rect.top - owner.getBoundingClientRect().top - owner.clientTop + owner.scrollTop
      : rect.top + window.scrollY;
    setScrollMargin((prev) => (prev !== top ? top : prev));
  }, [scroller]);

  // Read the wrapper's top offset synchronously after layout so the first
  // virtual frame already positions rows correctly. Re-run when the row count
  // changes (content above/below the window shifts the wrapper).
  React.useLayoutEffect(() => {
    measureScrollMargin();
  }, [measureScrollMargin, count]);

  const estimate = estimatedItemSize ?? DEFAULT_ESTIMATED_ITEM_SIZE;
  // `useFlushSync: false`: by default every scroll event re-renders the list
  // synchronously before the browser can paint; overscan covers the frame an
  // ordinary batched render lags.
  const options = {
    count,
    estimateSize: () => estimate,
    overscan: overscan ?? DEFAULT_OVERSCAN,
    scrollMargin,
    useFlushSync: false,
    getItemKey: keyExtractor
      ? (index: number) => {
          const item = items[index];
          return item !== undefined ? keyExtractor(item, index) : index;
        }
      : undefined,
  };
  // Both are always called (hook order); only the one matching the scroller is
  // enabled, so a panel switching flow keeps its list mounted.
  const windowVirtualizer = useWindowVirtualizer<HTMLDivElement>({
    ...options,
    enabled: active && !scroller,
  });
  const elementVirtualizer = useVirtualizer<HTMLElement, HTMLDivElement>({
    ...options,
    enabled: active && scroller !== null,
    getScrollElement: () => (scroller?.current as HTMLElement | null | undefined) ?? null,
  });
  const virtualizer = scroller ? elementVirtualizer : windowVirtualizer;

  // Explicit post-mount recompute + resize re-sync. The virtualizer can latch a
  // frame where the scroller's rect read as 0 / `scrollMargin` was stale,
  // leaving `getVirtualItems()` empty even though rows exist. A static list does
  // not re-render enough to self-correct, so we force the range to recompute
  // once the real viewport + offset are known — and again on every resize.
  const hasRows = count > 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: `hasRows` is the trigger — the wrapper the observer watches exists only while there are rows.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => {
      measureScrollMargin();
      virtualizer.measure();
    };
    sync();
    window.addEventListener('resize', sync);
    // The wrapper gains its box when a retained screen is shown again, and moves
    // without resizing when content above it grows (a header, an embed).
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measureScrollMargin);
    const wrapper = wrapperRef.current;
    if (wrapper) observer?.observe(wrapper);
    if (wrapper?.parentElement) observer?.observe(wrapper.parentElement);
    observer?.observe((scroller?.current as HTMLElement | null | undefined) ?? document.body);
    return () => {
      window.removeEventListener('resize', sync);
      observer?.disconnect();
    };
  }, [measureScrollMargin, virtualizer, scroller, hasRows]);

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
  const rowRefCallbacks = React.useRef(new Map<string, (node: HTMLDivElement | null) => void>());
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
  const flatContentStyle = StyleSheet.flatten(contentContainerStyle) as CSSProperties | undefined;

  const header = renderSlot(ListHeaderComponent);
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

  return (
    <View style={[{ minHeight: 0 }, flatStyle]} testID={testID}>
      {/* Like FlatList's, the content container wraps the header, the rows and
          the footer, so its padding (a Screen's header and bar clearance) clears
          the whole list rather than the rows alone. */}
      <div style={flatContentStyle}>
        {header}
        <div ref={wrapperRef} style={{ height: spacerHeight, width: '100%', position: 'relative' }}>
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
                  transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                {renderItem ? renderItem({ item, index: virtualRow.index }) : null}
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
  props: VirtualListProps<T> & { ref?: React.Ref<VirtualListHandle> },
) => React.ReactElement;
function ScreenVirtualList<T>({
  forwardedRef,
  ...props
}: VirtualListProps<T> & { forwardedRef: React.ForwardedRef<VirtualListHandle> }) {
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
