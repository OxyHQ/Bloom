import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import {
  METER_DURATION_VAR,
  METER_SPIN_MS,
  adoptMeterStyleSheet,
  meterFraction,
  meterValue,
  resolveMeterColors,
} from './shared';
import type { MeterRingProps } from './types';

/**
 * The same measurement as {@link Meter}, drawn as a ring: a full circle in the
 * track colour with an arc of the accent over it, starting at twelve o'clock
 * and going clockwise, with whatever `children` centred inside.
 *
 * The stroke is drawn INSIDE `size`, so the ring occupies exactly `size × size`
 * and a caller can lay it out as a fixed box. The `-90°` rotation lives on the
 * `<Svg>`, not on the arc: `react-native-svg` applies an element `transform`
 * before the dash offset on some native versions, which walks the start of the
 * arc off twelve o'clock.
 *
 * `cap: 'round'` at value 0 would paint a dot on an empty ring — a 0% score
 * that reads as "a little" — so it degrades to `'butt'` there.
 *
 * Accessibility: a `progressbar` named by `accessibilityLabel` with the flat
 * `aria-value*` props, for the reason spelled out on `Meter`. `children` are
 * hidden from assistive technology: the centred score is the same number
 * `aria-valuetext` already carries, and announcing it twice is noise.
 *
 * As an app store's download ring: `indeterminate` while the amount is not
 * known (a quarter of the ring turns, the progressbar reports no value), and
 * `onStop` makes the ring the control that stops it, a stop square in its
 * centre, named by `stopLabel`. The turn runs on the native driver natively and
 * in CSS on web (react-native-web has no native driver, and JavaScript frames
 * there starve other work), one turn a second on both.
 */
function MeterRingComponent({
  value,
  max = 1,
  size = 56,
  thickness = 5,
  fill,
  track,
  cap = 'round',
  accessibilityLabel,
  valueText,
  transitionMs = 0,
  indeterminate = false,
  onStop,
  stopLabel,
  children,
  style,
  testID,
}: MeterRingProps) {
  const theme = useTheme();
  const defaults = useMemo(() => resolveMeterColors(theme), [theme]);
  const web = Platform.OS === 'web';

  useEffect(() => {
    if (web && (transitionMs > 0 || indeterminate)) adoptMeterStyleSheet();
  }, [web, transitionMs, indeterminate]);

  // Natively, the indeterminate turn: one turn a second, on the native driver.
  const turn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (web || !indeterminate) return undefined;
    turn.setValue(0);
    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: METER_SPIN_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [web, indeterminate, turn]);

  // Indeterminate, a quarter of the ring; otherwise the share measured.
  const fraction = indeterminate ? 0.25 : meterFraction(value, max);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const boxStyle: WebCssStyle = {
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
    ...(transitionMs > 0 ? { [METER_DURATION_VAR]: `${transitionMs}ms` } : null),
  };

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : meterValue(value, max)}
      aria-valuetext={indeterminate ? undefined : valueText}
      aria-busy={indeterminate || undefined}
      testID={testID}
      style={[boxStyle, style]}
    >
      <Animated.View
        {...(transitionMs > 0 && !indeterminate ? webDataSet({ bloomMeterArc: '' }) : null)}
        {...(indeterminate && web ? webDataSet({ bloomMeterSpin: '' }) : null)}
        testID={testID && indeterminate ? `${testID}-turning` : undefined}
        style={[
          { position: 'absolute', top: 0, left: 0, width: size, height: size },
          indeterminate && !web
            ? {
                transform: [
                  {
                    rotate: turn.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }
            : null,
        ]}
      >
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={track ?? defaults.track}
            strokeWidth={thickness}
            fill="none"
            testID={testID ? `${testID}-track` : undefined}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={fill ?? defaults.fill}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap={fraction > 0 ? cap : 'butt'}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - fraction)}
            testID={testID ? `${testID}-arc` : undefined}
          />
        </Svg>
      </Animated.View>
      {onStop ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={stopLabel}
          onPress={onStop}
          hitSlop={4}
          testID={testID ? `${testID}-stop` : undefined}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: stopSide(size, thickness),
              height: stopSide(size, thickness),
              borderRadius: Math.max(1, stopSide(size, thickness) / 6),
              backgroundColor: fill ?? defaults.fill,
            }}
          />
        </Pressable>
      ) : children != null ? (
        <View
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

/**
 * The stop square's side: a little over a third of the ring's inside, as an app
 * store's download ring draws it, never under 6 px.
 */
export function stopSide(size: number, thickness: number): number {
  return Math.max(6, Math.round((size - 2 * thickness) * 0.36));
}

export const MeterRing = memo(MeterRingComponent);
MeterRing.displayName = 'MeterRing';
