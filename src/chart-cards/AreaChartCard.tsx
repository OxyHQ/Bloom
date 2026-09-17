import React, { useCallback, useId, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { areaBandPath, curvePath, niceTicks, stackSeries, type Point } from './geometry';
import { CartesianPlot } from './primitives/CartesianPlot';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { ChartHeader } from './primitives/ChartHeader';
import { ChartLegend } from './primitives/ChartLegend';
import { ChartStatTiles } from './primitives/ChartStatTiles';
import { compactNumber, describeDeltaRatio, formatNumber, percentTick } from './primitives/format';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette, useChartTones } from './primitives/use-chart-palette';
import { useChartRange } from './primitives/use-chart-range';
import { resolveTone } from './palette';
import type { AreaChartCardProps, AreaPoint, AreaSeries } from './types';
import { lerp, useChartProgress } from './use-chart-progress';

/**
 * `AreaChartCard`: a multi-series area chart — composition over time — in
 * three looks.
 *
 * The recharts `AreaChart` it draws, rebuilt in react-native-svg on recharts'
 * geometry (`geometry.ts`), layer by layer:
 *
 *   grid       horizontal only, dashed `4 4`, chart-track, at every Y tick
 *   areas      per series in order: the band (stacked on the series below
 *              unless `overlap`) filled with a vertical gradient of the series
 *              colour, 55% → 4% (40% → 4% in `overlap`), under recharts' default
 *              `fillOpacity` 0.6; then its top curve, 2px, in `-active`
 *   cursor     1px dashed `4 4` rule, chart-cursor, plot top to bottom
 *   dots       r 4 in `-active` with a 2px ring in the card colour, one per series
 *   Y axis     44 wide, 4 "nice" ticks (`0 · 4.5K · 9K · 13.5K`), 12px; the
 *              100% chart pins `0%…100%` in quarters
 *   X axis     13px, 18px under the plot, `preserveStartEnd` culling
 *
 * Hovering a category (web) or pressing and scrubbing (native) swaps the header
 * label to the category and the number to its total (its first series' value in
 * `overlap`), hides the delta chip, and moves the legend / tiles to that
 * category's values. Over the axes the category clears. Series reveal left
 * to right over 450ms on mount and morph on a data change; all of it snaps
 * under reduced motion.
 */

const Y_AXIS_WIDTH = 44;
const TICK_COUNT = 4;
const PERCENT_TICKS = [0, 0.25, 0.5, 0.75, 1] as const;
/** recharts `Area` default `fillOpacity`. */
const AREA_FILL_OPACITY = 0.6;
/** `h-[196px]` — the plot's fixed height when the card carries tiles. */
const TILES_PLOT_HEIGHT = 196;

const valueOf = (row: AreaPoint | undefined, key: string) => {
  const v = Number(row?.[key] ?? 0);
  return Number.isFinite(v) ? v : 0;
};

function defaultAccessibilityLabel(title: string, variant: string, series: readonly AreaSeries[]): string {
  const kind = variant === 'percent' ? '100% stacked area chart' : variant === 'overlap' ? 'area chart' : 'stacked area chart';
  return `${title} ${kind}: ${series.map((s) => s.label).join(', ')}`;
}

export function AreaChartCard({
  variant = 'stacked',
  shape = 'curved',
  title = 'Visitors',
  data: dataProp,
  series: seriesProp,
  headline: headlineProp,
  delta: deltaProp,
  range,
  ranges,
  defaultRange,
  onRangeChange,
  format = formatNumber,
  formatAxisValue,
  tiles = false,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: AreaChartCardProps) {
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);

  const data = selected?.data ?? dataProp ?? [];
  const series = selected?.series ?? seriesProp ?? [];
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;
  const tones = useMemo(
    () => series.map((s, i) => resolveTone(palettes, i, s.color, s.activeColor)),
    [series, palettes],
  );

  const [activeIndex, setActiveIndex] = useActiveIndex(data.length, controlledIndex, onActiveIndexChange);
  const selectRange = useCallback(
    (id: string) => {
      setActiveIndex(null);
      select(id);
    },
    [select, setActiveIndex],
  );

  const isPercent = variant === 'percent';
  const curve = shape === 'sharp' ? 'linear' : 'monotone';

  const raw = useMemo(() => series.map((s) => data.map((row) => valueOf(row, s.key))), [series, data]);
  const bands = useMemo(
    () =>
      variant === 'overlap'
        ? raw.map((values) => ({ lower: values.map(() => 0), upper: values }))
        : stackSeries(raw, isPercent ? 'expand' : 'none'),
    [raw, variant, isPercent],
  );

  const { yDomain, yTicks } = useMemo(() => {
    if (isPercent) return { yDomain: [0, 1] as const, yTicks: PERCENT_TICKS };
    const peak = bands.reduce((max, b) => b.upper.reduce((m, v) => Math.max(m, v), max), 0);
    const ticks = niceTicks(0, peak, TICK_COUNT);
    return { yDomain: [ticks[0] ?? 0, ticks[ticks.length - 1] ?? 0] as const, yTicks: ticks };
  }, [bands, isPercent]);

  // One clock for every series: recharts starts them together.
  const flat = useMemo(() => bands.flatMap((b) => [...b.upper, ...b.lower]), [bands]);
  const anim = useChartProgress(flat);

  const totalOf = (i: number) => (raw[i] ?? []).reduce((sum, v) => sum + v, 0);
  const rowTotal = (index: number) => raw.reduce((sum, values) => sum + (values[index] ?? 0), 0);
  const hovering = activeIndex !== null;
  const grandTotal = raw.reduce((sum, _, i) => sum + totalOf(i), 0);
  // In `overlap` the series are not parts of a whole, so the first one carries the headline.
  const restingValue = headline ?? (variant === 'overlap' ? totalOf(0) : grandTotal);
  const headlineValue = hovering ? (variant === 'overlap' ? (raw[0]?.[activeIndex] ?? 0) : rowTotal(activeIndex)) : restingValue;
  const headerLabel = hovering ? String(data[activeIndex]?.label ?? title) : title;
  const valueFor = (i: number) => format(hovering ? (raw[i]?.[activeIndex] ?? 0) : totalOf(i));

  const categories = useMemo(() => data.map((row) => String(row.label)), [data]);

  // `useId` yields `«r0»` / `:r0:`, which a CSS `url(#…)` cannot reference.
  const rawId = useId();
  const id = `bloom-area-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const topOpacity = variant === 'overlap' ? 0.4 : 0.55;

  return (
    <ChartCardSurface height={tiles ? 'auto' : undefined} style={style} testID={testID}>
      <ChartHeader
        label={headerLabel}
        value={headlineValue}
        format={format}
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
        <CartesianPlot
          categories={categories}
          yAxisWidth={Y_AXIS_WIDTH}
          yDomain={yDomain}
          yTicks={yTicks}
          formatYTick={formatAxisValue ?? (isPercent ? percentTick : compactNumber)}
          grid
          outside="clear"
          onActiveIndexChange={setActiveIndex}
          palette={palette}
          accessibilityLabel={accessibilityLabel ?? defaultAccessibilityLabel(title, variant, series)}
          testID={testID ? `${testID}-plot` : undefined}>
          {({ size, box, x, y }) => {
            const n = data.length;
            const at = (offset: number, i: number, target: number) =>
              anim.from && anim.from.length === flat.length ? lerp(anim.from[offset + i]!, target, anim.progress) : target;
            const shapes = bands.map((band, s) => {
              const base = s * 2 * n;
              const top: Point[] = band.upper.map((v, i) => ({ x: x(i), y: y(at(base, i, v)) }));
              const bottom: Point[] = band.lower.map((v, i) => ({ x: x(i), y: y(at(base + n, i, v)) }));
              return { top, bottom };
            });
            const revealWidth = anim.from ? size.width : box.left + (size.width - box.left) * anim.progress;
            return (
              <Svg width={size.width} height={size.height} pointerEvents="none">
                <Defs>
                  {tones.map((tone, s) => (
                    <LinearGradient key={`g-${s}`} id={`${id}-${s}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={tone.color} stopOpacity={topOpacity} />
                      <Stop offset="1" stopColor={tone.color} stopOpacity={0.04} />
                    </LinearGradient>
                  ))}
                  <ClipPath id={`${id}-reveal`}>
                    <Rect x={0} y={0} width={revealWidth} height={size.height} />
                  </ClipPath>
                </Defs>
                <G clipPath={`url(#${id}-reveal)`}>
                  {shapes.map(({ top, bottom }, s) => (
                    <G key={series[s]!.key}>
                      <Path
                        d={areaBandPath(top, bottom, curve)}
                        fill={`url(#${id}-${s})`}
                        fillOpacity={AREA_FILL_OPACITY}
                        stroke="none"
                      />
                      <Path d={curvePath(top, curve)} fill="none" stroke={tones[s]!.activeColor} strokeWidth={2} />
                    </G>
                  ))}
                </G>
                {activeIndex !== null ? (
                  <>
                    <Line
                      x1={x(activeIndex)}
                      y1={box.top}
                      x2={x(activeIndex)}
                      y2={box.bottom}
                      stroke={palette.cursor}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    {shapes.map(({ top }, s) => {
                      const p = top[activeIndex];
                      return p ? (
                        <Circle
                          key={`dot-${series[s]!.key}`}
                          cx={p.x}
                          cy={p.y}
                          r={4}
                          fill={tones[s]!.activeColor}
                          stroke={palette.surface}
                          strokeWidth={2}
                        />
                      ) : null;
                    })}
                  </>
                ) : null}
              </Svg>
            );
          }}
        </CartesianPlot>
      </View>

      {tiles ? (
        <ChartStatTiles
          testID={testID ? `${testID}-tiles` : undefined}
          items={series.map((s, i) => ({
            label: s.label,
            value: valueFor(i),
            color: tones[i]!.color,
            activeColor: tones[i]!.activeColor,
          }))}
        />
      ) : (
        <ChartLegend
          testID={testID ? `${testID}-legend` : undefined}
          style={{ paddingBottom: 4 }}
          items={series.map((s, i) => ({ label: s.label, color: tones[i]!.color, value: valueFor(i) }))}
        />
      )}
    </ChartCardSurface>
  );
}
