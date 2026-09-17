import React, { memo } from 'react';
import { ScrollView } from 'react-native';

import { Chip } from '../chip';
import type { FilterChipsProps } from './types';

/**
 * The single-select pill row above a feed: "All", "Music", "Podcasts"…
 *
 *   chip        `Chip` size `large` (28 tall, full pill)
 *   rest        subtle neutral fill, text colour
 *   selected    solid accent fill, on-accent label
 *   gap         8; the row scrolls horizontally when it does not fit
 *
 * Each chip is a toggle button (`aria-pressed`, `accessibilityState.selected`
 * on native — `Chip`'s own contract) in a `role="group"` named by
 * `accessibilityLabel`.
 */
function FilterChipsComponent({
  options,
  value,
  onValueChange,
  allowDeselect = false,
  accessibilityLabel = 'Filters',
  contentInset = 0,
  style,
  testID,
}: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      role="group"
      accessibilityLabel={accessibilityLabel}
      showsHorizontalScrollIndicator={false}
      style={[{ flexGrow: 0 }, style]}
      contentContainerStyle={{
        gap: 8,
        alignItems: 'center',
        paddingLeft: contentInset,
        paddingRight: contentInset,
      }}
      testID={testID}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Chip
            key={option.value}
            size="large"
            variant={selected ? 'solid' : 'subtle'}
            selected={selected}
            onPress={() => {
              if (selected) {
                if (allowDeselect) onValueChange(undefined);
                return;
              }
              onValueChange(option.value);
            }}
            accessibilityLabel={option.label}
            style={{ paddingLeft: 12, paddingRight: 12 }}
            testID={testID ? `${testID}-${option.value}` : undefined}
          >
            {option.label}
          </Chip>
        );
      })}
    </ScrollView>
  );
}

export const FilterChips = memo(FilterChipsComponent);
FilterChips.displayName = 'FilterChips';
