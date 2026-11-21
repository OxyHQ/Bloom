import {
  Calendar,
  DatePicker,
  DateRangePicker,
  MeetingScheduler,
  RangeCalendar,
  TimeField,
} from '@oxy.so/bloom/date-picker';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const DAY = new Date(2026, 10, 21);
const MIN = new Date(2026, 10, 3);
const MAX = new Date(2026, 11, 20);
const RANGE = { start: new Date(2026, 10, 9), end: new Date(2026, 10, 14) };
const weekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

const pickers: ParityCase[] = [
  {
    name: 'DatePicker, nothing chosen',
    language: () => toElement(L.DatePicker([null, set])),
    bloom: () => <DatePicker value={null} onChange={set} />,
  },
  {
    name: 'DatePicker, a day, named',
    language: () => toElement(L.DatePicker([DAY, set]).label('Check-in').testID('in')),
    bloom: () => (
      <DatePicker value={DAY} onChange={set} accessibilityLabel="Check-in" testID="in" />
    ),
  },
  {
    name: 'DatePicker, a placeholder, disabled',
    language: () => toElement(L.DatePicker([null, set]).placeholder('Pick a day').disabled()),
    bloom: () => <DatePicker value={null} onChange={set} placeholder="Pick a day" disabled />,
  },
  {
    name: 'DatePicker, bounded, weekends off, Monday first, in French',
    language: () =>
      toElement(
        L.DatePicker([DAY, set]).bounds(MIN, MAX).unavailable(weekend).weekStart(1).locale('fr'),
      ),
    bloom: () => (
      <DatePicker
        value={DAY}
        onChange={set}
        minDate={MIN}
        maxDate={MAX}
        isDateUnavailable={weekend}
        weekStartsOn={1}
        locale="fr"
      />
    ),
  },
  {
    name: 'DatePicker, open, with labels of its own',
    language: () =>
      toElement(
        L.DatePicker([DAY, set]).presented([true, set]).labels({ cancel: 'Back', apply: 'Done' }),
      ),
    bloom: () => (
      <DatePicker
        value={DAY}
        onChange={set}
        open
        onOpenChange={set}
        labels={{ cancel: 'Back', apply: 'Done' }}
      />
    ),
  },
  {
    name: 'DatePicker, framed and padded',
    language: () => toElement(L.DatePicker([DAY, set]).padding('xs').frame({ width: '256' })),
    bloom: () => (
      <DatePicker
        value={DAY}
        onChange={set}
        style={{ paddingTop: 4, paddingBottom: 4, paddingStart: 4, paddingEnd: 4, width: 256 }}
      />
    ),
  },
  {
    name: 'DateRangePicker, nothing chosen',
    language: () => toElement(L.DateRangePicker([null, set])),
    bloom: () => <DateRangePicker value={null} onChange={set} />,
  },
  {
    name: 'DateRangePicker, a range, no quick select, disabled',
    language: () =>
      toElement(L.DateRangePicker([RANGE, set]).quickSelect(false).disabled().placeholder('Dates')),
    bloom: () => (
      <DateRangePicker
        value={RANGE}
        onChange={set}
        quickSelect={false}
        disabled
        placeholder="Dates"
      />
    ),
  },
  {
    name: 'DateRangePicker, open, bounded',
    language: () =>
      toElement(L.DateRangePicker([RANGE, set]).presented([true, set]).bounds(MIN, null)),
    bloom: () => (
      <DateRangePicker
        value={RANGE}
        onChange={set}
        open
        onOpenChange={set}
        minDate={MIN}
        maxDate={null}
      />
    ),
  },
];

const calendars: ParityCase[] = [
  {
    name: 'Calendar',
    language: () => toElement(L.Calendar([DAY, set])),
    bloom: () => <Calendar value={DAY} onChange={set} />,
  },
  {
    name: 'Calendar, a month of its own, bounded, named',
    language: () =>
      toElement(
        L.Calendar([null, set])
          .initialMonth(MAX)
          .bounds(MIN, MAX)
          .weekStart(1)
          .label('Due date')
          .labels({ previousMonth: 'Earlier', nextMonth: 'Later' }),
      ),
    bloom: () => (
      <Calendar
        value={null}
        onChange={set}
        defaultMonth={MAX}
        minDate={MIN}
        maxDate={MAX}
        weekStartsOn={1}
        accessibilityLabel="Due date"
        labels={{ previousMonth: 'Earlier', nextMonth: 'Later' }}
      />
    ),
  },
  {
    name: 'RangeCalendar',
    language: () => toElement(L.RangeCalendar([RANGE, set])),
    bloom: () => <RangeCalendar value={RANGE} onChange={set} />,
  },
  {
    name: 'RangeCalendar, two months, weekends off',
    language: () =>
      toElement(L.RangeCalendar([RANGE, set]).months(2).unavailable(weekend).padding('md')),
    bloom: () => (
      <RangeCalendar
        value={RANGE}
        onChange={set}
        visibleMonths={2}
        isDateUnavailable={weekend}
        style={{ paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 }}
      />
    ),
  },
];

const times: ParityCase[] = [
  {
    name: 'TimeField, empty, named',
    language: () => toElement(L.TimeField([null, set]).label('Viewing time')),
    bloom: () => <TimeField value={null} onChange={set} accessibilityLabel="Viewing time" />,
  },
  ...ENUMS.timeFieldSize.map((size) => ({
    name: `TimeField ${size}`,
    language: () => toElement(L.TimeField(['09:30', set]).size(size).label('Start')),
    bloom: () => <TimeField value="09:30" onChange={set} size={size} accessibilityLabel="Start" />,
  })),
  ...ENUMS.hourFormat.map((format) => ({
    name: `TimeField ${format}`,
    language: () => toElement(L.TimeField(['14:15', set]).hourFormat(format).label('End')),
    bloom: () => (
      <TimeField value="14:15" onChange={set} hourFormat={format} accessibilityLabel="End" />
    ),
  })),
  {
    name: 'TimeField, bounded, a 15-minute grid, a placeholder, disabled',
    language: () =>
      toElement(
        L.TimeField([null, set])
          .bounds('09:00', '18:00')
          .step(15)
          .placeholder('Any time')
          .disabled()
          .label('Slot'),
      ),
    bloom: () => (
      <TimeField
        value={null}
        onChange={set}
        min="09:00"
        max="18:00"
        step={15}
        placeholder="Any time"
        disabled
        accessibilityLabel="Slot"
      />
    ),
  },
];

const HOST = { name: 'Maya Collins', email: 'hi@example.com', avatarInitial: 'M' };
const MEETING = {
  title: '30 min intro meeting',
  description: 'How we can work together',
  durationMinutes: 30,
  language: 'English',
  conferencing: 'Video call',
};
const BOOKING = { date: DAY, time: '10:30' };
const SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00'];

const meetings: ParityCase[] = [
  {
    name: 'MeetingScheduler',
    language: () =>
      toElement(L.MeetingScheduler([null, set], HOST, MEETING, 'Amsterdam').testID('meeting')),
    bloom: () => (
      <MeetingScheduler
        host={HOST}
        meeting={MEETING}
        timezone="Amsterdam"
        value={null}
        onChange={set}
        testID="meeting"
      />
    ),
  },
  {
    name: 'MeetingScheduler open, booked, its own slots and words, 12h, bounded',
    language: () =>
      toElement(
        L.MeetingScheduler([BOOKING, set], HOST, MEETING, 'Amsterdam')
          .presented([true, set])
          .timeSlots(SLOTS)
          .hourFormat('12h')
          .bounds(MIN, MAX)
          .weekStart(1)
          .onTimezonePress(set)
          .labels({ send: 'Book' })
          .label('Book a call'),
      ),
    bloom: () => (
      <MeetingScheduler
        host={HOST}
        meeting={MEETING}
        timezone="Amsterdam"
        value={BOOKING}
        onChange={set}
        open
        onOpenChange={set}
        timeSlots={SLOTS}
        defaultHourFormat="12h"
        minDate={MIN}
        maxDate={MAX}
        weekStartsOn={1}
        onTimezonePress={set}
        labels={{ send: 'Book' }}
        accessibilityLabel="Book a call"
      />
    ),
  },
  {
    name: 'MeetingScheduler with a trigger of its own words, disabled, padded',
    language: () =>
      toElement(
        L.MeetingScheduler([null, set], HOST, MEETING, 'Lisbon')
          .triggerTitle('Book a call')
          .disabled()
          .padding('sm'),
      ),
    bloom: () => (
      <MeetingScheduler
        host={HOST}
        meeting={MEETING}
        timezone="Lisbon"
        value={null}
        onChange={set}
        triggerLabel="Book a call"
        disabled
        style={{ paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }}
      />
    ),
  },
];

export const DATE_PICKER_CASES: readonly ParityCase[] = [
  ...pickers,
  ...calendars,
  ...times,
  ...meetings,
];
