import React from 'react';
import { View } from 'react-native';

import { FilterChip } from './FilterChip';
import type { ToggleChipGroupProps } from './types';

/**
 * Multi-select filter pills, wrapped: each option is the filter pill (40 tall,
 * full pill, an optional 18px icon before the label), 8 apart in both
 * directions, the selected ones inverted.
 *
 * A `group` named by `accessibilityLabel`; each pill is a toggle `button` with
 * `aria-pressed` on web and `accessibilityState.selected` on native.
 *
 * The next selection is reported in `options` order, so the value is stable
 * whatever order the user tapped in.
 */
export function ToggleChipGroup<T extends string = string>({
  options,
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
  style,
  testID,
}: ToggleChipGroupProps<T>) {
  const selected = new Set<T>(value);

  const toggle = (item: T) => {
    const next = new Set(selected);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    onValueChange(options.map((o) => o.value).filter((v) => next.has(v)));
  };

  return (
    <View
      testID={testID}
      role="group"
      accessibilityLabel={accessibilityLabel}
      style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}
    >
      {options.map((option) => (
        <FilterChip
          key={option.value}
          mode="toggle"
          label={option.label}
          icon={option.icon}
          selected={selected.has(option.value)}
          onPress={() => toggle(option.value)}
          disabled={disabled || option.disabled}
          testID={testID ? `${testID}-${option.value}` : undefined}
        />
      ))}
    </View>
  );
}

ToggleChipGroup.displayName = 'ToggleChipGroup';
