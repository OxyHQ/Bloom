import React from 'react';
import { View } from 'react-native';

import { Checkbox } from '../checkbox';
import { HOUSING_FEATURE_OPTIONS, relabelOptions } from './constants';
import { ToggleChipGroup } from './ToggleChipGroup';
import type { FeatureFilterProps, HousingFeature, ToggleChipOption } from './types';

/**
 * What the home must have: elevator, parking, terrace, garden, pool,
 * furnished, pets allowed, air conditioning, heating, accessible, storage room
 * (the set and labels overridable). Multi-select.
 *
 *   chips        (default) the filter pills with their icons, wrapped — a
 *                `group` of `aria-pressed` toggles, as `ToggleChipGroup`
 *   checkboxes   two columns of Bloom `Checkbox`es, 16 apart vertically, for a
 *                long list read top to bottom — a `group` of `checkbox`es
 *
 * The next selection is reported in `options` order either way.
 */
export function FeatureFilter<T extends string = HousingFeature>({
  options,
  labels,
  variant = 'chips',
  value,
  onValueChange,
  accessibilityLabel = 'Features',
  disabled = false,
  style,
  testID,
}: FeatureFilterProps<T>) {
  const items = relabelOptions<T, ToggleChipOption<T>>(
    options ?? (HOUSING_FEATURE_OPTIONS as unknown as readonly ToggleChipOption<T>[]),
    labels,
  );

  if (variant === 'chips') {
    return (
      <ToggleChipGroup
        options={items}
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        style={style}
        testID={testID}
      />
    );
  }

  const selected = new Set<T>(value);
  const set = (item: T, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(item);
    else next.delete(item);
    onValueChange(items.map((o) => o.value).filter((v) => next.has(v)));
  };

  return (
    <View
      testID={testID}
      role="group"
      accessibilityLabel={accessibilityLabel}
      style={[{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 }, style]}
    >
      {items.map((option) => (
        <View key={option.value} style={{ width: '50%', paddingRight: 16 }}>
          <Checkbox
            checked={selected.has(option.value)}
            onCheckedChange={(on) => set(option.value, on)}
            label={option.label}
            disabled={disabled || option.disabled}
            testID={testID ? `${testID}-${option.value}` : undefined}
          />
        </View>
      ))}
    </View>
  );
}

FeatureFilter.displayName = 'FeatureFilter';
