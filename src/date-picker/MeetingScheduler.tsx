import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiFlagLine } from '../icons/remix/RiFlagLine';
import { RiGlobalLine } from '../icons/remix/RiGlobalLine';
import { RiVideoLine } from '../icons/remix/RiVideoLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text, TYPE_SCALE } from '../typography';
import { Calendar } from './Calendar';
import { formatTriggerDate, today } from './calendar-grid';
import type { CalendarPalette } from './palette';
import { PickerShell, usePickerPalette } from './PickerShell';
import type {
  MeetingSchedulerHourFormat,
  MeetingSchedulerProps,
  MeetingSchedulerValue,
} from './types';

/**
 * `MeetingScheduler` (`base/date-picker/meeting-scheduler.tsx`): a
 * Calendly-style booking popup opened from a picker trigger.
 *
 *   trigger        the pickers' trigger + a 16px chevron that turns over while open
 *   popup          8 below the trigger, end-aligned; 429 tall, three columns 16 apart
 *   host column    207 wide, 16 top/bottom/left, 16 between blocks:
 *                    avatar md (blue initials) over name / email (body-medium)
 *                    title (title-3-medium) over description (body-2-medium, secondary)
 *                    info rows pinned to the bottom, 12 apart: 20px icon, 5 gap
 *   calendar       the month panel, 8 top / 12 bottom, then 12 to the footer:
 *                    a bordered summary chip (date + secondary time), "Send meeting"
 *   slots column   170 wide, 16 top/right, 12 between rows:
 *                    timezone row (globe + name, chevron at the end)
 *                    day chip (tertiary, `Mo 16`) + 12h/24h toggle
 *                    half-hour slots, 8 apart, radius 10, 6/8 inset, centred;
 *                    the chosen one tertiary, hover secondary-hover; the list
 *                    fades in under a 16px top mask and scrolls
 *
 * Nothing is committed until "Send meeting", which needs a time. Where the window
 * is too narrow for the 700px row (a phone, the native sheet) the three
 * columns stack.
 */

const POPUP_HEIGHT = 429;
const HOST_WIDTH = 207;
const SLOTS_WIDTH = 170;
const COLUMN_GAP = 16;
/** 16 + 207 + 16 + 326 panel + 16 + 170 + 16. */
const WIDE_WIDTH = 16 + HOST_WIDTH + COLUMN_GAP + 326 + COLUMN_GAP + SLOTS_WIDTH + 16;

const IS_WEB = Platform.OS === 'web';
const BODY_MEDIUM: TextStyle = TYPE_SCALE['body-medium'];

/** Tailwind `shadow-2xs`, with a dark override in dark mode. */
const SHADOW_2XS = { light: '0 1px rgb(0 0 0 / 0.05)', dark: '0 1px rgb(0 0 0 / 0.16)' } as const;

/** `transition-colors duration-150 ease`. Web only. */
const COLOR_TRANSITION: WebCssStyle | null = IS_WEB
  ? {
      transitionProperty: 'background-color, color',
      transitionDuration: '150ms',
      transitionTimingFunction: 'ease',
    }
  : null;

/** 09:00 … 18:30 every half hour — the generated slot range. */
function defaultTimeSlots(): string[] {
  const slots: string[] = [];
  for (let minutes = 9 * 60; minutes <= 18 * 60 + 30; minutes += 30) {
    slots.push(
      `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
    );
  }
  return slots;
}

function formatTime(time: string, format: MeetingSchedulerHourFormat): string {
  if (format === '24h') return time;
  const [h = 0, m = 0] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function weekdayShort(date: Date, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).slice(0, 2);
  } catch {
    return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getDay()] ?? '';
  }
}

// ---------------------------------------------------------------------------
//  Chevron — `ChevronDownSmall` (16-unit, 2px round-capped stroke)
// ---------------------------------------------------------------------------

function ChevronDownSmall({
  size = 16,
  color,
  open = false,
}: {
  size?: number;
  color: string;
  open?: boolean;
}) {
  const transform: WebCssStyle = {
    transform: [{ rotate: open ? '180deg' : '0deg' }],
    ...(IS_WEB
      ? { transitionProperty: 'transform', transitionDuration: '200ms', transitionTimingFunction: 'ease' }
      : null),
  };
  return (
    <View style={transform} aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          d="M4 7L7.29289 10.2929C7.68342 10.6834 8.31658 10.6834 8.70711 10.2929L12 7"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

/**
 * The trigger's trailing glyph. `Button` takes an icon COMPONENT, so the open
 * state and colour reach it through context rather than props; it keeps the
 * 20px slot `Button` sizes and centres the 16px chevron in it.
 */
const TriggerChevronContext = createContext<{ open: boolean; color: string }>({
  open: false,
  color: 'currentColor',
});

function TriggerChevron({ width = 20 }: { width?: number; height?: number; fill?: string }) {
  const { open, color } = useContext(TriggerChevronContext);
  return (
    <View style={{ width, height: width, alignItems: 'center', justifyContent: 'center' }}>
      <ChevronDownSmall color={color} open={open} />
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Parts
// ---------------------------------------------------------------------------

function InfoRow({
  icon,
  children,
  palette,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  palette: CalendarPalette;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <Text style={[BODY_MEDIUM, { color: palette.text, flexShrink: 1 }]}>{children}</Text>
    </View>
  );
}

function HourFormatToggle({
  value,
  onChange,
  palette,
  shadow,
}: {
  value: MeetingSchedulerHourFormat;
  onChange: (value: MeetingSchedulerHourFormat) => void;
  palette: CalendarPalette;
  shadow: string;
}) {
  return (
    <View role="radiogroup" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 2 }}>
      {(['12h', '24h'] as const).map((label) => (
        <HourFormatOption
          key={label}
          label={label}
          selected={value === label}
          onPress={() => onChange(label)}
          palette={palette}
          shadow={shadow}
        />
      ))}
    </View>
  );
}

function HourFormatOption({
  label,
  selected,
  onPress,
  palette,
  shadow,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  palette: CalendarPalette;
  shadow: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      role="radio"
      accessibilityLabel={label}
      aria-checked={selected}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        COLOR_TRANSITION,
        {
          borderRadius: 6,
          paddingLeft: 10,
          paddingRight: 10,
          paddingTop: 4,
          paddingBottom: 4,
          backgroundColor: selected ? palette.panel : 'transparent',
          boxShadow: selected ? shadow : undefined,
        },
      ]}
    >
      <Text
        style={[
          BODY_MEDIUM,
          COLOR_TRANSITION,
          { color: selected || hovered ? palette.text : palette.secondaryText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SlotButton({
  label,
  selected,
  onPress,
  palette,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  palette: CalendarPalette;
  testID?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      role="radio"
      accessibilityLabel={label}
      aria-checked={selected}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      testID={testID}
      style={[
        COLOR_TRANSITION,
        {
          width: '100%',
          flexShrink: 0,
          borderRadius: 10,
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 6,
          paddingBottom: 6,
          alignItems: 'center',
          backgroundColor: selected ? palette.tertiary : hovered ? palette.hover : 'transparent',
        },
      ]}
    >
      <Text style={[BODY_MEDIUM, { color: palette.text, textAlign: 'center' }]}>{label}</Text>
    </Pressable>
  );
}

function TimezoneRow({
  timezone,
  onPress,
  palette,
}: {
  timezone: string;
  onPress?: () => void;
  palette: CalendarPalette;
}) {
  const content = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 }}>
        <RiGlobalLine width={20} height={20} fill={palette.text} />
        <Text numberOfLines={1} style={[BODY_MEDIUM, { color: palette.text, flexShrink: 1 }]}>
          {timezone}
        </Text>
      </View>
      <ChevronDownSmall color={palette.secondaryText} />
    </>
  );
  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
  };
  return onPress ? (
    <Pressable
      role="button"
      accessibilityLabel={timezone}
      aria-haspopup="menu"
      onPress={onPress}
      style={rowStyle}
    >
      {content}
    </Pressable>
  ) : (
    <View style={rowStyle}>{content}</View>
  );
}

// ---------------------------------------------------------------------------
//  MeetingScheduler
// ---------------------------------------------------------------------------

export function MeetingScheduler({
  host,
  meeting,
  timezone,
  onTimezonePress,
  timeSlots,
  value,
  defaultValue,
  onChange,
  defaultHourFormat = '24h',
  triggerLabel = 'Schedule a meeting',
  accessibilityLabel = 'Schedule meeting',
  labels,
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
}: MeetingSchedulerProps) {
  const theme = useTheme();
  const palette = usePickerPalette();
  const { width: windowWidth } = useWindowDimensions();
  const slots = useMemo(() => timeSlots ?? defaultTimeSlots(), [timeSlots]);
  const [committed, setCommitted] = useControllableState<MeetingSchedulerValue | null>({
    value,
    defaultValue: defaultValue === undefined ? { date: today(), time: null } : defaultValue,
    onChange,
  });
  const [pending, setPending] = useState<MeetingSchedulerValue | null>(committed);
  const [hourFormat, setHourFormat] = useState<MeetingSchedulerHourFormat>(defaultHourFormat);
  const [calendarKey, setCalendarKey] = useState(0);
  const [open, setOpenState] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  // Every open starts again from the committed booking.
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setPending(committed);
      setCalendarKey((key) => key + 1);
    }
  }

  const wide = windowWidth >= WIDE_WIDTH + 32;
  const shadow2xs = theme.isDark ? SHADOW_2XS.dark : SHADOW_2XS.light;
  const sendLabel = labels?.send ?? 'Send meeting';
  const durationText = (labels?.duration ?? ((n: number) => `${n} minutes`))(meeting.durationMinutes);
  const chevron = useMemo(() => ({ open, color: palette.secondaryText }), [open, palette.secondaryText]);

  const hostColumn = (
    <View
      style={{
        width: wide ? HOST_WIDTH : undefined,
        flexShrink: 0,
        gap: 16,
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 16,
        paddingRight: wide ? 0 : 16,
      }}
    >
      <View style={{ alignItems: 'flex-start', gap: 8 }}>
        <Avatar
          size="md"
          color="blue"
          initials={host.avatarInitial ?? host.name.slice(0, 1)}
          source={host.avatarSource}
          name={host.name}
        />
        <View>
          <Text style={[BODY_MEDIUM, { color: palette.text }]}>{host.name}</Text>
          <Text style={[BODY_MEDIUM, { color: palette.secondaryText }]}>{host.email}</Text>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Text role="heading" style={[TYPE_SCALE['title-3-medium'], { color: palette.text }]}>
          {meeting.title}
        </Text>
        {meeting.description ? (
          <Text style={[TYPE_SCALE['body-2-medium'], { color: palette.secondaryText }]}>
            {meeting.description}
          </Text>
        ) : null}
      </View>
      <View style={{ marginTop: wide ? 'auto' : 0, gap: 12 }}>
        <InfoRow icon={<RiGlobalLine width={20} height={20} fill={palette.text} />} palette={palette}>
          {durationText}
        </InfoRow>
        {meeting.language ? (
          <InfoRow icon={<RiFlagLine width={20} height={20} fill={palette.text} />} palette={palette}>
            {meeting.language}
          </InfoRow>
        ) : null}
        {meeting.conferencing ? (
          <InfoRow
            icon={meeting.conferencingIcon ?? <RiVideoLine width={20} height={20} fill={palette.text} />}
            palette={palette}
          >
            {meeting.conferencing}
          </InfoRow>
        ) : null}
      </View>
    </View>
  );

  const calendarColumn = (
    <View style={{ gap: 12, paddingTop: 8, paddingBottom: 12, alignItems: wide ? undefined : 'center' }}>
      <Calendar
        key={calendarKey}
        value={pending?.date ?? null}
        onChange={(date) => setPending((prev) => ({ date, time: prev?.time ?? null }))}
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
          alignSelf: 'stretch',
          gap: 12,
        }}
      >
        {/* The summary chip: always drawn — empty with no day. */}
        <View
          testID={testID ? `${testID}-summary` : undefined}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: palette.chipBorder,
            backgroundColor: palette.panel,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 8,
            paddingBottom: 8,
            boxShadow: palette.shadowXs,
          }}
        >
          {pending ? (
            <>
              <Text style={[BODY_MEDIUM, { color: palette.text }]}>
                {formatTriggerDate(pending.date, locale)}
              </Text>
              <Text style={[BODY_MEDIUM, { color: palette.secondaryText }]}>
                {pending.time ?? labels?.selectTime ?? 'Select a time'}
              </Text>
            </>
          ) : null}
        </View>
        <Button onPress={() => {
            // Guarded here too, not only by `disabled`: a booking needs a time.
            if (!pending?.time) return;
            setCommitted(pending);
            setOpenState(false);
          }} disabled={!pending?.time} testID={testID ? `${testID}-send` : undefined}>
          {sendLabel}
        </Button>
      </View>
    </View>
  );

  const slotList = slots.map((slot) => (
    <SlotButton
      key={slot}
      label={formatTime(slot, hourFormat)}
      selected={pending?.time === slot}
      onPress={() => setPending((prev) => ({ date: prev?.date ?? today(), time: slot }))}
      palette={palette}
      testID={testID ? `${testID}-slot-${slot}` : undefined}
    />
  ));

  // `mask-image: linear-gradient(to bottom, transparent, black 16px)` — the list
  // fades out under the toggle row as it scrolls. Web only; native has no mask.
  const maskStyle: WebCssStyle | null = IS_WEB
    ? {
        maskImage: 'linear-gradient(to bottom, transparent, black 16px, black 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 16px, black 100%)',
      }
    : null;

  const slotsColumn = (
    <View
      style={{
        width: wide ? SLOTS_WIDTH : undefined,
        height: wide ? '100%' : undefined,
        flexShrink: 0,
        gap: 12,
        overflow: 'hidden',
        paddingTop: wide ? 16 : 0,
        paddingRight: 16,
        paddingLeft: wide ? 0 : 16,
        paddingBottom: wide ? 0 : 16,
      }}
    >
      <TimezoneRow timezone={timezone} onPress={onTimezonePress} palette={palette} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {pending ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              borderRadius: 10,
              backgroundColor: palette.tertiary,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 4,
              paddingBottom: 4,
            }}
          >
            <Text style={[BODY_MEDIUM, { color: palette.text }]}>
              {weekdayShort(pending.date, locale)}
            </Text>
            <Text style={[BODY_MEDIUM, { color: palette.secondaryText }]}>
              {pending.date.getDate()}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <HourFormatToggle
          value={hourFormat}
          onChange={setHourFormat}
          palette={palette}
          shadow={shadow2xs}
        />
      </View>
      {wide ? (
        <ScrollView
          role="radiogroup"
          accessibilityLabel={accessibilityLabel}
          style={[{ flex: 1, minHeight: 0 }, maskStyle]}
          contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
        >
          {slotList}
        </ScrollView>
      ) : (
        <View role="radiogroup" accessibilityLabel={accessibilityLabel} style={{ gap: 8 }}>
          {slotList}
        </View>
      )}
    </View>
  );

  return (
    <TriggerChevronContext.Provider value={chevron}>
      <PickerShell
        open={open}
        onOpenChange={setOpenState}
        triggerText={triggerLabel}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        palette={palette}
        style={style}
        testID={testID}
        trailingIcon={TriggerChevron}
        sideOffset={8}
      >
        {wide ? (
          <View
            testID={testID ? `${testID}-panel` : undefined}
            style={{ flexDirection: 'row', height: POPUP_HEIGHT, gap: COLUMN_GAP }}
          >
            {hostColumn}
            {calendarColumn}
            {slotsColumn}
          </View>
        ) : (
          <ScrollView testID={testID ? `${testID}-panel` : undefined} style={{ maxHeight: 640 }}>
            {hostColumn}
            {calendarColumn}
            {slotsColumn}
          </ScrollView>
        )}
      </PickerShell>
    </TriggerChevronContext.Provider>
  );
}
