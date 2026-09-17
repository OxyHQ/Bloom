import React, { useCallback, useId, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { curvePath, fixedDomainTicks, type Point } from './geometry';
import { chartHueTone } from './palette';
import { CartesianPlot } from './primitives/CartesianPlot';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { describeDeltaRatio, groupThousands } from './primitives/format';
import { PeriodChartHeader } from './primitives/PeriodChartHeader';
import { PulsingDot } from './primitives/PulsingDot';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette } from './primitives/use-chart-palette';
import { useChartRange, type ChartRange } from './primitives/use-chart-range';
import { lerp, useChartProgress } from './use-chart-progress';

/**
 * One series as a line over a soft gradient, a Weekly / Monthly / Yearly
 * switcher, a count-up headline that follows the hovered point, and a
 * pulsing active dot.
 *
 * The recharts `ComposedChart`, layer by layer on recharts' geometry:
 *
 *   card       329 tall, radius 16, padding 16/16/12, gap 24 (not the 16 of
 *              the `ChartCard` family)
 *   header     `PeriodChartHeader`: headline + delta chip, segmented control
 *   area       the curve closed on the plot base, gradient chart-2 35% → 0%
 *   line       2.5px chart-2-active, monotone (`curved`) or linear (`sharp`)
 *   cursor     1px dashed `4 4`, chart-cursor, plot top to bottom
 *   dot        `PulsingDot`: r 5 with a 3px card ring, halo r 5 → 13 every 1.4s
 *   Y axis     44 wide, domain `[0, max × 1.1]`, 4 ticks, `$6K`, 12px
 *   X axis     13px, 18px under the plot, `preserveStartEnd`
 *   no grid
 *
 * Hover (web) or press-and-scrub (native) moves the headline to the point:
 * label → full month name, number → its value, the chip hides. Over the axes
 * the point is KEPT — the pointer handler only sets. The series reveals
 * left to right over 450ms, morphs on a period switch, snaps under reduced
 * motion.
 */

export interface LinePoint {
  /** X label (`"Jan"`). */
  label: string;
  value: number;
}

/** A switcher period: the segment label plus the props it overrides. */
export type LineRange = ChartRange<{
  data: LinePoint[];
  /** Headline at rest. */
  headline: number;
  /** Delta ratio for the chip (`0.094` → `+9.4%`). */
  delta: number;
}>;

export type LineChartShape = 'curved' | 'sharp';

export interface LineChartCardProps {
  /** `curved` (monotone spline, default) or `sharp` (straight segments). */
  shape?: LineChartShape;
  /** Header label at rest. Default `"Revenue"`. */
  title?: string;
  /** Points left to right. Required unless every range carries its own. */
  data?: readonly LinePoint[];
  /** Headline at rest; defaults to the sum of the points. */
  headline?: number;
  /** Delta ratio for the chip; no chip when omitted. */
  delta?: number;
  /** Periods for the segmented switcher (e.g. Weekly / Monthly / Yearly). */
  ranges?: readonly LineRange[];
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  /** Names the switcher. Default `"<title> period"`. */
  rangesLabel?: string;
  /** Header label for a hovered point. Default: the full month name for `"Jul"`, else the label. */
  getPointTitle?: (point: LinePoint, index: number) => string;
  /** Headline format. Default `$18,240`. */
  format?: (value: number) => string;
  /** Y tick format. Default `$6K`. */
  formatAxisValue?: (value: number) => string;
  /** Series colours; default chart-2 (lime on a blue theme) and its hover step. */
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
/** `gap-6` — this card's header-to-chart gap. */
const CARD_GAP = 24;

const MONTH_NAMES: Record<string, string> = {
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

/** Maps `"Jul"` → `"July"`, anything else unchanged. */
export function monthTitle(label: string): string {
  return MONTH_NAMES[label] ?? label;
}

/** `$18,240` — `` `$${display.toLocaleString()}` ``. */
export const formatDollars = (value: number) => `$${groupThousands(value)}`;
/** `$0`, else `$6K` rounded to thousands. */
export const formatDollarsK = (value: number) => (value === 0 ? '$0' : `$${Math.round(value / 1000)}K`);

/** recharts `Area` on a flat base: the curve, down to the base at the last point, back to the first, closed. */
export function closedAreaPath(points: readonly Point[], baseY: number, shape: 'monotone' | 'linear'): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  return `${curvePath(points, shape)}L${r3(last.x)},${r3(baseY)}L${r3(first.x)},${r3(baseY)}Z`;
}

export function LineChartCard({
  shape = 'curved',
  title = 'Revenue',
  data: dataProp,
  headline: headlineProp,
  delta: deltaProp,
  ranges,
  defaultRange,
  onRangeChange,
  rangesLabel,
  getPointTitle,
  format = formatDollars,
  formatAxisValue = formatDollarsK,
  color,
  activeColor,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: LineChartCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);
  const data = selected?.data ?? dataProp ?? [];
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;

  const tone = useMemo(() => chartHueTone(theme, 2), [theme]);
  const fill = color ?? tone.color;
  const stroke = activeColor ?? (color ? color : tone.activeColor);

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
  const { domainMax, ticks } = useMemo(() => {
    const max = Math.max(0, ...values) * 1.1;
    return { domainMax: max, ticks: fixedDomainTicks(0, max, TICK_COUNT) };
  }, [values]);
  const anim = useChartProgress(values);
  const curve = shape === 'sharp' ? 'linear' : 'monotone';

  const hovering = activeIndex !== null;
  const total = headline ?? values.reduce((sum, v) => sum + v, 0);
  const point = hovering ? data[activeIndex] : undefined;
  const label = point ? (getPointTitle ? getPointTitle(point, activeIndex!) : monthTitle(point.label)) : title;

  const rawId = useId();
  const id = `bloom-line-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

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
        rangesLabel={rangesLabel ?? `${title} period`}
        testID={testID}
      />
      <View style={{ width: '100%', flex: 1, minHeight: 0 }}>
        <CartesianPlot
          categories={categories}
          yAxisWidth={Y_AXIS_WIDTH}
          yDomain={[0, domainMax]}
          yTicks={ticks}
          formatYTick={formatAxisValue}
          outside="keep"
          onActiveIndexChange={setActiveIndex}
          palette={palette}
          accessibilityLabel={accessibilityLabel ?? `${title} line chart`}
          testID={testID ? `${testID}-plot` : undefined}>
          {({ size, box, x, y }) => {
            const points: Point[] = values.map((v, i) => ({
              x: x(i),
              y: y(anim.from && anim.from.length === values.length ? lerp(anim.from[i]!, v, anim.progress) : v),
            }));
            const revealWidth = anim.from ? size.width : box.left + (size.width - box.left) * anim.progress;
            const active = activeIndex !== null ? points[activeIndex] : undefined;
            return (
              <Svg width={size.width} height={size.height} pointerEvents="none">
                <Defs>
                  <LinearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={fill} stopOpacity={0.35} />
                    <Stop offset="1" stopColor={fill} stopOpacity={0} />
                  </LinearGradient>
                  <ClipPath id={`${id}-reveal`}>
                    <Rect x={0} y={0} width={revealWidth} height={size.height} />
                  </ClipPath>
                </Defs>
                <G clipPath={`url(#${id}-reveal)`}>
                  <Path d={closedAreaPath(points, box.bottom, curve)} fill={`url(#${id}-fill)`} stroke="none" />
                  <Path d={curvePath(points, curve)} fill="none" stroke={stroke} strokeWidth={2.5} />
                </G>
                {active ? (
                  <>
                    {/* recharts paints the tooltip cursor over the series. */}
                    <Line
                      x1={active.x}
                      y1={box.top}
                      x2={active.x}
                      y2={box.bottom}
                      stroke={palette.cursor}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <PulsingDot
                      cx={active.x}
                      cy={active.y}
                      color={stroke}
                      ring={palette.surface}
                      testID={testID ? `${testID}-dot` : undefined}
                    />
                  </>
                ) : null}
              </Svg>
            );
          }}
        </CartesianPlot>
      </View>
    </ChartCardSurface>
  );
}
