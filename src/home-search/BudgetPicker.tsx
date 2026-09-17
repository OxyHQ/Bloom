import React, { memo, useCallback } from 'react';
import { View } from 'react-native';

import { Chip } from '../chip';
import { RangeFields } from '../stay-filters/RangeFields';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DEFAULT_BUDGET_PRESETS } from './constants';
import type { BudgetPickerProps, BudgetPreset } from './types';

/**
 * A budget for a search panel: a title, a "Minimum" / "Maximum" pair of fields
 * and a row of preset chips.
 *
 *   title        body-semibold, text-primary; description body-2-regular,
 *                text-secondary, 2 under it
 *   fields       the range filters' floating-label pair, 16 apart, 16 under
 *   presets      Bloom `Chip`s (`large`, `outlined`; the chosen one takes the
 *                brand tone), wrapped 8 apart, 16 under the fields
 *
 * `period` picks the defaults: `month` (rent) presets up to 800 / 800–1,200 /
 * 1,200–1,800 / 1,800+ and a 50 step; `total` (sale) up to 150,000 /
 * 150,000–300,000 / 300,000–600,000 / 600,000+ and a 5,000 step.
 *
 * EITHER END IS OPEN: `null` is no minimum / no maximum. An emptied field
 * commits `null`; a typed amount snaps to `step` and can not pass the other
 * end. A preset chip sets both ends at once; pressing the chosen one again
 * clears the budget. Preset labels are built from `formatAmount` unless given.
 */

/** A preset's chip label from the amount formatter. Pure; exported for the tests. */
export function budgetPresetLabel(preset: BudgetPreset, format: (n: number) => string): string {
  if (preset.label) return preset.label;
  if (preset.min == null && preset.max != null) return `Up to ${format(preset.max)}`;
  if (preset.max == null && preset.min != null) return `${format(preset.min)}+`;
  if (preset.min != null && preset.max != null) return `${format(preset.min)} – ${format(preset.max)}`;
  return 'Any';
}

function BudgetPickerComponent({
  value,
  onValueChange,
  period = 'month',
  presets,
  formatAmount = String,
  title,
  description,
  minLabel = 'Minimum',
  maxLabel = 'Maximum',
  step,
  presetsLabel = 'Budget presets',
  style,
  testID,
}: BudgetPickerProps) {
  const theme = useTheme();
  const items = presets ?? DEFAULT_BUDGET_PRESETS[period];
  const heading = title ?? (period === 'month' ? 'Monthly budget' : 'Price');
  const sub =
    description === undefined ? (period === 'month' ? 'Rent per month, before bills' : 'Total price') : description;

  const onCommit = useCallback(
    (next: [number | null, number | null]) => {
      if (next[0] !== value[0] || next[1] !== value[1]) onValueChange(next);
    },
    [value, onValueChange],
  );

  return (
    <View testID={testID} style={[{ gap: 16 }, style]}>
      <View style={{ gap: 2 }}>
        <Text variant="body-semibold" role="heading" style={{ color: theme.colors.text }}>
          {heading}
        </Text>
        {sub ? (
          <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
            {sub}
          </Text>
        ) : null}
      </View>
      <RangeFields
        value={value}
        onCommit={onCommit}
        format={formatAmount}
        labels={[minLabel, maxLabel]}
        min={0}
        step={step ?? (period === 'month' ? 50 : 5000)}
        nullable
        testID={testID}
      />
      {items.length > 0 ? (
        <View role="group" accessibilityLabel={presetsLabel} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {items.map((preset, index) => {
            const selected = preset.min === value[0] && preset.max === value[1];
            return (
              <Chip
                key={index}
                size="large"
                variant="outlined"
                selected={selected}
                onPress={() => onValueChange(selected ? [null, null] : [preset.min, preset.max])}
                testID={testID ? `${testID}-preset-${index}` : undefined}
                // `paddingHorizontal`, the spelling Chip's base uses — a longhand would lose on web.
                style={{ paddingHorizontal: 12, height: 32 }}
              >
                {budgetPresetLabel(preset, formatAmount)}
              </Chip>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export const BudgetPicker = memo(BudgetPickerComponent);
BudgetPicker.displayName = 'BudgetPicker';
