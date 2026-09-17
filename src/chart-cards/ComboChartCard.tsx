import React, { useCallback, useId, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg';

import { monotoneXPath, niceTicks, type Point } from './geometry';
import { resolveTone } from './palette';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { ChartHeader } from './primitives/ChartHeader';
import { ChartStatTiles } from './primitives/ChartStatTiles';
import { compactNumber, describeDeltaRatio, formatNumber } from './primitives/format';
import { MultiAxisPlot } from './primitives/MultiAxisPlot';
import { PulsingDot } from './primitives/PulsingDot';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette, useChartTones } from './primitives/use-chart-palette';
import { useChartRange, type ChartRange } from './primitives/use-chart-range';
import { useWebTransition } from './primitives/use-web-transition';
import { roundedBarPath, singleBarSlot } from './rounded-bar-geometry';
import { lerp, useChartProgress } from './use-chart-progress';

/**
 * `ComboChartCard`: a bar series on the left axis and a line series on its
 * own right axis — the "volume plus rate" shape (sessions and conversion,
 * revenue and margin).
 *
 * The recharts `ComposedChart`, layer by layer:
 *
 *   card       `ChartCardSurface` (329, gap 16); `h-auto` with tiles
 *   header     `ChartHeader`: "<category> · <other series> <value>" label,
 *              headline, delta chip, range pill / dropdown
 *   grid       dashed `4 4` chart-track at the plot's top and bottom edges
 *              only — `CartesianGrid` finds no default Y axis among the two
 *              named ones, so it draws just the box's horizontal edges
 *   bars       `barCategoryGap` 22%, whole-pixel width, `maxBarSize` 34,
 *              radius 8 on all four corners; hovered bar `-active`, the others
 *              at 30%, easing fill + opacity 200ms
 *   casing     the line again, 7px in the card colour, round caps and joins —
 *              it cuts a gap wherever the line crosses a bar
 *   line       2px `-active`, monotone, round caps and joins
 *   dots       r 3 `-active` with a 2px card ring on every point (after the
 *              series animation, as recharts); `PulsingDot` on the hovered one
 *   axes       left 44 wide (`compactNumber`), right 40 wide (the line
 *              format), 4 nice ticks each; X 13px `preserveStartEnd`
 *
 * Tiles (`tiles`) under a 196px plot: the bar total (the hovered category's
 * bar value while hovering) and the line average ("this month" while hovering).
 * Over the axes the category clears.
 */

export type ComboPoint = { label: string } & Record<string, number | string>;

export interface ComboSeries {
  /** Field of `ComboPoint` holding this series' values. */
  key: string;
  label: string;
  /** Any colour; defaults to the chart palette (lime bars, blue line). */
  color?: string;
  activeColor?: string;
  /** Axis tick + headline format for this series alone. */
  format?: (value: number) => string;
}

export type ComboRange = ChartRange<{
  data: ComboPoint[];
  delta: number;
  headline: number;
}>;

export interface ComboChartCardProps {
  /** Header label at rest; the hovered category's label while hovering. Default `"Sessions"`. */
  title?: string;
  /** Rows left to right. Required unless every range carries its own. */
  data?: readonly ComboPoint[];
  /** Bar series, read against the left axis. */
  bar: ComboSeries;
  /** Line series, read against the right axis. */
  line: ComboSeries;
  /** Headline at rest; defaults to the bar total (the line total with `headlineFrom="line"`). */
  headline?: number;
  /** Delta ratio for the chip. */
  delta?: number;
  /** Static period pill. Ignored when `ranges` is set. */
  range?: string;
  /** Selectable periods: the pill becomes a dropdown. */
  ranges?: readonly ComboRange[];
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  /** Stat tiles under the chart (bar total, line average); the card grows to fit. */
  tiles?: boolean;
  /** Which series the big number reads from. Default `bar`. */
  headlineFrom?: 'bar' | 'line';
  /** Replaces the label's caption part; receives the hovered row, or `undefined` at rest. */
  caption?: (row?: ComboPoint) => string;
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const LEFT_AXIS_WIDTH = 44;
const RIGHT_AXIS_WIDTH = 40;
const TICK_COUNT = 4;
const MARGIN = { top: 4, right: 0, bottom: 0, left: 0 } as const;
const BAR_CATEGORY_GAP = 0.22;
const MAX_BAR_SIZE = 34;
const BAR_RADIUS = 8;
/** Opacity of the other bars while one category is hovered. */
const DIM = 0.3;
const TILES_PLOT_HEIGHT = 196;

/** Combo `percent` format: `3.7%`, one decimal at most. */
export const formatPercent = (value: number) => `${Math.round(value * 10) / 10}%`;

const numberAt = (row: ComboPoint | undefined, key: string) => {
  const v = Number(row?.[key] ?? 0);
  return Number.isFinite(v) ? v : 0;
};

function axisOf(values: readonly number[]): { domain: readonly [number, number]; ticks: number[] } {
  const ticks = niceTicks(0, Math.max(0, ...values), TICK_COUNT);
  return { domain: [ticks[0] ?? 0, ticks[ticks.length - 1] ?? 0], ticks };
}

export function ComboChartCard({
  title = 'Sessions',
  data: dataProp,
  bar,
  line,
  headline: headlineProp,
  delta: deltaProp,
  range,
  ranges,
  defaultRange,
  onRangeChange,
  tiles = false,
  headlineFrom = 'bar',
  caption,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: ComboChartCardProps) {
  const palette = useChartCardPalette();
  const tones = useChartTones();
  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);
  const data = selected?.data ?? dataProp ?? [];
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;

  const barTone = resolveTone(tones, 0, bar.color, bar.activeColor);
  const lineTone = resolveTone(tones, 1, line.color, line.activeColor);
  const barFormat = bar.format ?? formatNumber;
  const lineFormat = line.format ?? formatPercent;

  const [activeIndex, setActiveIndex] = useActiveIndex(data.length, controlledIndex, onActiveIndexChange);
  const selectRange = useCallback(
    (id: string) => {
      setActiveIndex(null);
      select(id);
    },
    [select, setActiveIndex],
  );

  const barValues = useMemo(() => data.map((row) => numberAt(row, bar.key)), [data, bar.key]);
  const lineValues = useMemo(() => data.map((row) => numberAt(row, line.key)), [data, line.key]);
  const categories = useMemo(() => data.map((row) => String(row.label)), [data]);
  const barAxis = useMemo(() => axisOf(barValues), [barValues]);
  const lineAxis = useMemo(() => axisOf(lineValues), [lineValues]);
  const barAnim = useChartProgress(barValues);
  const lineAnim = useChartProgress(lineValues);

  const barTotal = barValues.reduce((sum, v) => sum + v, 0);
  const lineTotal = lineValues.reduce((sum, v) => sum + v, 0);
  const lineAverage = lineValues.length ? lineTotal / lineValues.length : 0;

  const hovering = activeIndex !== null;
  const headerLabel = hovering ? String(data[activeIndex]?.label ?? title) : title;
  const fromLine = headlineFrom === 'line';
  const headlineValues = fromLine ? lineValues : barValues;
  const headlineValue = hovering ? (headlineValues[activeIndex] ?? 0) : (headline ?? (fromLine ? lineTotal : barTotal));
  // The other series' reading for the category rides along in the label.
  const otherSeries = fromLine ? bar : line;
  const otherFormat = fromLine ? barFormat : lineFormat;
  const captionValue = hovering
    ? ((fromLine ? barValues : lineValues)[activeIndex] ?? 0)
    : fromLine
      ? barTotal
      : lineAverage;
  const label = caption
    ? `${headerLabel} · ${caption(hovering ? data[activeIndex] : undefined)}`
    : `${headerLabel} · ${otherSeries.label} ${otherFormat(captionValue)}`;

  const barEase = useWebTransition('fill, opacity', 200);

  const rawId = useId();
  const id = `bloom-combo-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <ChartCardSurface height={tiles ? 'auto' : undefined} style={style} testID={testID}>
      <ChartHeader
        label={label}
        value={headlineValue}
        format={fromLine ? lineFormat : barFormat}
        delta={delta !== undefined ? describeDeltaRatio(delta) : undefined}
        hovering={hovering}
        fadeKey={`${selectedId ?? ''}:${activeIndex}`}
        range={range}
        ranges={ranges}
        rangeId={selectedId}
        onRangeChange={selectRange}
        testID={testID}
      />

      <View style={tiles ? { width: '100%', height: TILES_PLOT_HEIGHT } : { width: '100%', flex: 1, minHeight: 0 }}>
        <MultiAxisPlot
          categories={categories}
          xScale="band"
          axis={{ width: LEFT_AXIS_WIDTH, domain: barAxis.domain, ticks: barAxis.ticks, format: compactNumber }}
          rightAxis={{ width: RIGHT_AXIS_WIDTH, domain: lineAxis.domain, ticks: lineAxis.ticks, format: lineFormat }}
          margin={MARGIN}
          outside="clear"
          onActiveIndexChange={setActiveIndex}
          palette={palette}
          accessibilityLabel={accessibilityLabel ?? `${title} chart: ${bar.label} bars against ${line.label} line`}
          testID={testID ? `${testID}-plot` : undefined}>
          {({ size, box, x, band, y, yRight }) => {
            const slot = singleBarSlot(band, BAR_CATEGORY_GAP, MAX_BAR_SIZE);
            const bars = barValues.map((v, i) => {
              const from = barAnim.from && barAnim.from.length === barValues.length ? barAnim.from[i]! : null;
              // Mount: grow from the base; data change: morph from the previous value.
              const value = from !== null ? lerp(from, v, barAnim.progress) : v;
              const top = y(value);
              const full = box.bottom - top;
              const height = from !== null ? full : full * barAnim.progress;
              return { x: box.left + i * band + slot.offset, y: box.bottom - height, width: slot.size, height };
            });
            const points: Point[] = lineValues.map((v, i) => ({
              x: x(i),
              y: yRight(
                lineAnim.from && lineAnim.from.length === lineValues.length ? lerp(lineAnim.from[i]!, v, lineAnim.progress) : v,
              ),
            }));
            const d = monotoneXPath(points);
            const revealWidth = lineAnim.from ? size.width : box.left + (size.width - box.left) * lineAnim.progress;
            const settled = lineAnim.progress >= 1;
            const active = activeIndex !== null ? points[activeIndex] : undefined;
            return (
              <Svg width={size.width} height={size.height} pointerEvents="none">
                <Defs>
                  <ClipPath id={`${id}-reveal`}>
                    <Rect x={0} y={0} width={revealWidth} height={size.height} />
                  </ClipPath>
                </Defs>
                {[box.top, box.bottom].map((gy) => (
                  <Line
                    key={`grid-${gy}`}
                    x1={box.left}
                    y1={gy}
                    x2={box.right}
                    y2={gy}
                    stroke={palette.track}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                ))}
                {bars.map((b, i) => (
                  <Path
                    key={`bar-${categories[i]}-${i}`}
                    testID={testID ? `${testID}-bar-${i}` : undefined}
                    d={roundedBarPath(b.x, b.y, b.width, b.height, BAR_RADIUS)}
                    fill={i === activeIndex ? barTone.activeColor : barTone.color}
                    opacity={hovering && i !== activeIndex ? DIM : 1}
                    {...(barEase ? { style: barEase } : null)}
                  />
                ))}
                <G clipPath={`url(#${id}-reveal)`}>
                  <Path
                    d={d}
                    fill="none"
                    stroke={palette.surface}
                    strokeWidth={7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d={d}
                    fill="none"
                    stroke={lineTone.activeColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </G>
                {settled
                  ? points.map((p, i) => (
                      <Circle
                        key={`dot-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={3}
                        fill={lineTone.activeColor}
                        stroke={palette.surface}
                        strokeWidth={2}
                      />
                    ))
                  : null}
                {active ? (
                  <PulsingDot
                    cx={active.x}
                    cy={active.y}
                    color={lineTone.activeColor}
                    ring={palette.surface}
                    testID={testID ? `${testID}-dot` : undefined}
                  />
                ) : null}
              </Svg>
            );
          }}
        </MultiAxisPlot>
      </View>

      {tiles ? (
        <ChartStatTiles
          testID={testID ? `${testID}-tiles` : undefined}
          items={[
            {
              label: `${bar.label} · total`,
              value: barFormat(hovering ? (barValues[activeIndex] ?? 0) : barTotal),
              color: barTone.color,
              activeColor: barTone.activeColor,
            },
            {
              label: `${line.label} · ${hovering ? 'this month' : 'average'}`,
              // Not `captionValue`: it holds the BAR total under
              // `headlineFrom="line"` ("83,200%"); the line's own reading is meant.
              value: lineFormat(hovering ? (lineValues[activeIndex] ?? 0) : lineAverage),
              color: lineTone.color,
              activeColor: lineTone.activeColor,
            },
          ]}
        />
      ) : null}
    </ChartCardSurface>
  );
}
