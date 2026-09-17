import React, { Children, isValidElement, memo, useState } from 'react';
import { View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';

import { IS_WEB, listingGridColumns } from './shared';
import type { ListingCardGridProps } from './types';

/**
 * A results grid for `ListingCard`s.
 *
 *   columns   1 below 640, 2 below 950, 3 below 1280, 4 from there — of the
 *             GRID's own width, so a grid beside a map or inside a sheet counts
 *             the room it actually has; `columns` fixes the count instead
 *   gaps      24 between columns, 40 between rows
 *
 * Bloom's `Grid` (`Row`/`Col`) is a single fixed row of fractional columns: it
 * neither wraps nor responds to width, which is what a results page needs, so
 * this measures and wraps instead. Until the first layout it counts from the
 * window, so the first frame is already close.
 *
 * Cells are sized in pixels from the measured width, rounded DOWN to a
 * hundredth: a fraction that rounds up can push the last cell of a row onto
 * the next.
 */
function ListingCardGridComponent({
  children,
  columns: fixedColumns,
  columnGap = 24,
  rowGap = 40,
  style,
  testID,
}: ListingCardGridProps) {
  const window = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  const width = measured > 0 ? measured : window.width;
  const columns = Math.max(1, fixedColumns ?? listingGridColumns(width));
  const cell = Math.max(0, Math.floor(((width - columnGap * (columns - 1)) / columns) * 100) / 100);

  const items = Children.toArray(children).filter(isValidElement);

  return (
    <View
      role="list"
      onLayout={(event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.width)}
      style={[
        { width: '100%', flexDirection: 'row', flexWrap: 'wrap', columnGap, rowGap },
        style,
      ]}
      testID={testID}
      {...(IS_WEB ? { dataSet: { bloomListingCardGrid: String(columns) } } : null)}
    >
      {items.map((child, index) => (
        <View
          key={child.key ?? index}
          role="listitem"
          style={{ width: cell }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

export const ListingCardGrid = memo(ListingCardGridComponent);
ListingCardGrid.displayName = 'ListingCardGrid';
