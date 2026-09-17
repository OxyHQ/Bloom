import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { chartHueTone, resolveChartCardPalette } from '../chart-cards/palette';
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
 *   bar     8 tall, radius 4, `value / largest value` wide — and NO rail
 *
 * THE COLOURS COME FROM THE CHART PALETTE, NOT THE METER'S, AND THERE IS NO
 * RAIL. This is the one family in the fold that is a CHART rather than a meter:
 * each bar is a different subject compared against the others, so its colour
 * encodes WHICH datum it is, not how much of one thing there is. The
 * highlighted row takes `chart-6` — the brand-anchored blue, a data hue that
 * rotates with the preset — and the comparators `neutralSeries`. Painting them
 * with the accent would have said they were progress toward something.
 *
 * The rail went with them, and it had to: `neutralSeries` is `neutral-800` in
 * dark, drawn against a `neutral-900` card, so on ANY rail dark enough to read
 * as a rail it lands on the rail's own colour and disappears. A bar chart does
 * not draw the remainder anyway — the row already states the value in words,
 * and the lengths are the comparison. The first attempt kept the rail and used
 * `resolveMonoTone` instead, which is legible in both modes but paints the
 * comparators heavier than the highlighted row: the emphasis inverted, which a
 * colour assertion cannot see and a screenshot can.
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
    () => ({ highlight: chartHueTone(theme, 6).color, rest: resolveChartCardPalette(theme).neutralSeries }),
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
            track="transparent"
            fillTestID={testID ? `${testID}-row-${index}-fill` : undefined}
          />
        </View>
      ))}
    </View>
  );
}

export const PricePerAreaComparison = memo(PricePerAreaComparisonComponent);
PricePerAreaComparison.displayName = 'PricePerAreaComparison';
