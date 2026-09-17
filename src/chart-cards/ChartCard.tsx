import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { BREAKPOINTS } from '../styles/breakpoints';
import { borderRadius } from '../styles/tokens';
import { Text } from '../typography';
import { describeDelta, fixedDomainTicks, type PlotBox } from './geometry';
import type { ChartCardPalette } from './palette';
import { CartesianPlot, type ChartSize } from './primitives/CartesianPlot';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { ChartHeadline } from './primitives/ChartHeader';
import { groupThousands } from './primitives/format';
import type { ChartCardPoint, YearOverYearChartCardProps } from './types';

/**
 * The dashboard variant of the chart card chrome, shared by
 * `RevenueChartCard` and `OrdersChartCard`. Built from the same
 * primitives as every other chart card (`primitives/`):
 *
 *   card      `ChartCardSurface` at h 344, gap 24
 *   header    ≥ sm: `ChartHeadline` left, legend right (items-start);
 *             < sm: stacked, gap 12
 *   headline  label + count-up number + delta chip + "… last year" caption
 *   legend    8px dots, gap 6 to the label, 16 between items, body-2-medium,
 *             text-secondary
 *   chart     `CartesianPlot` filling the rest (216 tall at the card's 344)
 *
 * Internal to `chart-cards`: not published on its own.
 */

export const CARD_HEIGHT = 344;
const CARD_GAP = 24;
const LEGEND_DOT = 8;

const MONTHS: Record<string, string> = {
  Jan: 'January',
  Feb: 'February',
  Mar: 'March',
  Apr: 'April',
  May: 'May',
  Jun: 'June',
  Jul: 'July',
  Aug: 'August',
  Sep: 'September',
  Oct: 'October',
  Nov: 'November',
  Dec: 'December',
};

/** `"Jul"` → `"July"`, anything else unchanged. */
export function defaultPointTitle(point: ChartCardPoint): string {
  return MONTHS[point.label] ?? point.label;
}

export { groupThousands };
export { useActiveIndex } from './primitives/use-active-index';
export { useChartCardPalette } from './primitives/use-chart-palette';

/** `"Revenue chart: this year against last year"`. */
export function chartAccessibilityLabel(title: string, currentLabel = 'This year', previousLabel = 'Last year'): string {
  return `${title} chart: ${currentLabel.toLowerCase()} against ${previousLabel.toLowerCase()}`;
}

// ---------------------------------------------------------------------------
//  Card + header
// ---------------------------------------------------------------------------

export interface ChartCardFrameProps extends YearOverYearChartCardProps {
  /** Default headline label. */
  defaultTitle: string;
  /** Default headline / caption formatter. */
  defaultFormatValue: (value: number) => string;
  /** The active series colour, for the legend dot. */
  seriesColor: string;
  /** The comparison series colour, for the legend dot. */
  comparisonColor: string;
  activeIndex: number | null;
  palette: ChartCardPalette;
  /** Renders the plot into the space under the header. */
  children: React.ReactNode;
}

export function ChartCardFrame({
  data,
  title,
  defaultTitle,
  getPointTitle,
  formatValue,
  defaultFormatValue,
  currentLabel = 'This year',
  previousLabel = 'Last year',
  totalComparisonLabel = 'last year',
  pointComparisonLabel = 'a year earlier',
  seriesColor,
  comparisonColor,
  activeIndex,
  palette,
  style,
  testID,
  children,
}: ChartCardFrameProps) {
  const { width: viewportWidth } = useWindowDimensions();
  const wide = viewportWidth >= BREAKPOINTS.sm;
  const format = formatValue ?? defaultFormatValue;

  const totalCurrent = data.reduce((sum, p) => sum + p.current, 0);
  const totalPrevious = data.reduce((sum, p) => sum + p.previous, 0);
  const point = activeIndex !== null ? data[activeIndex] ?? null : null;
  const headlineValue = point ? point.current : totalCurrent;
  const comparison = point ? point.previous : totalPrevious;
  const delta = describeDelta(headlineValue, comparison);
  const label = point ? (getPointTitle ?? defaultPointTitle)(point, activeIndex ?? 0) : (title ?? defaultTitle);

  return (
    <ChartCardSurface height={CARD_HEIGHT} gap={CARD_GAP} style={style} testID={testID}>
      <View
        testID={testID ? `${testID}-header` : undefined}
        style={
          wide
            ? { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }
            : { flexDirection: 'column', gap: 12 }
        }>
        <ChartHeadline
          label={label}
          value={Math.round(headlineValue)}
          format={format}
          delta={delta}
          fadeKey={activeIndex ?? 'total'}
          caption={`${format(comparison)} ${point ? pointComparisonLabel : totalComparisonLabel}`}
          testID={testID}
        />
        <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <LegendDot color={seriesColor} label={currentLabel} palette={palette} />
          <LegendDot color={comparisonColor} label={previousLabel} palette={palette} />
        </View>
      </View>
      <View style={{ minHeight: 0, width: '100%', flex: 1 }}>{children}</View>
    </ChartCardSurface>
  );
}

function LegendDot({ color, label, palette }: { color: string; label: string; palette: ChartCardPalette }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: LEGEND_DOT, height: LEGEND_DOT, borderRadius: borderRadius.full, backgroundColor: color }} />
      <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Plot: the dashboard cards' fixed `[0, max × 1.1]` domain over CartesianPlot
// ---------------------------------------------------------------------------

export type { ChartSize };

export interface ChartPlotRenderArgs {
  size: ChartSize;
  box: PlotBox;
  domainMax: number;
}

export interface ChartPlotProps {
  data: readonly ChartCardPoint[];
  /** recharts `YAxis width`. */
  yAxisWidth: number;
  formatAxisValue: (value: number) => string;
  xScale: 'point' | 'band';
  onActiveIndexChange: (index: number | null) => void;
  palette: ChartCardPalette;
  accessibilityLabel: string;
  testID?: string;
  /** The SVG layer. */
  children: (args: ChartPlotRenderArgs) => React.ReactNode;
}

export function ChartPlot({ data, children, ...plot }: ChartPlotProps) {
  const domainMax = useMemo(() => Math.max(0, ...data.map((d) => Math.max(d.current, d.previous))) * 1.1, [data]);
  const ticks = useMemo(() => fixedDomainTicks(0, domainMax, 4), [domainMax]);
  const categories = useMemo(() => data.map((d) => d.label), [data]);
  return (
    <CartesianPlot
      {...plot}
      categories={categories}
      yDomain={[0, domainMax]}
      yTicks={ticks}
      formatYTick={plot.formatAxisValue}>
      {({ size, box }) => children({ size, box, domainMax })}
    </CartesianPlot>
  );
}
