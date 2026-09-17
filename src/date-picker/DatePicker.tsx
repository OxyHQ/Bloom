import React, { useState } from 'react';
import { View } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import { Calendar } from './Calendar';
import { formatTriggerDate } from './calendar-grid';
import { DateChipInput } from './DateChipInput';
import { PickerActions, PickerShell, usePickerPalette } from './PickerShell';
import { SummaryPresence } from './SummaryPresence';
import type { DatePickerProps } from './types';

/**
 * A trigger that opens
 * one month plus a footer — the editable `DD/MM/YYYY` chip for the pending day,
 * then Cancel / Apply.
 *
 *   popup inset      8 / 8 / 12 / 8   (top / right / bottom / left)
 *   footer           12 above, 16 either side, chip left, actions right
 *
 * The choice is PENDING until Apply: pressing a day only moves the pending day,
 * Cancel restores the committed one, and every open starts again from it.
 *
 * The chip drops in and out (`SummaryPresence`: 12px, fade,
 * 250ms with a slight overshoot).
 */
export function DatePicker({
  value,
  defaultValue = null,
  onChange,
  placeholder = 'Select date',
  accessibilityLabel = 'Date',
  disabled,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  minDate,
  maxDate,
  isDateUnavailable,
  weekStartsOn,
  locale,
  style,
  testID,
}: DatePickerProps) {
  const palette = usePickerPalette();
  const [committed, setCommitted] = useControllableState<Date | null>({
    value,
    defaultValue,
    onChange,
  });
  const [pending, setPending] = useState<Date | null>(committed);
  // Re-keys the calendar on every open, so it shows the committed day's month
  // rather than wherever it was left.
  const [openCount, setOpenCount] = useState(0);
  const [open, setOpenState] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  // Every open — from the trigger or from a controlling parent — starts again
  // from the committed day. Adjusted during render, so the first open frame
  // already shows it.
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setPending(committed);
      setOpenCount((count) => count + 1);
    }
  }

  return (
    <PickerShell
      open={open}
      onOpenChange={setOpenState}
      triggerText={committed ? formatTriggerDate(committed, locale) : placeholder}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      palette={palette}
      style={style}
      testID={testID}
    >
      <View style={{ paddingTop: 8, paddingRight: 8, paddingBottom: 12, paddingLeft: 8 }}>
        <Calendar
          key={openCount}
          value={pending}
          onChange={setPending}
          minDate={minDate}
          maxDate={maxDate}
          isDateUnavailable={isDateUnavailable}
          weekStartsOn={weekStartsOn}
          locale={locale}
          accessibilityLabel={accessibilityLabel}
          testID={testID ? `${testID}-calendar` : undefined}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            paddingRight: 16,
            paddingLeft: 16,
          }}
        >
          <View>
            <SummaryPresence show={pending != null}>
              {pending ? (
                <DateChipInput
                  date={pending}
                  label={accessibilityLabel}
                  onCommit={setPending}
                  palette={palette}
                  testID={testID ? `${testID}-chip` : undefined}
                />
              ) : null}
            </SummaryPresence>
          </View>
          <PickerActions
            onCancel={() => {
              setPending(committed);
              setOpenState(false);
            }}
            onApply={() => {
              setCommitted(pending);
              setOpenState(false);
            }}
            applyDisabled={!pending}
            testID={testID}
          />
        </View>
      </View>
    </PickerShell>
  );
}
