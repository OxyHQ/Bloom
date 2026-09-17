import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PointerEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, G, Line } from 'react-native-svg';

import { Text } from '../typography';
import { MIN_TICK_GAP, TICK_SIZE, Y_TICK_MARGIN, niceTicks, placeTicks, type PlotBox } from './geometry';
import { resolveTone } from './palette';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { ChartHeader } from './primitives/ChartHeader';
import { ChartLegend } from './primitives/ChartLegend';
import { ChartStatTiles } from './primitives/ChartStatTiles';
import { compactNumber, describeDeltaRatio, formatNumber } from './primitives/format';
import { useChartCardPalette, useChartTones } from './primitives/use-chart-palette';
import { useChartRange, type ChartRange } from './primitives/use-chart-range';
import { svgTextType, textTopForBaseline } from './svg-text';

export interface ScatterPoint {
  x: number;
  y: number;
  /** Bubble size input. Any point carrying `z` switches the card to bubbles. */
  z?: number;
  /** Name shown in the header while the point is hovered. */
  label?: string;
}

export interface ScatterSeries {
  label: string;
  points: readonly ScatterPoint[];
  /** Any colour; defaults to the chart palette by series index. */
  color?: string;
  activeColor?: string;
}

/** A selectable period: pill label + the props it overrides. */
export type ScatterRange = ChartRange<{
  series: readonly ScatterSeries[];
  delta: number;
  headline: number;
}>;

/** The hovered point: series index and point index within it. */
export interface ScatterActivePoint {
  series: number;
  index: number;
}

export interface ScatterChartCardProps {
  /** Header label; swaps to the hovered point. Default `"Revenue per account"`. */
  title?: string;
  series?: readonly ScatterSeries[];
  /** Captions under the plot: `[x, y]` (drawn y on the left, x on the right). */
  axisLabels?: readonly [string, string];
  /** Force bubbles on / off; by default any `z` in the data turns them on. */
  bubble?: boolean;
  /** Headline at rest; defaults to the rounded average y across every point. */
  headline?: number;
  /** Delta ratio for the chip, e.g. `0.052` → "+5.2%". */
  delta?: number;
  /** Static period pill. Ignored when `ranges` is set. */
  range?: string;
  /** Selectable periods — the pill becomes a dropdown and the range's fields override the props. */
  ranges?: readonly ScatterRange[];
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  /** The y measure: headline, legend and tiles. Default en-US grouping. */
  format?: (value: number) => string;
  /** The x measure: axis ticks and the hovered point's caption. Default `4.5K`-style. */
  formatX?: (value: number) => string;
  /** Stat tiles (each series' average y) instead of the legend; the card grows to fit. */
  tiles?: boolean;
  /** The hovered point. Controlled when set (`null` = none). */
  activePoint?: ScatterActivePoint | null;
  onActivePointChange?: (point: ScatterActivePoint | null) => void;
  /** Names the plot for assistive tech. Defaults to a summary of the series. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `margin={{ top: 8, right: 8, bottom: 0, left: 0 }}`, Y axis `width={48}`, default 30px X axis. */
export const SCATTER_MARGIN = { top: 8, right: 8 } as const;
const Y_AXIS_WIDTH = 48;
const X_AXIS_HEIGHT = 30;
/** `tickMargin={10}` on the X axis. */
const X_TICK_MARGIN = 10;
const X_TICK_COUNT = 5;
const Y_TICK_COUNT = 4;
/** Bubble area range, px² (`ZAxis range`). */
export const BUBBLE_RANGE = [90, 620] as const;
/** recharts' implicit Z axis: every symbol 64px². */
const DEFAULT_SYMBOL_AREA = 64;
/** Opacity of the other series while a point is hovered. */
const DIM = 0.25;
const FILL_OPACITY = 0.85;
const STROKE_WIDTH = 1.5;
/** `animationDuration={450}`; recharts' Scatter eases linearly. */
const ANIMATION_MS = 450;
/** `h-[196px]` — the plot's height when the card carries tiles. */
const TILES_PLOT_HEIGHT = 196;

const TICK_TYPE = svgTextType('caption-1-regular');
/** recharts measures a 12px tick as 18px tall. */
const Y_TICK_EXTENT = 18;
const LABEL_SLOT = 160;

const NO_SERIES: readonly ScatterSeries[] = [];

export function scatterPlotBox(width: number, height: number): PlotBox {
  return { left: Y_AXIS_WIDTH, top: SCATTER_MARGIN.top, right: width - SCATTER_MARGIN.right, bottom: height - X_AXIS_HEIGHT };
}

/** recharts' `[0, 'auto']` number domain: nice ticks from `min(0, dataMin)` to the data max. */
export function scatterTicks(values: readonly number[], count: number): number[] {
  if (values.length === 0) return niceTicks(0, 0, count);
  let lo = 0;
  let hi = -Infinity;
  for (const v of values) {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return niceTicks(lo, hi, count);
}

/** A symbol's radius for its area: `ZAxis` maps `[0, zMax]` linearly onto `BUBBLE_RANGE`. */
export function bubbleRadius(z: number | undefined, zMax: number): number {
  const [lo, hi] = BUBBLE_RANGE;
  const area = z === undefined || !Number.isFinite(z) ? lo : zMax > 0 ? lo + (z / zMax) * (hi - lo) : lo;
  return Math.sqrt(Math.max(area, 0) / Math.PI);
}

const DEFAULT_RADIUS = Math.sqrt(DEFAULT_SYMBOL_AREA / Math.PI);

interface Symbol {
  cx: number;
  cy: number;
  r: number;
}

/**
 * recharts' Scatter animation: 450ms, linear. On mount every symbol grows from
 * nothing in place; on a data change symbols matched by index glide and
 * resize, new ones grow. Snaps under reduced motion.
 */
function useScatterAnimation(target: Symbol[][]): Symbol[][] {
  const reducedMotion = useReducedMotion();
  const key = target.map((s) => s.map((p) => `${p.cx},${p.cy},${p.r}`).join(';')).join('|');
  const shownRef = useRef<Symbol[][] | null>(null);
  const [frame, setFrame] = useState<Symbol[][] | null>(null);

  useEffect(() => {
    const previous = shownRef.current;
    if (reducedMotion || typeof requestAnimationFrame !== 'function' || target.every((s) => s.length === 0)) {
      shownRef.current = target;
      setFrame(target);
      return;
    }
    const from = (s: number, i: number): Symbol => {
      const prev = previous?.[s]?.[i];
      const next = target[s]![i]!;
      return prev ?? { cx: next.cx, cy: next.cy, r: 0 };
    };
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / ANIMATION_MS);
      const next = target.map((series, s) =>
        series.map((p, i) => {
          const a = from(s, i);
          return { cx: a.cx + (p.cx - a.cx) * t, cy: a.cy + (p.cy - a.cy) * t, r: a.r + (p.r - a.r) * t };
        }),
      );
      shownRef.current = next;
      setFrame(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the serialised symbols
  }, [key, reducedMotion]);

  if (reducedMotion) return target;
  return frame && frame.length === target.length && frame.every((s, i) => s.length === target[i]!.length)
    ? frame
    : target.map((s) => s.map((p) => ({ ...p, r: 0 })));
}

const samePoint = (a: ScatterActivePoint | null, b: ScatterActivePoint | null) =>
  a === b || (!!a && !!b && a.series === b.series && a.index === b.index);

/**
 * `ScatterChartCard`: the correlation view — one dot per record on two
 * measures, optionally sized by a third (`z`, bubbles). recharts'
 * `ScatterChart`, layer by layer:
 *
 *   grid      dashed `4 4` in chart-track, horizontal at every Y tick AND
 *             vertical at every X tick
 *   axes      X number axis, 5 nice ticks from 0, 16px under the plot; Y 48
 *             wide, 4 nice ticks (`compactNumber`); both 12px text-tertiary
 *   symbols   circles 64px² (r 4.51), or bubbles 90–620px² by `z` over
 *             `[0, zMax]`; fill the series colour at 85%, 1.5px `-active` ring
 *   hover     a symbol swaps the header to "Label · x" and its y, hides the
 *             delta and dims every other series to 25%
 *   captions  `axisLabels` under the plot, y left and x right
 *   footer    legend (each series' average y) or stat tiles
 *
 * Symbols grow in over 450ms on mount and glide on a data change.
 */
export function ScatterChartCard({
  title = 'Revenue per account',
  series: seriesProp,
  axisLabels,
  bubble: bubbleProp,
  headline: headlineProp,
  delta: deltaProp,
  range,
  ranges,
  defaultRange,
  onRangeChange,
  format = formatNumber,
  formatX = compactNumber,
  tiles = false,
  activePoint: controlled,
  onActivePointChange,
  accessibilityLabel,
  style,
  testID,
}: ScatterChartCardProps) {
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);

  const series = selected?.series ?? seriesProp ?? NO_SERIES;
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;
  const tones = useMemo(
    () => series.map((s, i) => resolveTone(palettes, i, s.color, s.activeColor)),
    [series, palettes],
  );

  const [own, setOwn] = useState<ScatterActivePoint | null>(null);
  const active = controlled !== undefined ? controlled : own;
  const setActive = useCallback(
    (point: ScatterActivePoint | null) => {
      if (samePoint(point, active)) return;
      if (controlled === undefined) setOwn(point);
      onActivePointChange?.(point);
    },
    [active, controlled, onActivePointChange],
  );

  const allPoints = useMemo(() => series.flatMap((s) => s.points), [series]);
  const bubble = bubbleProp ?? allPoints.some((p) => p.z !== undefined);
  const averageOf = (list: readonly ScatterPoint[]) =>
    list.length ? list.reduce((sum, p) => sum + p.y, 0) / list.length : 0;

  const xTicks = useMemo(() => scatterTicks(allPoints.map((p) => p.x), X_TICK_COUNT), [allPoints]);
  const yTicks = useMemo(() => scatterTicks(allPoints.map((p) => p.y), Y_TICK_COUNT), [allPoints]);
  const zMax = useMemo(() => allPoints.reduce((m, p) => (p.z !== undefined && p.z > m ? p.z : m), 0), [allPoints]);

  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const box = size ? scatterPlotBox(size.width, size.height) : null;
  const xMin = xTicks[0] ?? 0;
  const xMax = xTicks[xTicks.length - 1] ?? 1;
  const yMin = yTicks[0] ?? 0;
  const yMax = yTicks[yTicks.length - 1] ?? 1;
  const sx = (v: number) => (box ? box.left + (xMax === xMin ? 0.5 : (v - xMin) / (xMax - xMin)) * (box.right - box.left) : 0);
  const sy = (v: number) => (box ? box.bottom - (yMax === yMin ? 0 : (v - yMin) / (yMax - yMin)) * (box.bottom - box.top) : 0);

  const target: Symbol[][] = box
    ? series.map((s) =>
        s.points.map((p) => ({ cx: sx(p.x), cy: sy(p.y), r: bubble ? bubbleRadius(p.z, zMax) : DEFAULT_RADIUS })),
      )
    : series.map(() => []);
  const shown = useScatterAnimation(target);

  const hovering = active !== null;
  const hoveredSeries = active ? series[active.series] : undefined;
  const hoveredPoint = active ? hoveredSeries?.points[active.index] : undefined;
  const headerLabel = hoveredPoint ? `${hoveredPoint.label ?? hoveredSeries?.label} · ${formatX(hoveredPoint.x)}` : title;
  // The resting figure is an average, so round it — a fractional headline reads as false precision.
  const headlineValue = hoveredPoint ? hoveredPoint.y : (headline ?? Math.round(averageOf(allPoints)));

  const hitTest = (px: number, py: number): ScatterActivePoint | null => {
    for (let s = target.length - 1; s >= 0; s--) {
      const symbols = target[s]!;
      for (let i = symbols.length - 1; i >= 0; i--) {
        const p = symbols[i]!;
        if ((px - p.cx) ** 2 + (py - p.cy) ** 2 <= (p.r + STROKE_WIDTH / 2) ** 2) return { series: s, index: i };
      }
    }
    return null;
  };
  const track = (px: number, py: number) => setActive(hitTest(px, py));
  const pointerHandlers: ViewProps = {
    onPointerMove: (e: PointerEvent) => track(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
    onPointerLeave: () => setActive(null),
    ...(Platform.OS === 'web'
      ? null
      : {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderTerminationRequest: () => false,
          onResponderGrant: (e: GestureResponderEvent) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderMove: (e: GestureResponderEvent) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderRelease: () => setActive(null),
          onResponderTerminate: () => setActive(null),
        }),
  };

  const placedY =
    box && size
      ? placeTicks(
          yTicks.map((v) => ({ coordinate: sy(v), size: Y_TICK_EXTENT })),
          size.height,
          'preserveEnd',
        ).map((p) => ({ value: yTicks[p.index]!, y: p.tickCoord }))
      : [];
  const xLabels = xTicks.map((v) => formatX(v));
  const xMeasured = xLabels.every((label, i) => labelWidths[`${i}:${label}`] !== undefined);
  const placedX =
    box && size && xMeasured
      ? placeTicks(
          xTicks.map((v, i) => ({ coordinate: sx(v), size: labelWidths[`${i}:${xLabels[i]}`]! })),
          size.width,
          'preserveStartEnd',
          MIN_TICK_GAP,
        )
      : null;
  // `<text y={bottom + tickSize + tickMargin} dy="0.71em">`.
  const xLabelTop = box ? textTopForBaseline(box.bottom + TICK_SIZE + X_TICK_MARGIN + 0.71 * 12, TICK_TYPE) : 0;
  const tickColor = { color: palette.textTertiary };

  const label = accessibilityLabel ?? `${title} ${bubble ? 'bubble' : 'scatter'} chart: ${series.map((s) => s.label).join(', ')}`;

  return (
    <ChartCardSurface height={tiles ? 'auto' : undefined} style={style} testID={testID}>
      <ChartHeader
        label={headerLabel}
        value={headlineValue}
        format={format}
        delta={delta !== undefined ? describeDeltaRatio(delta) : undefined}
        hovering={hovering}
        fadeKey={`${selectedId ?? ''}:${active ? `${active.series}:${active.index}` : 'idle'}`}
        range={range}
        ranges={ranges}
        rangeId={selectedId}
        onRangeChange={(id) => {
          setActive(null);
          select(id);
        }}
        testID={testID}
      />

      <View style={tiles ? styles.tilesPlot : styles.plot}>
        <View style={StyleSheet.absoluteFill} onLayout={onLayout} testID={testID ? `${testID}-plot` : undefined}>
          {size && box ? (
            <>
              <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
                {yTicks.map((v) => (
                  <Line key={`gy-${v}`} x1={box.left} y1={sy(v)} x2={box.right} y2={sy(v)} stroke={palette.track} strokeWidth={1} strokeDasharray="4 4" />
                ))}
                {xTicks.map((v) => (
                  <Line key={`gx-${v}`} x1={sx(v)} y1={box.top} x2={sx(v)} y2={box.bottom} stroke={palette.track} strokeWidth={1} strokeDasharray="4 4" />
                ))}
                {series.map((s, si) => {
                  const dimmed = active !== null && active.series !== si;
                  return (
                    <G key={`series-${si}-${s.label}`}>
                      {(shown[si] ?? []).map((p, i) => (
                        <Circle
                          key={`p-${i}`}
                          cx={p.cx}
                          cy={p.cy}
                          r={p.r}
                          fill={tones[si]!.color}
                          fillOpacity={dimmed ? DIM : FILL_OPACITY}
                          stroke={tones[si]!.activeColor}
                          strokeOpacity={dimmed ? DIM : 1}
                          strokeWidth={p.r > 0 ? STROKE_WIDTH : 0}
                        />
                      ))}
                    </G>
                  );
                })}
              </Svg>
              {placedY.map((tick) => (
                <View
                  key={`y-${tick.value}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: box.left - TICK_SIZE - Y_TICK_MARGIN - LABEL_SLOT,
                    top: textTopForBaseline(tick.y + 0.355 * 12, TICK_TYPE),
                    width: LABEL_SLOT,
                    alignItems: 'flex-end',
                  }}>
                  <Text numberOfLines={1} style={[TICK_TYPE, tickColor]}>
                    {compactNumber(tick.value)}
                  </Text>
                </View>
              ))}
              {xTicks.map((v, i) => {
                const key = `${i}:${xLabels[i]}`;
                const placed = placedX?.find((t) => t.index === i);
                return (
                  <View
                    key={`x-${key}`}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: (placed?.tickCoord ?? sx(v)) - LABEL_SLOT / 2,
                      top: xLabelTop,
                      width: LABEL_SLOT,
                      alignItems: 'center',
                      opacity: placed ? 1 : 0,
                    }}>
                    <Text
                      numberOfLines={1}
                      style={[TICK_TYPE, tickColor]}
                      onLayout={(event) => {
                        const w = event.nativeEvent.layout.width;
                        setLabelWidths((prev) => (prev[key] === w ? prev : { ...prev, [key]: w }));
                      }}>
                      {xLabels[i]}
                    </Text>
                  </View>
                );
              })}
              <View
                role="img"
                accessibilityLabel={label}
                testID={testID ? `${testID}-surface` : undefined}
                style={StyleSheet.absoluteFill}
                {...pointerHandlers}
              />
            </>
          ) : null}
        </View>
      </View>

      {axisLabels ? (
        <View style={styles.axisLabels} testID={testID ? `${testID}-axis-labels` : undefined}>
          <Text variant="caption-1-medium" style={tickColor}>
            {axisLabels[1]}
          </Text>
          <Text variant="caption-1-medium" style={tickColor}>
            {axisLabels[0]}
          </Text>
        </View>
      ) : null}

      {tiles ? (
        <ChartStatTiles
          testID={testID ? `${testID}-tiles` : undefined}
          items={series.map((s, i) => ({
            label: `${s.label} · avg`,
            value: format(Math.round(averageOf(s.points))),
            color: tones[i]!.color,
            activeColor: tones[i]!.activeColor,
          }))}
          activeIndex={active?.series ?? null}
          onActiveChange={(index) => setActive(index === null ? null : { series: index, index: 0 })}
        />
      ) : (
        <ChartLegend
          testID={testID ? `${testID}-legend` : undefined}
          style={{ paddingBottom: 4 }}
          items={series.map((s, i) => ({ label: s.label, color: tones[i]!.color, value: format(Math.round(averageOf(s.points))) }))}
        />
      )}
    </ChartCardSurface>
  );
}

const styles = StyleSheet.create({
  plot: { width: '100%', flex: 1, minHeight: 0 },
  tilesPlot: { width: '100%', height: TILES_PLOT_HEIGHT },
  axisLabels: { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
});
