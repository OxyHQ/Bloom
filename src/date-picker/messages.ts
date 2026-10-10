import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { DateRangePreset } from './types';

/**
 * Every fixed string the date-picker family draws or announces, in each Bloom
 * language. Month titles, weekday names and dates come from `Intl` instead; a
 * caller's `labels` prop still wins over any entry here.
 */
export interface DatePickerMessages {
  cancel: string;
  apply: string;
  previousMonth: string;
  nextMonth: string;
  /** `DatePicker`'s empty trigger and its name. */
  datePlaceholder: string;
  dateLabel: string;
  /** `DateRangePicker`'s empty trigger and its name. */
  rangePlaceholder: string;
  rangeLabel: string;
  startDate: string;
  endDate: string;
  daysSelected: (days: number) => string;
  presets: Record<DateRangePreset, string>;
  /** `MeetingScheduler`'s trigger, its name, its commit button and its empty time chip. */
  meetingTrigger: string;
  meetingLabel: string;
  send: string;
  selectTime: string;
  duration: (minutes: number) => string;
}

export const DATE_PICKER_MESSAGES: MessageCatalog<DatePickerMessages> =
  defineMessages<DatePickerMessages>('DATE_PICKER_MESSAGES', {
    cancel: 'Cancel',
    apply: 'Apply',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    datePlaceholder: 'Select date',
    dateLabel: 'Date',
    rangePlaceholder: 'Select date range',
    rangeLabel: 'Date range',
    startDate: 'Start date',
    endDate: 'End date',
    daysSelected: (n) => plural('en', n, { one: '{n} day selected', other: '{n} days selected' }),
    presets: {
      today: 'Today',
      yesterday: 'Yesterday',
      lastWeek: 'Last week',
      thisMonth: 'This month',
      lastMonth: 'Last month',
      thisYear: 'This year',
      lastYear: 'Last year',
      allTime: 'All time',
    },
    meetingTrigger: 'Schedule a meeting',
    meetingLabel: 'Schedule meeting',
    send: 'Send meeting',
    selectTime: 'Select a time',
    duration: (n) => plural('en', n, { one: '{n} minute', other: '{n} minutes' }),
  });
