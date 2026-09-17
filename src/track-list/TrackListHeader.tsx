import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { WEB_POSITION_STICKY } from '../styles/web-view-style';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CELL, DEFAULT_LABELS, IS_WEB, rowGeometry, resolveTrackListPaint } from './shared';
import type { TrackListHeaderProps } from './types';

/**
 * The column labels above a track table: "#", "Title", "Album", "Date added",
 * "Plays" and a clock for the duration, in `caption-1-medium` muted, over a
 * hairline (neutral-200, dark 800). Cells use the row's own widths and gaps, so
 * every label sits over its column.
 *
 * On web it sticks to the top of the scrolling page (`position: sticky`) with
 * the page background behind it; native lists pin it with their own
 * `stickyHeaderIndices`.
 *
 * Accessibility: `role="row"` of `columnheader`s. The clock header is named
 * "Duration".
 */
function TrackListHeaderComponent({
  columns,
  density = 'comfortable',
  reorderable = false,
  likeable = false,
  hasMenu = false,
  sticky = true,
  stickyOffset = 0,
  background,
  labels: labelsProp,
  style,
  testID,
}: TrackListHeaderProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveTrackListPaint(theme), [theme]);
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const geo = rowGeometry(density, false);
  const has = (column: (typeof columns)[number]) => columns.includes(column);
  const gap = { marginLeft: geo.gap };

  const label = (text: string, align: 'left' | 'right' | 'center' = 'left') => (
    <Text
      variant="caption-1-medium"
      numberOfLines={1}
      style={{ color: paint.textMuted, textAlign: align }}
    >
      {text}
    </Text>
  );

  const rootStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingLeft: geo.paddingX,
    paddingRight: geo.paddingX,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: paint.hairline,
    backgroundColor: background ?? theme.colors.background,
    ...(IS_WEB && sticky ? { position: WEB_POSITION_STICKY, top: stickyOffset, zIndex: 1 } : null),
  };

  return (
    <View role="row" aria-rowindex={1} style={[rootStyle, style]} testID={testID}>
      {reorderable ? <View style={{ width: CELL.handle, marginRight: 4, marginLeft: -8 }} /> : null}
      {has('index') ? (
        <View role="columnheader" style={{ width: CELL.index, alignItems: 'center' }}>
          {label(labels.index, 'center')}
        </View>
      ) : null}
      {has('title') ? (
        <View
          role="columnheader"
          style={[{ flex: CELL.flex.title, minWidth: 0 }, has('index') ? gap : null]}
        >
          {label(labels.title)}
        </View>
      ) : null}
      {has('album') ? (
        <View role="columnheader" style={[{ flex: CELL.flex.album, minWidth: 0 }, gap]}>
          {label(labels.album)}
        </View>
      ) : null}
      {has('dateAdded') ? (
        <View role="columnheader" style={[{ flex: CELL.flex.dateAdded, minWidth: 0 }, gap]}>
          {label(labels.dateAdded)}
        </View>
      ) : null}
      {has('plays') ? (
        <View role="columnheader" style={[{ width: CELL.plays }, gap]}>
          {label(labels.plays, 'right')}
        </View>
      ) : null}
      {has('actions') && likeable ? <View style={[{ width: CELL.button }, gap]} /> : null}
      {has('duration') ? (
        <View
          role="columnheader"
          accessibilityLabel={labels.duration}
          style={[
            { width: CELL.duration, alignItems: 'flex-end' },
            has('actions') && likeable ? { marginLeft: 8 } : gap,
          ]}
        >
          <View aria-hidden importantForAccessibility="no-hide-descendants">
            <RiTimeLine width={16} height={16} fill={paint.textMuted} />
          </View>
        </View>
      ) : null}
      {has('actions') && hasMenu ? <View style={{ width: CELL.button, marginLeft: 8 }} /> : null}
    </View>
  );
}

export const TrackListHeader = memo(TrackListHeaderComponent);
TrackListHeader.displayName = 'TrackListHeader';
