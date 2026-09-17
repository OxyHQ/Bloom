import React, { memo } from 'react';
import { View } from 'react-native';

import { Chip } from '../chip';
import { Calendar } from '../date-picker';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DEFAULT_CONTRACT_LENGTHS, DEFAULT_MOVE_IN_LABELS } from './constants';
import type { MoveInPickerProps, MoveInTiming } from './types';

/**
 * When a renter moves in, for a search panel: a single-day `Calendar`, a
 * "Flexible" / "As soon as possible" chip pair, then the contract length.
 *
 *   headings    body-semibold, text-primary, 12 above their content
 *   calendar    Bloom's `Calendar` (one month, single day)
 *   chips       Bloom `Chip`s (`large`, `outlined`; the chosen one takes the
 *               brand tone), wrapped 8 apart
 *   sections    20 apart
 *
 * ONE ANSWER TO "WHEN": a day, "Flexible" or "As soon as possible". Picking a
 * day sets `timing: 'date'`; a timing chip sets its timing and clears the day,
 * and pressing it again returns to `date` (with no day). The calendar shows no
 * selection while a chip is chosen. The contract length is independent and
 * single-select.
 */
function MoveInPickerComponent({
  value,
  onValueChange,
  contractLengths = DEFAULT_CONTRACT_LENGTHS,
  labels: labelOverrides,
  defaultMonth,
  minDate,
  maxDate,
  isDateUnavailable,
  weekStartsOn,
  locale,
  style,
  testID,
}: MoveInPickerProps) {
  const theme = useTheme();
  const labels = { ...DEFAULT_MOVE_IN_LABELS, ...labelOverrides };

  const heading = (text: string) => (
    <Text variant="body-semibold" role="heading" style={{ color: theme.colors.text }}>
      {text}
    </Text>
  );

  const timingChip = (timing: Exclude<MoveInTiming, 'date'>, label: string) => {
    const selected = value.timing === timing;
    return (
      <Chip
        size="large"
        variant="outlined"
        selected={selected}
        onPress={() => onValueChange({ ...value, timing: selected ? 'date' : timing, date: null })}
        testID={testID ? `${testID}-${timing}` : undefined}
        style={{ paddingHorizontal: 12, height: 32 }}
      >
        {label}
      </Chip>
    );
  };

  return (
    <View testID={testID} style={[{ gap: 20 }, style]}>
      <View style={{ gap: 12 }}>
        {heading(labels.date)}
        <Calendar
          value={value.timing === 'date' ? value.date : null}
          onChange={(date) => onValueChange({ ...value, timing: 'date', date })}
          defaultMonth={defaultMonth}
          minDate={minDate}
          maxDate={maxDate}
          isDateUnavailable={isDateUnavailable}
          weekStartsOn={weekStartsOn}
          locale={locale}
          accessibilityLabel={labels.date}
          testID={testID ? `${testID}-calendar` : undefined}
        />
        <View role="group" accessibilityLabel={labels.date} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {timingChip('flexible', labels.flexible)}
          {timingChip('asap', labels.asap)}
        </View>
      </View>
      <View style={{ gap: 12 }}>
        {heading(labels.contractLength)}
        <View
          role="group"
          accessibilityLabel={labels.contractLength}
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
        >
          {contractLengths.map((option) => (
            <Chip
              key={option.value}
              size="large"
              variant="outlined"
              selected={option.value === value.contractLength}
              onPress={() => onValueChange({ ...value, contractLength: option.value })}
              testID={testID ? `${testID}-length-${option.value}` : undefined}
              style={{ paddingHorizontal: 12, height: 32 }}
            >
              {option.label}
            </Chip>
          ))}
        </View>
      </View>
    </View>
  );
}

export const MoveInPicker = memo(MoveInPickerComponent);
MoveInPicker.displayName = 'MoveInPicker';
