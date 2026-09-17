import React, { memo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { StepperRow } from '../stepper';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DEFAULT_GUEST_DESCRIPTIONS, DEFAULT_GUEST_LABELS, GUEST_KINDS } from './constants';
import { useGuestPickerClose } from './context';
import { applyGuestCount, minimumAdults } from './guests';
import type { GuestKind, GuestPickerProps } from './types';

/** The kinds `maxGuests` counts; infants and pets ride free. */
const COUNTED: readonly GuestKind[] = ['adults', 'children'];

/**
 * Adults / children / infants / pets as `StepperRow`s with hairlines between
 * them — the one guests picker, used by the search bar's "Who" panel and the
 * booking card's guests popover alike. Then an optional note and "Close".
 *
 * Two rules:
 *  - while any child, infant or pet is counted, adults cannot go below 1 (the
 *    adults `−` disables there), and adding one of them with no adults sets
 *    adults to 1 — see `applyGuestCount`;
 *  - `maxGuests` caps adults + children: each of their `+` buttons disables at
 *    the cap by lowering that row's `max` to what is left, so the stepper's own
 *    clamping enforces it.
 */
function GuestPickerComponent({
  value,
  onChange,
  max,
  maxGuests,
  kinds = GUEST_KINDS,
  labels,
  descriptions,
  note,
  onClose,
  closeLabel = 'Close',
  size = 'medium',
  style,
  testID,
}: GuestPickerProps) {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  const contextClose = useGuestPickerClose();
  const close = onClose ?? contextClose;
  const counted = COUNTED.reduce((sum, kind) => sum + value[kind], 0);

  const maxFor = (kind: GuestKind) => {
    let cap = typeof max === 'number' ? max : max?.[kind];
    if (maxGuests != null && COUNTED.includes(kind)) {
      const room = value[kind] + Math.max(0, maxGuests - counted);
      cap = cap == null ? room : Math.min(cap, room);
    }
    return cap;
  };

  return (
    <View style={style} testID={testID}>
      {kinds.map((kind, index) => {
        const description =
          descriptions && kind in descriptions ? descriptions[kind] : DEFAULT_GUEST_DESCRIPTIONS[kind];
        return (
          <StepperRow
            key={kind}
            title={labels?.[kind] ?? DEFAULT_GUEST_LABELS[kind]}
            description={description ?? undefined}
            value={value[kind]}
            min={kind === 'adults' ? minimumAdults(value) : 0}
            max={maxFor(kind)}
            size={size}
            onValueChange={(n) => onChange(applyGuestCount(value, kind, n))}
            divider={index < kinds.length - 1}
            testID={testID ? `${testID}-${kind}` : undefined}
          />
        );
      })}
      {note != null ? (
        typeof note === 'string' ? (
          <Text variant="body-2-regular" style={{ color: neutral[500], paddingTop: 8 }}>
            {note}
          </Text>
        ) : (
          note
        )
      ) : null}
      {close ? (
        <View style={{ alignItems: 'flex-end', paddingTop: 12 }}>
          <Button variant="link" size="small" onPress={close} testID={testID ? `${testID}-close` : undefined}>
            {closeLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

export const GuestPicker = memo(GuestPickerComponent);
GuestPicker.displayName = 'GuestPicker';
