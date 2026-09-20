import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  Easing,
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
import Svg, { ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Chip } from '../chip';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { purpleChip, purpleStop } from './ai-profile-hues';
import { linearPath, niceTicks, type Point } from './geometry';
import { TABULAR } from './primitives/ChartHeader';
import { FadeOnChange } from './primitives/FadeOnChange';
import { PulsingDot } from './primitives/PulsingDot';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette } from './primitives/use-chart-palette';
import { useCountUp } from './use-count-up';

/**
 * `TokensChartCard`: daily token usage as a sharp line over a fading
 * area, idle stretches drawn as a grey dashed baseline, the plot bleeding to
 * the card's edges.
 *
 * The recharts `ComposedChart`, in react-native-svg on recharts' geometry:
 *
 *   card     radius 20, background-secondary, padding 12 top and bottom only
 *   header   16 in, 4 from the top, over the plot (`-mb-8`): label body-medium
 *            text-secondary, 2px, the number title-2-medium tabular + a
 *            status-purple `Chip` 8px after it
 *   plot     200 tall, full card width; margin top 27, bottom 2; X is a point
 *            scale edge to edge, Y `[0, nice max]` from recharts' five ticks
 *   area     the line closed on the base, purple-400 32% → 0%
 *   line     2px, straight joins, cut into runs: purple-400 between idle days
 *            (each run reaches one point into the neighbouring zeros, so the
 *            descent and climb stay purple) and neutral-400 dashed `5 5` along
 *            every run of zeros
 *   cursor   1px dashed `4 4`, chart-cursor, plot top to bottom
 *   dot      `PulsingDot` — purple-500, neutral-400 on an idle day
 *   reveal   the plot wipes in left to right over 1800ms
 *            `cubic-bezier(0.33, 0, 0.15, 1)`, via a clip-path sweep
 *   axis     8 under the plot, start / end labels caption-2-medium
 *            text-tertiary, 16 in
 *
 * Hovering inside the plot (web) or pressing and scrubbing (native) picks the
 * nearest day: the label becomes its date and the number rolls to its value,
 * tenths included. Outside the plot rectangle it clears. Reduced motion skips
 * the reveal.
 */

export interface TokensPoint {
  /** The day as the hovered header names it, e.g. `"Jun 20"`. */
  label: string;
  value: number;
}

export interface TokensChartCardProps {
  /** One point per day, left to right. Zero is an idle day. */
  data: readonly TokensPoint[];
  /** Header label at rest. Default `"Tokens"`. */
  title?: string;
  /** Headline at rest. Defaults to the sum of `data`. */
  headline?: number;
  /** Headline format, resting and hovered. Default `"667.7M tokens"`. */
  format?: (value: number) => string;
  /** Header label for a hovered day. Default: the point's `label`. */
  getPointTitle?: (point: TokensPoint, index: number) => string;
  /** The chip beside the number, e.g. `"+9.4%"`. No chip when omitted. */
  delta?: string;
  /** Axis labels under the plot's edges. Default `"Jun 14"` / `"Today"` — pass your own. */
  startLabel?: string;
  endLabel?: string;
  /** Plot height. Default 200. */
  plotHeight?: number;
  /** Line colour (and the area's). Default purple-400. */
  color?: string;
  /** Active dot colour. Default purple-500. */
  activeColor?: string;
  /** The hovered day. Controlled when set (`null` = none). */
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const TOKENS_PLOT_HEIGHT = 200;
export const TOKENS_MARGIN_TOP = 27;
export const TOKENS_MARGIN_BOTTOM = 2;
const REVEAL_MS = 1800;
const REVEAL_EASE = Easing.bezier(0.33, 0, 0.15, 1);
const IS_WEB = Platform.OS === 'web';

const defaultFormat = (value: number) => `${value.toFixed(1)}M tokens`;

export interface TokensSegment {
  key: string;
  dashed: boolean;
  from: number;
  to: number;
}

/**
 * Alternating runs. A dashed run is a stretch of zeros; a solid run spans
 * the values between, reaching one point into the zero run on each side.
 */
export function tokensSegments(values: readonly number[]): TokensSegment[] {
  const segments: TokensSegment[] = [];
  let i = 0;
  while (i < values.length) {
    const zero = values[i] === 0;
    let end = i;
    while (end + 1 < values.length && (values[end + 1] === 0) === zero) end++;
    if (zero) {
      segments.push({ key: `idle-${i}`, dashed: true, from: i, to: end });
    } else {
      segments.push({
        key: `run-${i}`,
        dashed: false,
        from: Math.max(0, i - 1),
        to: Math.min(values.length - 1, end + 1),
      });
    }
    i = end + 1;
  }
  return segments;
}

/** Point positions: a point scale edge to edge, `[0, nice max]` down from `top` to `bottom`. */
export function tokensPoints(values: readonly number[], width: number, top: number, bottom: number): Point[] {
  const ticks = niceTicks(0, values.reduce((m, v) => Math.max(m, v), 0), 5);
  const domainMax = ticks[ticks.length - 1] ?? 0;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values.map((v, i) => ({
    x: values.length > 1 ? i * step : width / 2,
    y: domainMax > 0 ? bottom - (v / domainMax) * (bottom - top) : bottom,
  }));
}

/** recharts `Area` on a flat base, straight joins. */
export function tokensAreaPath(points: readonly Point[], baseY: number): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  return `${linearPath(points)}L${r3(last.x)},${r3(baseY)}L${r3(first.x)},${r3(baseY)}Z`;
}

/** A 0 → 1 clock over `duration` on `easing`, started on mount. Snaps when `skip`. */
function useReveal(skip: boolean): number {
  const [progress, setProgress] = useState(skip ? 1 : 0);
  useEffect(() => {
    if (skip || typeof requestAnimationFrame !== 'function') {
      setProgress(1);
      return;
    }
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / REVEAL_MS);
      setProgress(REVEAL_EASE(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [skip]);
  return skip ? 1 : progress;
}

export function TokensChartCard({
  data,
  title = 'Tokens',
  headline,
  format = defaultFormat,
  getPointTitle,
  delta,
  startLabel = 'Jun 14',
  endLabel = 'Today',
  plotHeight = TOKENS_PLOT_HEIGHT,
  color,
  activeColor,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: TokensChartCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [activeIndex, setActiveIndex] = useActiveIndex(data.length, controlledIndex, onActiveIndexChange);
  const reveal = useReveal(reducedMotion);

  const colors = useMemo(() => {
    return {
      line: color ?? purpleStop(theme, 400),
      dot: activeColor ?? purpleStop(theme, 500),
      idle: theme.colors.textTertiary,
      chip: purpleChip(theme, palette.surface),
    };
  }, [theme, color, activeColor, palette.surface]);

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const segments = useMemo(() => tokensSegments(values), [values]);
  const total = headline ?? values.reduce((s, v) => s + v, 0);
  const point = activeIndex !== null ? data[activeIndex]! : null;
  // Rolled in tenths so the decimal animates too.
  const display = useCountUp(Math.round((point ? point.value : total) * 10)) / 10;
  const label = point ? (getPointTitle?.(point, activeIndex!) ?? point.label) : title;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const top = TOKENS_MARGIN_TOP;
  const bottom = size ? size.height - TOKENS_MARGIN_BOTTOM : 0;
  const points = useMemo(
    () => (size ? tokensPoints(values, size.width, top, bottom) : []),
    [size, values, top, bottom],
  );

  const track = (px: number, py: number) => {
    if (!size || data.length === 0) return;
    if (px >= 0 && px <= size.width && py >= top && py <= bottom) {
      const step = data.length > 1 ? size.width / (data.length - 1) : size.width;
      setActiveIndex(Math.min(data.length - 1, Math.max(0, Math.round(px / step))));
    } else {
      setActiveIndex(null);
    }
  };
  const pointerHandlers: ViewProps = {
    onPointerMove: (e: PointerEvent) => track(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
    onPointerLeave: () => setActiveIndex(null),
    ...(IS_WEB
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

  const rawId = useId();
  const id = `bloom-tokens-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const active = activeIndex !== null ? points[activeIndex] : undefined;
  const summary =
    accessibilityLabel ?? `${title} line chart: ${data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}`;

  return (
    <View
      testID={testID}
      style={[
        {
          width: '100%',
          minWidth: 0,
          flexDirection: 'column',
          borderRadius: 20,
          backgroundColor: palette.surface,
          paddingTop: 12,
          paddingBottom: 12,
        },
        style,
      ]}>
      <View
        style={{
          zIndex: 1,
          width: '100%',
          flexDirection: 'row',
          marginBottom: -32,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 4,
        }}>
        <View style={{ flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {label}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FadeOnChange fadeKey={String(activeIndex)} style={{ flexShrink: 0 }}>
              <Text
                variant="title-2-medium"
                numberOfLines={1}
                testID={testID ? `${testID}-headline` : undefined}
                style={[{ color: palette.text }, TABULAR]}>
                {format(display)}
              </Text>
            </FadeOnChange>
            {delta !== undefined ? (
              <Chip
                size="md"
                testID={testID ? `${testID}-delta` : undefined}
                style={{ alignSelf: 'center', backgroundColor: colors.chip.background }}
                textStyle={{ color: colors.chip.foreground }}>
                {delta}
              </Chip>
            ) : null}
          </View>
        </View>
      </View>

      <View
        style={{ width: '100%', height: plotHeight }}
        onLayout={onLayout}
        testID={testID ? `${testID}-plot` : undefined}>
        {size && size.width > 0 && size.height > 0 ? (
          <>
            <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Defs>
                <LinearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.line} stopOpacity={0.32} />
                  <Stop offset="1" stopColor={colors.line} stopOpacity={0} />
                </LinearGradient>
                <ClipPath id={`${id}-reveal`}>
                  <Rect x={0} y={0} width={size.width * reveal} height={size.height} />
                </ClipPath>
              </Defs>
              <G clipPath={`url(#${id}-reveal)`}>
                <Path
                  testID={testID ? `${testID}-area` : undefined}
                  d={tokensAreaPath(points, bottom)}
                  fill={`url(#${id}-fill)`}
                  stroke="none"
                />
                {segments.map((seg) => (
                  <Path
                    key={seg.key}
                    testID={testID ? `${testID}-${seg.key}` : undefined}
                    d={linearPath(points.slice(seg.from, seg.to + 1))}
                    fill="none"
                    stroke={seg.dashed ? colors.idle : colors.line}
                    strokeWidth={2}
                    strokeDasharray={seg.dashed ? '5 5' : undefined}
                  />
                ))}
                {active ? (
                  // recharts' tooltip cursor layer sits over the series, under the active dot.
                  <Line
                    testID={testID ? `${testID}-cursor` : undefined}
                    x1={active.x}
                    y1={top}
                    x2={active.x}
                    y2={bottom}
                    stroke={palette.cursor}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                ) : null}
                {active ? (
                  <PulsingDot
                    cx={active.x}
                    cy={active.y}
                    color={values[activeIndex!] === 0 ? colors.idle : colors.dot}
                    ring={palette.surface}
                    testID={testID ? `${testID}-dot` : undefined}
                  />
                ) : null}
              </G>
            </Svg>
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

      <View
        style={{
          marginTop: 8,
          width: '100%',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingLeft: 16,
          paddingRight: 16,
        }}>
        <Text variant="caption-2-medium" numberOfLines={1} style={{ color: palette.textTertiary }}>
          {startLabel}
        </Text>
        <Text variant="caption-2-medium" numberOfLines={1} style={{ color: palette.textTertiary }}>
          {endLabel}
        </Text>
      </View>
    </View>
  );
}
