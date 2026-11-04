import React, { memo, useEffect, useMemo, useRef } from 'react';
import { styled } from 'react-native-css';
import { Animated, Easing, Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useResolvedBloomLocale } from '../locale/context';
import { useTheme } from '../theme/use-theme';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import {
  METER_DURATION_VAR,
  METER_SWEEP_MS,
  METER_SWEEP_PARKED,
  METER_SWEEP_SHARE,
  adoptMeterStyleSheet,
  meterFraction,
  meterValue,
  meterValueText,
  resolveMeterColors,
  sharePercent,
} from './shared';
import type { AnyMeterProps } from './types';
import { useMeterReveal } from './use-meter-reveal';

const SWEEP_FROM = sharePercent(-METER_SWEEP_SHARE);

/**
 * The indeterminate segment: {@link METER_SWEEP_SHARE} of the track, sweeping
 * from off its left edge to off its right one. Natively its `left` moves, as a
 * share of the track, on the JS driver (a layout property cannot take the
 * native driver, and a share needs no measurement); on the web the shared
 * stylesheet's keyframe moves it. Parked under reduced motion.
 */
function MeterSweep({
  radius,
  fill,
  style,
  testID,
}: {
  radius: number;
  fill: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const web = Platform.OS === 'web';
  const reducedMotion = usePrefersReducedMotion();
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (web) {
      adoptMeterStyleSheet();
      return undefined;
    }
    if (reducedMotion) return undefined;
    sweep.setValue(0);
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: METER_SWEEP_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
        isInteraction: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [web, reducedMotion, sweep]);

  const left = web
    ? undefined
    : reducedMotion
      ? sharePercent(METER_SWEEP_PARKED)
      : sweep.interpolate({ inputRange: [0, 1], outputRange: [SWEEP_FROM, '100%'] });

  return (
    <Animated.View
      {...(web ? webDataSet({ bloomMeterSweep: '' }) : null)}
      testID={testID}
      style={[
        {
          width: sharePercent(METER_SWEEP_SHARE),
          height: '100%',
          borderRadius: radius,
          backgroundColor: fill,
        },
        style,
        left === undefined ? null : { left },
      ]}
    />
  );
}

/**
 * ONE determinate bar. Every progress bar in Bloom is this one.
 *
 *   track   `height` tall (6), radius `height / 2`, `neutral-200` (dark
 *           `neutral-700`), clipping its fill
 *   fill    `value / max` of the width, the accent, the same radius
 *
 * It draws NOTHING else — no label, no value, no footer. A bar with a label is
 * `StatBar`; a bar inside a card is that card's business. What this owns is the
 * geometry, the two colours and the accessibility, which is the part every
 * hand-rolled copy got subtly differently.
 *
 * Accessibility: a `meter` (a level indicator; `role="progressbar"` for a
 * task's progress, `MeterRole`) named by `accessibilityLabel`, with the FLAT
 * `aria-value*` props — react-native-web drops the `accessibilityValue` object
 * entirely, so a bar setting only that announces its role and no value, while
 * React Native folds the flat props back into `accessibilityValue`.
 * `valueText` carries the reading ("4 of 5"); without it, the share of the
 * track in the reader's locale (`meterValueText`), since React Native keeps
 * `aria-valuenow` as a whole number and a fraction of 1 would say nothing.
 *
 * A bar that is one SEGMENT of a larger meter passes `decorative` and gets no
 * role at all — two nested meters announce the measurement twice.
 */
function MeterComponent(props: AnyMeterProps & { fillStyle?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const locale = useResolvedBloomLocale();
  const defaults = useMemo(() => resolveMeterColors(theme), [theme]);
  const {
    value,
    reveal,
    max = 1,
    height = 6,
    radius = height / 2,
    fill = defaults.fill,
    track = defaults.track,
    width,
    transitionMs = 0,
    indeterminate = false,
    style,
    testID,
    fillStyle: callerFillStyle,
    fillTestID = testID ? `${testID}-fill` : undefined,
  } = props;

  useEffect(() => {
    if (Platform.OS === 'web' && transitionMs > 0) adoptMeterStyleSheet();
  }, [transitionMs]);

  const fraction = meterFraction(value, max);
  const revealedWidth = useMeterReveal(fraction, reveal);

  const fillStyle: WebCssStyle = {
    width: `${fraction * 100}%`,
    height: '100%',
    borderRadius: radius,
    backgroundColor: fill,
    ...(transitionMs > 0 ? { [METER_DURATION_VAR]: `${transitionMs}ms` } : null),
  };

  const fillDataSet = transitionMs > 0 ? webDataSet({ bloomMeterFill: '' }) : null;
  const bar = indeterminate ? (
    <MeterSweep radius={radius} fill={fill} style={callerFillStyle} testID={fillTestID} />
  ) : reveal ? (
    <Animated.View
      {...fillDataSet}
      testID={fillTestID}
      style={[fillStyle, callerFillStyle, { width: revealedWidth }]}
    />
  ) : (
    <View
      {...fillDataSet}
      testID={fillTestID}
      style={[fillStyle, callerFillStyle, { width: fillStyle.width }]}
    />
  );

  const trackStyle = [
    {
      width: width ?? ('100%' as const),
      height,
      borderRadius: radius,
      backgroundColor: track,
      overflow: 'hidden' as const,
    },
    style,
  ];

  // The two branches are written out rather than folded into a spread on
  // purpose: `aria-state-source-census.test.ts` reads the SOURCE, and a role
  // that only exists inside a spread object is a role the census cannot see.
  if (props.decorative) {
    return (
      <View aria-hidden testID={testID} style={trackStyle}>
        {bar}
      </View>
    );
  }

  return (
    <View
      // The two roles spelled out: a meter unless the caller says it measures a task
      // (`MeterRole`). An amount nobody knows yet is a task's: a `meter` always has a value.
      role={indeterminate || props.role === 'progressbar' ? 'progressbar' : 'meter'}
      accessibilityLabel={props.accessibilityLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : meterValue(value, max)}
      aria-valuetext={
        indeterminate ? undefined : (props.valueText ?? meterValueText(value, max, locale))
      }
      aria-busy={indeterminate || undefined}
      testID={testID}
      style={trackStyle}
    >
      {bar}
    </View>
  );
}

export const Meter = memo(
  styled(MeterComponent, { className: 'style', fillClassName: 'fillStyle' }),
);
Meter.displayName = 'Meter';
