import React from 'react';
import { View, useWindowDimensions } from 'react-native';

import * as Skeleton from '../skeleton';
import { CELL, isNarrow, resolveVisibleColumns, rowGeometry } from './shared';
import type { TrackRowSkeletonProps } from './types';

/**
 * Placeholder rows with the same geometry and column collapsing as `TrackRow`,
 * so the table does not jump when the tracks arrive. Hidden from assistive
 * technology — announce loading on the surrounding region instead.
 */
export function TrackRowSkeleton({
  columns,
  width,
  density = 'comfortable',
  count = 1,
  style,
  testID,
}: TrackRowSkeletonProps) {
  const window = useWindowDimensions();
  const layoutWidth = width ?? window.width;
  const narrow = isNarrow(layoutWidth);
  const visible = columns ?? resolveVisibleColumns(undefined, layoutWidth);
  const has = (column: (typeof visible)[number]) => visible.includes(column);
  const geo = rowGeometry(density, narrow);
  const gap = { marginLeft: geo.gap };
  const bar = (w: number | `${number}%`, h = 10) => <Skeleton.Box width={w} height={h} borderRadius={4} />;

  return (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={style}
      testID={testID}
    >
      {Array.from({ length: count }, (_, i) => {
        // Vary the text widths a little so a block of rows does not read as a grid.
        const titleWidth = 50 + ((i * 37) % 35);
        const artistWidth = 25 + ((i * 23) % 25);
        return (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: geo.height,
              paddingLeft: geo.paddingX,
              paddingRight: geo.paddingX,
            }}
          >
            {has('index') && !narrow ? (
              <View style={{ width: CELL.index, alignItems: 'center' }}>{bar(12)}</View>
            ) : null}
            {has('title') ? (
              <View
                style={[
                  { flex: CELL.flex.title, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
                  has('index') && !narrow ? gap : null,
                ]}
              >
                <Skeleton.Box width={geo.cover} height={geo.cover} borderRadius={geo.coverRadius} />
                <View style={{ flex: 1, marginLeft: 12, gap: density === 'compact' ? 4 : 8 }}>
                  {bar(`${titleWidth}%`, 12)}
                  {bar(`${artistWidth}%`)}
                </View>
              </View>
            ) : null}
            {has('album') ? <View style={[{ flex: CELL.flex.album }, gap]}>{bar('60%')}</View> : null}
            {has('dateAdded') ? (
              <View style={[{ flex: CELL.flex.dateAdded }, gap]}>{bar('50%')}</View>
            ) : null}
            {has('plays') ? (
              <View style={[{ width: CELL.plays, alignItems: 'flex-end' }, gap]}>{bar(64)}</View>
            ) : null}
            {has('duration') && !narrow ? (
              <View style={[{ width: CELL.duration, alignItems: 'flex-end' }, gap]}>{bar(32)}</View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
