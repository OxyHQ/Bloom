import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useContainerWidth } from '../hooks/use-container-width';
import { Meter, MeterRing } from '../stat-bar';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { NEIGHBOURHOOD_SCORES_TWO_COLUMN_MIN_WIDTH } from './constants';
import { resolveInsightPalette, type InsightPalette } from './shared';
import type { NeighbourhoodScore, NeighbourhoodScoresProps } from './types';

/**
 * How the area around a home scores — transport, schools, shops, green areas,
 * quiet, safety (the labels are props).
 *
 *   columns   `auto`: 1 below 560 wide, 2 from 560; 32 apart, rows 24 apart
 *   bars      icon 20 + label (body-medium) + score right (body-semibold,
 *             tabular); 8 below, a 6-tall `Meter` — the shared neutral-200
 *             (dark neutral-700) track, radius 3, filled with the accent to
 *             `value / max`; the description (body-2-regular, text-secondary)
 *             8 below
 *   rings     a 56 `MeterRing` (5 stroke, same track and fill, starting at 12
 *             o'clock) with the score centred (body-semibold); the label
 *             (body-medium) and description beside it, 16 apart
 *
 * Each bar or ring is a `progressbar` named by its label, with flat
 * `aria-valuemin/max/now` and `aria-valuetext` ("8.4 out of 10").
 */

const RING = 56;
const RING_STROKE = 5;

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

interface ItemProps {
  item: NeighbourhoodScore;
  max: number;
  palette: InsightPalette;
  valueText: string;
  display: string;
  testID?: string;
}

function BarItem({ item, max, palette, valueText, display, testID }: ItemProps) {
  const Icon = item.icon;
  const clamped = Math.min(max, Math.max(0, item.value));
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {Icon ? <Icon width={20} height={20} fill={palette.text} /> : null}
        <Text variant="body-medium" numberOfLines={1} style={{ flex: 1, minWidth: 0, color: palette.text }}>
          {item.label}
        </Text>
        <Text
          variant="body-semibold"
          importantForAccessibility="no"
          accessibilityElementsHidden
          style={{ color: palette.text, fontVariant: ['tabular-nums'] }}
        >
          {display}
        </Text>
      </View>
      <Meter
        value={clamped}
        max={max}
        height={6}
        accessibilityLabel={item.label}
        valueText={valueText}
        testID={testID ? `${testID}-bar` : undefined}
        fillTestID={testID ? `${testID}-fill` : undefined}
      />
      {item.description ? (
        <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
          {item.description}
        </Text>
      ) : null}
    </View>
  );
}

function RingItem({ item, max, palette, valueText, display, testID }: ItemProps) {
  const clamped = Math.min(max, Math.max(0, item.value));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <MeterRing
        value={clamped}
        max={max}
        size={RING}
        thickness={RING_STROKE}
        accessibilityLabel={item.label}
        valueText={valueText}
        testID={testID ? `${testID}-ring` : undefined}
      >
        <Text variant="body-semibold" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
          {display}
        </Text>
      </MeterRing>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="body-medium" style={{ color: palette.text }}>
          {item.label}
        </Text>
        {item.description ? (
          <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function NeighbourhoodScoresComponent({
  items,
  max: maxProp = 10,
  variant = 'bars',
  columns = 'auto',
  formatValueText = (display, max) => `${display} out of ${max}`,
  style,
  testID,
}: NeighbourhoodScoresProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveInsightPalette(theme), [theme]);
  const { width, onLayout } = useContainerWidth();
  const max = maxProp > 0 ? maxProp : 10;
  const count =
    columns === 'auto' ? (width != null && width >= NEIGHBOURHOOD_SCORES_TWO_COLUMN_MIN_WIDTH ? 2 : 1) : columns;
  const Item = variant === 'rings' ? RingItem : BarItem;

  return (
    <View
      onLayout={onLayout}
      role="list"
      style={[{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', rowGap: 24 }, style]}
      testID={testID}
    >
      {items.map((item, index) => {
        const display = item.display ?? formatScore(item.value);
        return (
          <View
            key={`${item.label}-${index}`}
            role="listitem"
            testID={testID ? `${testID}-item-${index}` : undefined}
            style={{
              width: `${100 / count}%`,
              paddingRight: count > 1 && index % 2 === 0 ? 16 : 0,
              paddingLeft: count > 1 && index % 2 === 1 ? 16 : 0,
            }}
          >
            <Item
              item={item}
              max={max}
              palette={palette}
              display={display}
              valueText={formatValueText(display, max)}
              testID={testID ? `${testID}-item-${index}` : undefined}
            />
          </View>
        );
      })}
    </View>
  );
}

export const NeighbourhoodScores = memo(NeighbourhoodScoresComponent);
NeighbourhoodScores.displayName = 'NeighbourhoodScores';
