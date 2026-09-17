import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { RatingBarProps } from './types';

/**
 * One row of a rating breakdown: label, a 4px bar, and an optional value.
 *
 *   label     body-regular, text-primary
 *   track     4 tall, radius 2, neutral-200 (dark neutral-800)
 *   fill      text-primary, `value / max` of the track
 *   display   body-semibold, text-primary, tabular, min width 28, right-aligned
 *
 * Without `labelWidth` the label flexes and the bar is 96 wide, so a column of
 * categories lines up on the right; with it the bar flexes, for a 5→1
 * distribution. The bar is a `progressbar` with flat `aria-value*` (and
 * `aria-valuetext` from `display`), named by `label`.
 */

const BAR_WIDTH = 96;

function RatingBarComponent({ label, value, max = 5, display, labelWidth, style, testID }: RatingBarProps) {
  const theme = useTheme();
  const { neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(safeMax, Math.max(0, value));
  const fraction = clamped / safeMax;

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
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        aria-valuetext={display}
        testID={testID ? `${testID}-bar` : undefined}
        style={[
          {
            height: 4,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: theme.isDark ? neutral[800] : neutral[200],
          },
          labelWidth === undefined ? { width: BAR_WIDTH } : { flex: 1, minWidth: 0 },
        ]}
      >
        <View
          testID={testID ? `${testID}-fill` : undefined}
          style={{ width: `${fraction * 100}%`, height: '100%', backgroundColor: theme.colors.text }}
        />
      </View>
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
