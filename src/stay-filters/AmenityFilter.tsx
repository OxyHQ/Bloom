import React, { useState } from 'react';
import { View } from 'react-native';

import { FilterTextButton } from './FilterTextButton';
import { ToggleChipGroup } from './ToggleChipGroup';
import type { AmenityFilterProps } from './types';

/**
 * A `ToggleChipGroup` that shows its first `collapsedCount` options and a
 * "Show more" link that reveals the rest (and turns into "Show less").
 *
 *   link   underlined body-semibold, 24 under the pills, `aria-expanded`
 *
 * A SELECTED option past the fold stays visible while collapsed, so collapsing
 * never hides a filter the user has applied. Expansion is uncontrolled.
 */
export function AmenityFilter<T extends string = string>({
  options,
  value,
  collapsedCount = 6,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  defaultExpanded = false,
  style,
  testID,
  ...group
}: AmenityFilterProps<T>) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const foldable = options.length > collapsedCount;
  const selected = new Set<T>(value);
  const visible =
    expanded || !foldable
      ? options
      : options.filter((option, index) => index < collapsedCount || selected.has(option.value));

  return (
    <View testID={testID} style={[{ gap: 24 }, style]}>
      <ToggleChipGroup
        {...group}
        options={visible}
        value={value}
        testID={testID ? `${testID}-group` : undefined}
      />
      {foldable ? (
        <View style={{ alignItems: 'flex-start' }}>
          <FilterTextButton
            label={expanded ? showLessLabel : showMoreLabel}
            expanded={expanded}
            onPress={() => setExpanded((e) => !e)}
            testID={testID ? `${testID}-toggle` : undefined}
          />
        </View>
      ) : null}
    </View>
  );
}

AmenityFilter.displayName = 'AmenityFilter';
