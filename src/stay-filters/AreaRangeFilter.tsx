import React, { memo, useCallback } from 'react';
import { View } from 'react-native';

import { RangeSlider } from '../slider';
import { RangeFields } from './RangeFields';
import type { AreaRangeFilterProps } from './types';

/**
 * A floor-area range in square metres: a "Minimum" / "Maximum" pair of fields,
 * with an optional `RangeSlider` above them.
 *
 *   fields   the range filters' floating-label pair, 16 apart
 *   slider   `slider` only: Bloom's `RangeSlider`, no bubbles, 24 above the fields
 *
 * EITHER END IS OPEN. `null` means "no minimum" / "no maximum": an emptied
 * field commits `null`, and the slider reports `null` for a thumb resting on
 * `min` (lower) or `max` (upper), so dragging back to an end removes that
 * bound instead of pinning it. A typed value is snapped to `step` and clamped
 * to its own side of the range, as in `PriceRangeFilter`.
 */
function AreaRangeFilterComponent({
  min = 0,
  max = 500,
  value,
  onValueChange,
  onValueCommit,
  step = 5,
  slider = false,
  formatArea = (n) => `${n} m²`,
  minLabel = 'Minimum',
  maxLabel = 'Maximum',
  accessibilityLabel = 'Area',
  disabled = false,
  style,
  testID,
}: AreaRangeFilterProps) {
  const toOpen = useCallback(
    ([low, high]: [number, number]): [number | null, number | null] => [low <= min ? null : low, high >= max ? null : high],
    [min, max],
  );

  const onFieldCommit = useCallback(
    (next: [number | null, number | null]) => {
      if (next[0] !== value[0] || next[1] !== value[1]) onValueChange(next);
      onValueCommit?.(next);
    },
    [value, onValueChange, onValueCommit],
  );

  return (
    <View testID={testID} role="group" accessibilityLabel={accessibilityLabel} style={[{ width: '100%', gap: 24 }, style]}>
      {slider ? (
        <RangeSlider
          value={[value[0] ?? min, value[1] ?? max]}
          onValueChange={(next) => onValueChange(toOpen(next))}
          onSlidingComplete={onValueCommit ? (next) => onValueCommit(toOpen(next)) : undefined}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          showTooltip={false}
          accessibilityLabel={accessibilityLabel}
          thumbLabels={[minLabel, maxLabel]}
          testID={testID ? `${testID}-slider` : undefined}
        />
      ) : null}
      <RangeFields
        value={value}
        onCommit={onFieldCommit}
        format={formatArea}
        labels={[minLabel, maxLabel]}
        min={min}
        max={max}
        step={step}
        nullable
        disabled={disabled}
        testID={testID}
      />
    </View>
  );
}

export const AreaRangeFilter = memo(AreaRangeFilterComponent);
AreaRangeFilter.displayName = 'AreaRangeFilter';
