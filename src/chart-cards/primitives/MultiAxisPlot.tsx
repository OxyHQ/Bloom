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

import { Text } from '../../typography';
import { TYPE_SCALE } from '../../typography/scale';
import {
  CHART_MARGIN,
  TICK_SIZE,
  X_AXIS_HEIGHT,
  X_TICK_MARGIN,
  Y_TICK_MARGIN,
  bandIndex,
  bandSize,
  inPlot,
  nearestPointIndex,
  placeTicks,
  pointX,
  scaleY,
  type PlotBox,
} from '../geometry';
import type { ChartCardPalette } from '../palette';
import type { ChartSize } from './CartesianPlot';

/**
 * `CartesianPlot` with the three recharts knobs it pins, for the charts that
 * need them (`ComboChartCard`, `EarningsChartCard`):
 *
 *   margin       recharts `margin` — CartesianPlot fixes `right: 6`; the combo
 *                and earnings cards use `right: 0`
 *   rightAxis    a second `YAxis orientation="right"` with its own width,
 *                domain, ticks and formatter; labels start 8px right of the plot
 *   xInterval    the X axis `interval` — `preserveStartEnd` (set explicitly by
 *                most cards) or recharts' default `preserveEnd`
 *
 * Everything else — measuring, culled tick labels as Bloom `Text`, the
 * pointer / responder tracking, the `role="img"` surface — is CartesianPlot's.
 */

export interface MultiAxisPlotRenderArgs {
  size: ChartSize;
  box: PlotBox;
  /** X centre of category `index` (the band centre on a `band` scale). */
  x: (index: number) => number;
  /** Width of one category slot on a `band` scale (the step on `point`). */
  band: number;
  /** Pixel Y of a value on the left axis. */
  y: (value: number) => number;
  /** Pixel Y of a value on the right axis (the left axis when there is none). */
  yRight: (value: number) => number;
}

export interface MultiAxisPlotAxis {
  /** recharts `YAxis width`. */
  width: number;
  domain: readonly [number, number];
  ticks: readonly number[];
  format: (value: number) => string;
}

export interface MultiAxisPlotProps {
  categories: readonly string[];
  xScale?: 'point' | 'band';
  /** Left axis. */
  axis: MultiAxisPlotAxis;
  rightAxis?: MultiAxisPlotAxis;
  margin?: { top: number; right: number; bottom: number; left: number };
  xInterval?: 'preserveStartEnd' | 'preserveEnd';
  outside?: 'keep' | 'clear';
  onActiveIndexChange: (index: number | null) => void;
  palette: ChartCardPalette;
  accessibilityLabel: string;
  testID?: string;
  children: (args: MultiAxisPlotRenderArgs) => React.ReactNode;
}

/** recharts measures a 12px tick as 18px tall. */
const Y_TICK_EXTENT = 18;
const X_LABEL_TOP_OFFSET = TICK_SIZE + X_TICK_MARGIN - 4.5;
const Y_LABEL_TOP_OFFSET = -8;
const LABEL_SLOT = 160;
const X_TICK_TYPE: TextStyle = { ...TYPE_SCALE['body-2-regular'] };
const Y_TICK_TYPE: TextStyle = { ...TYPE_SCALE['caption-1-regular'], letterSpacing: 0 };

export function multiAxisPlotBox(
  width: number,
  height: number,
  leftWidth: number,
  rightWidth: number,
  margin: { top: number; right: number; bottom: number; left: number } = CHART_MARGIN,
): PlotBox {
  return {
    left: margin.left + leftWidth,
    top: margin.top,
    right: width - margin.right - rightWidth,
    bottom: height - margin.bottom - X_AXIS_HEIGHT,
  };
}

export function MultiAxisPlot({
  categories,
  xScale = 'point',
  axis,
  rightAxis,
  margin = CHART_MARGIN,
  xInterval = 'preserveStartEnd',
  outside = 'keep',
  onActiveIndexChange,
  palette,
  accessibilityLabel,
  testID,
  children,
}: MultiAxisPlotProps) {
  const [size, setSize] = useState<ChartSize | null>(null);
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const count = categories.length;
  const box = useMemo(
    () => (size ? multiAxisPlotBox(size.width, size.height, axis.width, rightAxis?.width ?? 0, margin) : null),
    [size, axis.width, rightAxis?.width, margin],
  );

  const labelX = useCallback(
    (index: number, b: PlotBox) =>
      xScale === 'band' ? b.left + (index + 0.5) * bandSize(count, b) : pointX(index, count, b),
    [xScale, count],
  );

  const placeY = useCallback(
    (a: MultiAxisPlotAxis | undefined) => {
      if (!a || !box || !size) return [];
      return placeTicks(
        a.ticks.map((v) => ({ coordinate: scaleY(v, a.domain, box), size: Y_TICK_EXTENT })),
        size.height,
        'preserveEnd',
      ).map((p) => ({ value: a.ticks[p.index]!, y: p.tickCoord }));
    },
    [box, size],
  );
  const placedLeft = useMemo(() => placeY(axis), [placeY, axis]);
  const placedRight = useMemo(() => placeY(rightAxis), [placeY, rightAxis]);

  const placedX = useMemo(() => {
    if (!box || !size) return null;
    const measured = categories.every((label, i) => labelWidths[`${i}:${label}`] !== undefined);
    if (!measured) return null;
    return placeTicks(
      categories.map((label, i) => ({ coordinate: labelX(i, box), size: labelWidths[`${i}:${label}`]! })),
      size.width,
      xInterval,
    );
  }, [box, size, categories, labelWidths, labelX, xInterval]);

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
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {children({
              size,
              box,
              x: (i) => labelX(i, box),
              band: xScale === 'band' ? bandSize(count, box) : count > 1 ? (box.right - box.left) / (count - 1) : 0,
              y: (v) => scaleY(v, axis.domain, box),
              yRight: (v) => scaleY(v, (rightAxis ?? axis).domain, box),
            })}
          </View>
          {placedLeft.map((tick) => (
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
                {axis.format(tick.value)}
              </Text>
            </View>
          ))}
          {rightAxis
            ? placedRight.map((tick) => (
                <View
                  key={`yr-${tick.value}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: box.right + TICK_SIZE + Y_TICK_MARGIN,
                    top: tick.y + Y_LABEL_TOP_OFFSET,
                    width: LABEL_SLOT,
                    alignItems: 'flex-start',
                  }}>
                  <Text numberOfLines={1} style={[Y_TICK_TYPE, tickColor]}>
                    {rightAxis.format(tick.value)}
                  </Text>
                </View>
              ))
            : null}
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
