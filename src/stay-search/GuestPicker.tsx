import React, { memo } from 'react';
import { View } from 'react-native';

import { LinkButton } from '../button';

import { StepperRow } from '../stepper';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { GUEST_KINDS } from './constants';
import { STAY_SEARCH_MESSAGES } from './messages';
import { useGuestPickerClose } from './context';
import { applyGuestCount, minimumAdults } from './guests';
import type { GuestKind, GuestPickerProps } from './types';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';

/** The kinds `maxGuests` counts; infants and pets ride free. */
const COUNTED: readonly GuestKind[] = ['adults', 'children'];

/**
 * Adults / children / infants / pets as `StepperRow`s with hairlines between
 * them — the one guests picker, used by the search bar's "Who" panel and the
 * booking card's guests popover alike. Then an optional note and "Close".
 *
 * The stepper button names travel too: `decrementLabel` / `incrementLabel`
 * reach every row, so the two words a screen reader reads on the eight buttons
 * are translatable like everything else the family draws. Their default is
 * `Stepper`'s own English pair.
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
  decrementLabel,
  incrementLabel,
  note,
  onClose,
  closeLabel: closeLabelProp,
  size,
  style,
  testID,
}: GuestPickerProps) {
  const common = useCommonMessages();
  const { messages } = useMessages(STAY_SEARCH_MESSAGES);
  const closeLabel = closeLabelProp ?? common.close;
  const theme = useTheme();
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
          descriptions && kind in descriptions ? descriptions[kind] : messages.guestDescriptions[kind];
        return (
          <StepperRow
            key={kind}
            title={labels?.[kind] ?? messages.guests[kind]}
            description={description ?? undefined}
            value={value[kind]}
            min={kind === 'adults' ? minimumAdults(value) : 0}
            max={maxFor(kind)}
            size={size}
            decrementLabel={decrementLabel}
            incrementLabel={incrementLabel}
            onValueChange={(n) => onChange(applyGuestCount(value, kind, n))}
            divider={index < kinds.length - 1}
            testID={testID ? `${testID}-${kind}` : undefined}
          />
        );
      })}
      {note != null ? (
        typeof note === 'string' ? (
          <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary, paddingTop: 8 }}>
            {note}
          </Text>
        ) : (
          note
        )
      ) : null}
      {close ? (
        <View style={{ alignItems: 'flex-end', paddingTop: 12 }}>
          <LinkButton  size="sm" onPress={close} testID={testID ? `${testID}-close` : undefined}>
            {closeLabel}
          </LinkButton>
        </View>
      ) : null}
    </View>
  );
}

export const GuestPicker = memo(GuestPickerComponent);
GuestPicker.displayName = 'GuestPicker';
