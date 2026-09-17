import React, { useId, useMemo } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import {
  ChartCardFrame,
  ChartPlot,
  chartAccessibilityLabel,
  groupThousands,
  useActiveIndex,
  useChartCardPalette,
} from './ChartCard';
import { monotoneXAreaPath, monotoneXPath, pointX, yScale } from './geometry';
import { revenueSeriesTone } from './palette';
import type { RevenueChartCardProps } from './types';
import { lerp, useChartProgress } from './use-chart-progress';

/**
 * `RevenueChartCard`: a year of revenue against the year before.
 *
 * The recharts `ComposedChart` it draws is rebuilt in react-native-svg on the
 * geometry recharts computes (`geometry.ts`), layer for layer:
 *
 *   cursor     1px dashed `4 4` rule, chart-cursor, plot top to bottom
 *   previous   monotone line, chart-neutral, 2px, dashed `5 5`
 *   area       monotone area, gradient chart-2 at 35% → 0%
 *   current    monotone line, chart-2-active, 2.5px
 *   active dot r 7 at 25% under r 4 with a 2px card-coloured ring
 *   Y axis     44 wide, 4 ticks, `$16k` formatter, 12px text-tertiary
 *   X axis     13px text-tertiary, `preserveStartEnd`
 *
 * Hovering (web) or pressing and scrubbing (native) a month swaps the headline
 * for that month and its year-earlier figure.
 */

const Y_AXIS_WIDTH = 44;

const defaultFormatValue = (value: number) => `$${groupThousands(value)}`;
/** `formatK`: `$16k`, or `$950` under a thousand. */
const defaultFormatAxisValue = (value: number) =>
  value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`;

export function RevenueChartCard({
  data,
  formatAxisValue = defaultFormatAxisValue,
  color,
  activeColor,
  previousColor,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  testID,
  ...frame
}: RevenueChartCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const tone = useMemo(() => revenueSeriesTone(theme), [theme]);
  const fill = color ?? tone.color;
  const stroke = activeColor ?? color ?? tone.activeColor;
  const comparisonStroke = previousColor ?? palette.neutralSeries;
  const [activeIndex, setActiveIndex] = useActiveIndex(data.length, controlledIndex, onActiveIndexChange);

  // `useId` yields `«r0»` / `:r0:`, which a CSS `url(#…)` cannot reference.
  const rawId = useId();
  const id = `bloom-revenue-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const current = useMemo(() => data.map((d) => d.current), [data]);
  const previous = useMemo(() => data.map((d) => d.previous), [data]);
  const currentAnim = useChartProgress(current);
  const previousAnim = useChartProgress(previous);

  const label =
    accessibilityLabel ?? chartAccessibilityLabel(frame.title ?? 'Revenue', frame.currentLabel, frame.previousLabel);

  return (
    <ChartCardFrame
      {...frame}
      data={data}
      defaultTitle="Revenue"
      defaultFormatValue={defaultFormatValue}
      seriesColor={stroke}
      comparisonColor={comparisonStroke}
      activeIndex={activeIndex}
      palette={palette}
      testID={testID}
    >
      <ChartPlot
        data={data}
        yAxisWidth={Y_AXIS_WIDTH}
        formatAxisValue={formatAxisValue}
        xScale="point"
        onActiveIndexChange={setActiveIndex}
        palette={palette}
        accessibilityLabel={label}
        testID={testID ? `${testID}-plot` : undefined}
      >
        {({ size, box, domainMax }) => {
          const count = data.length;
          const at = (values: readonly number[], anim: typeof currentAnim) =>
            values.map((v, i) => ({
              x: pointX(i, count, box),
              y: yScale(anim.from ? lerp(anim.from[i]!, v, anim.progress) : v, domainMax, box),
            }));
          const currentPoints = at(current, currentAnim);
          const previousPoints = at(previous, previousAnim);
          const revealWidth = (anim: typeof currentAnim) =>
            anim.from ? size.width : box.left + (size.width - box.left) * anim.progress;
          const activePoint = activeIndex !== null ? currentPoints[activeIndex] : undefined;

          return (
            <Svg width={size.width} height={size.height} pointerEvents="none">
              <Defs>
                <LinearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={fill} stopOpacity={0.35} />
                  <Stop offset="1" stopColor={fill} stopOpacity={0} />
                </LinearGradient>
                <ClipPath id={`${id}-reveal-current`}>
                  <Rect x={0} y={0} width={revealWidth(currentAnim)} height={size.height} />
                </ClipPath>
                <ClipPath id={`${id}-reveal-previous`}>
                  <Rect x={0} y={0} width={revealWidth(previousAnim)} height={size.height} />
                </ClipPath>
              </Defs>
              {activePoint ? (
                <Line
                  x1={activePoint.x}
                  y1={box.top}
                  x2={activePoint.x}
                  y2={box.bottom}
                  stroke={palette.cursor}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ) : null}
              <G clipPath={`url(#${id}-reveal-previous)`}>
                <Path
                  d={monotoneXPath(previousPoints)}
                  fill="none"
                  stroke={comparisonStroke}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </G>
              <G clipPath={`url(#${id}-reveal-current)`}>
                <Path d={monotoneXAreaPath(currentPoints, box.bottom)} fill={`url(#${id}-fill)`} stroke="none" />
                <Path d={monotoneXPath(currentPoints)} fill="none" stroke={stroke} strokeWidth={2.5} />
              </G>
              {activePoint ? (
                <G>
                  <Circle cx={activePoint.x} cy={activePoint.y} r={7} fill={stroke} opacity={0.25} />
                  <Circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r={4}
                    fill={stroke}
                    stroke={palette.surface}
                    strokeWidth={2}
                  />
                </G>
              ) : null}
            </Svg>
          );
        }}
      </ChartPlot>
    </ChartCardFrame>
  );
}
