import React, { memo } from 'react';
import { View } from 'react-native';

import { Meter } from '../stat-bar';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { RatingBarProps } from './types';

/**
 * One row of a rating breakdown: label, a 4px `Meter`, and an optional value.
 *
 *   label     body-regular, text-primary
 *   track     4 tall, radius 2, neutral-200 (dark neutral-700)
 *   fill      the accent, `value / max` of the track
 *   display   body-semibold, text-primary, tabular, min width 28, right-aligned
 *
 * The fill was text-primary — a near-black bar — until the meters were folded
 * onto one primitive. A rating breakdown is NOT a chart: the rows do not encode
 * different categories by colour (they are all "how good is this, out of 5"),
 * so a chart hue would claim a distinction that is not there. It is a
 * measurement, and the accent is the theme's colour for one.
 *
 * Without `labelWidth` the label flexes and the bar is 96 wide, so a column of
 * categories lines up on the right; with it the bar flexes, for a 5→1
 * distribution. The bar is a `progressbar` with flat `aria-value*` (and
 * `aria-valuetext` from `display`), named by `label`.
 */

const BAR_WIDTH = 96;

function RatingBarComponent({ label, value, max = 5, display, labelWidth, style, testID }: RatingBarProps) {
  const theme = useTheme();
  const safeMax = max > 0 ? max : 1;

  return (
    <View
      testID={testID}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}
    >
      <Text
        variant="body-regular"
        numberOfLines={1}
        importantForAccessibility="no"
        accessibilityElementsHidden
        style={[
          { color: theme.colors.text },
          labelWidth === undefined ? { flex: 1, minWidth: 0 } : { width: labelWidth },
        ]}
      >
        {label}
      </Text>
      <Meter
        value={value}
        max={safeMax}
        height={4}
        accessibilityLabel={label}
        valueText={display}
        testID={testID ? `${testID}-bar` : undefined}
        fillTestID={testID ? `${testID}-fill` : undefined}
        style={labelWidth === undefined ? { width: BAR_WIDTH } : { flex: 1, minWidth: 0 }}
      />
      {display != null && (
        <Text
          variant="body-semibold"
          importantForAccessibility="no"
          accessibilityElementsHidden
          style={{ color: theme.colors.text, minWidth: 28, textAlign: 'right', fontVariant: ['tabular-nums'] }}
        >
          {display}
        </Text>
      )}
    </View>
  );
}

export const RatingBar = memo(RatingBarComponent);
RatingBar.displayName = 'RatingBar';
