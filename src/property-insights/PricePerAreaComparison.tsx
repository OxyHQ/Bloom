import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

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
 *   bar     neutral-100 (dark neutral-800) track, radius 4; the fill is
 *           `value / largest value` of the track — primary for the
 *           `highlight` row, neutral-300 (dark neutral-700) for the others
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
  const max = Math.max(0, ...rows.map((r) => r.value));

  return (
    <View role="list" accessibilityLabel={accessibilityLabel} style={[{ width: '100%', gap: 16 }, style]} testID={testID}>
      {rows.map((row, index) => {
        const ratio = max > 0 ? Math.max(0, row.value) / max : 0;
        return (
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
            <View style={{ height: 8, borderRadius: 4, backgroundColor: palette.track, overflow: 'hidden' }}>
              <View
                testID={testID ? `${testID}-row-${index}-fill` : undefined}
                style={{
                  width: `${ratio * 100}%`,
                  height: '100%',
                  borderRadius: 4,
                  backgroundColor: row.highlight ? palette.accent : palette.bar,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export const PricePerAreaComparison = memo(PricePerAreaComparisonComponent);
PricePerAreaComparison.displayName = 'PricePerAreaComparison';
