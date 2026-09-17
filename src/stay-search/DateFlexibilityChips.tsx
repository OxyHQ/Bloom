import React, { memo } from 'react';
import { View } from 'react-native';

import { Chip } from '../chip';
import { DEFAULT_DATE_FLEXIBILITY_OPTIONS } from './constants';
import type { DateFlexibilityChipsProps } from './types';

/**
 * A single-select row of Bloom `Chip`s (`large`, `outlined`; the selected one
 * takes the brand tone) that says how flexible the chosen dates are. Put it
 * under a `RangeCalendar` or `DateRangePicker` — this part does not draw a
 * calendar.
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
          size="large"
          variant="outlined"
          selected={option.value === value}
          onPress={() => onChange(option.value)}
          testID={testID ? `${testID}-${option.value}` : undefined}
          // `paddingHorizontal`, the spelling Chip's base uses — a longhand would lose on web.
          style={{ paddingHorizontal: 12, height: 32 }}
        >
          {option.label}
        </Chip>
      ))}
    </View>
  );
}

export const DateFlexibilityChips = memo(DateFlexibilityChipsComponent);
DateFlexibilityChips.displayName = 'DateFlexibilityChips';
