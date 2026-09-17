import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '../../typography';
import { useCountUpPrecise } from '../use-count-up';
import { TABULAR } from './ChartHeader';
import { FadeOnChange } from './FadeOnChange';
import { formatNumber } from './format';
import { useChartCardPalette } from './use-chart-palette';

export interface ChartCenterReadoutProps {
  value: number;
  format?: (value: number) => string;
  caption?: string;
  fadeKey?: string | number;
  /** `display` (32px, `display-4-medium`) for big single-value gauges, `title` (24px) where the hole is smaller. */
  size?: 'display' | 'title';
  /** Override the centring, e.g. `{ justifyContent: 'flex-end' }` to sit on a half gauge's base. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * `ChartCenterReadout`: the number inside a ring chart, absolutely
 * centred over its (relatively positioned) plot, `pointerEvents="none"` so the
 * arcs underneath still take the pointer. Caption `caption-1-medium`
 * text-tertiary, max 120 wide, truncating, pulled up 4px under the number.
 */
export function ChartCenterReadout({
  value,
  format = formatNumber,
  caption,
  fadeKey = 'rest',
  size = 'display',
  style,
  testID,
}: ChartCenterReadoutProps) {
  const palette = useChartCardPalette();
  const display = useCountUpPrecise(value);
  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[
        { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
        style,
      ]}>
      <FadeOnChange fadeKey={fadeKey}>
        <Text
          variant={size === 'display' ? 'display-4-medium' : 'title-1-medium'}
          style={[{ color: palette.text }, TABULAR]}>
          {format(display)}
        </Text>
      </FadeOnChange>
      {caption ? (
        <FadeOnChange fadeKey={`caption:${fadeKey}`} style={{ marginTop: -4, maxWidth: 120 }}>
          <Text variant="caption-1-medium" numberOfLines={1} style={{ color: palette.textTertiary }}>
            {caption}
          </Text>
        </FadeOnChange>
      ) : null}
    </View>
  );
}
