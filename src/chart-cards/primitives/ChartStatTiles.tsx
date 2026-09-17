import React from 'react';
import { View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

import { BREAKPOINTS } from '../../styles/breakpoints';
import { Text } from '../../typography';
import { TABULAR } from './ChartHeader';
import { useChartCardPalette } from './use-chart-palette';
import { useWebTransition } from './use-web-transition';

export interface ChartStatTile {
  label: string;
  /** Already formatted. */
  value: string;
  /** Swatch colour; no swatch when omitted. */
  color?: string;
  /** Swatch colour while this tile is the active one. */
  activeColor?: string;
}

export interface ChartStatTilesProps {
  items: readonly ChartStatTile[];
  activeIndex?: number | null;
  /** Hovering a tile focuses its item (web / pointer). */
  onActiveChange?: (index: number | null) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Rows of tile indexes: `perRow` at a time, the last row's remainder stretched. */
function rowsOf(count: number, perRow: number): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < count; i += perRow) {
    rows.push(Array.from({ length: Math.min(perRow, count - i) }, (_, k) => i + k));
  }
  return rows;
}

/**
 * `ChartStatTiles`: the tile row under a chart. From `sm` (640) up,
 * three per row on a six-column grid with the last row's remainder stretched
 * (5 → 3 + 2, 4 → 3 + 1); below it two per row, an odd last tile spanning.
 * Rows of equal `flex: 1` tiles reproduce those spans exactly. 8px gaps; the
 * block bleeds 8px past the card's side padding and 4px into its bottom.
 *
 * Tile: radius 10, `background-inner`, padding 8 / 10, 1px between the name
 * row and the value. Name row: 12px swatch (radius 4, 150ms colour ease), 6px,
 * label `body-regular` text-secondary truncating. Value `body-medium`
 * text-primary tabular. While one tile is active the others fade to 40%.
 */
export function ChartStatTiles({ items, activeIndex = null, onActiveChange, style, testID }: ChartStatTilesProps) {
  const palette = useChartCardPalette();
  const { width } = useWindowDimensions();
  const perRow = width >= BREAKPOINTS.sm ? 3 : 2;
  const fade = useWebTransition('opacity', 200);
  const swatchEase = useWebTransition('background-color', 150);
  const hovering = activeIndex !== null;

  return (
    <View testID={testID} style={[{ marginLeft: -8, marginRight: -8, marginBottom: -4, flexDirection: 'column', gap: 8 }, style]}>
      {rowsOf(items.length, perRow).map((row) => (
        <View key={row[0]} style={{ flexDirection: 'row', gap: 8 }}>
          {row.map((i) => {
            const item = items[i]!;
            const active = activeIndex === i;
            return (
              <View
                key={`${item.label}-${i}`}
                testID={testID ? `${testID}-tile-${i}` : undefined}
                onPointerEnter={onActiveChange ? () => onActiveChange(i) : undefined}
                onPointerLeave={onActiveChange ? () => onActiveChange(null) : undefined}
                style={[
                  {
                    flex: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1,
                    borderRadius: 10,
                    backgroundColor: palette.inner,
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 8,
                    paddingBottom: 8,
                    opacity: hovering && !active ? 0.4 : 1,
                  },
                  fade,
                ]}>
                <View style={{ minWidth: 0, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {item.color ? (
                    <View
                      style={[
                        {
                          width: 12,
                          height: 12,
                          flexShrink: 0,
                          borderRadius: 4,
                          backgroundColor: active && item.activeColor ? item.activeColor : item.color,
                        },
                        swatchEase,
                      ]}
                    />
                  ) : null}
                  <Text
                    variant="body-regular"
                    numberOfLines={1}
                    style={{ flexShrink: 1, color: palette.textSecondary }}>
                    {item.label}
                  </Text>
                </View>
                <Text variant="body-medium" numberOfLines={1} style={[{ color: palette.text }, TABULAR]}>
                  {item.value}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
