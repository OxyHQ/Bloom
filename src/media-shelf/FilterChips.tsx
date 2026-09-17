import React, { memo } from 'react';

import { Chip, ChipRow } from '../chip';
import type { FilterChipsProps } from './types';

/**
 * The single-select pill row above a feed: "All", "Music", "Podcasts"…
 *
 *   chip        `Chip` size `xl` (32 tall, full pill, 12px sides)
 *   rest        subtle neutral fill, text colour
 *   selected    the SUBTLE brand tint — `Chip`'s own selected pill
 *   gap         8; a `ChipRow`, so it scrolls sideways with an edge fade
 *
 * Two things here were wrong and are not preserved. It asked for
 * `variant="solid"` when selected, which is the one filter row in the library
 * that shouted its selection where every other one tints it; and it overrode
 * the side padding with `paddingLeft`/`paddingRight` against a base that
 * spells it `paddingHorizontal`, so on WEB the override dropped and the pills
 * drew at 6 — react-native-web ranks `padding-inline` above `padding-left`
 * whatever the array order. Native got 12, web got 6, and nothing failed. The
 * `xl` rung carries the 12 for both.
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
    <ChipRow
      role="group"
      accessibilityLabel={accessibilityLabel}
      contentInset={contentInset}
      style={style}
      testID={testID}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Chip
            key={option.value}
            size="xl"
            selected={selected}
            onPress={() => {
              if (selected) {
                if (allowDeselect) onValueChange(undefined);
                return;
              }
              onValueChange(option.value);
            }}
            accessibilityLabel={option.label}
            testID={testID ? `${testID}-${option.value}` : undefined}
          >
            {option.label}
          </Chip>
        );
      })}
    </ChipRow>
  );
}

export const FilterChips = memo(FilterChipsComponent);
FilterChips.displayName = 'FilterChips';
