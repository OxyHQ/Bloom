import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PointerEvent,
  type TextStyle,
  type ViewProps,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { Text } from '../../typography';
import { TYPE_SCALE } from '../../typography/scale';
import {
  TICK_SIZE,
  X_TICK_MARGIN,
  Y_TICK_MARGIN,
  bandIndex,
  bandSize,
  inPlot,
  nearestPointIndex,
  placeTicks,
  plotBox,
  pointX,
  scaleY,
  type PlotBox,
} from '../geometry';
import type { ChartCardPalette } from '../palette';

export interface ChartSize {
  width: number;
  height: number;
}

/** What the plot hands its SVG layer once it has been measured. */
export interface CartesianPlotRenderArgs {
  size: ChartSize;
  /** The plot rectangle inside the axes (recharts' `offset`). */
  box: PlotBox;
  domain: readonly [number, number];
  /** X centre of category `index`. */
  x: (index: number) => number;
  /** Pixel Y of a data value. */
  y: (value: number) => number;
}

export interface CartesianPlotProps {
  /** X axis labels, one per category, left to right. */
  categories: readonly string[];
  /**
   * `point` (line / area: first category on the left edge, last on the right)
   * or `band` (bars: each category owns an equal slot, label centred in it).
   */
  xScale?: 'point' | 'band';
  /** recharts `YAxis width` (44 for most cards). */
  yAxisWidth: number;
  /** `[min, max]` in data units (`niceTicks` → first / last tick for an auto domain). */
  yDomain: readonly [number, number];
  /** Y tick values, bottom to top. */
  yTicks: readonly number[];
  formatYTick: (value: number) => string;
  /** Horizontal dashed `4 4` grid at every Y tick in `chart-track` (recharts `CartesianGrid vertical={false}`). */
  grid?: boolean;
  /**
   * What the pointer does over the axes, outside the plot rectangle. `'keep'`
   * leaves the last category active (a handler that only SETS on
   * `isTooltipActive`); `'clear'` drops it (one that also clears).
   */
  outside?: 'keep' | 'clear';
  onActiveIndexChange: (index: number | null) => void;
  palette: ChartCardPalette;
  /** Names the plot (`role="img"`) — a summary a screen reader can announce. */
  accessibilityLabel: string;
  testID?: string;
  /** The SVG layer, drawn over the grid and under the axis labels. */
  children: (args: CartesianPlotRenderArgs) => React.ReactNode;
}

/** recharts measures a 12px tick as 18px tall (the body's 1.5 line-height). */
const Y_TICK_EXTENT = 18;
/** Where the Text box starts relative to recharts' `<text y dy>`, for Inter. */
const X_LABEL_TOP_OFFSET = TICK_SIZE + X_TICK_MARGIN - 4.5;
const Y_LABEL_TOP_OFFSET = -8;
/** Wide enough that a label never wraps; the label centres (or right-aligns) inside it. */
const LABEL_SLOT = 160;

/** `tick={{ fontSize: 13 }}` on the X axis. */
const X_TICK_TYPE: TextStyle = { ...TYPE_SCALE['body-2-regular'] };
/** `tick={{ fontSize: 12 }}` — a bare 12px, so the caption step without its 0.15 tracking. */
const Y_TICK_TYPE: TextStyle = { ...TYPE_SCALE['caption-1-regular'], letterSpacing: 0 };

/**
 * A recharts cartesian chart surface in React Native: measures itself
 * (`ResponsiveContainer`), lays out the plot box, draws the dashed grid, the
 * culled Y and X tick labels as Bloom `Text` (so they take the sans font on
 * both platforms), and tracks the category under the pointer.
 *
 * Fills its parent absolutely — put it in a `View` with a height (`flex: 1`
 * in a fixed-height card, or a fixed height). Nothing renders until the first
 * layout.
 *
 * Tracking: web hover arrives as pointer events; on native a finger presses
 * and scrubs through the responder, and letting go clears the category. An
 * iPad trackpad hovers like the web. testIDs: `<testID>` on the measured box,
 * `<testID>-surface` on the `role="img"` hit surface.
 */
export function CartesianPlot({
  categories,
  xScale = 'point',
  yAxisWidth,
  yDomain,
  yTicks,
  formatYTick,
  grid = false,
  outside = 'keep',
  onActiveIndexChange,
  palette,
  accessibilityLabel,
  testID,
  children,
}: CartesianPlotProps) {
  const [size, setSize] = useState<ChartSize | null>(null);
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const count = categories.length;
  const box = useMemo(() => (size ? plotBox(size.width, size.height, yAxisWidth) : null), [size, yAxisWidth]);
  const [domainMin, domainMax] = yDomain;

  const labelX = useCallback(
    (index: number, b: PlotBox) =>
      xScale === 'band' ? b.left + (index + 0.5) * bandSize(count, b) : pointX(index, count, b),
    [xScale, count],
  );

  const placedY = useMemo(() => {
    if (!box || !size) return [];
    const placed = placeTicks(
      yTicks.map((v) => ({ coordinate: scaleY(v, [domainMin, domainMax], box), size: Y_TICK_EXTENT })),
      size.height,
      'preserveEnd',
    );
    return placed.map((p) => ({ value: yTicks[p.index]!, y: p.tickCoord }));
  }, [box, size, yTicks, domainMin, domainMax]);

  const placedX = useMemo(() => {
    if (!box || !size) return null;
    const measured = categories.every((label, i) => labelWidths[`${i}:${label}`] !== undefined);
    if (!measured) return null;
    return placeTicks(
      categories.map((label, i) => ({ coordinate: labelX(i, box), size: labelWidths[`${i}:${label}`]! })),
      size.width,
      'preserveStartEnd',
    );
  }, [box, size, categories, labelWidths, labelX]);

  const track = useCallback(
    (px: number, py: number) => {
      if (!box || count === 0) return;
      if (inPlot(px, py, box)) {
        onActiveIndexChange(xScale === 'band' ? bandIndex(px, count, box) : nearestPointIndex(px, count, box));
      } else if (outside === 'clear') {
        onActiveIndexChange(null);
      }
    },
    [box, count, xScale, outside, onActiveIndexChange],
  );

  const pointerHandlers: ViewProps = {
    onPointerMove: (e: PointerEvent) => track(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
    onPointerLeave: () => onActiveIndexChange(null),
    ...(Platform.OS === 'web'
      ? null
      : {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderTerminationRequest: () => false,
          onResponderGrant: (e: GestureResponderEvent) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderMove: (e: GestureResponderEvent) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderRelease: () => onActiveIndexChange(null),
          onResponderTerminate: () => onActiveIndexChange(null),
        }),
  };

  const tickColor = { color: palette.textTertiary };

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} testID={testID}>
      {size && box ? (
        <>
          {grid ? (
            <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
              {yTicks.map((v) => {
                const gy = scaleY(v, [domainMin, domainMax], box);
                return (
                  <Line
                    key={`grid-${v}`}
                    x1={box.left}
                    y1={gy}
                    x2={box.right}
                    y2={gy}
                    stroke={palette.track}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                );
              })}
            </Svg>
          ) : null}
          {/* Its own positioned layer: an in-flow SVG would paint UNDER the absolutely positioned grid. */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {children({
              size,
              box,
              domain: yDomain,
              x: (i) => labelX(i, box),
              y: (v) => scaleY(v, [domainMin, domainMax], box),
            })}
          </View>
          {placedY.map((tick) => (
            <View
              key={`y-${tick.value}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: box.left - TICK_SIZE - Y_TICK_MARGIN - LABEL_SLOT,
                top: tick.y + Y_LABEL_TOP_OFFSET,
                width: LABEL_SLOT,
                alignItems: 'flex-end',
              }}>
              <Text numberOfLines={1} style={[Y_TICK_TYPE, tickColor]}>
                {formatYTick(tick.value)}
              </Text>
            </View>
          ))}
          {categories.map((label, i) => {
            const key = `${i}:${label}`;
            const placed = placedX?.find((t) => t.index === i);
            return (
              <View
                key={`x-${key}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: (placed?.tickCoord ?? labelX(i, box)) - LABEL_SLOT / 2,
                  top: box.bottom + X_LABEL_TOP_OFFSET,
                  width: LABEL_SLOT,
                  alignItems: 'center',
                  opacity: placed ? 1 : 0,
                }}>
                <Text
                  numberOfLines={1}
                  style={[X_TICK_TYPE, tickColor]}
                  onLayout={(event) => {
                    const w = event.nativeEvent.layout.width;
                    setLabelWidths((prev) => (prev[key] === w ? prev : { ...prev, [key]: w }));
                  }}>
                  {label}
                </Text>
              </View>
            );
          })}
          <View
            role="img"
            accessibilityLabel={accessibilityLabel}
            testID={testID ? `${testID}-surface` : undefined}
            style={StyleSheet.absoluteFill}
            {...pointerHandlers}
          />
        </>
      ) : null}
    </View>
  );
}
