import { boundedLabelSlot } from './svg-text';
import React, { useCallback, useMemo, useState } from 'react';
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
import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { barPositions, niceTicks } from './geometry';
import { chartHueTone, resolveTone } from './palette';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { groupThousands } from './primitives/format';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette } from './primitives/use-chart-palette';
import {
  MEDICAL_CARD_HEIGHT,
  MEDICAL_CARD_STYLE,
  MedicalHeader,
  MedicalHeadline,
  WeekRangePill,
  useSvgEase,
} from './medical-parts';
import { lerp, useChartProgress } from './use-chart-progress';

/**
 * `StepsCard`: a week of step counts as rounded bars over a neutral track.
 *
 * The recharts `BarChart` it draws, in react-native-svg on recharts' geometry:
 *
 *   plot     the card's 10px inset, stretched 5.5px past it on both sides;
 *            4px margin on top, a 26px label row under it
 *   bands    one per day; recharts' numeric `barCategoryGap={4.5}` on each
 *            side, the bar width rounded and capped at 50 (`maxBarSize`)
 *   track    the full plot height behind every bar, radius 10, chart-track
 *   bars     chart-1 (teal 400), the hovered one chart-1-active (500), all
 *            four corners radius 10 (clamped to half the bar); value domain
 *            `[0, nice max]` from recharts' default five Y ticks; bars grow
 *            from the base over 450ms on mount and morph on a data change
 *   hover    a 2px chart-cursor outline 3px outside the hovered track, radius
 *            13, fading in over 150ms
 *   labels   12px text-secondary, centred on the band, 8px under the plot
 *
 * The header rolls to the hovered day's count (count-up + fade), swaps the
 * label to the full day name and the suffix from "total steps" to "steps".
 * Hovering (web) or pressing and scrubbing (native) inside the plot picks the
 * day whose band is under the pointer; over the labels it clears.
 */

export interface StepsPoint {
  /** X label, e.g. `"Mon"`. */
  label: string;
  value: number;
}

export interface StepsCardProps {
  /** One bar per point, left to right (e.g. Mon → Sun). */
  data: readonly StepsPoint[];
  /** Header label at rest. Default `"Steps"`. */
  title?: string;
  /** Header label while a day is hovered. Defaults to the full English day name for a three-letter day (`"Mon"` → `"Monday"`), else the label. */
  getPointTitle?: (point: StepsPoint, index: number) => string;
  /** Headline at rest; defaults to the sum of `data`. */
  headline?: number;
  /** Suffix after the resting number. Default `"total steps"`. */
  totalSuffix?: string;
  /** Suffix after a hovered day's number. Default `"steps"`. */
  pointSuffix?: string;
  /** Headline formatting. Default en-US grouping. */
  format?: (value: number) => string;
  /** The period pill's label ("29 Jun - 5 Jul"). No pill when omitted. */
  range?: string;
  /** Chevron handlers — with either, the pill's chevrons become buttons and its label rolls. */
  onPrevRange?: () => void;
  onNextRange?: () => void;
  /** Bar colour and its hover step. Default chart-1 (teal). */
  color?: string;
  activeColor?: string;
  /** The hovered day. Controlled when set (`null` = none); omit to track the pointer. */
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  /** Names the chart for assistive tech. Defaults to a summary of the days. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DAY_FULL: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

/** `-mx-[5.5px]` on the chart container. */
export const STEPS_BLEED = 5.5;
/** `margin={{ top: 4 }}`. */
export const STEPS_MARGIN_TOP = 4;
/** `XAxis height={26}`. */
export const STEPS_AXIS_HEIGHT = 26;
export const STEPS_CATEGORY_GAP = 4.5;
export const STEPS_MAX_BAR = 50;
export const STEPS_RADIUS = 10;
const HOVER_PADDING = 3;
const HOVER_STROKE = 2;
/** recharts' default YAxis `tickCount`, which picks the nice domain max. */
const TICK_COUNT = 5;
/** tickSize 6 + tickMargin 8 puts the `<text y>` 14px under the plot; for 12px Inter on a 16px line the box starts ~4px above it. */
const LABEL_TOP = 6 + 8 - 4;
const LABEL_SLOT = 120;
/** `tick={{ fontSize: 12 }}` — the caption step without its tracking. */
const TICK_TYPE: TextStyle = { ...TYPE_SCALE['caption-1-regular'], letterSpacing: 0 };

export interface StepsBar {
  x: number;
  width: number;
}

/**
 * recharts `getBarPositions` for one series with a NUMERIC `barCategoryGap`
 * and a `maxBarSize`: the gap on each side of the band, the width rounded, then
 * capped with the difference split around it.
 */
export function stepsBars(width: number, count: number): StepsBar[] {
  if (count <= 0 || width <= 0) return [];
  const band = width / count;
  const [pos] = barPositions(band, 1, STEPS_CATEGORY_GAP / band, 0);
  const original = pos!.size;
  const size = Math.min(original, STEPS_MAX_BAR);
  const offset = pos!.offset + (original - size) / 2;
  return Array.from({ length: count }, (_, i) => ({ x: i * band + offset, width: size }));
}

export function StepsCard({
  data,
  title = 'Steps',
  getPointTitle,
  headline,
  totalSuffix = 'total steps',
  pointSuffix = 'steps',
  format = groupThousands,
  range,
  onPrevRange,
  onNextRange,
  color,
  activeColor,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: StepsCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const tone = useMemo(
    () => (color ? resolveTone([], 0, color, activeColor) : chartHueTone(theme, 1)),
    [theme, color, activeColor],
  );
  const svgEase = useSvgEase('steps');
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [activeIndex, setActiveIndex] = useActiveIndex(data.length, controlledIndex, onActiveIndexChange);

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const anim = useChartProgress(values);
  const total = values.reduce((sum, v) => sum + v, 0);
  const hovering = activeIndex !== null;
  const point = hovering ? data[activeIndex]! : null;
  const label = point ? (getPointTitle?.(point, activeIndex!) ?? DAY_FULL[point.label] ?? point.label) : title;

  const domainMax = useMemo(() => {
    const peak = values.reduce((m, v) => Math.max(m, v), 0);
    const ticks = niceTicks(0, peak, TICK_COUNT);
    return ticks[ticks.length - 1] ?? 0;
  }, [values]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const plotTop = STEPS_MARGIN_TOP;
  const plotBottom = size ? size.height - STEPS_AXIS_HEIGHT : 0;
  const plotHeight = Math.max(0, plotBottom - plotTop);
  const bars = size ? stepsBars(size.width, data.length) : [];
  const band = size && data.length > 0 ? size.width / data.length : 0;

  const track = (px: number, py: number) => {
    if (!size || data.length === 0) return;
    if (px >= 0 && px <= size.width && py >= plotTop && py <= plotBottom) {
      setActiveIndex(Math.min(data.length - 1, Math.max(0, Math.floor(px / band))));
    } else {
      setActiveIndex(null);
    }
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

  const heightOf = (i: number) => {
    const target = values[i] ?? 0;
    const from = anim.from && anim.from.length === values.length ? anim.from[i]! : 0;
    const v = lerp(from, target, anim.progress);
    return domainMax > 0 ? (v / domainMax) * plotHeight : 0;
  };

  const summary =
    accessibilityLabel ??
    `${title} bar chart: ${data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}`;

  return (
    <ChartCardSurface height={MEDICAL_CARD_HEIGHT} style={[MEDICAL_CARD_STYLE, style]} testID={testID}>
      <MedicalHeader>
        <MedicalHeadline
          label={label}
          value={point ? point.value : (headline ?? total)}
          format={format}
          suffix={point ? pointSuffix : totalSuffix}
          fadeKey={String(activeIndex)}
          testID={testID}
        />
        {range !== undefined ? (
          <WeekRangePill
            label={range}
            onPrev={onPrevRange}
            onNext={onNextRange}
            testID={testID ? `${testID}-range` : undefined}
          />
        ) : null}
      </MedicalHeader>

      <View
        {...svgEase}
        style={{ flex: 1, minHeight: 0, marginLeft: -STEPS_BLEED, marginRight: -STEPS_BLEED }}
        onLayout={onLayout}
        testID={testID ? `${testID}-plot` : undefined}>
        {size && size.width > 0 && size.height > 0 ? (
          <>
            <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
              {bars.map((bar, i) => (
                <React.Fragment key={`track-${i}`}>
                  <Rect
                    x={bar.x}
                    y={plotTop}
                    width={bar.width}
                    height={plotHeight}
                    rx={STEPS_RADIUS}
                    ry={STEPS_RADIUS}
                    fill={palette.track}
                  />
                  <Rect
                    testID={testID ? `${testID}-outline-${i}` : undefined}
                    x={bar.x - HOVER_PADDING}
                    y={plotTop - HOVER_PADDING}
                    width={bar.width + HOVER_PADDING * 2}
                    height={plotHeight + HOVER_PADDING * 2}
                    rx={STEPS_RADIUS + HOVER_PADDING}
                    ry={STEPS_RADIUS + HOVER_PADDING}
                    fill="none"
                    stroke={palette.cursor}
                    strokeWidth={HOVER_STROKE}
                    opacity={activeIndex === i ? 1 : 0}
                  />
                </React.Fragment>
              ))}
              {bars.map((bar, i) => {
                const h = heightOf(i);
                if (h <= 0) return null;
                const r = Math.min(STEPS_RADIUS, bar.width / 2, h / 2);
                return (
                  <Rect
                    key={`bar-${i}`}
                    testID={testID ? `${testID}-bar-${i}` : undefined}
                    x={bar.x}
                    y={plotBottom - h}
                    width={bar.width}
                    height={h}
                    rx={r}
                    ry={r}
                    fill={activeIndex === i ? tone.activeColor : tone.color}
                  />
                );
              })}
            </Svg>
            {data.map((d, i) => (
              <View
                key={`label-${i}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  ...boundedLabelSlot(size.width, (i + 0.5) * band, 'middle', LABEL_SLOT),
                  top: plotBottom + LABEL_TOP,
                  alignItems: 'center',
                }}>
                <Text numberOfLines={1} style={[TICK_TYPE, { maxWidth: '100%', color: palette.textSecondary }]}>
                  {d.label}
                </Text>
              </View>
            ))}
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
    </ChartCardSurface>
  );
}
