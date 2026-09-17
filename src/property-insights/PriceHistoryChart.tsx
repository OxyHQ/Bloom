import React, { useCallback, useId, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { borderRadius } from '../styles/tokens';
import { niceTicks, type Point } from '../chart-cards/geometry';
import { CartesianPlot } from '../chart-cards/primitives/CartesianPlot';
import { ChartCardSurface } from '../chart-cards/primitives/ChartCardSurface';
import { PeriodChartHeader } from '../chart-cards/primitives/PeriodChartHeader';
import { useActiveIndex } from '../chart-cards/primitives/use-active-index';
import { useChartCardPalette } from '../chart-cards/primitives/use-chart-palette';
import { useChartRange } from '../chart-cards/primitives/use-chart-range';
import { lerp, useChartProgress } from '../chart-cards/use-chart-progress';
import { RiLineChartLine } from '../icons/remix';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PRICE_HISTORY_PLOT_HEIGHT } from './constants';
import { formatEuros, formatEurosCompact } from './shared';
import type { PriceEventKind, PriceHistoryChartProps, PriceHistoryEvent, PriceHistoryPoint } from './types';

/**
 * A home's asking price (or rent) over time, with what happened to it.
 *
 * Built on the chart-card primitives:
 *
 *   card      `ChartCardSurface` (auto height, gap 16)
 *   header    `PeriodChartHeader`: "Current price" and the price, swapping to
 *             the hovered point; the 1Y / 3Y / All `SegmentedControl`
 *   plot      200 tall, `CartesianPlot` with a 52 Y axis, 4 nice ticks around
 *             the prices (never from zero — a price moving 5% would draw flat)
 *   series    `step` (default: an asking price holds until it changes) or
 *             `line`; 2px primary stroke over a primary gradient 16% → 0%;
 *             reveals left to right over 450ms, snaps under reduced motion
 *   events    r 5 markers with a 2px card ring on their point, coloured by
 *             kind: listed primary, price-drop success, price-rise warning,
 *             rented / sold text-primary, delisted text-tertiary
 *   now       an r 4 primary dot on the last point with a pill callout above
 *             it ("Now · €385,000", caption-1-semibold, text-primary fill with
 *             the page colour as ink), kept inside the plot
 *   hover     1px dashed `4 4` cursor and an r 5 dot on the hovered point
 *   legend    the events as a wrapping list under the plot: an 8px dot, the
 *             label (body-2-medium) and the date (body-2-regular, secondary)
 *   empty     fewer than two points: a 200-tall panel with a chart glyph and
 *             "No price history yet"
 *
 * The plot's `role="img"` is named by a composed summary — "Price history,
 * 1Y: from €405,000 in Sep 2025 to €385,000 in Sep 2026. Listed, Sep 2025.
 * Price drop −5%, Mar 2026." — so the chart is readable without sight or a
 * pointer; the legend repeats the events as text.
 */

const Y_AXIS_WIDTH = 52;
const TICK_COUNT = 4;

export function priceEventColor(theme: Theme, kind: PriceEventKind): string {
  const c = theme.colors;
  switch (kind) {
    case 'listed':
      return c.primary;
    case 'price-drop':
      return c.success;
    case 'price-rise':
      return c.warning;
    case 'delisted':
      return c.textTertiary;
    default:
      return c.text;
  }
}

/** `M x0 y0 H x1 V y1 H x2 V y2 …` — each price holds until the next point. */
export function stepPath(points: readonly Point[]): string {
  if (points.length === 0) return '';
  const r = (n: number) => Math.round(n * 1000) / 1000;
  let d = `M${r(points[0]!.x)},${r(points[0]!.y)}`;
  for (let i = 1; i < points.length; i++) d += `H${r(points[i]!.x)}V${r(points[i]!.y)}`;
  return d;
}

function linePath(points: readonly Point[]): string {
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${r(p.x)},${r(p.y)}`).join('');
}

/** The Y domain: nice ticks around the prices, padded so the line never sits on the frame. */
export function priceDomain(values: readonly number[]): { ticks: number[]; domain: [number, number] } {
  if (values.length === 0) return { ticks: [0, 1], domain: [0, 1] };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.15, max * 0.02, 1);
  const ticks = niceTicks(Math.max(0, min - pad), max + pad, TICK_COUNT);
  return { ticks, domain: [ticks[0]!, ticks[ticks.length - 1]!] };
}

export function describePriceHistory(
  title: string,
  periodLabel: string | undefined,
  data: readonly PriceHistoryPoint[],
  events: readonly PriceHistoryEvent[],
  format: (value: number) => string,
): string {
  const first = data[0];
  const last = data[data.length - 1];
  const head = periodLabel ? `${title}, ${periodLabel}` : title;
  if (!first || !last) return head;
  const parts = [
    `${head}: from ${format(first.value)} in ${first.title ?? first.label} to ${format(last.value)} in ${last.title ?? last.label}.`,
    ...events.map((e) => `${e.label}, ${e.date ?? data[e.index]?.title ?? data[e.index]?.label ?? ''}.`),
  ];
  return parts.join(' ');
}

export function PriceHistoryChart({
  periods,
  data: dataProp,
  events: eventsProp,
  defaultPeriod,
  onPeriodChange,
  shape = 'step',
  title = 'Current price',
  currentPrice,
  format = formatEuros,
  formatAxisValue = formatEurosCompact,
  currentLabel = 'Now',
  emptyLabel = 'No price history yet',
  periodsLabel = 'Price history period',
  accessibilityLabel,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  style,
  testID,
}: PriceHistoryChartProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const { selected, selectedId, select } = useChartRange(periods, defaultPeriod, onPeriodChange);
  const data = selected?.data ?? dataProp ?? [];
  const events = (selected ? selected.events : eventsProp) ?? [];

  const [activeIndex, setActiveIndex] = useActiveIndex(data.length, controlledIndex, onActiveIndexChange);
  const selectPeriod = useCallback(
    (id: string) => {
      setActiveIndex(null);
      select(id);
    },
    [select, setActiveIndex],
  );

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const categories = useMemo(() => data.map((d) => d.label), [data]);
  const { ticks, domain } = useMemo(() => priceDomain(values), [values]);
  const anim = useChartProgress(values);

  const stroke = theme.colors.primary;
  const rawId = useId();
  const id = `bloom-price-history-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const last = data[data.length - 1];
  const resting = currentPrice ?? last?.value;
  const point = activeIndex !== null ? data[activeIndex] : undefined;
  const empty = data.length < 2;
  const summary =
    accessibilityLabel ??
    (empty
      ? `Price history: ${emptyLabel}`
      : describePriceHistory('Price history', selected?.label, data, events, format));

  return (
    <ChartCardSurface height="auto" style={style} testID={testID}>
      <PeriodChartHeader
        label={point ? (point.title ?? point.label) : title}
        value={point ? point.value : resting}
        format={format}
        hovering={point !== undefined}
        fadeKey={`${selectedId ?? ''}:${activeIndex}`}
        ranges={periods}
        rangeId={selectedId}
        onRangeChange={selectPeriod}
        rangesLabel={periodsLabel}
        testID={testID}
      />
      {empty ? (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={summary}
          testID={testID ? `${testID}-empty` : undefined}
          style={{ height: PRICE_HISTORY_PLOT_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <RiLineChartLine width={28} height={28} fill={palette.textTertiary} />
          <Text variant="body-medium" style={{ color: palette.textSecondary }}>
            {emptyLabel}
          </Text>
        </View>
      ) : (
        <View style={{ width: '100%', height: PRICE_HISTORY_PLOT_HEIGHT }}>
          <CartesianPlot
            categories={categories}
            yAxisWidth={Y_AXIS_WIDTH}
            yDomain={domain}
            yTicks={ticks}
            formatYTick={formatAxisValue}
            grid
            outside="keep"
            onActiveIndexChange={setActiveIndex}
            palette={palette}
            accessibilityLabel={summary}
            testID={testID ? `${testID}-plot` : undefined}
          >
            {({ size, box, x, y }) => {
              const points: Point[] = values.map((v, i) => ({
                x: x(i),
                y: y(anim.from && anim.from.length === values.length ? lerp(anim.from[i]!, v, anim.progress) : v),
              }));
              const revealWidth = anim.from ? size.width : box.left + (size.width - box.left) * anim.progress;
              const path = shape === 'line' ? linePath(points) : stepPath(points);
              const firstPoint = points[0]!;
              const lastPoint = points[points.length - 1]!;
              const area = `${path}L${lastPoint.x},${box.bottom}L${firstPoint.x},${box.bottom}Z`;
              const active = activeIndex !== null ? points[activeIndex] : undefined;
              const calloutText = `${currentLabel} · ${format(last!.value)}`;
              return (
                <>
                  <Svg width={size.width} height={size.height} pointerEvents="none">
                    <Defs>
                      <LinearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={stroke} stopOpacity={0.16} />
                        <Stop offset="1" stopColor={stroke} stopOpacity={0} />
                      </LinearGradient>
                      <ClipPath id={`${id}-reveal`}>
                        <Rect x={0} y={0} width={revealWidth} height={size.height} />
                      </ClipPath>
                    </Defs>
                    <G clipPath={`url(#${id}-reveal)`}>
                      <Path d={area} fill={`url(#${id}-fill)`} stroke="none" />
                      <Path d={path} fill="none" stroke={stroke} strokeWidth={2} testID={testID ? `${testID}-series` : undefined} />
                      {events.map((event, i) => {
                        const p = points[event.index];
                        if (!p) return null;
                        return (
                          <Circle
                            key={`${event.kind}-${event.index}-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r={5}
                            fill={priceEventColor(theme, event.kind)}
                            stroke={palette.surface}
                            strokeWidth={2}
                            testID={testID ? `${testID}-event-${i}` : undefined}
                          />
                        );
                      })}
                      <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={stroke} stroke={palette.surface} strokeWidth={2} />
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
                        <Circle cx={active.x} cy={active.y} r={5} fill={stroke} stroke={palette.surface} strokeWidth={3} />
                      </>
                    ) : null}
                  </Svg>
                  <View
                    importantForAccessibility="no-hide-descendants"
                    accessibilityElementsHidden
                    testID={testID ? `${testID}-callout` : undefined}
                    style={{
                      position: 'absolute',
                      // Right-aligned on the point, but never past the plot's right edge.
                      right: Math.max(0, size.width - lastPoint.x - 8),
                      top: Math.max(0, lastPoint.y - 34),
                      height: 24,
                      justifyContent: 'center',
                      paddingLeft: 8,
                      paddingRight: 8,
                      borderRadius: borderRadius.full,
                      backgroundColor: palette.text,
                      opacity: active ? 0 : 1,
                    }}
                  >
                    <Text
                      variant="caption-1-semibold"
                      numberOfLines={1}
                      style={{ color: theme.colors.background, fontVariant: ['tabular-nums'] }}
                    >
                      {calloutText}
                    </Text>
                  </View>
                </>
              );
            }}
          </CartesianPlot>
        </View>
      )}
      {!empty && events.length > 0 ? (
        <View
          role="list"
          style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, paddingBottom: 4 }}
          testID={testID ? `${testID}-legend` : undefined}
        >
          {events.map((event, i) => (
            <View key={`${event.kind}-${event.index}-${i}`} role="listitem" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: priceEventColor(theme, event.kind) }} />
              <Text variant="body-2-medium" style={{ color: palette.text }}>
                {event.label}
              </Text>
              <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
                {event.date ?? data[event.index]?.title ?? data[event.index]?.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ChartCardSurface>
  );
}
