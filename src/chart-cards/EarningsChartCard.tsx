import React, { useCallback, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { niceTicks } from './geometry';
import { chartHueTone } from './palette';
import { formatDollars, monthTitle } from './LineChartCard';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { describeDeltaRatio } from './primitives/format';
import { MultiAxisPlot } from './primitives/MultiAxisPlot';
import { PeriodChartHeader } from './primitives/PeriodChartHeader';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette } from './primitives/use-chart-palette';
import { useChartRange, type ChartRange } from './primitives/use-chart-range';
import { useWebTransition } from './primitives/use-web-transition';
import { roundedBarPath, singleBarSlot } from './rounded-bar-geometry';
import { lerp, useChartProgress } from './use-chart-progress';

/**
 * `EarningsChartCard` ("Earned so far"): rounded bars standing in full-height
 * tracks, a Weekly / Monthly / Yearly switcher and a count-up headline that
 * follows the hovered bar.
 *
 * The recharts `BarChart`, layer by layer:
 *
 *   card       329 tall, radius 16, padding 16/16/12, gap 24
 *   header     `PeriodChartHeader`
 *   track      per category, the bar's slot from plot top to bottom, radius 10,
 *              chart-track (recharts `Bar background`)
 *   outline    the track grown 3px each way (radius 13), 2px chart-cursor
 *              stroke, visible only on the hovered bar — 150ms opacity ease
 *   bars       `barCategoryGap` 18%, whole-pixel width, `maxBarSize` 40,
 *              radius 10 on all four corners, chart-2; hovered chart-2-active
 *   Y axis     44 wide, `$10K`; margin right 0, no grid
 *   X axis     13px, recharts' default `preserveEnd` culling
 *
 * The Y axis can be pinned to fixed ticks (e.g. `0 · 3K · 5K · 10K` over
 * `[0, 12000]`) — pass `yTicks` / `yMax` for that; left out, the axis takes
 * recharts' nice ticks for the data. Hovering a bar (web) or pressing and
 * scrubbing (native) swaps the headline to that month; over the axes it
 * clears. Bars grow from the base over 450ms and morph on a period switch.
 */

export interface EarningsPoint {
  label: string;
  value: number;
}

export type EarningsRange = ChartRange<{
  data: EarningsPoint[];
  headline: number;
  delta: number;
}>;

export interface EarningsChartCardProps {
  /** Header label at rest. Default `"Earned so far"`. */
  title?: string;
  /** Bars left to right. Required unless every range carries its own. */
  data?: readonly EarningsPoint[];
  /** Headline at rest; defaults to the sum of the bars. */
  headline?: number;
  /** Delta ratio for the chip; no chip when omitted. */
  delta?: number;
  /** Periods for the segmented switcher. */
  ranges?: readonly EarningsRange[];
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  /** Names the switcher. Default `"Earnings period"`. */
  rangesLabel?: string;
  /** Explicit Y ticks (e.g. `[0, 3000, 5000, 10000]`). Default: nice ticks for the data. */
  yTicks?: readonly number[];
  /** Top of the Y domain (e.g. `12000`). Default: the last tick. */
  yMax?: number;
  getPointTitle?: (point: EarningsPoint, index: number) => string;
  /** Headline format. Default `$7,462`. */
  format?: (value: number) => string;
  /** Y tick format. Default `$10K`. */
  formatAxisValue?: (value: number) => string;
  color?: string;
  activeColor?: string;
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const Y_AXIS_WIDTH = 44;
const TICK_COUNT = 4;
const CARD_GAP = 24;
const MARGIN = { top: 4, right: 0, bottom: 0, left: 0 } as const;
const BAR_CATEGORY_GAP = 0.18;
const MAX_BAR_SIZE = 40;
const BAR_RADIUS = 10;
/** Gap between the track and the hover outline, and the outline thickness. */
const HOVER_PADDING = 3;
const HOVER_STROKE = 2;

/** Earnings format: `$0`, `$3K`, `$2.5K` — no rounding. */
export const formatEarningsK = (value: number) => (value === 0 ? '$0' : `$${value / 1000}K`);

export function EarningsChartCard({
  title = 'Earned so far',
  data: dataProp,
  headline: headlineProp,
  delta: deltaProp,
  ranges,
  defaultRange,
  onRangeChange,
  rangesLabel = 'Earnings period',
  yTicks,
  yMax,
  getPointTitle,
  format = formatDollars,
  formatAxisValue = formatEarningsK,
  color,
  activeColor,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: EarningsChartCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);
  const data = selected?.data ?? dataProp ?? [];
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;

  const tone = useMemo(() => chartHueTone(theme, 2), [theme]);
  const fill = color ?? tone.color;
  const fillActive = activeColor ?? (color ? color : tone.activeColor);

  const [activeIndex, setActiveIndex] = useActiveIndex(data.length, controlledIndex, onActiveIndexChange);
  const selectRange = useCallback(
    (id: string) => {
      setActiveIndex(null);
      select(id);
    },
    [select, setActiveIndex],
  );

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const categories = useMemo(() => data.map((d) => d.label), [data]);
  const axis = useMemo(() => {
    const ticks = yTicks ?? niceTicks(0, Math.max(0, ...values), TICK_COUNT);
    const max = yMax ?? ticks[ticks.length - 1] ?? 0;
    return { width: Y_AXIS_WIDTH, domain: [0, max] as const, ticks, format: formatAxisValue };
  }, [yTicks, yMax, values, formatAxisValue]);
  const anim = useChartProgress(values);
  const outlineEase = useWebTransition('opacity', 150);

  const hovering = activeIndex !== null;
  const point = hovering ? data[activeIndex] : undefined;
  const label = point ? (getPointTitle ? getPointTitle(point, activeIndex!) : monthTitle(point.label)) : title;
  const total = headline ?? values.reduce((sum, v) => sum + v, 0);

  return (
    <ChartCardSurface gap={CARD_GAP} style={style} testID={testID}>
      <PeriodChartHeader
        label={label}
        value={point ? point.value : total}
        format={format}
        delta={delta !== undefined ? describeDeltaRatio(delta) : undefined}
        hovering={hovering}
        fadeKey={`${selectedId ?? ''}:${activeIndex}`}
        ranges={ranges}
        rangeId={selectedId}
        onRangeChange={selectRange}
        rangesLabel={rangesLabel}
        testID={testID}
      />
      <View style={{ width: '100%', flex: 1, minHeight: 0 }}>
        <MultiAxisPlot
          categories={categories}
          xScale="band"
          axis={axis}
          margin={MARGIN}
          xInterval="preserveEnd"
          outside="clear"
          onActiveIndexChange={setActiveIndex}
          palette={palette}
          accessibilityLabel={accessibilityLabel ?? `${title} bar chart`}
          testID={testID ? `${testID}-plot` : undefined}>
          {({ size, box, band, y }) => {
            const slot = singleBarSlot(band, BAR_CATEGORY_GAP, MAX_BAR_SIZE);
            const trackHeight = box.bottom - box.top;
            return (
              <Svg width={size.width} height={size.height} pointerEvents="none">
                {values.map((v, i) => {
                  const x = box.left + i * band + slot.offset;
                  const from = anim.from && anim.from.length === values.length ? anim.from[i]! : null;
                  const value = from !== null ? lerp(from, v, anim.progress) : v;
                  const full = Math.max(0, box.bottom - y(value));
                  const height = from !== null ? full : full * anim.progress;
                  const active = i === activeIndex;
                  return (
                    <G key={`bar-${categories[i]}-${i}`}>
                      <Rect
                        x={x}
                        y={box.top}
                        width={slot.size}
                        height={trackHeight}
                        rx={BAR_RADIUS}
                        ry={BAR_RADIUS}
                        fill={palette.track}
                      />
                      <Rect
                        testID={testID ? `${testID}-outline-${i}` : undefined}
                        x={x - HOVER_PADDING}
                        y={box.top - HOVER_PADDING}
                        width={slot.size + HOVER_PADDING * 2}
                        height={trackHeight + HOVER_PADDING * 2}
                        rx={BAR_RADIUS + HOVER_PADDING}
                        ry={BAR_RADIUS + HOVER_PADDING}
                        fill="none"
                        stroke={palette.cursor}
                        strokeWidth={HOVER_STROKE}
                        opacity={active ? 1 : 0}
                        {...(outlineEase ? { style: outlineEase } : null)}
                      />
                      <Path
                        testID={testID ? `${testID}-bar-${i}` : undefined}
                        d={roundedBarPath(x, box.bottom - height, slot.size, height, BAR_RADIUS)}
                        fill={active ? fillActive : fill}
                      />
                    </G>
                  );
                })}
              </Svg>
            );
          }}
        </MultiAxisPlot>
      </View>
    </ChartCardSurface>
  );
}
