import React, { memo } from 'react';

import { ChipRow } from '../chip';
import { SelectChip } from '../listing-actions/parts';
import { Text } from '../typography';
import { DELIVERY_DAY_LABEL } from './constants';
import type { DeliverySlotDaysProps } from './types';

/**
 * The days across the top: which day's windows are listed below.
 *
 *   tile     `SelectChip shape="day"` — 56 wide, radius 12, a hairline at rest,
 *            a neutral wash under a pointer, INVERTED when chosen
 *   text     the weekday caption-1-regular over the date headline-semibold in
 *            tabular figures, so a two-digit date does not widen the tile
 *   strip    `ChipRow`, 8 apart, which supplies the sideways scroll, the fade
 *            at whichever edge has more behind it, and the room a focus ring
 *            needs so the outline is not clipped by its own scroller
 *   unavailable  struck through at the disabled opacity, not pressable
 *
 * Both parts are the library's. `SelectChip` is the day tile Bloom already
 * draws for scheduling a viewing — a day picked out of a strip is one thing,
 * not one per app — and `ChipRow` is the sideways scroller five filter rows
 * share. Nothing here is a new shape.
 *
 * It announces as a `radiogroup` of `radio`s, which is what the control IS: one
 * day of several, exactly one chosen. The WINDOWS are their own group — two
 * choices, two groups, rather than one group a reader has to infer the halves
 * of.
 */
function DeliverySlotDaysComponent({
  days,
  value,
  onChange,
  accessibilityLabel = DELIVERY_DAY_LABEL,
  disabled = false,
  fadeColor,
  style,
  testID,
}: DeliverySlotDaysProps) {
  return (
    <ChipRow
      role="radiogroup"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      fadeColor={fadeColor}
      gap={8}
      style={style}
      testID={testID}
    >
      {days.map((d) => {
        const unavailable = disabled || d.disabled === true;
        return (
          <SelectChip
            key={d.id}
            shape="day"
            selected={d.id === value}
            disabled={unavailable}
            onPress={onChange ? () => onChange(d.id) : undefined}
            accessibilityLabel={d.accessibilityLabel ?? `${d.weekday} ${d.day}`}
            testID={d.testID ?? (testID ? `${testID}-${d.id}` : undefined)}
          >
            {(ink) => (
              <>
                <Text variant="caption-1-regular" style={{ color: ink }}>
                  {d.weekday}
                </Text>
                <Text
                  variant="headline-semibold"
                  style={{
                    color: ink,
                    fontVariant: ['tabular-nums'],
                    textDecorationLine: unavailable ? 'line-through' : 'none',
                  }}
                >
                  {d.day}
                </Text>
              </>
            )}
          </SelectChip>
        );
      })}
    </ChipRow>
  );
}

export const DeliverySlotDays = memo(DeliverySlotDaysComponent);
DeliverySlotDays.displayName = 'DeliverySlotDays';
