import { useContext, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle, type ViewProps } from 'react-native';
import { GridItemStretchContext } from '../../grid/context';

import { type CardProps, Card } from '../../card';

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
  radius?: CardProps['radius'];
  height?: number | 'auto';
  /** Gap between the card's children. Default 16 (the dashboard cards use 24). */
  gap?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onLayout?: ViewProps['onLayout'];
  children: ReactNode;
}

/**
 * The ONE chart card shell (`ChartCard` / the dashboard cards'
 * `<section>`): a `background-secondary` column, radius 16, padding
 * 16 / 16 / 12 written as LONGHANDS so a caller's `style` padding override
 * lands on web too, children spaced by `gap`.
 */
export function ChartCardSurface({
  radius = 'radius-16',
  height = CHART_CARD_HEIGHT,
  gap = CHART_CARD_GAP,
  style,
  testID,
  onLayout,
  children,
}: ChartCardSurfaceProps) {
  const stretch = useContext(GridItemStretchContext);
  const resolved: ViewStyle =
    StyleSheet.flatten<StyleProp<ViewStyle>>([
      {
        height: height === 'auto' ? undefined : height,
        minWidth: 0,
        flexDirection: 'column',
        gap,
        paddingTop: 16,
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 12,
      },
      style,
    ]) ?? {};
  const heightFloor = typeof resolved.height === 'number' ? resolved.height : 0;
  const minimum =
    typeof resolved.minHeight === 'number'
      ? Math.max(resolved.minHeight, heightFloor)
      : (resolved.minHeight ?? heightFloor);
  return (
    <Card
      radius={radius}
      elevation="none"
      testID={testID}
      onLayout={onLayout}
      style={[
        resolved,
        stretch
          ? { height: 'auto', minHeight: minimum, flexGrow: 1, flexShrink: 1, flexBasis: 'auto' }
          : undefined,
      ]}
    >
      <GridItemStretchContext.Provider value={false}>{children}</GridItemStretchContext.Provider>
    </Card>
  );
}
