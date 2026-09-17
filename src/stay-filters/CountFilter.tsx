import React, { memo } from 'react';
import { ScrollView, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { FilterChip } from './FilterChip';
import type { CountFilterProps } from './types';

/**
 * A minimum count ("Bedrooms") picked from a row of pills: "Any", then
 * `min`..`max`, the last reading `8+`.
 *
 *   title   body-regular, text-primary, 16 above the pills
 *   pills   the filter pill (40 tall, full pill), 8 apart; the selected one is
 *           inverted. One row that scrolls sideways when it does not fit, so the
 *           counts stay in reading order on a narrow screen instead of wrapping.
 *
 * Single select, and never empty: "Any" is the `null` value. A `radiogroup` of
 * `radio`s, named by `title` — each pill names only its number.
 *
 * For an exact count the user nudges rather than picks (beds on a small
 * screen), `StepperRow` from `@oxy.so/bloom/stepper` is the alternative.
 */
function CountFilterComponent({
  title,
  value,
  onValueChange,
  max = 8,
  min = 1,
  anyLabel = 'Any',
  formatCount = (n, isMax) => (isMax ? `${n}+` : String(n)),
  accessibilityLabel,
  disabled = false,
  style,
  testID,
}: CountFilterProps) {
  const theme = useTheme();
  const name = accessibilityLabel ?? (typeof title === 'string' ? title : undefined);
  const counts: number[] = [];
  for (let n = min; n <= max; n += 1) counts.push(n);

  return (
    <View testID={testID} style={[{ gap: 16 }, style]}>
      {typeof title === 'string' ? (
        <Text variant="body-regular" style={{ color: theme.colors.text }}>
          {title}
        </Text>
      ) : (
        title
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        role="radiogroup"
        accessibilityLabel={name}
        aria-disabled={disabled || undefined}
        // 4px of room on every side so a pill's focus ring is not clipped by the
        // scroller, taken back out with negative margins so the pills still
        // line up with the title.
        style={{ marginTop: -4, marginBottom: -4, marginLeft: -4, marginRight: -4 }}
        contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingTop: 4, paddingBottom: 4, paddingLeft: 4, paddingRight: 4 }}
      >
        <FilterChip
          mode="radio"
          label={anyLabel}
          selected={value == null}
          onPress={() => onValueChange(null)}
          disabled={disabled}
          testID={testID ? `${testID}-any` : undefined}
        />
        {counts.map((n) => (
          <FilterChip
            key={n}
            mode="radio"
            label={formatCount(n, n === max)}
            selected={value === n}
            onPress={() => onValueChange(n)}
            disabled={disabled}
            testID={testID ? `${testID}-${n}` : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export const CountFilter = memo(CountFilterComponent);
CountFilter.displayName = 'CountFilter';
