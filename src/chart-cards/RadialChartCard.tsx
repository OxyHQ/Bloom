import React, { useCallback, useId, useMemo } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, Text as SvgText, TextPath } from 'react-native-svg';

import { BREAKPOINTS } from '../styles/breakpoints';
import { resolveTone } from './palette';
import {
  animatedPieAngles,
  pieSectorAngles,
  polarToCartesian,
  radialBarBandCentres,
  radialBarBands,
  radialLabelArc,
  sectorIndexAt,
  sectorPath,
  valueAngle,
  type RingBand,
  type SectorAngles,
} from './polar-geometry';
import { PolarSurface, svgTransition } from './PolarSurface';
import { ChartCardSurface, CHART_CARD_HEIGHT } from './primitives/ChartCardSurface';
import { ChartCenterReadout } from './primitives/ChartCenterReadout';
import { ChartHeader } from './primitives/ChartHeader';
import { ChartLegend } from './primitives/ChartLegend';
import { ChartStatTiles } from './primitives/ChartStatTiles';
import { describeDeltaRatio, formatNumber } from './primitives/format';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette, useChartTones } from './primitives/use-chart-palette';
import { useChartRange, type ChartRange } from './primitives/use-chart-range';
import { useWebTransition } from './primitives/use-web-transition';
import { lerp, useChartProgress } from './use-chart-progress';

/** One ring / segment of a radial chart. */
export interface RadialDatum {
  label: string;
  value: number;
  /** Any colour; defaults to the chart palette by index (lime, blue, purple, …). */
  color?: string;
  /** Hover colour; defaults to the palette's hover step (or `color` darkened). */
  activeColor?: string;
}

/**
 * `rings` — one ring per item over a grey track, first item innermost;
 * `labels` — rings with the item name set along the start of each arc;
 * `grid` — rings without tracks over a circular grid; `gauge` — one thin ring
 * showing `value / max`, percent in the centre; `solid` — the same, thicker, on
 * a raised inner disc; `stacked` — a half gauge of stacked segments whose
 * centre follows the hovered segment's share.
 */
export type RadialVariant = 'rings' | 'labels' | 'grid' | 'gauge' | 'solid' | 'stacked';

/** A selectable period: pill label + the props it overrides. */
export type RadialRange = ChartRange<{
  data: RadialDatum[];
  max: number;
  delta: number;
  headline: number;
}>;

export interface RadialChartCardProps {
  variant?: RadialVariant;
  /** Header label; swaps to the hovered item's name. */
  title?: string;
  data?: readonly RadialDatum[];
  /**
   * The full-circle value. Rings default to 110% of the largest item (so the
   * biggest ring stops just short of closing); gauges to the item total.
   */
  max?: number;
  /** Headline number at rest; defaults to the total of all items. */
  headline?: number;
  /** Delta ratio for the chip, e.g. `0.052` → "+5.2%". */
  delta?: number;
  /** Static period pill ("Last 7 days"). Ignored when `ranges` is set. */
  range?: string;
  /** Selectable periods — the pill becomes a dropdown and the selected range's fields override the props. */
  ranges?: readonly RadialRange[];
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  format?: (value: number) => string;
  /** Caption under the centre percentage (default `"of goal"`; the segment's name for `stacked`). */
  centerCaption?: string;
  /** Stat tiles under the chart, one per item. The card grows to fit. */
  tiles?: boolean;
  /** The hovered / pressed item. Controlled when set (`null` = none). */
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  /** Names the chart for assistive tech. Defaults to a summary of its items. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Ring charts' outer radius (`OUTER`); the gauges use 104. */
const OUTER = 106;
/** The half gauge's radii at full size. */
const HALF_OUTER = 128;
const HALF_INNER = 96;
/** Gap between the half gauge's segments, degrees. */
const HALF_PADDING_ANGLE = 3;
/** `cy="78%"`. */
const HALF_CY = 0.78;
/** Clear space kept above the half gauge's apex when its radius has to shrink. */
const HALF_APEX_MARGIN = 6;
/** `max-sm:min-h-[180px]` — the half gauge's chart-area floor on phones. */
const HALF_MIN_HEIGHT = 180;
/** `h-[231px]` — the chart area's fixed height when the card carries tiles. */
const TILES_PLOT_HEIGHT = 231;
/** `LabelList offset={10}` — degrees into the arc. */
const LABEL_OFFSET = 10;
/** `cornerRadius={99}`: recharts clamps it to half the thickness — fully round ends. */
const ROUND = 99;

/** The largest half-gauge outer radius whose apex fits the chart height, capped at 128. */
export function fitHalfOuter(height: number): number {
  return Math.min(HALF_OUTER, Math.max(48, Math.round(height * HALF_CY) - HALF_APEX_MARGIN));
}

const pctFormat = (n: number) => `${n}%`;

/** `dominantBaseline` is not on react-native-svg's `TextProps`; its web build forwards it to the DOM. */
const WEB_CENTRAL_BASELINE: object = Platform.OS === 'web' ? { dominantBaseline: 'central' } : {};


interface Arc extends RingBand, SectorAngles {}

/**
 * `RadialChartCard`: recharts `RadialBarChart` (and a `PieChart` for the
 * half gauge), rebuilt in react-native-svg on recharts' geometry
 * (`polar-geometry.ts`):
 *
 *   rings      centred, radii 44 → 106 (26 → 106 `labels`) split into one band
 *              per item, 22% of each band kept clear on both sides (14% `labels`),
 *              first item innermost; arcs from twelve o'clock clockwise with fully
 *              round ends over a full chart-track ring (no track for `grid`)
 *   grid       chart-cursor 1px circles through the band centres and spokes every
 *              45° from the inner to the outer radius
 *   labels     10px medium names in the card colour along each arc, 10° in
 *   gauges     one band 88 → 104 (`gauge`) or 72 → 104 (`solid`, over an inner
 *              disc r 64 in background-inner); the centre reads `value / max`
 *   stacked    a 180° pie 96 → 128 at 78% down, segments 3° apart with round ends
 *              over a round chart-track half ring; the centre sits on its base and
 *              follows the hovered segment; the radii shrink to fit a short card
 *
 * Hovering an arc darkens it to its `-active` tone and drops the others (to 25%,
 * 30% on the half gauge), swaps the header to it and focuses its legend row or
 * tile. Arcs sweep in over 450ms and morph on a data change; the arc names wait
 * for the sweep to finish, as recharts hides them while animating.
 */
export function RadialChartCard({
  variant = 'rings',
  title = 'Visitors',
  data: dataProp,
  max: maxProp,
  headline: headlineProp,
  delta: deltaProp,
  range,
  ranges,
  defaultRange,
  onRangeChange,
  format = formatNumber,
  centerCaption,
  tiles = false,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: RadialChartCardProps) {
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const { width: viewportWidth } = useWindowDimensions();
  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);

  const isRingFamily = variant === 'rings' || variant === 'labels' || variant === 'grid';
  const isGauge = variant === 'gauge' || variant === 'solid';
  const isStacked = variant === 'stacked';

  const data = selected?.data ?? dataProp ?? [];
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;
  const tones = useMemo(() => data.map((d, i) => resolveTone(palettes, i, d.color, d.activeColor)), [data, palettes]);

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const total = values.reduce((sum, v) => sum + v, 0);
  const largest = Math.max(1, ...values);
  const max = selected?.max ?? maxProp ?? (isRingFamily ? Math.ceil(largest * 1.1) : Math.max(1, total));

  const [activeIndex, setActiveIndex] = useActiveIndex(data.length, controlledIndex, onActiveIndexChange);
  const selectRange = useCallback(
    (id: string) => {
      setActiveIndex(null);
      select(id);
    },
    [select, setActiveIndex],
  );

  const hovering = activeIndex !== null;
  const headerLabel = hovering ? (data[activeIndex]?.label ?? title) : title;
  const headlineValue = hovering ? (data[activeIndex]?.value ?? 0) : (headline ?? total);
  const pct = (v: number) => Math.round((v / Math.max(1, max)) * 100);

  let center: { value: number; caption: string } | null = null;
  if (isGauge) {
    center = { value: pct(data[0]?.value ?? 0), caption: centerCaption ?? 'of goal' };
  } else if (isStacked) {
    const focus = hovering ? activeIndex : 0;
    center = { value: pct(data[focus]?.value ?? 0), caption: centerCaption ?? data[focus]?.label ?? '' };
  }

  // The stacked half gauge: the items plus an unclaimed remainder, so the arcs stay proportional to `max`.
  const pieValues = useMemo(() => {
    const remainder = Math.max(0, max - total);
    return remainder > 0 ? [...values, remainder] : values;
  }, [values, max, total]);
  const anim = useChartProgress(useMemo(() => (isStacked ? pieValues : [...values, max]), [isStacked, pieValues, values, max]));
  const animating = anim.progress < 1;

  const fade = useWebTransition('opacity', 200);
  const fillFade = useWebTransition('fill, opacity', 200);
  const rawId = useId();
  const id = `bloom-radial-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const isPhone = viewportWidth < BREAKPOINTS.sm;
  const halfFit = isStacked && !tiles && isPhone;

  /** Where every arc is, at the current point of the animation. */
  const layout = (width: number, height: number) => {
    if (isStacked) {
      const outer = fitHalfOuter(height);
      const inner = Math.round((outer * HALF_INNER) / HALF_OUTER);
      const cx = width / 2;
      const cy = height * HALF_CY;
      const target = pieSectorAngles(pieValues, 180, 0, HALF_PADDING_ANGLE);
      const prev = anim.from ? pieSectorAngles(anim.from, 180, 0, HALF_PADDING_ANGLE) : null;
      const arcs: Arc[] = animatedPieAngles(pieValues, target, prev, anim.progress, HALF_PADDING_ANGLE).map((a) => ({
        ...a,
        innerRadius: inner,
        outerRadius: outer,
      }));
      return { cx, cy, inner, outer, arcs };
    }
    const inner = variant === 'labels' ? 26 : isGauge ? (variant === 'solid' ? 72 : 88) : 44;
    const outer = isGauge ? 104 : OUTER;
    const cx = width / 2;
    const cy = height / 2;
    const bands = radialBarBands(data.length, inner, outer, variant === 'labels' ? 0.14 : 0.22);
    const prevMax = anim.from ? anim.from[anim.from.length - 1]! : null;
    const arcs: Arc[] = bands.map((band, i) => {
      const end = valueAngle(data[i]!.value, max);
      if (anim.from && prevMax !== null) {
        return { ...band, startAngle: 90, endAngle: lerp(valueAngle(anim.from[i]!, prevMax), end, anim.progress) };
      }
      return { ...band, startAngle: 90, endAngle: lerp(90, end, anim.progress) };
    });
    return { cx, cy, inner, outer, arcs, bands };
  };

  const onPointerAt = (x: number, y: number, size: { width: number; height: number }) => {
    const { cx, cy, arcs } = layout(size.width, size.height);
    // recharts hands a RadialBar's background track the bar's own mouse handlers,
    // so a ring with a track is hoverable all the way round.
    const targets = isRingFamily || isGauge ? (variant === 'grid' ? arcs : arcs.map((a) => ({ ...a, startAngle: 90, endAngle: -270 }))) : arcs;
    const index = sectorIndexAt(x, y, cx, cy, targets);
    setActiveIndex(index !== null && index < data.length ? index : null);
  };

  const kind = isStacked ? 'half gauge' : isGauge ? 'gauge' : 'radial chart';
  const a11y =
    accessibilityLabel ??
    (isGauge
      ? `${title} ${kind}: ${pct(data[0]?.value ?? 0)}% ${centerCaption ?? 'of goal'}`
      : `${title} ${kind}: ${data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}`);

  const chart = (
    <PolarSurface
      accessibilityLabel={a11y}
      testID={testID ? `${testID}-plot` : undefined}
      onPointerAt={onPointerAt}
      onPointerLeave={() => setActiveIndex(null)}>
      {({ width, height }) => {
        const geo = layout(width, height);
        const { cx, cy, inner, outer, arcs } = geo;
        if (isStacked) {
          const track = sectorPath({ cx, cy, innerRadius: inner, outerRadius: outer, startAngle: 180, endAngle: 0, cornerRadius: ROUND });
          return (
            <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
              {track ? <Path d={track} fill={palette.track} stroke="none" /> : null}
              {arcs.slice(0, data.length).map((arc, i) => {
                const d = sectorPath({ cx, cy, ...arc, cornerRadius: ROUND });
                const active = activeIndex === i;
                return d ? (
                  <Path
                    key={`seg-${i}`}
                    testID={testID ? `${testID}-arc-${i}` : undefined}
                    d={d}
                    stroke="none"
                    fill={active ? tones[i]!.activeColor : tones[i]!.color}
                    opacity={hovering && !active ? 0.3 : 1}
                    {...svgTransition(fade)}
                  />
                ) : null;
              })}
            </Svg>
          );
        }
        const bands = geo.bands ?? [];
        return (
          <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
            {variant === 'grid' ? (
              <G>
                {radialBarBandCentres(data.length, inner, outer).map((r, i) => (
                  <Circle key={`grid-${i}`} cx={cx} cy={cy} r={r} fill="none" stroke={palette.cursor} strokeWidth={1} />
                ))}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                  const a = polarToCartesian(cx, cy, inner, angle);
                  const b = polarToCartesian(cx, cy, outer, angle);
                  return (
                    <Line key={`spoke-${angle}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={palette.cursor} strokeWidth={1} />
                  );
                })}
              </G>
            ) : null}
            {variant === 'solid' ? <Circle cx={cx} cy={cy} r={inner - 8} fill={palette.inner} stroke="none" /> : null}
            {variant !== 'grid'
              ? bands.map((band, i) => {
                  const d = sectorPath({ cx, cy, ...band, startAngle: 90, endAngle: -270 });
                  return d ? <Path key={`track-${i}`} d={d} fill={palette.track} stroke="none" /> : null;
                })
              : null}
            {arcs.map((arc, i) => {
              const d = sectorPath({ cx, cy, ...arc, cornerRadius: ROUND });
              const active = activeIndex === i;
              return d ? (
                <Path
                  key={`arc-${i}`}
                  testID={testID ? `${testID}-arc-${i}` : undefined}
                  d={d}
                  stroke="none"
                  fill={active ? tones[i]!.activeColor : tones[i]!.color}
                  // The hovered ring keeps full strength; every other ring drops hard.
                  opacity={hovering && !active ? 0.25 : 1}
                  {...svgTransition(fillFade)}
                />
              ) : null;
            })}
            {variant === 'labels' && !animating ? (
              <>
                <Defs>
                  {arcs.map((arc, i) => (
                    <Path key={`label-path-${i}`} id={`${id}-${i}`} d={radialLabelArc(cx, cy, arc, arc.startAngle, arc.endAngle, LABEL_OFFSET)} />
                  ))}
                </Defs>
                {arcs.map((_, i) => (
                  <SvgText
                    key={`label-${i}`}
                    fill={palette.surface}
                    fontSize={10}
                    fontWeight="500"
                    fontFamily={Platform.OS === 'web' ? 'var(--bloom-font-sans)' : 'Inter'}
                    alignmentBaseline="central"
                    // Chrome ignores `alignment-baseline` on <text>; recharts sets `dominant-baseline`.
                    {...WEB_CENTRAL_BASELINE}>
                    <TextPath href={`#${id}-${i}`}>{data[i]!.label}</TextPath>
                  </SvgText>
                ))}
              </>
            ) : null}
          </Svg>
        );
      }}
    </PolarSurface>
  );

  const stackedHeightStyle: ViewStyle | null = halfFit ? { height: 'auto', minHeight: CHART_CARD_HEIGHT } : null;

  return (
    <ChartCardSurface height={tiles ? 'auto' : undefined} style={[stackedHeightStyle, style]} testID={testID}>
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

      <View
        style={[
          tiles ? { width: '100%', height: TILES_PLOT_HEIGHT } : { width: '100%', flex: 1, minHeight: 0 },
          halfFit ? { minHeight: HALF_MIN_HEIGHT } : null,
        ]}>
        {chart}
        {center ? (
          <View
            pointerEvents="none"
            style={
              isStacked
                ? { position: 'absolute', left: 0, right: 0, top: 0, height: `${HALF_CY * 100}%` }
                : { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }
            }>
            <ChartCenterReadout
              value={center.value}
              format={pctFormat}
              caption={center.caption}
              fadeKey={`${selectedId ?? ''}:${activeIndex}`}
              testID={testID ? `${testID}-center` : undefined}
              style={isStacked ? { justifyContent: 'flex-end' } : undefined}
            />
          </View>
        ) : null}
      </View>

      {isStacked && !tiles ? (
        <ChartLegend
          testID={testID ? `${testID}-legend` : undefined}
          items={data.map((d, i) => ({ label: d.label, color: tones[i]!.color, value: format(d.value) }))}
          activeIndex={activeIndex}
          onActiveChange={setActiveIndex}
          style={{ paddingBottom: 4 }}
        />
      ) : null}

      {tiles ? (
        <ChartStatTiles
          testID={testID ? `${testID}-tiles` : undefined}
          items={data.map((d, i) => ({
            label: d.label,
            value: format(d.value),
            color: tones[i]!.color,
            activeColor: tones[i]!.activeColor,
          }))}
          activeIndex={activeIndex}
          onActiveChange={setActiveIndex}
        />
      ) : null}
    </ChartCardSurface>
  );
}
