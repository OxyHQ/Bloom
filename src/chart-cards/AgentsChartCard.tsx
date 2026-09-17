import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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

import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { purpleStop } from './ai-profile-hues';
import { WeekRangePill } from './medical-parts';
import { TABULAR } from './primitives/ChartHeader';
import { FadeOnChange } from './primitives/FadeOnChange';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette } from './primitives/use-chart-palette';
import { useCountUp } from './use-count-up';

/**
 * A month of daily agent runs as plain rounded bars, with a month switcher
 * pill and a count-up headline that follows the hovered day.
 *
 *   card     radius 20, background-secondary, padding 12 / 10, gap 10
 *   header   6px further in, 4 from the top: label body-medium text-secondary,
 *            2px, `"32 agents"` title-2-medium text-primary tabular
 *   pill     `WeekRangePill` 128 wide, absolutely 16 from the top and right
 *   track    206 tall (`trackHeight`), one flex column per day, 7px apart
 *   bars     radius 4; `value / max × maxBarHeight` (158) tall, chart-agents-bar
 *            (light purple-300, dark purple-500), hovered -active (400 / 600);
 *            a zero day collapses to a 4px chart-track stub (chart-cursor
 *            hovered). Background eases over 300ms `ease` on web
 *   rise     every bar grows from its base over 360ms
 *            `cubic-bezier(0.22, 1, 0.36, 1)`, staggered 22ms left to right;
 *            replays when the data or the range label changes
 *   axis     start / end labels, caption-2-medium text-tertiary, 6px in
 *
 * Hovering a day column (web) or pressing and scrubbing (native) swaps the label
 * to the day and rolls the number to its agents; the gaps between columns keep
 * the last day, leaving the track clears. Reduced motion drops the rise.
 */

export interface AgentsPoint {
  /** The day as the hovered header names it, e.g. `"Dec 12"`. */
  label: string;
  /** Agents that day. Zero draws the 4px idle stub. */
  value: number;
}

export interface AgentsChartCardProps {
  /** One bar per day, left to right. */
  data: readonly AgentsPoint[];
  /** Header label at rest. Default `"Agents"`. */
  title?: string;
  /** Headline at rest — the period's agent count (e.g. 32). */
  headline: number;
  /** Formats the headline (resting and hovered). Default `"32 agents"`. */
  format?: (value: number) => string;
  /** Header label for a hovered day. Default: the point's `label`. */
  getPointTitle?: (point: AgentsPoint, index: number) => string;
  /** The month pill's label ("December"). No pill when omitted. */
  range?: string;
  /** With either, the pill's chevrons are buttons and its label rolls. */
  onPrevRange?: () => void;
  onNextRange?: () => void;
  /** Accessible names of the pill's chevrons. */
  prevRangeLabel?: string;
  nextRangeLabel?: string;
  /** Axis labels under the first and last bars. Default `"Jun 14"` / `"Today"` — pass your own. */
  startLabel?: string;
  endLabel?: string;
  /** The bars' track height. Default 206. */
  trackHeight?: number;
  /** Height of the tallest bar (`max`). Default 158. */
  maxBarHeight?: number;
  /** The value `maxBarHeight` stands for. Defaults to the largest value. */
  max?: number;
  /** Bar colour and its hover step. Default chart-agents-bar (purple). */
  color?: string;
  activeColor?: string;
  /** The hovered day. Controlled when set (`null` = none). */
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  /** Names the chart for assistive tech. Defaults to a summary. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const AGENTS_TRACK_HEIGHT = 206;
export const AGENTS_MAX_BAR = 158;
/** `AGENTS_ZERO_BAR`. */
export const AGENTS_ZERO_BAR = 4;
export const AGENTS_BAR_GAP = 7;
const BAR_RADIUS = 4;
const RISE_MS = 360;
const RISE_STAGGER_MS = 22;
const RISE_EASE = Easing.bezier(0.22, 1, 0.36, 1);
const IS_WEB = Platform.OS === 'web';

const defaultFormat = (value: number) => `${value} agents`;

/** Bar heights for the data: `value / max × maxBarHeight`, a zero day the stub. */
export function agentsBarHeights(
  values: readonly number[],
  maxBarHeight = AGENTS_MAX_BAR,
  max?: number,
): number[] {
  const top = max ?? values.reduce((m, v) => Math.max(m, v), 0);
  return values.map((v) => (v <= 0 || top <= 0 ? AGENTS_ZERO_BAR : (v / top) * maxBarHeight));
}

/** Which column is under `x` in a `width`-wide track; `undefined` in a gap. */
export function agentsColumnAt(x: number, width: number, count: number, gap = AGENTS_BAR_GAP): number | undefined {
  if (count <= 0 || width <= 0) return undefined;
  const column = (width - gap * (count - 1)) / count;
  const pitch = column + gap;
  const index = Math.floor(x / pitch);
  if (index < 0 || index >= count) return undefined;
  return x - index * pitch <= column ? index : undefined;
}

export function AgentsChartCard({
  data,
  title = 'Agents',
  headline,
  format = defaultFormat,
  getPointTitle,
  range,
  onPrevRange,
  onNextRange,
  prevRangeLabel,
  nextRangeLabel,
  startLabel = 'Jun 14',
  endLabel = 'Today',
  trackHeight = AGENTS_TRACK_HEIGHT,
  maxBarHeight = AGENTS_MAX_BAR,
  max,
  color,
  activeColor,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: AgentsChartCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useActiveIndex(data.length, controlledIndex, onActiveIndexChange);
  const [width, setWidth] = useState(0);

  const tone = useMemo(() => {
    const light = !theme.isDark;
    return {
      bar: color ?? purpleStop(theme, light ? 300 : 500),
      active: activeColor ?? purpleStop(theme, light ? 400 : 600),
      stub: palette.track,
      stubActive: palette.cursor,
    };
  }, [theme, color, activeColor, palette.track, palette.cursor]);

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const heights = useMemo(() => agentsBarHeights(values, maxBarHeight, max), [values, maxBarHeight, max]);
  const resting = headline;
  const hovering = activeIndex !== null;
  const point = hovering ? data[activeIndex]! : null;
  const target = point ? Math.round(point.value) : resting;
  const display = useCountUp(target);
  const label = point ? (getPointTitle?.(point, activeIndex!) ?? point.label) : title;

  // The rise clock: one timeline, each bar reads its own staggered window.
  const riseKey = `${range ?? ''}|${values.join(',')}`;
  const total = Math.max(0, data.length - 1) * RISE_STAGGER_MS + RISE_MS;
  const rise = useRef(new Animated.Value(reducedMotion ? total : 0)).current;
  useEffect(() => {
    if (reducedMotion) {
      rise.setValue(total);
      return;
    }
    rise.setValue(0);
    const animation = Animated.timing(rise, {
      toValue: total,
      duration: total,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- replays on the data / range only
  }, [riseKey, reducedMotion]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    setWidth((prev) => (prev === w ? prev : w));
  }, []);

  const track = (x: number) => {
    const index = agentsColumnAt(x, width, data.length);
    if (index !== undefined) setActiveIndex(index);
  };
  const pointerHandlers: ViewProps = {
    onPointerMove: (e: PointerEvent) => track(e.nativeEvent.offsetX),
    onPointerLeave: () => setActiveIndex(null),
    ...(IS_WEB
      ? null
      : {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderTerminationRequest: () => false,
          onResponderGrant: (e: GestureResponderEvent) => track(e.nativeEvent.locationX),
          onResponderMove: (e: GestureResponderEvent) => track(e.nativeEvent.locationX),
          onResponderRelease: () => setActiveIndex(null),
          onResponderTerminate: () => setActiveIndex(null),
        }),
  };

  const ease: WebCssStyle | null =
    IS_WEB && !reducedMotion
      ? { transitionProperty: 'height, background-color', transitionDuration: '300ms', transitionTimingFunction: 'ease' }
      : null;

  const summary =
    accessibilityLabel ?? `${title} bar chart: ${data.map((d) => `${d.label} ${format(Math.round(d.value))}`).join(', ')}`;

  return (
    <View
      testID={testID}
      style={[
        {
          position: 'relative',
          width: '100%',
          minWidth: 0,
          flexDirection: 'column',
          gap: 10,
          borderRadius: 20,
          backgroundColor: palette.surface,
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 10,
          paddingRight: 10,
        },
        style,
      ]}>
      <View style={{ width: '100%', flexDirection: 'row', paddingLeft: 6, paddingRight: 6, paddingTop: 4 }}>
        <View style={{ minWidth: 0, flex: 1, flexDirection: 'column', gap: 2 }}>
          <Text variant="body-medium" numberOfLines={1} style={{ width: '100%', color: palette.textSecondary }}>
            {label}
          </Text>
          <FadeOnChange fadeKey={`${range ?? ''}:${activeIndex}`}>
            <Text
              variant="title-2-medium"
              numberOfLines={1}
              testID={testID ? `${testID}-headline` : undefined}
              style={[{ color: palette.text }, TABULAR]}>
              {format(display)}
            </Text>
          </FadeOnChange>
        </View>
      </View>

      {range !== undefined ? (
        <WeekRangePill
          label={range}
          onPrev={onPrevRange}
          onNext={onNextRange}
          prevLabel={prevRangeLabel}
          nextLabel={nextRangeLabel}
          width={128}
          style={{ position: 'absolute', top: 16, right: 16 }}
          testID={testID ? `${testID}-range` : undefined}
        />
      ) : null}

      <View
        onLayout={onLayout}
        testID={testID ? `${testID}-plot` : undefined}
        style={{ width: '100%', height: trackHeight, flexDirection: 'row', alignItems: 'flex-end', gap: AGENTS_BAR_GAP }}>
        {heights.map((h, i) => {
          const zero = (values[i] ?? 0) <= 0;
          const on = activeIndex === i;
          const delay = i * RISE_STAGGER_MS;
          const scale = rise.interpolate({
            inputRange: [delay, delay + RISE_MS],
            outputRange: [0, 1],
            easing: RISE_EASE,
            extrapolate: 'clamp',
          });
          return (
            <View
              key={`${riseKey}:${i}`}
              style={{ flex: 1, flexBasis: 0, minWidth: 0, height: '100%', justifyContent: 'flex-end' }}>
              <Animated.View
                testID={testID ? `${testID}-bar-${i}` : undefined}
                style={[
                  {
                    width: '100%',
                    height: h,
                    borderRadius: BAR_RADIUS,
                    backgroundColor: zero ? (on ? tone.stubActive : tone.stub) : on ? tone.active : tone.bar,
                    transformOrigin: 'bottom',
                    transform: [{ scaleY: scale }],
                  },
                  ease,
                ]}
              />
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
      </View>

      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingLeft: 6,
          paddingRight: 6,
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
