import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useChartCardPalette } from './use-chart-palette';

/** `ChartCard`: `h-[329px]`. */
export const CHART_CARD_HEIGHT = 329;
/** `rounded-2xl`. */
export const CHART_CARD_RADIUS = 16;
/** `gap-4` between header, plot and legend. */
export const CHART_CARD_GAP = 16;

export interface ChartCardSurfaceProps {
  /**
   * Fixed card height. Chart cards are 329 tall; the dashboard
   * revenue / orders cards 344. `'auto'` lets the content size the card —
   * what `tiles` cards do (`h-auto`).
   */
  height?: number | 'auto';
  /** Gap between the card's children. Default 16 (the dashboard cards use 24). */
  gap?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: React.ReactNode;
}

/**
 * The ONE chart card shell (`ChartCard` / the dashboard cards'
 * `<section>`): a `background-secondary` column, radius 16, padding
 * 16 / 16 / 12 written as LONGHANDS so a caller's `style` padding override
 * lands on web too, children spaced by `gap`.
 */
export function ChartCardSurface({
  height = CHART_CARD_HEIGHT,
  gap = CHART_CARD_GAP,
  style,
  testID,
  children,
}: ChartCardSurfaceProps) {
  const palette = useChartCardPalette();
  return (
    <View
      testID={testID}
      style={[
        {
          height: height === 'auto' ? undefined : height,
          minWidth: 0,
          flexDirection: 'column',
          gap,
          borderRadius: CHART_CARD_RADIUS,
          backgroundColor: palette.surface,
          paddingTop: 16,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 12,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
