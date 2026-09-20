import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Stepper } from './Stepper';
import type { StepperRowProps } from './types';

/**
 * A labelled `Stepper` row for guest pickers and filters: title (headline-medium,
 * text-primary) over an optional description (body-regular, text-secondary) on
 * the left, the stepper on the right, 16 above and below, and an optional
 * 1px neutral hairline underneath (neutral-200, dark neutral-800 — `Divider`'s
 * stop).
 */
function StepperRowComponent({
  title,
  description,
  divider = false,
  accessibilityLabel,
  style,
  stepperStyle,
  ...stepper
}: StepperRowProps) {
  const theme = useTheme();
  const name = accessibilityLabel ?? (typeof title === 'string' ? title : '');

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingTop: 16,
          paddingBottom: 16,
          borderBottomWidth: divider ? 1 : 0,
          // neutral-700 in dark, not 800: 800 is the floating surface (a popover, a
          // sheet) these rows usually sit on, where an 800 hairline disappears.
          borderBottomColor: theme.colors.borderLight,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {typeof title === 'string' ? (
          <Text variant="headline-medium" style={{ color: theme.colors.text }}>
            {title}
          </Text>
        ) : (
          title
        )}
        {description == null ? null : typeof description === 'string' ? (
          <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
            {description}
          </Text>
        ) : (
          description
        )}
      </View>
      <Stepper {...stepper} accessibilityLabel={name} style={stepperStyle} />
    </View>
  );
}

export const StepperRow = memo(StepperRowComponent);
StepperRow.displayName = 'StepperRow';
