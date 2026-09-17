import React, { memo, useCallback, useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';

import * as Skeleton from '../skeleton';
import { SHELF_GAP, shelfGridColumns } from './shared';
import type { ShelfSkeletonProps } from './types';

/**
 * The placeholder for a `Shelf` that is still loading: a title bar and
 * `count` tiles, each a square cover (radius 12, or round) over two text lines.
 * Same gaps and header rhythm as `Shelf`, so nothing jumps when it swaps in.
 *
 * Semantics: a `role="group"` with `aria-busy`, named "Loading" — the shimmer
 * itself is decoration.
 */
function ShelfSkeletonComponent({
  layout = 'row',
  count = 6,
  itemWidth = 160,
  minItemWidth = 160,
  round = false,
  eyebrow = false,
  gap = SHELF_GAP,
  accessibilityLabel = 'Loading',
  style,
  testID,
}: ShelfSkeletonProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const onGridLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setGridWidth((current) => (Math.abs(current - width) < 0.5 ? current : width));
  }, []);

  const grid = shelfGridColumns(gridWidth, minItemWidth, gap);
  const width = layout === 'grid' ? grid.itemWidth : itemWidth;
  const tileCount = layout === 'grid' ? Math.min(count, grid.columns) : count;

  const tiles = Array.from({ length: Math.max(0, tileCount) }, (_, index) => (
    <View key={index} style={{ width, gap: 8 }} testID={testID ? `${testID}-tile` : undefined}>
      <Skeleton.Box width={width} height={width} borderRadius={round ? width / 2 : 12} />
      <View style={{ gap: 2, alignItems: round ? 'center' : 'flex-start' }}>
        {/* `Skeleton.Text` only caps its width, so each line gets a sized box. */}
        <View style={{ width: Math.round(width * 0.75) }}>
          <Skeleton.Text style={{ lineHeight: 20 }} />
        </View>
        <View style={{ width: Math.round(width * 0.5) }}>
          <Skeleton.Text style={{ lineHeight: 18 }} />
        </View>
      </View>
    </View>
  ));

  return (
    <View
      role="group"
      accessibilityLabel={accessibilityLabel}
      aria-busy
      accessibilityState={{ busy: true }}
      style={[{ gap: 12, minWidth: 0 }, style]}
      testID={testID}
    >
      <View style={{ gap: 4 }}>
        {eyebrow ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Skeleton.Circle size={24} />
            <View style={{ width: 72 }}>
              <Skeleton.Text style={{ lineHeight: 16 }} />
            </View>
          </View>
        ) : null}
        <Skeleton.Text style={{ width: 200, lineHeight: 26 }} />
      </View>
      {layout === 'grid' ? (
        <View
          onLayout={onGridLayout}
          style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: gap, rowGap: gap }}
        >
          {grid.columns > 0 ? tiles : null}
        </View>
      ) : (
        <ScrollView
          horizontal
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap }}
        >
          {tiles}
        </ScrollView>
      )}
    </View>
  );
}

export const ShelfSkeleton = memo(ShelfSkeletonComponent);
ShelfSkeleton.displayName = 'ShelfSkeleton';
