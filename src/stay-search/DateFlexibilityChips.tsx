import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Chip } from '../chip';
import { useMessages } from '../locale/messages';
import { dateFlexibilityOptions } from './constants';
import { STAY_SEARCH_MESSAGES } from './messages';
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
  options: optionsProp,
  accessibilityLabel: accessibilityLabelProp,
  style,
  testID,
}: DateFlexibilityChipsProps) {
  const { messages } = useMessages(STAY_SEARCH_MESSAGES);
  const options = useMemo(() => optionsProp ?? dateFlexibilityOptions(messages), [optionsProp, messages]);
  const accessibilityLabel = accessibilityLabelProp ?? messages.dateFlexibility;
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
