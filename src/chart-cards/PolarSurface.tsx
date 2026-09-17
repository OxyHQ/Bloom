import React, { useCallback, useState } from 'react';
import {
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

import type { WebCssStyle } from '../styles/web-view-style';
import type { ChartSize } from './primitives/CartesianPlot';

export interface PolarSurfaceProps {
  /** Names the chart (`role="img"`) — a summary a screen reader can announce. */
  accessibilityLabel: string;
  /**
   * The pointer moved to `(x, y)` inside the surface (web hover; a pressed and
   * scrubbing finger on native). The chart hit-tests its own shapes.
   */
  onPointerAt: (x: number, y: number, size: ChartSize) => void;
  /** The pointer left the surface, or the finger lifted. */
  onPointerLeave: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** The drawing, once measured. Everything it returns sits UNDER the hit surface. */
  children: (size: ChartSize) => React.ReactNode;
}

/**
 * The polar counterpart of `CartesianPlot` for the radar / radial / ring cards:
 * a box that measures itself (recharts `ResponsiveContainer`), renders the
 * drawing once it has a size, and lays a `role="img"` hit surface over it.
 *
 * recharts wires hover per SHAPE (`onMouseEnter` on a sector) or per chart
 * (`onMouseMove` on a radar); both reduce to "where is the pointer", so the
 * surface reports coordinates and each card hit-tests its own geometry
 * (`polar-geometry.ts`). On native a finger presses and scrubs through the
 * responder; lifting it clears, as leaving does on web.
 *
 * Fills its parent absolutely unless `style` says otherwise. testIDs:
 * `<testID>` on the measured box, `<testID>-surface` on the hit surface.
 */
export function PolarSurface({ accessibilityLabel, onPointerAt, onPointerLeave, style, testID, children }: PolarSurfaceProps) {
  const [size, setSize] = useState<ChartSize | null>(null);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const at = (x: number, y: number) => {
    if (size) onPointerAt(x, y, size);
  };
  const handlers: ViewProps = {
    onPointerMove: (e: PointerEvent) => at(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
    onPointerLeave: () => onPointerLeave(),
    ...(Platform.OS === 'web'
      ? null
      : {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderTerminationRequest: () => false,
          onResponderGrant: (e: GestureResponderEvent) => at(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderMove: (e: GestureResponderEvent) => at(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderRelease: () => onPointerLeave(),
          onResponderTerminate: () => onPointerLeave(),
        }),
  };

  return (
    <View style={[StyleSheet.absoluteFill, style]} onLayout={onLayout} testID={testID}>
      {size ? (
        <>
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {children(size)}
          </View>
          <View
            role="img"
            accessibilityLabel={accessibilityLabel}
            testID={testID ? `${testID}-surface` : undefined}
            style={StyleSheet.absoluteFill}
            {...handlers}
          />
        </>
      ) : null}
    </View>
  );
}

/**
 * A CSS transition on a react-native-svg shape. Its web build forwards `style`
 * to the DOM node (where presentation attributes such as `fill` / `opacity`
 * transition like CSS), but `PathProps` does not declare `style`, so it rides
 * in as an untyped spread. `null` — native, reduced motion — adds nothing.
 */
export function svgTransition(transition: WebCssStyle | null): object {
  return transition ? { style: transition } : {};
}
