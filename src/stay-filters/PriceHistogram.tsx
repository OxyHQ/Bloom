import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { chartHueTone } from '../chart-cards/palette';
import { useTheme } from '../theme/use-theme';
import type { PriceHistogramProps } from './types';

/**
 * How many listings sit at each price, as a row of bars.
 *
 *   bars      equal width (flex 1), 2px apart, top corners radius 3
 *   height    count / tallest count × `height` (default 64); a non-empty bucket
 *             is at least 2 tall so it stays visible, an empty one draws nothing
 *   in range  the chart series tone (`chart-6`, the blue hue re-anchored on the
 *             theme's primary — the same ink every chart card and the range
 *             slider underneath use) — a bucket whose MIDPOINT lies inside `value`
 *   outside   neutral-300 (dark neutral-700)
 *
 * The buckets split `min`..`max` evenly, so the row spans exactly the width a
 * `RangeSlider` with the same bounds maps prices onto: a bar sits over the
 * prices it counts. It is decorative — hidden from assistive technology, since
 * the slider it sits on announces the same range as numbers.
 */

/** Which buckets fall inside the range, by midpoint. Exported for the tests. */
export function histogramSelection(
  bucketCount: number,
  min: number,
  max: number,
  [low, high]: [number, number],
): boolean[] {
  const width = bucketCount > 0 ? (max - min) / bucketCount : 0;
  return Array.from({ length: bucketCount }, (_, i) => {
    const mid = min + (i + 0.5) * width;
    return mid >= low && mid <= high;
  });
}

const BAR_GAP = 2;
const BAR_RADIUS = 3;
const MIN_BAR = 2;

function PriceHistogramComponent({ buckets, min, max, value, height = 64, style, testID }: PriceHistogramProps) {
  const theme = useTheme();
  const { neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const tallest = buckets.reduce((m, n) => Math.max(m, n), 0);
  const selected = histogramSelection(buckets.length, min, max, value);
  const inColor = useMemo(() => chartHueTone(theme, 6).color, [theme]);
  const outColor = theme.isDark ? neutral[700] : neutral[300];

  return (
    <View
      testID={testID}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[{ height, flexDirection: 'row', alignItems: 'flex-end', gap: BAR_GAP }, style]}
    >
      {buckets.map((count, i) => {
        const barHeight = count <= 0 || tallest <= 0 ? 0 : Math.max(MIN_BAR, (count / tallest) * height);
        return (
          <View
            key={i}
            testID={testID ? `${testID}-bar-${i}` : undefined}
            style={{
              flex: 1,
              minWidth: 0,
              height: barHeight,
              borderTopLeftRadius: BAR_RADIUS,
              borderTopRightRadius: BAR_RADIUS,
              backgroundColor: selected[i] ? inColor : outColor,
            }}
          />
        );
      })}
    </View>
  );
}

export const PriceHistogram = memo(PriceHistogramComponent);
PriceHistogram.displayName = 'PriceHistogram';
