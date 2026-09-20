import { boundedLabelSlot } from './svg-text';
import React, { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import type { WebCssStyle } from '../styles/web-view-style';
import { parseRgba } from '../theme/color-utils';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { fixedDomainTicks } from './geometry';
import { resolveTone } from './palette';
import {
  closedPolygonPath,
  polarFrame,
  polarToCartesian,
  radarAxisAngle,
  radarIndexAt,
  tickAnchor,
  type PolarPoint,
} from './polar-geometry';
import { PolarSurface } from './PolarSurface';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { ChartHeader, TABULAR } from './primitives/ChartHeader';
import { ChartLegend } from './primitives/ChartLegend';
import { ChartStatTiles } from './primitives/ChartStatTiles';
import { describeDeltaRatio, formatNumber } from './primitives/format';
import { PulsingDot } from './primitives/PulsingDot';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette, useChartTones } from './primitives/use-chart-palette';
import { useChartRange, type ChartRange } from './primitives/use-chart-range';
import { useWebTransition } from './primitives/use-web-transition';
import { lerp, useChartProgress } from './use-chart-progress';

/** One axis of a radar: its category `label` plus one numeric field per series. */
export type RadarPoint = { label: string } & Record<string, number | string>;

export interface RadarSeries {
  /** Field of `RadarPoint` holding this series' values. */
  key: string;
  label: string;
  /** Any colour; defaults to the chart palette by series index (lime, blue, purple, …). */
  color?: string;
  /** Outline / dot / hover colour; defaults to the palette's hover step (or `color` darkened). */
  activeColor?: string;
}

/**
 * `filled` — soft fill + 2px outline; `dots` — filled with a dot on every
 * vertex; `lines` — outline only, the multi-series comparison look; `score` —
 * filled + dots, every axis label carries its value and a raised disc in the
 * centre shows the average score.
 */
export type RadarVariant = 'filled' | 'dots' | 'lines' | 'score';

/** A selectable period: pill label + the props it overrides. */
export type RadarRange = ChartRange<{
  data: RadarPoint[];
  series: RadarSeries[];
  delta: number;
  headline: number;
  max: number;
}>;

export interface RadarChartCardProps {
  variant?: RadarVariant;
  /** Header label (default `"Visitors"`, `"Weekly score"` for `score`); swaps to the hovered category. */
  title?: string;
  data?: readonly RadarPoint[];
  series?: readonly RadarSeries[];
  /** Radius axis ceiling; defaults to the largest value across all series (100 for `score`). */
  max?: number;
  /** Headline number at rest; defaults to the first series' total. */
  headline?: number;
  /** Delta ratio for the chip, e.g. `0.052` → "+5.2%". */
  delta?: number;
  /** Static period pill ("Jan – Jun 2024"). Ignored when `ranges` is set. */
  range?: string;
  /** Selectable periods — the pill becomes a dropdown and the selected range's fields override the props. */
  ranges?: readonly RadarRange[];
  /** Initially selected range id (defaults to the first). */
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  format?: (value: number) => string;
  /** `score` only: axis values below this are painted in the negative (rose) text colour. */
  alertBelow?: number;
  /** `score` only: caption under the centre score. Defaults to Excellent / Strong / Fair / Needs work. */
  scoreCaption?: string | ((score: number) => string);
  /** Stat tiles under the chart, one per axis (first series' value). The card grows to fit. */
  tiles?: boolean;
  /** Scales the polygon inside the same chart area — `1.15` draws it 15% larger. Labels move out with it. */
  radiusScale?: number;
  /** Nudges the plot (and the `score` disc) within the chart area, in px — negative moves it up. */
  plotOffsetY?: number;
  /**
   * Where the multi-series legend sits: under the chart (`bottom`, adds a row),
   * in the header beside the pill (`top`), or over the bottom edge of the chart
   * area (`overlay`, the radar nudges up) — the last two keep the card's height.
   */
  legend?: 'bottom' | 'top' | 'overlay';
  /** The hovered / pressed axis. Controlled when set (`null` = none). */
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  /** Names the chart for assistive tech. Defaults to a summary of its axes and series. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** recharts `margin={{ top: 4, right: 4, bottom: 4, left: 4 }}`. */
const MARGIN = 4;
/** `PolarAngleAxis` default `tickSize`: labels sit 8px outside the outer radius. */
const TICK_OFFSET = 8;
/** `PolarRadiusAxis` default `tickCount` — the concentric grid rings. */
const RADIUS_TICK_COUNT = 5;
/** `h-[231px]` — the chart area's fixed height when the card carries tiles. */
const TILES_PLOT_HEIGHT = 231;
/** `fillOpacity={0.28}`. */
const FILL_OPACITY = 0.28;
/** Wide enough that a label never wraps; anchored inside it. */
const LABEL_SLOT = 200;
/**
 * Where a `Text` box's top sits above its SVG baseline, per type step — measured in Chrome against
 * recharts' own `<text>` boxes (Inter), so the glyphs land where
 * recharts' `<text y dy>` puts them.
 */
const BASELINE_12 = 12;
const BASELINE_11 = 11;
const BASELINE_16 = 16.99;

/** `fontSize={12} fontWeight={500}` — the caption step without its tracking. */
const AXIS_TYPE: TextStyle = { ...TYPE_SCALE['caption-1-medium'], letterSpacing: 0 };
/** `fontSize={11} fontWeight={500} letterSpacing="0.02em"`. */
const SCORE_NAME_TYPE: TextStyle = { ...TYPE_SCALE['caption-2-medium'], letterSpacing: 0.22 };
/** `fontSize={16} fontWeight={500}`. */
const SCORE_VALUE_TYPE: TextStyle = { ...TYPE_SCALE['headline-medium'] };

const valueOf = (row: RadarPoint | undefined, key: string) => {
  const v = Number(row?.[key] ?? 0);
  return Number.isFinite(v) ? v : 0;
};

/** Qualitative caption under the centre score. */
export function defaultRadarScoreCaption(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Strong';
  if (score >= 50) return 'Fair';
  return 'Needs work';
}

function AxisLabel({
  plotWidth,
  x,
  y,
  anchor,
  children,
}: {
  plotWidth: number;
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  children: React.ReactNode;
}) {
  const slot = boundedLabelSlot(plotWidth, x, anchor, LABEL_SLOT);
  const align = anchor === 'start' ? 'flex-start' : anchor === 'end' ? 'flex-end' : 'center';
  return (
    <View pointerEvents="none" style={{ position: 'absolute', ...slot, top: y, alignItems: align }}>
      {children}
    </View>
  );
}

/**
 * `RadarChartCard`: a recharts `RadarChart`, rebuilt in react-native-svg on
 * recharts' geometry (`polar-geometry.ts`):
 *
 *   frame      margin 4; centre at 50% / 50% (44% down with an overlay legend);
 *              outer radius 74% of the inner half-side (62% `score`, 66% overlay),
 *              times `radiusScale`
 *   grid       chart-cursor 1px: a concentric polygon at every radius tick
 *              (`getTickValuesFixedDomain([0, max], 5)`) and a spoke per axis
 *   polygons   per series: fill `color` at 28% (none for `lines`), 2px `-active`
 *              outline, round joins; `dots` / `score` add r 3.5 vertex dots with
 *              a 2px card-coloured ring
 *   labels     8px outside the outer radius, anchored by side, 12px medium
 *              text-tertiary → text-primary on the hovered axis (150ms); `score`
 *              stacks an 11px name over its 16px value, lifted above the top axes
 *              and dropped under the bottom ones, rose below `alertBelow`
 *   hover      the axis nearest the pointer inside the outer radius: header label
 *              and number swap to it, the chip hides, a pulsing dot marks it on
 *              every series, legend values follow, the other tiles dim
 *
 * Polygons grow out of the centre over 450ms on mount and morph on a data
 * change; everything snaps under reduced motion.
 */
export function RadarChartCard({
  variant = 'filled',
  title,
  data: dataProp,
  series: seriesProp,
  max: maxProp,
  headline: headlineProp,
  delta: deltaProp,
  range,
  ranges,
  defaultRange,
  onRangeChange,
  format = formatNumber,
  alertBelow,
  scoreCaption,
  tiles = false,
  radiusScale = 1,
  plotOffsetY = 0,
  legend = 'bottom',
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: RadarChartCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);

  const isScore = variant === 'score';
  const data = selected?.data ?? dataProp ?? [];
  const series = selected?.series ?? seriesProp ?? [];
  const maxOverride = selected?.max ?? maxProp;
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;
  const label = title ?? (isScore ? 'Weekly score' : 'Visitors');
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

  const primary = series[0];
  const totalOf = (key: string) => data.reduce((sum, row) => sum + valueOf(row, key), 0);
  const hovering = activeIndex !== null;
  const domainMax =
    maxOverride ?? (isScore ? 100 : Math.max(1, ...series.flatMap((s) => data.map((row) => valueOf(row, s.key)))));

  const headlineValue = primary
    ? hovering
      ? valueOf(data[activeIndex], primary.key)
      : (headline ?? totalOf(primary.key))
    : (headline ?? 0);
  const headerLabel = hovering ? String(data[activeIndex]?.label ?? label) : label;

  const score = primary ? Math.round(totalOf(primary.key) / Math.max(1, data.length)) : 0;
  const caption = typeof scoreCaption === 'function' ? scoreCaption(score) : (scoreCaption ?? defaultRadarScoreCaption(score));

  const legendItems =
    series.length > 1
      ? series.map((s, i) => ({
          label: s.label,
          color: tones[i]!.color,
          value: format(hovering ? valueOf(data[activeIndex], s.key) : totalOf(s.key)),
        }))
      : null;
  const overlayLegend = legendItems !== null && legend === 'overlay';

  const values = useMemo(() => series.flatMap((s) => data.map((row) => valueOf(row, s.key))), [series, data]);
  const radiusTicks = useMemo(() => fixedDomainTicks(0, domainMax, RADIUS_TICK_COUNT), [domainMax]);
  // The polygons animate in pixels, so a new ceiling morphs them too (recharts keeps `prevPoints`).
  const anim = useChartProgress(useMemo(() => [...values, domainMax], [values, domainMax]));

  const labelEase = useWebTransition('color', 150);
  const cardShadow = theme.isDark ? '0 1px 1px 0 rgb(0 0 0 / 0.14)' : '0 1px 1px 0 rgb(0 0 0 / 0.05)';
  // `bg-background-inner-default backdrop-blur-[2px]`: in dark mode the inner surface is
  // canonical inner surface at 60%, so the polygon shows through, softened.
  const discStyle = useMemo<WebCssStyle>(() => {
    const n800 = parseRgba(palette.inner);
    const backgroundColor = theme.isDark && n800 ? `rgba(${n800.r}, ${n800.g}, ${n800.b}, 0.6)` : palette.inner;
    return Platform.OS === 'web'
      ? { backgroundColor, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }
      : { backgroundColor };
  }, [theme, palette.inner]);

  const geometryFor = (width: number, height: number) => {
    const frame = polarFrame(width, height, 0.5, overlayLegend ? 0.44 : 0.5, MARGIN);
    const pct = isScore ? 62 : overlayLegend ? 66 : 74;
    const outerRadius = frame.maxRadius * (Math.round(pct * radiusScale) / 100);
    return { cx: frame.cx, cy: frame.cy, outerRadius };
  };

  const onPointerAt = (x: number, y: number, size: { width: number; height: number }) => {
    setActiveIndex(radarIndexAt(x, y, geometryFor(size.width, size.height), data.length));
  };

  const count = data.length;
  const kind = isScore ? 'score radar chart' : 'radar chart';
  const a11y =
    accessibilityLabel ??
    `${label} ${kind}: ${data.map((row) => String(row.label)).join(', ')}${series.length > 1 ? ` — ${series.map((s) => s.label).join(', ')}` : ''}`;

  const plot = (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, transform: [{ translateY: plotOffsetY }] }}>
      <PolarSurface
        accessibilityLabel={a11y}
        testID={testID ? `${testID}-plot` : undefined}
        onPointerAt={onPointerAt}
        onPointerLeave={() => setActiveIndex(null)}>
        {({ width, height }) => {
          const { cx, cy, outerRadius } = geometryFor(width, height);
          const r = (v: number) => (outerRadius * v) / Math.max(1e-9, domainMax);
          const axisPoint = (i: number, radius: number) => polarToCartesian(cx, cy, radius, radarAxisAngle(i, count));
          const targets: PolarPoint[][] = series.map((s) => data.map((row, i) => axisPoint(i, r(valueOf(row, s.key)))));
          // recharts animates each vertex from its previous position, or out of the centre.
          const prevMax = anim.from ? anim.from[anim.from.length - 1]! : null;
          const shapes = targets.map((points, s) =>
            points.map((p, i) => {
              if (anim.progress >= 1) return p;
              if (anim.from && prevMax !== null) {
                const prevValue = anim.from[s * count + i]!;
                const prev = axisPoint(i, (outerRadius * prevValue) / Math.max(1e-9, prevMax));
                return { x: lerp(prev.x, p.x, anim.progress), y: lerp(prev.y, p.y, anim.progress) };
              }
              return { x: lerp(cx, p.x, anim.progress), y: lerp(cy, p.y, anim.progress) };
            }),
          );
          const filled = variant !== 'lines';
          const dotted = variant === 'dots' || isScore;
          return (
            <>
              <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
                <G>
                  {radiusTicks.map((t) => (
                    <Path
                      key={`ring-${t}`}
                      d={closedPolygonPath(data.map((_, i) => axisPoint(i, r(t))))}
                      fill="none"
                      stroke={palette.cursor}
                      strokeWidth={1}
                    />
                  ))}
                  {data.map((row, i) => {
                    const end = axisPoint(i, outerRadius);
                    return (
                      <Line
                        key={`spoke-${i}-${String(row.label)}`}
                        x1={cx}
                        y1={cy}
                        x2={end.x}
                        y2={end.y}
                        stroke={palette.cursor}
                        strokeWidth={1}
                      />
                    );
                  })}
                </G>
                {shapes.map((points, s) => (
                  <G key={series[s]!.key}>
                    <Path
                      d={closedPolygonPath(points)}
                      fill={filled ? tones[s]!.color : 'none'}
                      fillOpacity={filled ? FILL_OPACITY : 0}
                      stroke={tones[s]!.activeColor}
                      strokeWidth={2}
                      strokeLinejoin="round"
                    />
                    {dotted
                      ? points.map((p, i) => (
                          <Circle
                            key={`dot-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r={3.5}
                            fill={tones[s]!.activeColor}
                            fillOpacity={1}
                            stroke={palette.surface}
                            strokeWidth={2}
                          />
                        ))
                      : null}
                  </G>
                ))}
                {activeIndex !== null
                  ? shapes.map((points, s) => {
                      const p = points[activeIndex];
                      return p ? (
                        <PulsingDot
                          key={`active-${series[s]!.key}`}
                          cx={p.x}
                          cy={p.y}
                          color={tones[s]!.activeColor}
                          ring={palette.surface}
                        />
                      ) : null;
                    })
                  : null}
              </Svg>
              {data.map((row, i) => {
                const angle = radarAxisAngle(i, count);
                const at = polarToCartesian(cx, cy, outerRadius + TICK_OFFSET, angle);
                const anchor = tickAnchor(angle);
                const active = i === activeIndex;
                const nameColor = { color: active ? palette.text : palette.textTertiary };
                if (!isScore) {
                  return (
                    <AxisLabel plotWidth={width} key={`label-${i}`} x={at.x} y={at.y + 4 - BASELINE_12} anchor={anchor}>
                      <Text numberOfLines={1} style={[AXIS_TYPE, nameColor, labelEase, { maxWidth: '100%' }]}>
                        {String(row.label)}
                      </Text>
                    </AxisLabel>
                  );
                }
                // Two lines (name over value) clear the vertex on their side.
                const sin = Math.sin(angle * (Math.PI / 180));
                const base = sin > 0.3 ? -22 : sin < -0.3 ? 12 : -6;
                const value = primary ? valueOf(row, primary.key) : 0;
                const alert = alertBelow !== undefined && value < alertBelow;
                return (
                  <React.Fragment key={`label-${i}`}>
                    <AxisLabel plotWidth={width} x={at.x} y={at.y + base - BASELINE_11} anchor={anchor}>
                      <Text numberOfLines={1} style={[SCORE_NAME_TYPE, nameColor, labelEase, { maxWidth: '100%' }]}>
                        {String(row.label)}
                      </Text>
                    </AxisLabel>
                    <AxisLabel plotWidth={width} x={at.x} y={at.y + base + 17 - BASELINE_16} anchor={anchor}>
                      <Text
                        numberOfLines={1}
                        testID={testID ? `${testID}-score-${i}` : undefined}
                        style={[SCORE_VALUE_TYPE, { maxWidth: '100%', color: alert ? palette.negative.foreground : palette.text }, TABULAR]}>
                        {format(value)}
                      </Text>
                    </AxisLabel>
                  </React.Fragment>
                );
              })}
            </>
          );
        }}
      </PolarSurface>
      {isScore ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View
            testID={testID ? `${testID}-score` : undefined}
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: cardShadow,
              ...discStyle,
            }}>
            <Text variant="title-1-medium" style={[{ lineHeight: 24, color: palette.text }, TABULAR]}>
              {format(score)}
            </Text>
            <Text
              variant="caption-1-medium"
              numberOfLines={1}
              style={{ marginTop: 4, maxWidth: 72, color: palette.textTertiary }}>
              {caption}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <ChartCardSurface height={tiles ? 'auto' : undefined} style={style} testID={testID}>
      <ChartHeader
        label={headerLabel}
        value={isScore ? undefined : headlineValue}
        format={format}
        delta={delta !== undefined ? describeDeltaRatio(delta) : undefined}
        hovering={hovering}
        fadeKey={`${selectedId ?? ''}:${activeIndex}`}
        range={range}
        ranges={ranges}
        rangeId={selectedId}
        onRangeChange={selectRange}
        testID={testID}
        trailing={
          legendItems && legend === 'top' ? (
            <ChartLegend
              items={legendItems}
              testID={testID ? `${testID}-legend` : undefined}
              style={{ minHeight: 32, width: 'auto', maxWidth: '100%', flexShrink: 1, justifyContent: 'flex-end', columnGap: 12 }}
            />
          ) : undefined
        }
      />

      <View style={tiles ? { width: '100%', height: TILES_PLOT_HEIGHT } : { width: '100%', flex: 1, minHeight: 0 }}>
        {plot}
        {overlayLegend ? (
          <ChartLegend
            items={legendItems}
            testID={testID ? `${testID}-legend` : undefined}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
          />
        ) : null}
      </View>

      {legendItems && legend === 'bottom' ? (
        <ChartLegend
          items={legendItems}
          testID={testID ? `${testID}-legend` : undefined}
          style={tiles ? undefined : { paddingBottom: 4 }}
        />
      ) : null}

      {tiles ? (
        <ChartStatTiles
          testID={testID ? `${testID}-tiles` : undefined}
          // No swatch: every axis belongs to the same (first) series.
          items={data.map((row) => ({ label: String(row.label), value: format(primary ? valueOf(row, primary.key) : 0) }))}
          activeIndex={activeIndex}
          onActiveChange={setActiveIndex}
        />
      ) : null}
    </ChartCardSurface>
  );
}
