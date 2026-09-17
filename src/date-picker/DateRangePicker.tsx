import React, { useMemo, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions, type TextStyle } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text, TYPE_SCALE } from '../typography';
import {
  daysInRange,
  formatTriggerDate,
  isSameRange,
  quickSelectPresets,
} from './calendar-grid';
import { RangeCalendar } from './Calendar';
import { MONTH_PANEL_WIDTH } from './CalendarMonth';
import { DateChipInput } from './DateChipInput';
import type { CalendarPalette } from './palette';
import { PickerActions, PickerShell, usePickerPalette } from './PickerShell';
import { SummaryPresence } from './SummaryPresence';
import type { DateRange, DateRangePickerProps } from './types';

/**
 * `DateRangePicker`: a quick-select column, two adjacent months, and a
 * footer with the start/end chips, an "N days selected" pill and Cancel /
 * Apply.
 *
 *   quick select     118 wide, 16 from the top and left, rows 6 apart
 *   preset row       6 / 8 inset, radius 10, 14/20
 *   months           8 apart, inside an 8 / 8 / 12 inset
 *   footer           12 above, 16 right; chips 5 apart around a "-", pill radius 12
 *
 * Like `DatePicker`, the choice is pending until Apply. The popup only shows two
 * months where it has room for them (a phone gets one), and the chips and pill
 * drop in with the summary motion (`SummaryPresence`).
 */

/** 16 + 118 + 12 + two panels + 8 between them + 8 — the popup width. */
const DUAL_MONTH_WIDTH = 16 + 118 + 12 + MONTH_PANEL_WIDTH * 2 + 8 + 8;

/** `text-body-medium`, in Inter. */
const BODY: TextStyle = TYPE_SCALE['body-medium'];

/** The preset row's `transition-colors duration-150 ease`. Web only. */
const PRESET_TRANSITION: WebCssStyle | null = Platform.OS === 'web'
  ? { transitionProperty: 'background-color', transitionDuration: '150ms', transitionTimingFunction: 'ease' }
  : null;

function PresetRow({
  label,
  active,
  onPress,
  palette,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  palette: CalendarPalette;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      // A toggle-shaped row: `aria-pressed` for web, `selected` for native.
      aria-pressed={active}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[PRESET_TRANSITION, {
        width: '100%',
        borderRadius: 10,
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 8,
        paddingRight: 8,
        backgroundColor: active ? palette.tertiary : hovered ? palette.hover : 'transparent',
      }]}
    >
      <Text style={{ ...BODY, color: palette.text }}>{label}</Text>
    </Pressable>
  );
}

export function DateRangePicker({
  value,
  defaultValue = null,
  onChange,
  placeholder = 'Select date range',
  accessibilityLabel = 'Date range',
  quickSelect = true,
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
}: DateRangePickerProps) {
  const palette = usePickerPalette();
  const { width: windowWidth } = useWindowDimensions();
  const [committed, setCommitted] = useControllableState<DateRange | null>({
    value,
    defaultValue,
    onChange,
  });
  const [pending, setPending] = useState<DateRange | null>(committed);
  const [calendarKey, setCalendarKey] = useState(0);
  const [open, setOpenState] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const presets = useMemo(() => quickSelectPresets(), []);

  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setPending(committed);
      setCalendarKey((key) => key + 1);
    }
  }

  const dual = windowWidth >= DUAL_MONTH_WIDTH + 32;
  const showQuickSelect = quickSelect && dual;
  const choose = (range: DateRange) => {
    setPending(range);
    // Remount so the calendar pages to a preset's months.
    setCalendarKey((key) => key + 1);
  };
  const triggerText = committed
    ? `${formatTriggerDate(committed.start, locale)} - ${formatTriggerDate(committed.end, locale)}`
    : placeholder;
  const days = pending ? daysInRange(pending) : 0;

  return (
    <PickerShell
      open={open}
      onOpenChange={setOpenState}
      triggerText={triggerText}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      palette={palette}
      style={style}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {showQuickSelect ? (
          <View style={{ paddingTop: 16, paddingLeft: 16 }}>
            <View style={{ width: 118, gap: 6 }}>
              {presets.map((preset) => (
                <PresetRow
                  key={preset.label}
                  label={preset.label}
                  active={isSameRange(pending, preset.range)}
                  onPress={() => choose(preset.range)}
                  palette={palette}
                />
              ))}
            </View>
          </View>
        ) : null}
        <View
          style={{
            paddingTop: 8,
            paddingRight: 8,
            paddingBottom: 12,
            paddingLeft: showQuickSelect ? 0 : 8,
          }}
        >
          <RangeCalendar
            key={calendarKey}
            value={pending}
            onChange={setPending}
            visibleMonths={dual ? 2 : 1}
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
              flexWrap: dual ? 'nowrap' : 'wrap',
              gap: dual ? 0 : 12,
              paddingTop: 12,
              paddingRight: 16,
              paddingLeft: showQuickSelect ? 0 : 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <SummaryPresence
                show={pending != null}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {pending ? (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <DateChipInput
                        date={pending.start}
                        label="Start date"
                        palette={palette}
                        onCommit={(start) =>
                          setPending({ start, end: start > pending.end ? start : pending.end })
                        }
                      />
                      <Text style={{ ...BODY, color: palette.secondaryText }}>-</Text>
                      <DateChipInput
                        date={pending.end}
                        label="End date"
                        palette={palette}
                        onCommit={(end) =>
                          setPending({ start: end < pending.start ? end : pending.start, end })
                        }
                      />
                    </View>
                    {dual ? (
                      <View
                        style={{
                          borderRadius: 12,
                          backgroundColor: palette.tertiary,
                          paddingTop: 8,
                          paddingBottom: 8,
                          paddingLeft: 8,
                          paddingRight: 8,
                        }}
                      >
                        <Text style={{ ...BODY, color: palette.secondaryText }}>
                          {days} day{days === 1 ? '' : 's'} selected
                        </Text>
                      </View>
                    ) : null}
                  </>
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
      </View>
    </PickerShell>
  );
}
