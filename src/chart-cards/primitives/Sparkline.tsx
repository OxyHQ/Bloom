import React, { useId, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useTheme } from '../../theme/use-theme';
import { areaBandPath, curvePath, type Point } from '../geometry';
import { chartHueTone } from '../palette';
import { useChartCardPalette } from './use-chart-palette';

/** Which colour the line takes: status tones for a trend, the chart blue for plain data. */
export type SparklineTone = 'accent' | 'positive' | 'negative' | 'neutral';

export interface SparklineProps {
  /** Values left to right. Fewer than two draws nothing. */
  data: readonly number[];
  /** Default 72. */
  width?: number;
  /** Default 28. */
  height?: number;
  /** Default `'accent'` (`chart-6-active`). */
  tone?: SparklineTone;
  /** Any colour; wins over `tone`. */
  color?: string;
  /** A soft gradient under the line (the line colour, 24% → 0%). Default `true`. */
  fill?: boolean;
  /** `curved` (monotone) or `sharp` (straight segments). Default `curved`. */
  shape?: 'curved' | 'sharp';
  /** Default 1.5. */
  strokeWidth?: number;
  /**
   * Names the sparkline as an image (`role="img"`). Without it the sparkline is
   * decorative and hidden from assistive tech — the usual case beside a value
   * and delta that already say the same thing.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The sparkline's points in a `width × height` box, inset so the stroke is never clipped. */
export function sparklinePoints(
  data: readonly number[],
  width: number,
  height: number,
  inset: number,
): Point[] {
  if (data.length < 2) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min;
  const usableW = Math.max(0, width - inset * 2);
  const usableH = Math.max(0, height - inset * 2);
  return data.map((v, i) => ({
    x: inset + (usableW * i) / (data.length - 1),
    // A flat series sits on the middle line rather than the floor.
    y: span === 0 ? height / 2 : inset + usableH * (1 - (v - min) / span),
  }));
}

/**
 * `Sparkline`: a tiny axis-less trend line for a KPI tile or a table cell.
 * The same monotone curve the chart cards draw, scaled to its own min–max.
 */
export function Sparkline({
  data,
  width = 72,
  height = 28,
  tone = 'accent',
  color,
  fill = true,
  shape = 'curved',
  strokeWidth = 1.5,
  accessibilityLabel,
  style,
  testID,
}: SparklineProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const stroke = useMemo(() => {
    if (color) return color;
    switch (tone) {
      case 'positive':
        return palette.positive.foreground;
      case 'negative':
        return palette.negative.foreground;
      case 'neutral':
        return palette.textTertiary;
      default:
        return chartHueTone(theme, 6).activeColor;
    }
  }, [color, tone, palette, theme]);

  const rawId = useId();
  const id = `bloom-sparkline-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const points = useMemo(
    () => sparklinePoints(data, width, height, strokeWidth + 1),
    [data, width, height, strokeWidth],
  );
  const curve = shape === 'sharp' ? 'linear' : 'monotone';
  const named = Boolean(accessibilityLabel);

  return (
    <View
      testID={testID}
      style={[{ width, height }, style]}
      {...(named
        ? { role: 'img' as const, accessibilityLabel }
        : {
            'aria-hidden': true,
            accessibilityElementsHidden: true,
            importantForAccessibility: 'no-hide-descendants' as const,
          })}
    >
      {points.length > 1 ? (
        <Svg width={width} height={height} pointerEvents="none">
          {fill ? (
            <Defs>
              <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={stroke} stopOpacity={0.24} />
                <Stop offset="1" stopColor={stroke} stopOpacity={0} />
              </LinearGradient>
            </Defs>
          ) : null}
          {fill ? (
            <Path
              d={areaBandPath(
                points,
                points.map((p) => ({ x: p.x, y: height })),
                curve,
              )}
              fill={`url(#${id})`}
              stroke="none"
            />
          ) : null}
          <Path
            d={curvePath(points, curve)}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}
