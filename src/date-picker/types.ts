import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

/** An inclusive range of calendar days. Both ends are local-midnight `Date`s. */
export interface DateRange {
  start: Date;
  end: Date;
}

/** First column of the grid: `0` Sunday (the default) … `6` Saturday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** What every calendar and picker takes to decide which days can be chosen, and how they read. */
export interface CalendarConstraintProps {
  /** Days before this are disabled. */
  minDate?: Date | null;
  /** Days after this are disabled. */
  maxDate?: Date | null;
  /** Disable arbitrary days (weekends, holidays). */
  isDateUnavailable?: (date: Date) => boolean;
  /** First column of the grid. Defaults to `0` (Sunday). */
  weekStartsOn?: WeekStart;
  /**
   * BCP 47 locale for month, weekday and trigger text, and for Bloom's own
   * strings (Cancel, Apply, …). Defaults to `BloomProvider`'s `locale`, else the
   * runtime's.
   */
  locale?: string;
}

/**
 * Overrides for the month panels' fixed strings. Bloom already speaks them in
 * the picker's `locale`; pass these only for wording of your own.
 */
export interface CalendarLabels {
  /** Names the previous-month chevron (`'Previous month'` in English). */
  previousMonth?: string;
  /** Names the next-month chevron (`'Next month'` in English). */
  nextMonth?: string;
}

interface CalendarBaseProps extends CalendarConstraintProps {
  /** Month shown first. Defaults to the selected day's month, else today's. */
  defaultMonth?: Date;
  /** Names the calendar grid. Defaults to the month title. */
  accessibilityLabel?: string;
  labels?: CalendarLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CalendarProps extends CalendarBaseProps {
  /** Selected day (controlled). `null` for none. */
  value?: Date | null;
  /** Initially selected day (uncontrolled). */
  defaultValue?: Date | null;
  /** Called with the pressed day. */
  onChange?: (date: Date) => void;
}

export interface RangeCalendarProps extends CalendarBaseProps {
  /** Selected range (controlled). `null` for none. */
  value?: DateRange | null;
  /** Initially selected range (uncontrolled). */
  defaultValue?: DateRange | null;
  /**
   * Called when a range is completed. The first press anchors the range and the
   * second closes it, in either order.
   */
  onChange?: (range: DateRange) => void;
  /** Months side by side. Defaults to `1`. */
  visibleMonths?: 1 | 2;
}

interface PickerBaseProps extends CalendarConstraintProps {
  /** Blocks opening and paints the trigger disabled. */
  disabled?: boolean;
  /** Controlled open state of the popup. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Style for the trigger button. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Overrides for `DatePicker`'s fixed strings, which Bloom already speaks in `locale`. */
export interface DatePickerLabels extends CalendarLabels {
  /** The footer's dismiss button (`'Cancel'` in English). */
  cancel?: string;
  /** The footer's commit button (`'Apply'` in English). */
  apply?: string;
}

/** The quick-select column's rows, in the order they are drawn. */
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'allTime';

/** Overrides for `DateRangePicker`'s fixed strings, which Bloom already speaks in `locale`. */
export interface DateRangePickerLabels extends DatePickerLabels {
  /**
   * The footer pill. Receives the count; Bloom's own pluralises per language
   * (`'14 days selected'` in English).
   */
  daysSelected?: (days: number) => string;
  /** Names the start-date chip (`'Start date'` in English). */
  startDate?: string;
  /** Names the end-date chip (`'End date'` in English). */
  endDate?: string;
  /** Quick-select rows; any left out keep Bloom's (`'Today'`, `'Last week'`, … in English). */
  presets?: Partial<Record<DateRangePreset, string>>;
}

export interface DatePickerProps extends PickerBaseProps {
  /** Committed day (controlled). `null` for none. */
  value?: Date | null;
  /** Initially committed day (uncontrolled). */
  defaultValue?: Date | null;
  /** Called on Apply with the chosen day. */
  onChange?: (date: Date | null) => void;
  /** Trigger text with no day committed. Defaults to Bloom's (`'Select date'` in English). */
  placeholder?: string;
  /** Names the popup and its calendar. Defaults to Bloom's (`'Date'` in English). */
  accessibilityLabel?: string;
  /** Footer buttons and month chevrons. */
  labels?: DatePickerLabels;
}

export interface DateRangePickerProps extends PickerBaseProps {
  /** Committed range (controlled). `null` for none. */
  value?: DateRange | null;
  /** Initially committed range (uncontrolled). */
  defaultValue?: DateRange | null;
  /** Called on Apply with the chosen range. */
  onChange?: (range: DateRange | null) => void;
  /** Trigger text with no range committed. Defaults to Bloom's (`'Select date range'` in English). */
  placeholder?: string;
  /** Names the popup and its calendar. Defaults to Bloom's (`'Date range'` in English). */
  accessibilityLabel?: string;
  /** Show the quick-select column (Today, Last week, …). Defaults to `true`. */
  quickSelect?: boolean;
  /** Footer buttons and pill, date chips, quick-select rows and month chevrons. */
  labels?: DateRangePickerLabels;
}

/** The person the meeting is booked with. */
export interface MeetingSchedulerHost {
  name: string;
  email: string;
  /** Initials on the avatar disc. Defaults to the first letter of `name`. */
  avatarInitial?: string;
  /** Avatar image; the initials disc is the fallback. */
  avatarSource?: string;
}

/** The meeting summary beside the host. */
export interface MeetingSchedulerDetails {
  title: string;
  description?: string;
  durationMinutes: number;
  language?: string;
  conferencing?: string;
  /**
   * A 20px mark before `conferencing`.
   * Defaults to Remix `RiVideoLine`.
   */
  conferencingIcon?: React.ReactNode;
}

/** A booked slot: a day, and a 24h `"HH:mm"` time or `null` while none is picked. */
export interface MeetingSchedulerValue {
  date: Date;
  time: string | null;
}

/**
 * How a time of day is drawn. The VALUE is always a 24h `"HH:mm"` string —
 * this decides only what the reader sees.
 */
export type HourFormat = '12h' | '24h';

/** The hour-format toggle. An alias of {@link HourFormat}. */
export type MeetingSchedulerHourFormat = HourFormat;

/** Overrides for `MeetingScheduler`'s fixed strings, which Bloom already speaks in `locale`. */
export interface MeetingSchedulerLabels extends CalendarLabels {
  /** `'Send meeting'` in English. */
  send?: string;
  /** Chip text before a time is picked (`'Select a time'` in English). */
  selectTime?: string;
  /** The duration row (`'30 minutes'` in English). */
  duration?: (minutes: number) => string;
}

export interface MeetingSchedulerProps extends CalendarConstraintProps {
  host: MeetingSchedulerHost;
  meeting: MeetingSchedulerDetails;
  /** Timezone row text, e.g. `'Amsterdam'`. */
  timezone: string;
  /** Makes the timezone row a button (unset, the chevron shows but nothing is wired). */
  onTimezonePress?: () => void;
  /** Bookable slots as 24h `"HH:mm"`. Defaults to every half hour 09:00–18:30. */
  timeSlots?: ReadonlyArray<string>;
  /** Committed booking (controlled). */
  value?: MeetingSchedulerValue | null;
  /** Initial booking (uncontrolled). Defaults to today with no time. */
  defaultValue?: MeetingSchedulerValue | null;
  /** Called by "Send meeting" with the pending booking. */
  onChange?: (value: MeetingSchedulerValue | null) => void;
  /** Initial hour format. Defaults to `'24h'`. */
  defaultHourFormat?: MeetingSchedulerHourFormat;
  /** Trigger text. Defaults to Bloom's (`'Schedule a meeting'` in English). */
  triggerLabel?: string;
  /** Names the popup and its calendar. Defaults to Bloom's (`'Schedule meeting'` in English). */
  accessibilityLabel?: string;
  labels?: MeetingSchedulerLabels;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Style for the trigger button. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `small` is a 32-tall field with body-2 text; `medium` (default) 38 with body. */
export type TimeFieldSize = 'small' | 'medium';

export interface TimeFieldProps {
  /**
   * The time as a 24h `"HH:mm"` string, or `null` while the field is empty.
   * Fully controlled. The same shape `MeetingScheduler` uses, so a value drops
   * straight into one of its `timeSlots`.
   */
  value: string | null;
  /**
   * Called with the committed time — on blur, on submit, or on an arrow key.
   * `null` when the field has been emptied. Never called while typing.
   */
  onChange: (value: string | null) => void;
  /** Earliest time, 24h `"HH:mm"`. A typed time before it is pulled up to it. */
  min?: string;
  /** Latest time, 24h `"HH:mm"`. A typed time after it is pulled back to it. */
  max?: string;
  /**
   * Minutes one arrow press moves, and the grid a typed time snaps to. Default
   * `1` (no snapping); pass `15` or `30` for a booking grid. Counted from
   * midnight, so 15 always means :00 :15 :30 :45.
   */
  step?: number;
  /** How the time is DRAWN. Default `'24h'`; the value stays 24h either way. */
  hourFormat?: HourFormat;
  /** Default `medium`. */
  size?: TimeFieldSize;
  disabled?: boolean;
  /**
   * The NAME of the time ("Viewing time", "Check-in").
   *
   * The field draws no label of its own and `"--:--"` names nothing, so this or
   * an enclosing `Field`'s label is the only route to a name. With neither it
   * warns once in development (`hooks/use-accessible-name-warning.ts`).
   */
  accessibilityLabel?: string;
  /** The text while empty. Default `"--:--"`, or `"--:-- --"` in 12h. */
  placeholder?: string;
  /** Fixed width. Default: 104 at `medium`, 96 at `small`. */
  width?: number;
  style?: StyleProp<TextStyle>;
  testID?: string;
}
