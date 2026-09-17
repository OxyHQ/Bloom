import React, { useCallback, useId, useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { closedAreaPath } from '../chart-cards/LineChartCard';
import { curvePath, niceTicks, type Point } from '../chart-cards/geometry';
import { resolveTone } from '../chart-cards/palette';
import { CartesianPlot } from '../chart-cards/primitives/CartesianPlot';
import { ChartCardSurface } from '../chart-cards/primitives/ChartCardSurface';
import { compactNumber, describeDeltaRatio, formatNumber } from '../chart-cards/primitives/format';
import { PeriodChartHeader } from '../chart-cards/primitives/PeriodChartHeader';
import { PulsingDot } from '../chart-cards/primitives/PulsingDot';
import { useActiveIndex } from '../chart-cards/primitives/use-active-index';
import { useChartCardPalette, useChartTones } from '../chart-cards/primitives/use-chart-palette';
import { lerp, useChartProgress } from '../chart-cards/use-chart-progress';
import { RiAlbumLine } from '../icons/remix/RiAlbumLine';
import { Text } from '../typography';
import type { StreamsChartProps, StreamsEvent } from './types';

/**
 * `StreamsChart`: streams or listeners over time, switchable, with release
 * markers — built on the chart cards' own pieces.
 *
 *   card     `ChartCardSurface`, 360 tall, gap 24
 *   header   `PeriodChartHeader` — headline + delta chip, the metric
 *            `SegmentedControl` on the right (stacked under 640px)
 *   plot     `CartesianPlot` (Y axis 44, 4 nice ticks, dashed grid); the
 *            metric's area (gradient 30% → 0%) and a 2.5px monotone line in the
 *            metric's chart tone (the first metric blue, the second purple, …)
 *   markers  per event: a 1px dashed `3 3` rule in text-tertiary from the plot
 *            top to its point, a 3px ring dot on the line, and a label chip
 *            (album glyph 12 + `caption-1-medium`, radius 6, card-inner fill)
 *            pinned to the plot top, on the side of the rule with more room
 *   hover    the headline follows the point (label → point label, number → its
 *            value, chip hidden); on a marked point the caption names the release
 *
 * The series reveals left to right on mount and morphs on a metric switch;
 * snaps under reduced motion.
 */

const Y_AXIS_WIDTH = 44;
const TICK_COUNT = 4;
const CARD_GAP = 24;
const DEFAULT_HEIGHT = 360;

function describeEvents(events: readonly StreamsEvent[], labels: readonly string[]): string {
  if (events.length === 0) return '';
  return `; releases: ${events.map((e) => `${e.label} (${labels[e.index] ?? ''})`).join(', ')}`;
}

export function StreamsChart({
  metrics,
  metric: controlledMetric,
  defaultMetric,
  onMetricChange,
  events = [],
  metricsLabel = 'Chart metric',
  format = formatNumber,
  formatAxisValue = compactNumber,
  height = DEFAULT_HEIGHT,
  accessibilityLabel,
  style,
  testID,
}: StreamsChartProps) {
  const palette = useChartCardPalette();
  const tones = useChartTones();

  const [ownMetric, setOwnMetric] = useState(defaultMetric ?? metrics[0]?.id);
  const metricId = controlledMetric ?? ownMetric;
  const metricIndex = Math.max(
    0,
    metrics.findIndex((m) => m.id === metricId),
  );
  const current = metrics[metricIndex];
  const data = current?.data ?? [];

  // Streams blue (chart-6), listeners purple (chart-5), then the rest of the palette.
  const tone = useMemo(() => resolveTone(tones, metricIndex + 1), [tones, metricIndex]);

  const [activeIndex, setActiveIndex] = useActiveIndex(data.length, undefined, undefined);
  const selectMetric = useCallback(
    (id: string) => {
      setActiveIndex(null);
      if (controlledMetric === undefined) setOwnMetric(id);
      onMetricChange?.(id);
    },
    [controlledMetric, onMetricChange, setActiveIndex],
  );

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const categories = useMemo(() => data.map((d) => d.label), [data]);
  const { yDomain, yTicks } = useMemo(() => {
    const ticks = niceTicks(0, Math.max(0, ...values), TICK_COUNT);
    return { yDomain: [ticks[0] ?? 0, ticks[ticks.length - 1] ?? 0] as const, yTicks: ticks };
  }, [values]);
  const anim = useChartProgress(values);

  const hovering = activeIndex !== null;
  const point = hovering ? data[activeIndex] : undefined;
  const total = current?.headline ?? values.reduce((sum, v) => sum + v, 0);
  const hoveredEvent = hovering ? events.find((e) => e.index === activeIndex) : undefined;
  const visibleEvents = events.filter((e) => e.index >= 0 && e.index < data.length);

  const rawId = useId();
  const id = `bloom-streams-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const title = current?.label ?? '';

  return (
    <ChartCardSurface height={height} gap={CARD_GAP} style={style} testID={testID}>
      <PeriodChartHeader
        label={point ? point.label : title}
        value={point ? point.value : total}
        format={format}
        delta={current?.delta !== undefined ? describeDeltaRatio(current.delta) : undefined}
        hovering={hovering}
        fadeKey={`${metricId ?? ''}:${activeIndex}`}
        caption={hoveredEvent ? hoveredEvent.label : undefined}
        ranges={metrics.length > 1 ? metrics.map((m) => ({ id: m.id, label: m.label })) : undefined}
        rangeId={current?.id}
        onRangeChange={selectMetric}
        rangesLabel={metricsLabel}
        testID={testID}
      />
      <View style={{ width: '100%', flex: 1, minHeight: 0 }}>
        <CartesianPlot
          categories={categories}
          yAxisWidth={Y_AXIS_WIDTH}
          yDomain={yDomain}
          yTicks={yTicks}
          formatYTick={formatAxisValue}
          grid
          outside="keep"
          onActiveIndexChange={setActiveIndex}
          palette={palette}
          accessibilityLabel={
            accessibilityLabel ?? `${title} over time${describeEvents(visibleEvents, categories)}`
          }
          testID={testID ? `${testID}-plot` : undefined}
        >
          {({ size, box, x, y }) => {
            const points: Point[] = values.map((v, i) => ({
              x: x(i),
              y: y(anim.from && anim.from.length === values.length ? lerp(anim.from[i]!, v, anim.progress) : v),
            }));
            const revealWidth = anim.from ? size.width : box.left + (size.width - box.left) * anim.progress;
            const active = activeIndex !== null ? points[activeIndex] : undefined;
            return (
              <>
                <Svg width={size.width} height={size.height} pointerEvents="none">
                  <Defs>
                    <LinearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={tone.color} stopOpacity={0.3} />
                      <Stop offset="1" stopColor={tone.color} stopOpacity={0} />
                    </LinearGradient>
                    <ClipPath id={`${id}-reveal`}>
                      <Rect x={0} y={0} width={revealWidth} height={size.height} />
                    </ClipPath>
                  </Defs>
                  {visibleEvents.map((event) => {
                    const p = points[event.index];
                    if (!p) return null;
                    return (
                      <Line
                        key={`rule-${event.index}`}
                        testID={testID ? `${testID}-event-${event.index}-rule` : undefined}
                        x1={p.x}
                        y1={box.top}
                        x2={p.x}
                        y2={box.bottom}
                        stroke={palette.textTertiary}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                      />
                    );
                  })}
                  <G clipPath={`url(#${id}-reveal)`}>
                    <Path d={closedAreaPath(points, box.bottom, 'monotone')} fill={`url(#${id}-fill)`} stroke="none" />
                    <Path d={curvePath(points, 'monotone')} fill="none" stroke={tone.activeColor} strokeWidth={2.5} />
                    {visibleEvents.map((event) => {
                      const p = points[event.index];
                      return p ? (
                        <Circle
                          key={`dot-${event.index}`}
                          cx={p.x}
                          cy={p.y}
                          r={4}
                          fill={palette.surface}
                          stroke={tone.activeColor}
                          strokeWidth={2.5}
                        />
                      ) : null;
                    })}
                  </G>
                  {active ? (
                    <>
                      <Line
                        x1={active.x}
                        y1={box.top}
                        x2={active.x}
                        y2={box.bottom}
                        stroke={palette.cursor}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                      <PulsingDot cx={active.x} cy={active.y} color={tone.activeColor} ring={palette.surface} />
                    </>
                  ) : null}
                </Svg>
                {visibleEvents.map((event) => {
                  const p = points[event.index];
                  if (!p) return null;
                  // Label on whichever side of the rule has more room.
                  const leftSide = p.x > box.left + (box.right - box.left) / 2;
                  return (
                    <View
                      key={`label-${event.index}`}
                      pointerEvents="none"
                      testID={testID ? `${testID}-event-${event.index}` : undefined}
                      style={{
                        position: 'absolute',
                        top: box.top,
                        ...(leftSide ? { right: size.width - p.x + 6 } : { left: p.x + 6 }),
                        maxWidth: Math.max(80, (leftSide ? p.x - box.left : size.width - p.x) - 12),
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        borderRadius: 6,
                        paddingTop: 2,
                        paddingBottom: 2,
                        paddingLeft: 6,
                        paddingRight: 6,
                        backgroundColor: palette.inner,
                      }}
                    >
                      <RiAlbumLine width={12} height={12} fill={palette.textSecondary} />
                      <Text variant="caption-1-medium" numberOfLines={1} style={{ color: palette.text, flexShrink: 1 }}>
                        {event.label}
                      </Text>
                    </View>
                  );
                })}
              </>
            );
          }}
        </CartesianPlot>
      </View>
    </ChartCardSurface>
  );
}
