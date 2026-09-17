import React from 'react';

import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import type { SegmentedFilterProps } from './types';

/**
 * One choice out of a few ("Any type / Room / Entire home"): Bloom's
 * `SegmentedControl` at `large` (44 tall), stretched to the full width so the
 * segments share it equally. A `radiogroup` of `radio`s named by
 * `accessibilityLabel`.
 */
export function SegmentedFilter<T extends string = string>({
  options,
  value,
  onValueChange,
  accessibilityLabel,
  style,
  testID,
}: SegmentedFilterProps<T>) {
  return (
    <SegmentedControl
      label={accessibilityLabel}
      type="radio"
      size="large"
      value={value}
      onChange={onValueChange}
      style={[{ alignSelf: 'stretch' }, style]}
    >
      {options.map((option) => (
        <SegmentedControlItem
          key={option.value}
          value={option.value}
          testID={testID ? `${testID}-${option.value}` : undefined}
        >
          <SegmentedControlItemText>{option.label}</SegmentedControlItemText>
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}

SegmentedFilter.displayName = 'SegmentedFilter';
