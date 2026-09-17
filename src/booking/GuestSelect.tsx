import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { StepperRow } from '../stepper';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { BookingLink } from './BookingLink';
import { DEFAULT_GUEST_CATEGORIES } from './constants';
import { useGuestSelectClose } from './context';
import { resolveBookingPalette } from './shared';
import type { GuestSelectProps } from './types';

/**
 * The guests panel: one `StepperRow` per category (hairlines between), an
 * optional note (body-2-regular, text-secondary), and a right-aligned
 * underlined "Close".
 *
 * It is CONTENT, not a surface — `BookingCard` puts it in a `Popover` (a
 * bottom sheet on native) through its `guestSelect` prop; a search bar or a
 * checkout page can put it anywhere.
 *
 * `maxGuests` caps the sum of the categories that count toward it: each of
 * their `+` buttons disables at the cap by lowering that row's `max` to what is
 * left, so the stepper's own clamping enforces it.
 */
function GuestSelectComponent({
  value,
  onValueChange,
  categories = DEFAULT_GUEST_CATEGORIES,
  maxGuests,
  note,
  onClose,
  closeLabel = 'Close',
  style,
  testID,
}: GuestSelectProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveBookingPalette(theme), [theme]);
  const contextClose = useGuestSelectClose();
  const close = onClose ?? contextClose;

  const counted = useMemo(
    () =>
      categories
        .filter((c) => c.countsTowardMax !== false)
        .reduce((sum, c) => sum + (value[c.key] ?? 0), 0),
    [categories, value],
  );

  const change = useCallback(
    (key: string, n: number) => onValueChange({ ...value, [key]: n }),
    [onValueChange, value],
  );

  return (
    <View testID={testID} style={[{ paddingLeft: 8, paddingRight: 8 }, style]}>
      {categories.map((category, index) => {
        const current = value[category.key] ?? 0;
        const min = category.min ?? 0;
        let max = category.max;
        if (maxGuests != null && category.countsTowardMax !== false) {
          const room = current + Math.max(0, maxGuests - counted);
          max = max == null ? room : Math.min(max, room);
        }
        return (
          <StepperRow
            key={category.key}
            title={category.title}
            description={category.description}
            value={current}
            min={min}
            max={max}
            size="small"
            onValueChange={(n) => change(category.key, n)}
            divider={index < categories.length - 1}
            // StepperRow's hairline is neutral-800 in dark — the popover surface
            // itself, so the rows ran together. The panel's own border stop instead.
            style={{ borderBottomColor: palette.border }}
            testID={testID ? `${testID}-${category.key}` : undefined}
          />
        );
      })}
      {note != null ? (
        typeof note === 'string' ? (
          <Text variant="body-2-regular" style={{ color: palette.textSecondary, paddingTop: 8 }}>
            {note}
          </Text>
        ) : (
          note
        )
      ) : null}
      {close ? (
        <View style={{ alignItems: 'flex-end', paddingTop: 16, paddingBottom: 4 }}>
          <BookingLink
            variant="body-semibold"
            onPress={close}
            style={{ alignSelf: 'flex-end' }}
            testID={testID ? `${testID}-close` : undefined}
          >
            {closeLabel}
          </BookingLink>
        </View>
      ) : null}
    </View>
  );
}

export const GuestSelect = memo(GuestSelectComponent);
GuestSelect.displayName = 'GuestSelect';
