import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { animation } from '../styles/tokens';
import { bloomShadowStyle } from '../design-tokens/shadows';
import type { SliderProps } from './types';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function quantize(raw: number, min: number, max: number, step: number): number {
  if (step <= 0) return clamp(raw, min, max);
  const steps = Math.round((raw - min) / step);
  const snapped = min + steps * step;
  // Avoid floating-point drift accumulating in the reported value.
  const decimals = (String(step).split('.')[1] ?? '').length;
  const rounded = decimals > 0 ? Number(snapped.toFixed(decimals)) : snapped;
  return clamp(rounded, min, max);
}

/**
 * A draggable value slider. Track + fill + thumb, themed from Bloom tokens.
 * Controlled via `value` / `onValueChange`, with `min` / `max` / `step`.
 *
 * Universal: gestures use RN's `PanResponder` (works on React Native and on
 * web via react-native-web). On web the thumb is also focusable and responds
 * to arrow / Home / End keys for accessibility.
 */
const SliderComponent = function Slider({
  value,
  onValueChange,
  onSlidingComplete,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  trackHeight = 4,
  thumbSize = 20,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
  style,
  accessibilityLabel,
  testID,
}: SliderProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const pressScale = useRef(new Animated.Value(0)).current;

  // Latest props captured in refs so the PanResponder (created once) always
  // reads current values without being re-created mid-gesture.
  const stateRef = useRef({ value, trackWidth, min, max, step, disabled });
  stateRef.current = { value, trackWidth, min, max, step, disabled };
  const callbacksRef = useRef({ onValueChange, onSlidingComplete });
  callbacksRef.current = { onValueChange, onSlidingComplete };
  const gestureStartValueRef = useRef(value);

  const range = max - min;
  const fraction = range > 0 ? clamp((value - min) / range, 0, 1) : 0;

  const fillColor = minimumTrackTintColor ?? theme.colors.primary;
  const restColor = maximumTrackTintColor ?? theme.colors.border;
  const thumbColor = thumbTintColor ?? theme.colors.primary;

  const valueFromX = useCallback((x: number): number => {
    const s = stateRef.current;
    if (s.trackWidth <= 0) return s.value;
    const f = clamp(x / s.trackWidth, 0, 1);
    return quantize(s.min + f * (s.max - s.min), s.min, s.max, s.step);
  }, []);

  const animatePress = useCallback(
    (to: number) => {
      Animated.spring(pressScale, {
        toValue: to,
        useNativeDriver: true,
        ...animation.spring.snappy,
      }).start();
    },
    [pressScale],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !stateRef.current.disabled,
        onMoveShouldSetPanResponder: () => !stateRef.current.disabled,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          if (stateRef.current.disabled) return;
          gestureStartValueRef.current = stateRef.current.value;
          animatePress(1);
          const next = valueFromX(e.nativeEvent.locationX);
          if (next !== stateRef.current.value) {
            callbacksRef.current.onValueChange(next);
          }
        },
        onPanResponderMove: (
          _e: GestureResponderEvent,
          g: PanResponderGestureState,
        ) => {
          if (stateRef.current.disabled) return;
          const s = stateRef.current;
          const startFraction =
            s.max - s.min > 0
              ? (gestureStartValueRef.current - s.min) / (s.max - s.min)
              : 0;
          const startX = startFraction * s.trackWidth;
          const next = valueFromX(startX + g.dx);
          if (next !== s.value) {
            callbacksRef.current.onValueChange(next);
          }
        },
        onPanResponderRelease: () => {
          animatePress(0);
          callbacksRef.current.onSlidingComplete?.(stateRef.current.value);
        },
        onPanResponderTerminate: () => {
          animatePress(0);
          callbacksRef.current.onSlidingComplete?.(stateRef.current.value);
        },
      }),
    [animatePress, valueFromX],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const onKeyStep = useCallback(
    (delta: number, toEdge?: 'min' | 'max') => {
      if (disabled) return;
      const next =
        toEdge === 'min'
          ? min
          : toEdge === 'max'
            ? max
            : quantize(value + delta, min, max, step);
      if (next !== value) {
        onValueChange(next);
        onSlidingComplete?.(next);
      }
    },
    [disabled, min, max, step, value, onValueChange, onSlidingComplete],
  );

  // Web-only keyboard handling for the focusable thumb.
  const webKeyHandler: Record<string, unknown> =
    Platform.OS === 'web'
      ? {
          tabIndex: disabled ? -1 : 0,
          onKeyDown: (e: { key: string; preventDefault: () => void }) => {
            switch (e.key) {
              case 'ArrowRight':
              case 'ArrowUp':
                e.preventDefault();
                onKeyStep(step);
                break;
              case 'ArrowLeft':
              case 'ArrowDown':
                e.preventDefault();
                onKeyStep(-step);
                break;
              case 'Home':
                e.preventDefault();
                onKeyStep(0, 'min');
                break;
              case 'End':
                e.preventDefault();
                onKeyStep(0, 'max');
                break;
              default:
                break;
            }
          },
        }
      : {};

  const thumbScale = pressScale.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const thumbLeft = fraction * trackWidth - thumbSize / 2;

  return (
    <View
      testID={testID}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityState={{ disabled }}
      style={[
        styles.root,
        { height: Math.max(thumbSize, trackHeight) + 8 },
        disabled && styles.disabled,
        style,
      ]}
      {...panResponder.panHandlers}>
      <View
        onLayout={onLayout}
        style={[
          styles.track,
          { height: trackHeight, borderRadius: trackHeight / 2, backgroundColor: restColor },
        ]}>
        <View
          style={[
            styles.fill,
            {
              width: `${fraction * 100}%`,
              height: trackHeight,
              borderRadius: trackHeight / 2,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
      <Animated.View
        {...webKeyHandler}
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            marginTop: -thumbSize / 2,
            backgroundColor: thumbColor,
            left: thumbLeft,
            transform: [{ scale: thumbScale }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    // Subtle raise (`shadow-s`) — `boxShadow` on web, RN shadow/elevation on native.
    ...bloomShadowStyle('s'),
  },
  disabled: {
    opacity: 0.5,
  },
});

export const Slider = memo(SliderComponent);
Slider.displayName = 'Slider';
