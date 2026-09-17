import React, { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import {
  ChartCardFrame,
  ChartPlot,
  chartAccessibilityLabel,
  groupThousands,
  useActiveIndex,
  useChartCardPalette,
} from './ChartCard';
import { bandSize, barPositions, topRoundedBarPath, yScale } from './geometry';
import { ordersSeriesTone } from './palette';
import type { OrdersChartCardProps } from './types';
import { lerp, useChartProgress } from './use-chart-progress';

/**
 * `OrdersChartCard`: a year of orders as paired bars, last year beside
 * this year in every month.
 *
 * The recharts `BarChart` it draws, rebuilt in react-native-svg on recharts'
 * own geometry (`geometry.ts`):
 *
 *   cursor     the hovered month's whole band, chart-track at 50%, inset 0.5px
 *              top and bottom
 *   bars       band scale, 28% category gap, 3px between the pair, width
 *              rounded to whole pixels (7px at 528 wide), radius 4 top corners
 *              clamped to half the bar; last year chart-neutral, this year
 *              chart-9-active; they grow from the base over 450ms
 *   Y axis     40 wide, 4 ticks, `1.8k` formatter, 12px text-tertiary
 *   X axis     13px text-tertiary, `preserveStartEnd`
 */

const Y_AXIS_WIDTH = 40;
const BAR_CATEGORY_GAP = 0.28;
const BAR_GAP = 3;
const BAR_RADIUS = 4;

/** Formats counts: `2.7k`, `3k`, or the number under a thousand. */
const defaultFormatAxisValue = (value: number) =>
  value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : `${value}`;

export function OrdersChartCard({
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
}: OrdersChartCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const tone = useMemo(() => ordersSeriesTone(theme), [theme]);
  // This year's bars are filled with the `-active` step itself.
  const fill = activeColor ?? color ?? tone.activeColor;
  const comparisonFill = previousColor ?? palette.neutralSeries;
  const [activeIndex, setActiveIndex] = useActiveIndex(data.length, controlledIndex, onActiveIndexChange);

  const current = useMemo(() => data.map((d) => d.current), [data]);
  const previous = useMemo(() => data.map((d) => d.previous), [data]);
  const currentAnim = useChartProgress(current);
  const previousAnim = useChartProgress(previous);

  const label =
    accessibilityLabel ?? chartAccessibilityLabel(frame.title ?? 'Orders', frame.currentLabel, frame.previousLabel);

  return (
    <ChartCardFrame
      {...frame}
      data={data}
      defaultTitle="Orders"
      defaultFormatValue={groupThousands}
      seriesColor={fill}
      comparisonColor={comparisonFill}
      activeIndex={activeIndex}
      palette={palette}
      testID={testID}
    >
      <ChartPlot
        data={data}
        yAxisWidth={Y_AXIS_WIDTH}
        formatAxisValue={formatAxisValue}
        xScale="band"
        onActiveIndexChange={setActiveIndex}
        palette={palette}
        accessibilityLabel={label}
        testID={testID ? `${testID}-plot` : undefined}
      >
        {({ size, box, domainMax }) => {
          const count = data.length;
          const band = bandSize(count, box);
          const [previousBar, currentBar] = barPositions(band, 2, BAR_CATEGORY_GAP, BAR_GAP);
          const bar = (
            values: readonly number[],
            anim: typeof currentAnim,
            position: { offset: number; size: number },
            i: number,
          ) => {
            const v = values[i]!;
            // Mount: grow from the base. Data change: morph from the old height.
            const shown = anim.from ? lerp(anim.from[i]!, v, anim.progress) : v * anim.progress;
            const top = yScale(shown, domainMax, box);
            return topRoundedBarPath(box.left + i * band + position.offset, top, position.size, box.bottom - top, BAR_RADIUS);
          };

          return (
            <Svg width={size.width} height={size.height} pointerEvents="none">
              {activeIndex !== null ? (
                <Rect
                  x={box.left + activeIndex * band}
                  y={box.top + 0.5}
                  width={band}
                  height={Math.max(0, box.bottom - box.top - 1)}
                  fill={palette.track}
                  opacity={0.5}
                />
              ) : null}
              {previousBar && currentBar
                ? data.map((d, i) => (
                    <React.Fragment key={`${i}:${d.label}`}>
                      <Path d={bar(previous, previousAnim, previousBar, i)} fill={comparisonFill} />
                      <Path d={bar(current, currentAnim, currentBar, i)} fill={fill} />
                    </React.Fragment>
                  ))
                : null}
            </Svg>
          );
        }}
      </ChartPlot>
    </ChartCardFrame>
  );
}
