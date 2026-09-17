import React, { memo, useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';

import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import {
  METER_DURATION_VAR,
  adoptMeterStyleSheet,
  meterFraction,
  meterValue,
  resolveMeterColors,
} from './shared';
import type { AnyMeterProps } from './types';

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
 * Accessibility: a `progressbar` named by `accessibilityLabel`, with the FLAT
 * `aria-value*` props — react-native-web drops the `accessibilityValue` object
 * entirely, so a bar setting only that announces its role and no value, while
 * React Native folds the flat props back into `accessibilityValue` and native
 * is unchanged. `valueText` carries the reading ("4 of 5"), since a bare number
 * is announced as a percentage.
 *
 * A bar that is one SEGMENT of a larger progressbar passes `decorative` and
 * gets no role at all — two nested progressbars announce the measurement twice.
 */
function MeterComponent(props: AnyMeterProps) {
  const theme = useTheme();
  const defaults = useMemo(() => resolveMeterColors(theme), [theme]);
  const {
    value,
    max = 1,
    height = 6,
    radius = height / 2,
    fill = defaults.fill,
    track = defaults.track,
    width,
    transitionMs = 0,
    style,
    testID,
    fillTestID = testID ? `${testID}-fill` : undefined,
  } = props;

  useEffect(() => {
    if (Platform.OS === 'web' && transitionMs > 0) adoptMeterStyleSheet();
  }, [transitionMs]);

  const fraction = meterFraction(value, max);

  const fillStyle: WebCssStyle = {
    width: `${fraction * 100}%`,
    height: '100%',
    borderRadius: radius,
    backgroundColor: fill,
    ...(transitionMs > 0 ? { [METER_DURATION_VAR]: `${transitionMs}ms` } : null),
  };

  const bar = (
    <View
      {...(transitionMs > 0 ? webDataSet({ bloomMeterFill: '' }) : null)}
      testID={fillTestID}
      style={fillStyle}
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
      accessibilityRole="progressbar"
      accessibilityLabel={props.accessibilityLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={meterValue(value, max)}
      aria-valuetext={props.valueText}
      testID={testID}
      style={trackStyle}
    >
      {bar}
    </View>
  );
}

export const Meter = memo(MeterComponent);
Meter.displayName = 'Meter';
