import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '../../typography';
import { TABULAR } from './ChartHeader';
import { useChartCardPalette } from './use-chart-palette';
import { useWebTransition } from './use-web-transition';

export interface ChartLegendItem {
  label: string;
  /** Swatch colour — the series' fill (`tone.color`). */
  color: string;
  /** Formatted value after the label (a total, or the hovered category's value). */
  value?: string;
}

export interface ChartLegendProps {
  items: readonly ChartLegendItem[];
  /** The focused item; every other one dims to 50%. */
  activeIndex?: number | null;
  /** Hovering an item focuses its series (web / pointer). */
  onActiveChange?: (index: number | null) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The legend: a centred, wrapping row — 16px between items, 4px
 * between wrapped lines. Each item: a 12px swatch with a 4px radius, 6px, the
 * label (`body-regular`, text-secondary), 6px, the value (`body-medium`,
 * text-primary, tabular). Dimmed items fade to 50% over 200ms.
 *
 * Plain text, so a screen reader reads the legend in order.
 */
export function ChartLegend({ items, activeIndex = null, onActiveChange, style, testID }: ChartLegendProps) {
  const palette = useChartCardPalette();
  const transition = useWebTransition('opacity', 200);
  return (
    <View
      testID={testID}
      style={[
        { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 16, rowGap: 4 },
        style,
      ]}>
      {items.map((item, index) => {
        const dimmed = activeIndex !== null && activeIndex !== index;
        return (
          <View
            key={`${item.label}-${index}`}
            testID={testID ? `${testID}-item-${index}` : undefined}
            onPointerEnter={onActiveChange ? () => onActiveChange(index) : undefined}
            onPointerLeave={onActiveChange ? () => onActiveChange(null) : undefined}
            style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: dimmed ? 0.5 : 1 }, transition]}>
            <View style={{ width: 12, height: 12, flexShrink: 0, borderRadius: 4, backgroundColor: item.color }} />
            <Text variant="body-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
              {item.label}
            </Text>
            {item.value !== undefined ? (
              <Text variant="body-medium" numberOfLines={1} style={[{ color: palette.text }, TABULAR]}>
                {item.value}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
