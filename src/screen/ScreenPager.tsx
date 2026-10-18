import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useInsertionEffect,
  useRef,
  useState,
} from 'react';
import { FlatList, Platform, View, type LayoutChangeEvent } from 'react-native';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useScreenViewport } from './context';

import type { ScreenPagerHandle, ScreenPagerProps } from './types';

const PAGER_CSS = `
[data-bloom-screen-page]{height:var(--bloom-screen-viewport-height,100dvh);min-height:var(--bloom-screen-viewport-height,100dvh);flex-shrink:0;scroll-snap-align:start;scroll-margin-block-start:var(--bloom-screen-viewport-top,0px)}
:root:has([data-bloom-screen-pager="document"][data-bloom-pager-active="true"]),
[data-bloom-screen-viewport]:has([data-bloom-screen-pager="element"][data-bloom-pager-active="true"]){scroll-snap-type:y mandatory;scroll-padding-block:0}
`;

/** Full-region pages. The enclosing Screen owns sizing, scroll and chrome. */
export function ScreenPager<Item>(props: ScreenPagerProps<Item>) {
  return Platform.OS === 'web' ? <WebScreenPager {...props} /> : <NativeScreenPager {...props} />;
}
function WebScreenPager<Item>({
  data,
  keyExtractor,
  renderItem,
  onIndexChange,
  onEndReached,
  onEndReachedThreshold = 2,
  renderRadius = 6,
  ref,
  style,
  testID,
}: ScreenPagerProps<Item>) {
  const viewport = useScreenViewport();
  const contentRef = useRef<React.ElementRef<typeof View>>(null);
  const [index, setIndex] = useState(0);
  const [height, setHeight] = useState(0);
  const callbacks = useRef({ onIndexChange, onEndReached });
  callbacks.current = { onIndexChange, onEndReached };
  const lastIndex = useRef(-1);
  const endCount = useRef(-1);
  useInsertionEffect(() => {
    adoptStyleSheet('bloom-screen-pager', PAGER_CSS);
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex(target, options) {
        const node = contentRef.current as unknown as HTMLElement | null;
        const item = node?.children[Math.min(Math.max(0, target), data.length - 1)] as
          | HTMLElement
          | undefined;
        if (!item || !viewport) return;
        const owner =
          viewport.kind === 'element' ? (viewport.scrollRef?.current as HTMLElement | null) : null;
        const offset = owner ? owner.scrollTop : window.scrollY;
        const origin = owner ? owner.getBoundingClientRect().top + owner.clientTop : 0;
        const margin = Number.parseFloat(getComputedStyle(item).scrollMarginTop) || 0;
        viewport.scrollTo({
          y: item.getBoundingClientRect().top - origin + offset - margin,
          animated: options?.animated ?? true,
        });
      },
    }),
    [viewport, data.length],
  );
  useEffect(() => {
    const node = contentRef.current as unknown as HTMLElement | null;
    if (!node || !viewport || !viewport.active || !data.length) return;
    const owner =
      viewport.kind === 'element' ? (viewport.scrollRef?.current as HTMLElement | null) : null;
    const target = owner ?? window;
    let frame = 0;
    const read = () => {
      frame = 0;
      const first = node.firstElementChild as HTMLElement | null;
      if (!first) return;
      const rect = first.getBoundingClientRect();
      if (!rect.height) return;
      setHeight((previous) => (previous === rect.height ? previous : rect.height));
      const origin = owner ? owner.getBoundingClientRect().top + owner.clientTop : 0;
      const margin = Number.parseFloat(getComputedStyle(first).scrollMarginTop) || 0;
      const next = Math.min(
        data.length - 1,
        Math.max(0, Math.round((origin + margin - rect.top) / rect.height)),
      );
      if (lastIndex.current !== next) {
        lastIndex.current = next;
        setIndex(next);
        callbacks.current.onIndexChange?.(next);
      }
      const nearEnd = data.length - next - 1 <= onEndReachedThreshold;
      if (!nearEnd) endCount.current = -1;
      else if (endCount.current !== data.length) {
        endCount.current = data.length;
        callbacks.current.onEndReached?.();
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    target.addEventListener('scroll', schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    read();
    return () => {
      target.removeEventListener('scroll', schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [viewport, data.length, onEndReachedThreshold]);
  return (
    <View
      ref={contentRef}
      testID={testID}
      style={style}
      {...{
        dataSet: {
          bloomScreenPager: viewport?.kind ?? 'document',
          bloomPagerActive: String(viewport?.active ?? false),
        },
      }}
    >
      {data.map((item, itemIndex) => (
        <View key={keyExtractor(item, itemIndex)} {...{ dataSet: { bloomScreenPage: '' } }}>
          {Math.abs(itemIndex - index) <= renderRadius
            ? renderItem({ item, index: itemIndex, viewportHeight: height })
            : null}
        </View>
      ))}
    </View>
  );
}
function NativeScreenPager<Item>({
  data,
  keyExtractor,
  renderItem,
  onIndexChange,
  onEndReached,
  onEndReachedThreshold = 2,
  ref,
  style,
  testID,
}: ScreenPagerProps<Item>) {
  const list = useRef<FlatList<Item>>(null);
  const viewport = useScreenViewport();
  const ownerRef = viewport?.scrollRef;
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!ownerRef || !viewport?.active) return;
    const current = list.current;
    ownerRef.current = current;
    return () => {
      if (ownerRef.current === current) ownerRef.current = null;
    };
  }, [ownerRef, viewport?.active, height]);
  const callback = useRef(onIndexChange);
  callback.current = onIndexChange;
  const viewability = useRef({ itemVisiblePercentThreshold: 60 });
  const changed = useCallback(
    ({ viewableItems }: { viewableItems: { index?: number | null; isViewable: boolean }[] }) => {
      const index = viewableItems.find((item) => item.isViewable)?.index;
      if (index != null) callback.current?.(index);
    },
    [],
  );
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex(index, options) {
        list.current?.scrollToOffset({
          offset: Math.min(Math.max(0, index), data.length - 1) * height,
          animated: options?.animated ?? true,
        });
      },
    }),
    [data.length, height],
  );
  return (
    <View
      style={[{ flex: 1, minHeight: 0 }, style]}
      testID={testID}
      onLayout={(event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height)}
    >
      {height > 0 ? (
        <FlatList
          ref={list}
          data={data}
          onScroll={(event) => {
            if (!viewport?.active) return;
            viewport.metrics.scrollY.value = event.nativeEvent.contentOffset.y;
            viewport.metrics.contentHeight.value = event.nativeEvent.contentSize.height;
            viewport.metrics.viewportHeight.value = event.nativeEvent.layoutMeasurement.height;
          }}
          scrollEventThrottle={16}
          keyExtractor={keyExtractor}
          pagingEnabled
          snapToInterval={height}
          decelerationRate="fast"
          onViewableItemsChanged={changed}
          viewabilityConfig={viewability.current}
          onEndReached={onEndReached}
          onEndReachedThreshold={onEndReachedThreshold}
          getItemLayout={(_, index) => ({ index, offset: index * height, length: height })}
          renderItem={({ item, index }) => (
            <View style={{ height }}>{renderItem({ item, index, viewportHeight: height })}</View>
          )}
        />
      ) : null}
    </View>
  );
}
