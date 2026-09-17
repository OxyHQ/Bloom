import React, { memo, useCallback, useMemo, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { groupThousands } from '../chart-cards/primitives/format';
import { DataTable } from '../data-table/DataTable';
import type { DataTableColumn } from '../data-table/types';
import { RiArrowDownLine } from '../icons/remix/RiArrowDownLine';
import { RiArrowUpLine } from '../icons/remix/RiArrowUpLine';
import { RiMusic2Line } from '../icons/remix/RiMusic2Line';
import { RiSubtractLine } from '../icons/remix/RiSubtractLine';
import { useImageResolver } from '../image-resolver/context';
import { isImageUrl } from '../image-resolver/is-image-url';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveCreatorStudioPaint, type CreatorStudioPaint } from './shared';
import type { TopTrackTrend, TopTracksTableLabels, TopTracksTableProps } from './types';

/**
 * `TopTracksTable`: the ranked tracks of a period on `DataTable` (`inset`
 * layout) — rank, cover + title, streams, listeners, saves and a trend glyph.
 *
 *   rank     `body-medium` tabular, text-secondary, 40 wide
 *   track    40px cover (radius 8, a music glyph on the placeholder fill when
 *            there is none) + title `body-medium` over subtitle
 *            `body-2-regular` text-secondary, both truncating
 *   numbers  `body-regular` tabular, right-aligned, sortable (descending first)
 *   trend    a 16px arrow — up positive, down negative, flat text-tertiary — or
 *            a "New" caption in the accent; named for assistive tech
 *
 * Below 560px of its own width Listeners and Saves drop out, so a phone keeps
 * rank, track, streams and the trend without scrolling sideways.
 */

export const TOP_TRACKS_LABELS: TopTracksTableLabels = {
  title: 'Top tracks',
  rank: '#',
  track: 'Track',
  streams: 'Streams',
  listeners: 'Listeners',
  saves: 'Saves',
  trend: 'Trend',
  trends: { up: 'Rising', down: 'Falling', flat: 'Steady', new: 'New entry' },
  empty: 'No streams in this period yet.',
};

const NARROW_BELOW = 560;

export function TrendGlyph({
  trend,
  label,
  paint,
  newLabel = 'New',
  testID,
}: {
  trend: TopTrackTrend;
  label: string;
  paint: CreatorStudioPaint;
  newLabel?: string;
  testID?: string;
}) {
  const content =
    trend === 'new' ? (
      <Text variant="caption-1-medium" style={{ color: paint.accent }}>
        {newLabel}
      </Text>
    ) : trend === 'up' ? (
      <RiArrowUpLine width={16} height={16} fill={paint.positive} />
    ) : trend === 'down' ? (
      <RiArrowDownLine width={16} height={16} fill={paint.negative} />
    ) : (
      <RiSubtractLine width={16} height={16} fill={paint.textTertiary} />
    );
  return (
    <View role="img" accessibilityLabel={label} testID={testID} style={styles.trend}>
      {content}
    </View>
  );
}

function Cover({ artwork, paint, size }: { artwork?: string; paint: CreatorStudioPaint; size: number }) {
  const resolver = useImageResolver();
  const uri = artwork ? (isImageUrl(artwork) ? artwork : resolver?.(artwork, 'thumb')) : undefined;
  return (
    <View style={[styles.cover, { width: size, height: size, borderRadius: size / 5, backgroundColor: paint.placeholder }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.coverImage} accessibilityIgnoresInvertColors />
      ) : (
        <RiMusic2Line width={18} height={18} fill={paint.placeholderIcon} />
      )}
    </View>
  );
}

function TopTracksTableComponent({
  tracks,
  summary,
  format = groupThousands,
  pageSize = 10,
  toolbar,
  labels: labelOverrides,
  accessibilityLabel,
  style,
  testID,
}: TopTracksTableProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCreatorStudioPaint(theme), [theme]);
  const labels = useMemo(
    () => ({
      ...TOP_TRACKS_LABELS,
      ...labelOverrides,
      trends: { ...TOP_TRACKS_LABELS.trends, ...labelOverrides?.trends },
    }),
    [labelOverrides],
  );
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setWidth((prev) => (prev === next ? prev : next));
  }, []);
  const narrow = width > 0 && width < NARROW_BELOW;

  // The rank is the position in `tracks`, kept through sorting.
  const rows = useMemo(() => tracks.map((track, i) => ({ track, rank: i + 1 })), [tracks]);
  type Row = (typeof rows)[number];

  const columns = useMemo<DataTableColumn<Row>[]>(() => {
    const number = (id: 'streams' | 'listeners' | 'saves'): DataTableColumn<Row> => ({
      id,
      header: labels[id],
      width: narrow ? 80 : 112,
      align: 'end',
      accessor: (r) => r.track[id],
      sortDescFirst: true,
      cell: ({ row }) => (
        <Text variant="body-regular" numberOfLines={1} style={[styles.tabular, { color: paint.text }]}>
          {format(row.track[id])}
        </Text>
      ),
    });
    const all: DataTableColumn<Row>[] = [
      {
        id: 'rank',
        header: labels.rank,
        headerAccessibilityLabel: 'Rank',
        width: narrow ? 32 : 40,
        accessor: (r) => r.rank,
        sortDescFirst: false,
        cell: ({ row }) => (
          <Text variant="body-medium" style={[styles.tabular, { color: paint.textSecondary }]}>
            {row.rank}
          </Text>
        ),
      },
      {
        id: 'track',
        header: labels.track,
        flex: 1,
        minWidth: narrow ? 0 : 140,
        accessor: (r) => r.track.title,
        cell: ({ row }) => (
          <View style={[styles.trackCell, { gap: narrow ? 8 : 12 }]}>
            <Cover artwork={row.track.artwork} paint={paint} size={narrow ? 32 : 40} />
            <View style={styles.trackText}>
              <Text variant="body-medium" numberOfLines={1} style={{ color: paint.text }}>
                {row.track.title}
              </Text>
              {row.track.subtitle ? (
                <Text variant="body-2-regular" numberOfLines={1} style={{ color: paint.textSecondary }}>
                  {row.track.subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        ),
      },
      number('streams'),
      number('listeners'),
      number('saves'),
      {
        id: 'trend',
        header: narrow ? '' : labels.trend,
        headerAccessibilityLabel: labels.trend,
        width: narrow ? 40 : 72,
        align: 'end',
        sortable: false,
        cell: ({ row }) => (
          <TrendGlyph
            trend={row.track.trend}
            label={labels.trends[row.track.trend]}
            paint={paint}
            testID={testID ? `${testID}-trend-${row.track.id}` : undefined}
          />
        ),
      },
    ];
    return narrow ? all.filter((c) => c.id !== 'listeners' && c.id !== 'saves') : all;
  }, [labels, narrow, paint, format, testID]);

  const getRowId = useCallback((r: Row) => r.track.id, []);

  return (
    <View onLayout={onLayout} style={[styles.root, style]}>
      <DataTable<Row>
        layout="inset"
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        accessibilityLabel={accessibilityLabel ?? labels.title}
        title={labels.title}
        summary={summary}
        toolbar={toolbar}
        pageSize={pageSize}
        emptyState={labels.empty}
        testID={testID}
      />
    </View>
  );
}

export const TopTracksTable = memo(TopTracksTableComponent) as typeof TopTracksTableComponent;

const styles = StyleSheet.create({
  root: { width: '100%' },
  tabular: { fontVariant: ['tabular-nums'] },
  // Stretched to the cell (which aligns its content to the start), so a long title truncates.
  trackCell: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  trackText: { flex: 1, minWidth: 0, gap: 2 },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  coverImage: { width: '100%', height: '100%' },
  trend: { minWidth: 24, height: 20, alignItems: 'flex-end', justifyContent: 'center' },
});
