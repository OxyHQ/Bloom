import React, { memo } from 'react';
import { View } from 'react-native';

import { DatePicker } from '../date-picker';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { SwitchFilterRow } from './SwitchFilterRow';
import type { AvailabilityFilterProps } from './types';

/**
 * When the home has to be free: an "Available now" `SwitchFilterRow`, and under
 * it an "Available from" row with Bloom's `DatePicker`.
 *
 *   rows     24 apart; the date row's title body-medium on the left, the
 *            picker trigger on the right
 *   now on   the title turns text-secondary, the picker is disabled and its day ignored — "now" already means
 *            the earliest possible date. The app keeps `date`, so turning the
 *            switch off brings the chosen day back.
 */
function AvailabilityFilterComponent({
  availableNow,
  onAvailableNowChange,
  date,
  onDateChange,
  availableNowLabel = 'Available now',
  availableNowDescription = 'Ready to move in today',
  dateLabel = 'Available from',
  datePlaceholder = 'Any date',
  minDate,
  locale,
  disabled = false,
  style,
  testID,
}: AvailabilityFilterProps) {
  const theme = useTheme();
  return (
    <View testID={testID} style={[{ gap: 24 }, style]}>
      <SwitchFilterRow
        title={availableNowLabel}
        description={availableNowDescription}
        value={availableNow}
        onValueChange={onAvailableNowChange}
        disabled={disabled}
        testID={testID ? `${testID}-now` : undefined}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Text variant="body-medium" style={{ flex: 1, minWidth: 0, color: availableNow ? theme.colors.textSecondary : theme.colors.text }}>
          {dateLabel}
        </Text>
        <DatePicker
          value={availableNow ? null : date}
          onChange={onDateChange}
          placeholder={datePlaceholder}
          accessibilityLabel={dateLabel}
          disabled={disabled || availableNow}
          minDate={minDate}
          locale={locale}
          testID={testID ? `${testID}-date` : undefined}
        />
      </View>
    </View>
  );
}

export const AvailabilityFilter = memo(AvailabilityFilterComponent);
AvailabilityFilter.displayName = 'AvailabilityFilter';
