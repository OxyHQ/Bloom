import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveCartPaint } from './shared';
import type { CartTipPickerProps } from './types';

/**
 * What to add for the courier: a single choice among a few pre-formatted
 * amounts.
 *
 * It is `SegmentedControl type="radio"`, which already IS a `radiogroup` of
 * `radio`s that reads a `Field`, slides its thumb and carries one focus ring —
 * a row of pills would be a second grouped-choice control with the same
 * meaning, and the one thing it could not do is announce "2 of 4".
 *
 * `large` is the rung, because the segments are a finger's target: the control
 * is 44 tall there, which is the floor a touch target has.
 *
 * Every amount is a STRING the app formatted. A percentage and a fixed amount
 * are both just labels here; nothing computes either, and "No tip" is an
 * option like any other rather than a state this component invents.
 */
function CartTipPickerComponent({
  options,
  value,
  onValueChange,
  label = 'Tip',
  description,
  disabled = false,
  style,
  testID,
}: CartTipPickerProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveCartPaint(theme, surface), [theme, surface]);

  if (options.length === 0) return null;

  return (
    <View style={[{ gap: 8 }, style]} testID={testID}>
      <Text
        variant="body-medium"
        testID={testID ? `${testID}-label` : undefined}
        style={{ color: paint.text }}
      >
        {label}
      </Text>
      <SegmentedControl
        label={label}
        type="radio"
        size="large"
        value={value ?? ''}
        onChange={onValueChange}
        disabled={disabled}
        style={{ alignSelf: 'stretch' }}
        testID={testID ? `${testID}-options` : undefined}
      >
        {options.map((option) => (
          <SegmentedControlItem
            key={option.id}
            value={option.id}
            testID={testID ? `${testID}-option-${option.id}` : undefined}
          >
            <SegmentedControlItemText>{option.label}</SegmentedControlItemText>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      {description ? (
        <Text
          variant="caption-1-regular"
          testID={testID ? `${testID}-description` : undefined}
          style={{ color: paint.textSecondary }}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}

export const CartTipPicker = memo(CartTipPickerComponent);
CartTipPicker.displayName = 'CartTipPicker';
