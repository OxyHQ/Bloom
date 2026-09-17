import React, { useCallback, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PointerEvent,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { resolveTone, type ChartSeriesTone } from './palette';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { ChartHeader, TABULAR } from './primitives/ChartHeader';
import { describeDeltaRatio, formatNumber } from './primitives/format';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette, useChartTones, useMonoTone } from './primitives/use-chart-palette';
import { useChartRange, type ChartRange } from './primitives/use-chart-range';
import { useWebTransition } from './primitives/use-web-transition';
import { useSvgEase } from './medical-parts';
import { StageStatTiles } from './stage-parts';

/**
 * A horizontal flow funnel, hand-drawn in SVG.
 *
 *   columns  one per stage, 3px apart, filling the plot; each a band centred
 *            on the plot's midline that starts at its stage's height and
 *            tapers to the NEXT stage's height at its right edge (the last
 *            stays flat). Heights are the share of the first stage over the
 *            plot height (less 12px top and bottom in `curved`), at least 2px
 *   curved   flat for 42% of the column, then an S-curve (both control points
 *            at the midpoint of the rest); two translucent copies behind every
 *            band, 12px (10%) and 6px (22%) taller on each side
 *   sharp    a straight trapezoid, over a 36px backing band at 14%
 *   pills    share of the first stage, centred on every column: 20 tall,
 *            `label length × 7.2 + 16` wide, fully round, card colour, 12px
 *            medium tabular text-primary; dropped when wider than the column
 *   tiles    one per column from `sm` (640) up, two per row below
 *
 * Hovering a band, backing band or pill (web), or pressing one (native), swaps
 * the header to that stage, darkens its band (400 → 500) and fades every other
 * column to 30% and every other tile to 50%, all over 200ms. Leaving the plot
 * clears it; the empty space between shapes keeps the last stage, since only
 * entering a new shape updates it.
 */

export interface FunnelStage {
  label: string;
  value: number;
  /** Any colour; defaults to the chart palette by index. */
  color?: string;
  activeColor?: string;
}

/** `curved` — S-curve taper with layered edges; `sharp` — a plain trapezoid. */
export type FunnelShape = 'curved' | 'sharp';

/** A selectable period: the pill label plus the props it overrides. */
export type FunnelRange = ChartRange<{ stages: FunnelStage[]; delta: number; headline: number }>;

export interface FunnelChartCardProps {
  shape?: FunnelShape;
  /** Single-ink look: bands in one grey, no swatches on the tiles. */
  mono?: boolean;
  /** Header label; swaps to the hovered stage's name. Default `"Sign-up funnel"`. */
  title?: string;
  /** Stages left to right. Required unless every range carries its own. */
  stages?: readonly FunnelStage[];
  /** Headline number at rest; defaults to the first stage's value. */
  headline?: number;
  /** Delta ratio for the chip, e.g. `0.052` → "+5.2%". No chip when omitted. */
  delta?: number;
  /** Static period pill ("Last 30 days"). Ignored when `ranges` is set. */
  range?: string;
  /** Selectable periods: the pill becomes a dropdown and the selected range's fields override the props above. */
  ranges?: readonly FunnelRange[];
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  /** Headline and tile values. Default en-US grouping. */
  format?: (value: number) => string;
  /** The hovered stage. Controlled when set (`null` = none); omit to track the pointer. */
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  /** Names the funnel for assistive tech. Defaults to a summary of the stages. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Gap between funnel columns, px. */
export const FUNNEL_COL_GAP = 3;
/** Share of a curved column that stays flat before the S-curve taper. */
export const FUNNEL_FLAT = 0.42;
/** The two translucent edge layers behind a curved band: bleed px + fill opacity. */
export const FUNNEL_LAYERS = [
  { pad: 12, opacity: 0.1 },
  { pad: 6, opacity: 0.22 },
] as const;
const BACKING_H = 36;
const BACKING_OPACITY = 0.14;
/** Opacity of every other column while one stage is hovered. */
const DIM = 0.3;
const PILL_H = 20;
const PILL_PAD = 8;
const PILL_CHAR = 7.2;
/** `fontSize={12} fontWeight={500}` — the caption step without its tracking. */
const PILL_TYPE: TextStyle = { ...TYPE_SCALE['caption-1-medium'], letterSpacing: 0 };

/** Raw JS numbers, interpolated directly into the path. */
const n = (v: number) => String(v);

/**
 * One column band from height `hL` at `x0` to `hR` at `x1`, centred on `cy`.
 */
export function funnelBandPath(x0: number, x1: number, cy: number, hL: number, hR: number, shape: FunnelShape): string {
  const topL = cy - hL / 2;
  const botL = cy + hL / 2;
  const topR = cy - hR / 2;
  const botR = cy + hR / 2;
  if (shape === 'sharp') {
    return `M${n(x0)},${n(topL)} L${n(x1)},${n(topR)} L${n(x1)},${n(botR)} L${n(x0)},${n(botL)} Z`;
  }
  const xf = x0 + (x1 - x0) * FUNNEL_FLAT;
  const c = (xf + x1) / 2;
  return [
    `M${n(x0)},${n(topL)}`,
    `L${n(xf)},${n(topL)}`,
    `C${n(c)},${n(topL)} ${n(c)},${n(topR)} ${n(x1)},${n(topR)}`,
    `L${n(x1)},${n(botR)}`,
    `C${n(c)},${n(botR)} ${n(c)},${n(botL)} ${n(xf)},${n(botL)}`,
    `L${n(x0)},${n(botL)}`,
    'Z',
  ].join(' ');
}

/** Half the band's height at `x` inside its column (for hit testing). */
function bandHalfHeightAt(x: number, x0: number, x1: number, hL: number, hR: number, shape: FunnelShape): number {
  if (shape === 'sharp') {
    const t = x1 > x0 ? (x - x0) / (x1 - x0) : 0;
    return (hL + (hR - hL) * t) / 2;
  }
  const xf = x0 + (x1 - x0) * FUNNEL_FLAT;
  if (x <= xf) return hL / 2;
  const c = (xf + x1) / 2;
  // x(t) of the cubic (xf, c, c, x1) is monotone: bisect for t.
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 24; k++) {
    const t = (lo + hi) / 2;
    const u = 1 - t;
    const xt = u * u * u * xf + 3 * u * u * t * c + 3 * u * t * t * c + t * t * t * x1;
    if (xt < x) lo = t;
    else hi = t;
  }
  const t = (lo + hi) / 2;
  // y(t) with control values (hL, hL, hR, hR) is smoothstep-shaped.
  const w = 3 * t * t - 2 * t * t * t;
  return (hL + (hR - hL) * w) / 2;
}

export interface FunnelGeometry {
  colW: number;
  cy: number;
  columnX: (i: number) => { x0: number; x1: number };
  heightOf: (value: number) => number;
}

/** The funnel's layout inside a `width × height` plot. */
export function funnelGeometry(
  width: number,
  height: number,
  count: number,
  top: number,
  shape: FunnelShape,
): FunnelGeometry {
  const cols = Math.max(1, count);
  const bleed = shape === 'curved' ? FUNNEL_LAYERS[0].pad : 0;
  const colW = Math.max(0, (width - FUNNEL_COL_GAP * (cols - 1)) / cols);
  const usable = Math.max(0, height - bleed * 2);
  return {
    colW,
    cy: height / 2,
    columnX: (i) => {
      const x0 = i * (colW + FUNNEL_COL_GAP);
      return { x0, x1: x0 + colW };
    },
    heightOf: (value) => Math.max(2, (value / top) * usable),
  };
}

/** Pill label and width for a stage; `null` when it does not fit its column. */
export function funnelPill(value: number, top: number, colW: number): { label: string; width: number } | null {
  const label = `${Math.round((value / top) * 100)}%`;
  const width = label.length * PILL_CHAR + PILL_PAD * 2;
  return width > colW + FUNNEL_COL_GAP ? null : { label, width };
}

export function FunnelChartCard({
  shape = 'curved',
  mono = false,
  title = 'Sign-up funnel',
  stages: stagesProp,
  headline: headlineProp,
  delta: deltaProp,
  range,
  ranges,
  defaultRange,
  onRangeChange,
  format = formatNumber,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: FunnelChartCardProps) {
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const monoTone = useMonoTone();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const dimEase = useWebTransition('opacity', 200);
  const svgEase = useSvgEase('funnel');

  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);
  const stages = selected?.stages ?? stagesProp ?? [];
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;

  const [activeIndex, setActiveIndex] = useActiveIndex(stages.length, controlledIndex, onActiveIndexChange);
  const selectRange = useCallback(
    (id: string) => {
      setActiveIndex(null);
      select(id);
    },
    [select, setActiveIndex],
  );

  const tones: ChartSeriesTone[] = stages.map((s, i) => (mono ? monoTone : resolveTone(palettes, i, s.color, s.activeColor)));
  const top = Math.max(1, stages[0]?.value ?? 1);
  const hovering = activeIndex !== null;
  const headerLabel = hovering ? stages[activeIndex]!.label : title;
  const headlineValue = hovering ? stages[activeIndex]!.value : (headline ?? top);
  const count = Math.max(1, stages.length);
  const layered = shape === 'curved';
  const dimOf = (i: number) => (hovering && activeIndex !== i ? DIM : 1);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const geo = size ? funnelGeometry(size.width, size.height, stages.length, top, shape) : null;
  const heightsOf = (i: number) => {
    const hL = geo!.heightOf(stages[i]!.value);
    const hR = i < count - 1 ? geo!.heightOf(stages[i + 1]!.value) : hL;
    return { hL, hR };
  };

  /** The stage whose band, backing band or pill is under the point, or `undefined` for empty space. */
  const hitTest = (px: number, py: number): number | undefined => {
    if (!geo) return undefined;
    for (let i = 0; i < stages.length; i++) {
      const { x0, x1 } = geo.columnX(i);
      const pill = funnelPill(stages[i]!.value, top, geo.colW);
      const mid = (x0 + x1) / 2;
      if (pill && Math.abs(px - mid) <= pill.width / 2 && Math.abs(py - geo.cy) <= PILL_H / 2) return i;
    }
    for (let i = 0; i < stages.length; i++) {
      const { x0, x1 } = geo.columnX(i);
      if (px < x0 || px > x1) continue;
      const { hL, hR } = heightsOf(i);
      const half = bandHalfHeightAt(px, x0, x1, hL, hR, shape);
      if (Math.abs(py - geo.cy) <= Math.max(half, layered ? 0 : BACKING_H / 2)) return i;
    }
    return undefined;
  };
  const track = (px: number, py: number) => {
    const hit = hitTest(px, py);
    if (hit !== undefined) setActiveIndex(hit);
  };

  const pointerHandlers: ViewProps = {
    onPointerMove: (e: PointerEvent) => track(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
    onPointerLeave: () => setActiveIndex(null),
    ...(Platform.OS === 'web'
      ? null
      : {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderTerminationRequest: () => false,
          onResponderGrant: (e: GestureResponderEvent) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderMove: (e: GestureResponderEvent) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderRelease: () => setActiveIndex(null),
          onResponderTerminate: () => setActiveIndex(null),
        }),
  };

  const summary =
    accessibilityLabel ??
    `${title} funnel: ${stages.map((s) => `${s.label} ${format(s.value)} (${Math.round((s.value / top) * 100)}%)`).join(', ')}`;

  return (
    <ChartCardSurface style={style} testID={testID}>
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

      <View {...svgEase} style={{ width: '100%', flex: 1, minHeight: 0 }} onLayout={onLayout} testID={testID ? `${testID}-plot` : undefined}>
        {size && geo && size.width > 0 && size.height > 0 ? (
          <>
            <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
              {!layered
                ? stages.map((stage, i) => {
                    const { x0, x1 } = geo.columnX(i);
                    return (
                      <Rect
                        key={`backing-${stage.label}-${i}`}
                        x={x0}
                        y={geo.cy - BACKING_H / 2}
                        width={x1 - x0}
                        height={BACKING_H}
                        fill={tones[i]!.color}
                        fillOpacity={BACKING_OPACITY}
                        opacity={dimOf(i)}
                      />
                    );
                  })
                : null}
              {layered
                ? FUNNEL_LAYERS.map((layer) =>
                    stages.map((stage, i) => {
                      const { x0, x1 } = geo.columnX(i);
                      const { hL, hR } = heightsOf(i);
                      return (
                        <Path
                          key={`layer-${layer.pad}-${stage.label}-${i}`}
                          d={funnelBandPath(x0, x1, geo.cy, hL + layer.pad * 2, hR + layer.pad * 2, shape)}
                          fill={tones[i]!.color}
                          fillOpacity={layer.opacity}
                          opacity={dimOf(i)}
                          />
                      );
                    }),
                  )
                : null}
              {stages.map((stage, i) => {
                const { x0, x1 } = geo.columnX(i);
                const { hL, hR } = heightsOf(i);
                return (
                  <Path
                    key={`band-${stage.label}-${i}`}
                    testID={testID ? `${testID}-band-${i}` : undefined}
                    d={funnelBandPath(x0, x1, geo.cy, hL, hR, shape)}
                    fill={activeIndex === i ? tones[i]!.activeColor : tones[i]!.color}
                    opacity={dimOf(i)}
                  />
                );
              })}
            </Svg>
            {stages.map((stage, i) => {
              const { x0, x1 } = geo.columnX(i);
              const pill = funnelPill(stage.value, top, geo.colW);
              if (!pill) return null;
              return (
                <View
                  key={`pill-${stage.label}-${i}`}
                  pointerEvents="none"
                  testID={testID ? `${testID}-pill-${i}` : undefined}
                  style={[
                    {
                      position: 'absolute',
                      left: (x0 + x1) / 2 - pill.width / 2,
                      top: geo.cy - PILL_H / 2,
                      width: pill.width,
                      height: PILL_H,
                      borderRadius: PILL_H / 2,
                      backgroundColor: palette.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: dimOf(i),
                    },
                    dimEase,
                  ]}>
                  <Text numberOfLines={1} style={[PILL_TYPE, { color: palette.text }, TABULAR]}>
                    {pill.label}
                  </Text>
                </View>
              );
            })}
            <View
              role="img"
              accessibilityLabel={summary}
              testID={testID ? `${testID}-plot-surface` : undefined}
              style={StyleSheet.absoluteFill}
              {...pointerHandlers}
            />
          </>
        ) : null}
      </View>

      <StageStatTiles
        columns={count}
        narrowColumns={2}
        swatches={!mono}
        activeIndex={activeIndex}
        onActiveChange={setActiveIndex}
        testID={testID ? `${testID}-tiles` : undefined}
        items={stages.map((stage, i) => ({
          label: stage.label,
          value: format(stage.value),
          color: tones[i]!.color,
          activeColor: tones[i]!.activeColor,
        }))}
      />
    </ChartCardSurface>
  );
}
