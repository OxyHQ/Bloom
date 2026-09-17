import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { chartHueTone, resolveMonoTone } from '../chart-cards/palette';
import { Meter } from '../stat-bar';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveInsightPalette } from './shared';
import type { PricePerAreaComparisonProps } from './types';

/**
 * This home's price per area against its street, neighbourhood and city.
 *
 *   row     label (body-regular; body-semibold when highlighted) and the
 *           display value right-aligned (body-semibold, tabular), 8 above an
 *           8-tall bar; rows 16 apart
 *   bar     the shared meter rail, radius 4; the fill is `value / largest
 *           value` of the track
 *
 * THE COLOURS COME FROM THE CHART PALETTE, NOT THE METER'S. This is the one
 * family in the fold that is a CHART rather than a meter: each bar is a
 * different subject compared against the others, so its colour encodes WHICH
 * datum it is, not how much of one thing there is. The highlighted row takes
 * `chart-6` — the brand-anchored blue, a data hue that rotates with the preset
 * — and the comparators take the single-ink neutral (`resolveMonoTone`), which
 * is the chart family's own answer for "a series with no identity of its own".
 * Painting them with the accent would have said they were progress toward
 * something.
 *
 * `resolveMonoTone` rather than `neutralSeries`: the neutral series is
 * `neutral-800` in dark, drawn against a `neutral-900` card — on a rail it
 * lands on the rail's own colour and disappears. The mono tone (`neutral-500`
 * light, near-white dark) is legible over the rail in both modes.
 *
 * Bars start from zero — a price-per-area bar cropped at a baseline would
 * exaggerate a small difference. The list is named by `accessibilityLabel`,
 * and each row is one item named "This home: €4,050/m²".
 */
function PricePerAreaComparisonComponent({
  rows,
  accessibilityLabel = 'Price per square metre',
  style,
  testID,
}: PricePerAreaComparisonProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveInsightPalette(theme), [theme]);
  const series = useMemo(
    () => ({ highlight: chartHueTone(theme, 6).color, rest: resolveMonoTone(theme).color }),
    [theme],
  );
  const max = Math.max(0, ...rows.map((r) => r.value));

  return (
    <View role="list" accessibilityLabel={accessibilityLabel} style={[{ width: '100%', gap: 16 }, style]} testID={testID}>
      {rows.map((row, index) => (
        <View
          key={`${row.label}-${index}`}
          role="listitem"
          accessible
          accessibilityLabel={`${row.label}: ${row.display}`}
          style={{ gap: 8 }}
          testID={testID ? `${testID}-row-${index}` : undefined}
        >
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
            <Text
              variant={row.highlight ? 'body-semibold' : 'body-regular'}
              numberOfLines={1}
              style={{ flex: 1, minWidth: 0, color: palette.text }}
            >
              {row.label}
            </Text>
            <Text variant="body-semibold" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
              {row.display}
            </Text>
          </View>
          <Meter
            decorative
            value={Math.max(0, row.value)}
            max={max}
            height={8}
            fill={row.highlight ? series.highlight : series.rest}
            fillTestID={testID ? `${testID}-row-${index}-fill` : undefined}
          />
        </View>
      ))}
    </View>
  );
}

export const PricePerAreaComparison = memo(PricePerAreaComparisonComponent);
PricePerAreaComparison.displayName = 'PricePerAreaComparison';
