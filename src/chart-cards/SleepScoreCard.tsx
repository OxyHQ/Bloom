import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { chartHueTone, resolveTone, type ChartHue } from './palette';
import { animatedPieAngles, pieSectorAngles, sectorIndexAt, sectorPath } from './polar-geometry';
import { PolarSurface, svgTransition } from './PolarSurface';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { TABULAR } from './primitives/ChartHeader';
import { FadeOnChange } from './primitives/FadeOnChange';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette, useChartTones } from './primitives/use-chart-palette';
import { useWebTransition } from './primitives/use-web-transition';
import { useChartProgress } from './use-chart-progress';

/** One sub-score: an arc on the ring and a row in the panel. */
export interface SleepMetric {
  /** Row label ("Duration"). */
  label: string;
  /** Row detail after the label ("7h 50m"). */
  detail: string;
  score: number;
  max: number;
  /** Arc / swatch colour; defaults to chart-5, chart-3, chart-6 (then the palette). */
  color?: string;
}

export interface SleepScoreCardProps {
  metrics: readonly SleepMetric[];
  /** Label over the verdict. Default `"Sleep score"`. */
  title?: string;
  /** The verdict under the title; defaults to Excellent (≥ 90) / Good (≥ 75) / Fair (≥ 50) / Poor. */
  scoreLabel?: string | ((total: number) => string);
  /** The period pill's label ("29 Jun - 5 Jul"); no pill when omitted. */
  range?: string;
  /** Card height. Default 330. */
  height?: number;
  /** The hovered / pressed arc. Controlled when set (`null` = none). */
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  /** Names the ring for assistive tech. Defaults to the total and each sub-score. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `h-[330px]`. */
export const SLEEP_CARD_HEIGHT = 330;
/** Default arc tokens: purple, pink, blue. */
const DEFAULT_HUES: readonly ChartHue[] = [5, 3, 6];
const INNER_RADIUS = 37;
const OUTER_RADIUS = 52;
/** `h-[104px]`, pulled 8px up into the card's gap (`-mt-2`). */
const CHART_HEIGHT = 104;
const PADDING_ANGLE = 4;
/** `cornerRadius={99}`, clamped to half the thickness. */
const ROUND = 99;

/** The verdict for a total. */
export function defaultSleepScoreLabel(total: number): string {
  if (total >= 90) return 'Excellent';
  if (total >= 75) return 'Good';
  if (total >= 50) return 'Fair';
  return 'Poor';
}

const CHEVRON_LEFT = 'M9 4L5.70711 7.29289C5.31658 7.68342 5.31658 8.31658 5.70711 8.70711L9 12';
const CHEVRON_RIGHT = 'M7 4L10.2929 7.29289C10.6834 7.68342 10.6834 8.31658 10.2929 8.70711L7 12';

function Chevron16({ d, color }: { d: string; color: string }) {
  return (
    <View style={{ width: 16, height: 16, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }} aria-hidden>
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Path d={d} stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/**
 * `SleepScoreCard`: a verdict, a segmented score ring and the sub-scores
 * behind it.
 *
 *   card     330 tall, radius 20, padding 10, background-secondary, gap 16
 *   header   padded 6 / 6 / 0: body-medium text-secondary label over the
 *            title-1-medium verdict; the static week pill (151 × 32, radius 10,
 *            1px button border, shadow-xs, 16px chevrons) on the right
 *   ring     104 tall, pulled 8 up: a full chart-track ring r 37 → 52 under one
 *            arc per sub-score from twelve o'clock clockwise, 4° apart, round
 *            ends; the unearned points stay as exposed track. The total sits in
 *            the middle (display-4-medium) and swaps to a hovered arc's score
 *            with the number fade; the other arcs drop to 70%
 *   panel    the rest, radius 10, background-inner, padded on the LEFT only;
 *            rows share its height, each padded 8 / 10-right, a separator-strong
 *            hairline under every row but the last — so the rules run to the
 *            panel's right edge and stay inset on the left. Swatch + body-regular
 *            "Label: detail" in text-secondary, body-medium `score/max` tabular
 *
 * The arcs grow in turn over 450ms on mount and morph on a data change.
 */
export function SleepScoreCard({
  metrics,
  title = 'Sleep score',
  scoreLabel,
  range,
  height = SLEEP_CARD_HEIGHT,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: SleepScoreCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const colors = useMemo(
    () =>
      metrics.map((m, i) => {
        if (m.color) return m.color;
        const hue = DEFAULT_HUES[i];
        return hue !== undefined ? chartHueTone(theme, hue).color : resolveTone(palettes, i).color;
      }),
    [metrics, theme, palettes],
  );
  const separator = useMemo(() => {
    return theme.colors.contrast50;
  }, [theme, palette.inner]);

  const [activeIndex, setActiveIndex] = useActiveIndex(metrics.length, controlledIndex, onActiveIndexChange);
  const hovering = activeIndex !== null;

  const total = metrics.reduce((sum, m) => sum + m.score, 0);
  const totalMax = metrics.reduce((sum, m) => sum + m.max, 0);
  const verdict = typeof scoreLabel === 'function' ? scoreLabel(total) : (scoreLabel ?? defaultSleepScoreLabel(total));
  const centerValue = hovering ? (metrics[activeIndex]?.score ?? total) : total;

  // Coloured arcs + a transparent filler for the unearned points.
  const values = useMemo(() => {
    const remainder = Math.max(0, totalMax - total);
    return [...metrics.map((m) => m.score), ...(remainder > 0 ? [remainder] : [])];
  }, [metrics, total, totalMax]);
  const anim = useChartProgress(values);
  const fade = useWebTransition('opacity', 200);

  const sectorsFor = (width: number) => {
    const cx = width / 2;
    const cy = CHART_HEIGHT / 2;
    const target = pieSectorAngles(values, 90, -270, PADDING_ANGLE);
    const prev = anim.from ? pieSectorAngles(anim.from, 90, -270, PADDING_ANGLE) : null;
    const arcs = animatedPieAngles(values, target, prev, anim.progress, PADDING_ANGLE).map((a) => ({
      ...a,
      innerRadius: INNER_RADIUS,
      outerRadius: OUTER_RADIUS,
    }));
    return { cx, cy, arcs };
  };

  const a11y =
    accessibilityLabel ??
    `${title}: ${total} of ${totalMax}, ${verdict}. ${metrics.map((m) => `${m.label} ${m.score} of ${m.max}`).join(', ')}`;

  return (
    <ChartCardSurface
      height={height}
      testID={testID}
      style={[{ borderRadius: 20, paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10 }, style]}>
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
          paddingLeft: 6,
          paddingRight: 6,
          paddingTop: 6,
        }}>
        <View style={{ minWidth: 0, flex: 1, flexDirection: 'column', gap: 2 }}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {title}
          </Text>
          <Text
            variant="title-1-medium"
            numberOfLines={1}
            testID={testID ? `${testID}-verdict` : undefined}
            style={{ color: palette.text }}>
            {verdict}
          </Text>
        </View>
        {range !== undefined ? (
          <View
            testID={testID ? `${testID}-range` : undefined}
            style={{
              width: 151,
              height: 32,
              flexShrink: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: palette.pill.border,
              backgroundColor: palette.pill.background,
              paddingTop: 4,
              paddingRight: 4,
              paddingBottom: 4,
              paddingLeft: 4,
              boxShadow: palette.pill.shadow,
            }}>
            <Chevron16 d={CHEVRON_LEFT} color={palette.textSecondary} />
            <Text variant="body-medium" numberOfLines={1} style={{ flex: 1, textAlign: 'center', color: palette.text }}>
              {range}
            </Text>
            <Chevron16 d={CHEVRON_RIGHT} color={palette.textSecondary} />
          </View>
        ) : null}
      </View>

      <View style={{ width: '100%', height: CHART_HEIGHT, flexShrink: 0, marginTop: -8 }}>
        <PolarSurface
          accessibilityLabel={a11y}
          testID={testID ? `${testID}-plot` : undefined}
          onPointerAt={(x, y, size) => {
            const { cx, cy, arcs } = sectorsFor(size.width);
            const index = sectorIndexAt(x, y, cx, cy, arcs);
            // The unearned filler is hoverable but focuses nothing.
            setActiveIndex(index !== null && index < metrics.length ? index : null);
          }}
          onPointerLeave={() => setActiveIndex(null)}>
          {({ width }) => {
            const { cx, cy, arcs } = sectorsFor(width);
            const track = sectorPath({
              cx,
              cy,
              innerRadius: INNER_RADIUS,
              outerRadius: OUTER_RADIUS,
              startAngle: 0,
              endAngle: 360,
            });
            return (
              <Svg width={width} height={CHART_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
                {track ? <Path d={track} fill={palette.track} stroke="none" /> : null}
                {arcs.slice(0, metrics.length).map((arc, i) => {
                  const d = sectorPath({ cx, cy, ...arc, cornerRadius: ROUND });
                  return d ? (
                    <Path
                      key={`arc-${i}`}
                      testID={testID ? `${testID}-arc-${i}` : undefined}
                      d={d}
                      fill={colors[i]!}
                      stroke="none"
                      opacity={hovering && activeIndex !== i ? 0.7 : 1}
                      {...svgTransition(fade)}
                    />
                  ) : null;
                })}
              </Svg>
            );
          }}
        </PolarSurface>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' }}>
          <FadeOnChange fadeKey={String(activeIndex)}>
            <Text
              variant="display-4-medium"
              testID={testID ? `${testID}-score` : undefined}
              style={[{ color: palette.text }, TABULAR]}>
              {centerValue}
            </Text>
          </FadeOnChange>
        </View>
      </View>

      <View
        testID={testID ? `${testID}-metrics` : undefined}
        style={{ width: '100%', flex: 1, flexDirection: 'column', borderRadius: 10, backgroundColor: palette.inner, paddingLeft: 10 }}>
        {metrics.map((metric, i) => (
          <View
            key={`${metric.label}-${i}`}
            testID={testID ? `${testID}-metric-${i}` : undefined}
            style={{
              width: '100%',
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 8,
              paddingBottom: 8,
              paddingRight: 10,
              borderBottomWidth: i < metrics.length - 1 ? 1 : 0,
              borderBottomColor: separator,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0 }}>
              <View style={{ width: 12, height: 12, flexShrink: 0, borderRadius: 4, backgroundColor: colors[i] }} />
              <Text variant="body-regular" numberOfLines={1} style={{ flexShrink: 1, color: palette.textSecondary }}>
                {metric.label}: {metric.detail}
              </Text>
            </View>
            <Text variant="body-medium" numberOfLines={1} style={[{ color: palette.text }, TABULAR]}>
              {metric.score}/{metric.max}
            </Text>
          </View>
        ))}
      </View>
    </ChartCardSurface>
  );
}
