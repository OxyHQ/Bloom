import React, { memo } from 'react';
import { View } from 'react-native';

import { StepperRow } from '../stepper';
import { DEFAULT_GUEST_DESCRIPTIONS, DEFAULT_GUEST_LABELS, GUEST_KINDS } from './constants';
import { applyGuestCount, minimumAdults } from './guests';
import type { GuestKind, GuestPickerProps } from './types';

/**
 * Adults / children / infants / pets as `StepperRow`s with hairlines between
 * them. Enforces one rule and only one: while any child, infant or pet is
 * counted, adults cannot go below 1 (the adults `−` disables there), and adding
 * one of them with no adults sets adults to 1 — see `applyGuestCount`.
 */
function GuestPickerComponent({
  value,
  onChange,
  max,
  kinds = GUEST_KINDS,
  labels,
  descriptions,
  style,
  testID,
}: GuestPickerProps) {
  const maxFor = (kind: GuestKind) => (typeof max === 'number' ? max : max?.[kind]);
  return (
    <View style={style}>
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
            onValueChange={(n) => onChange(applyGuestCount(value, kind, n))}
            divider={index < kinds.length - 1}
            testID={testID ? `${testID}-${kind}` : undefined}
          />
        );
      })}
    </View>
  );
}

export const GuestPicker = memo(GuestPickerComponent);
GuestPicker.displayName = 'GuestPicker';
