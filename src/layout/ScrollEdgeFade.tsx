import React, { useCallback, useId, useRef, useState } from 'react';
import {
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useSurfaceFill } from '../styles/surface-levels';

/** Pixels from an end within which the strip counts as scrolled to it. */
const EDGE_EPSILON = 2;
export const SCROLL_EDGE_FADE_WIDTH = 24;

export interface HorizontalScrollEdges {
  /** More content hides past the leading edge. */
  canScrollStart: boolean;
  /** More content hides past the trailing edge. */
  canScrollEnd: boolean;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onLayout: (event: LayoutChangeEvent) => void;
  onContentSizeChange: (width: number, height: number) => void;
}

/**
 * Tracks whether a horizontal scroller has more content past either edge, so a
 * clipped strip can draw a cue. Wire the three handlers onto the `ScrollArea`
 * and render a `ScrollEdgeFade` per side the flags name.
 */
export function useHorizontalScrollEdges(): HorizontalScrollEdges {
  const metrics = useRef({ offset: 0, viewport: 0, content: 0 });
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const { offset, viewport, content } = metrics.current;
    const overflow = viewport > 0 && content - viewport > EDGE_EPSILON;
    const next = {
      start: overflow && offset > EDGE_EPSILON,
      end: overflow && offset < content - viewport - EDGE_EPSILON,
    };
    setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      metrics.current = {
        offset: contentOffset.x,
        viewport: layoutMeasurement.width,
        content: contentSize.width,
      };
      update();
    },
    [update],
  );
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      metrics.current.viewport = event.nativeEvent.layout.width;
      update();
    },
    [update],
  );
  const onContentSizeChange = useCallback(
    (width: number) => {
      metrics.current.content = width;
      update();
    },
    [update],
  );

  return {
    canScrollStart: edges.start,
    canScrollEnd: edges.end,
    onScroll,
    onLayout,
    onContentSizeChange,
  };
}

/**
 * A fade from the surface behind the scroller to transparent, laid over one of
 * its edges as the "more this way" cue. The colour is the PUBLISHED surface
 * fill, so it matches a page, a card or a dialog without the caller naming one.
 * Inert to pointers; put it in a `position: relative` host beside the scroller.
 */
export function ScrollEdgeFade({ edge, testID }: { edge: 'start' | 'end'; testID?: string }) {
  const fill = useSurfaceFill();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const atStart = edge === 'start';
  return (
    <View
      pointerEvents="none"
      testID={testID}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: SCROLL_EDGE_FADE_WIDTH,
        ...(atStart ? { left: 0 } : { right: 0 }),
      }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1={atStart ? '0' : '1'} y1="0" x2={atStart ? '1' : '0'} y2="0">
            <Stop offset="0" stopColor={fill} stopOpacity={1} />
            <Stop offset="1" stopColor={fill} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
