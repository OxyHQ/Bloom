import React, { memo, useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { webDataSet } from '../checkbox/shared';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { METER_DURATION_VAR, adoptMeterStyleSheet, meterFraction, meterValue, resolveMeterColors } from './shared';
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
  children,
  style,
  testID,
}: MeterRingProps) {
  const theme = useTheme();
  const defaults = useMemo(() => resolveMeterColors(theme), [theme]);

  useEffect(() => {
    if (Platform.OS === 'web' && transitionMs > 0) adoptMeterStyleSheet();
  }, [transitionMs]);

  const fraction = meterFraction(value, max);
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
      aria-valuenow={meterValue(value, max)}
      aria-valuetext={valueText}
      testID={testID}
      style={[boxStyle, style]}
    >
      <View
        {...(transitionMs > 0 ? webDataSet({ bloomMeterArc: '' }) : null)}
        style={{ position: 'absolute', top: 0, left: 0 }}
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
      </View>
      {children != null ? (
        <View aria-hidden importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {children}
        </View>
      ) : null}
    </View>
  );
}

export const MeterRing = memo(MeterRingComponent);
MeterRing.displayName = 'MeterRing';
