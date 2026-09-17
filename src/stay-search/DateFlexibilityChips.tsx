import React, { memo } from 'react';
import { View } from 'react-native';

import { Chip } from '../chip';
import { DEFAULT_DATE_FLEXIBILITY_OPTIONS } from './constants';
import type { DateFlexibilityChipsProps } from './types';

/**
 * A single-select row of Bloom `Chip`s (`xl`, `outlined`; the selected one
 * takes the brand tone) that says how flexible the chosen dates are. Put it
 * under a `RangeCalendar` or `DateRangePicker` — this part does not draw a
 * calendar.
 *
 * It used to be `large` with `{ paddingHorizontal: 12, height: 32 }` written on
 * every pill, because `Chip`'s scale stopped at 28. `xl` IS that pill.
 */
function DateFlexibilityChipsComponent({
  value,
  onChange,
  options = DEFAULT_DATE_FLEXIBILITY_OPTIONS,
  accessibilityLabel = 'Date flexibility',
  style,
  testID,
}: DateFlexibilityChipsProps) {
  return (
    <View
      role="group"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          size="xl"
          variant="outlined"
          selected={option.value === value}
          onPress={() => onChange(option.value)}
          testID={testID ? `${testID}-${option.value}` : undefined}
        >
          {option.label}
        </Chip>
      ))}
    </View>
  );
}

export const DateFlexibilityChips = memo(DateFlexibilityChipsComponent);
DateFlexibilityChips.displayName = 'DateFlexibilityChips';
