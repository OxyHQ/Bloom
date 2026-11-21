import {
  Calendar as BloomCalendar,
  DatePicker as BloomDatePicker,
  DateRangePicker as BloomDateRangePicker,
  RangeCalendar as BloomRangeCalendar,
  TimeField as BloomTimeField,
  type DatePickerLabels,
  type DateRange,
  type DateRangePickerLabels,
  type CalendarLabels,
  type HourFormat,
  type WeekStart,
} from '@oxy.so/bloom/date-picker';

import type { Binding } from '../binding';
import { Node, type ViewModifiers } from '../node';
import type { ControlDraw, ControlRenderer } from './draw';

/** Date and time pickers, and the month calendars they are built from (Bloom `date-picker`). */
export type DatePickerKind =
  | 'datePicker'
  | 'dateRangePicker'
  | 'calendar'
  | 'rangeCalendar'
  | 'timeField';

export interface SelectionProps<T> {
  readonly selection: Binding<T>;
}

/** What every calendar and picker takes to decide which days can be chosen, and how they read. */
interface DateConstraints<Self> {
  /** Days before `min` and after `max` cannot be chosen; `null` leaves that end open. */
  bounds(min: Date | null, max?: Date | null): Self;
  /** Days that cannot be chosen (weekends, holidays). */
  unavailable(value: (date: Date) => boolean): Self;
  /** The grid's first column: `0` Sunday (the default) … `6` Saturday. */
  weekStart(value: WeekStart): Self;
  /** The BCP 47 locale its months, weekdays and Bloom's own strings speak; the provider's by default. */
  locale(value: string): Self;
}

/** A picker's trigger and its popup. */
interface PickerModifiers<Self> extends DateConstraints<Self> {
  /** The trigger's text with nothing chosen; Bloom's (`Select date`) by default. */
  placeholder(value: string): Self;
  /** The trigger takes no press and is drawn disabled. */
  disabled(value?: boolean): Self;
  /** Whether the popup is open, and what opening and closing it set. */
  presented(value: Binding<boolean>): Self;
}

/** Bloom `DatePicker`: a trigger that opens a month calendar, its day applied with Apply. */
export interface DatePickerView
  extends ViewModifiers<DatePickerView>,
    PickerModifiers<DatePickerView> {
  /** Wording of your own for its buttons and month chevrons (Bloom speaks them in `locale`). */
  labels(value: DatePickerLabels): DatePickerView;
}
/** Bloom `DateRangePicker`: a trigger that opens two months and the quick-select column. */
export interface DateRangePickerView
  extends ViewModifiers<DateRangePickerView>,
    PickerModifiers<DateRangePickerView> {
  /** The quick-select column (Today, Last week…); shown by default. */
  quickSelect(value: boolean): DateRangePickerView;
  labels(value: DateRangePickerLabels): DateRangePickerView;
}
/** Bloom `Calendar`: one month, a day chosen by pressing it. */
export interface CalendarView extends ViewModifiers<CalendarView>, DateConstraints<CalendarView> {
  /** The month shown first; the chosen day's, else today's, by default. */
  initialMonth(value: Date): CalendarView;
  labels(value: CalendarLabels): CalendarView;
}
/** Bloom `RangeCalendar`: a range chosen with two presses, in either order. */
export interface RangeCalendarView
  extends ViewModifiers<RangeCalendarView>,
    DateConstraints<RangeCalendarView> {
  initialMonth(value: Date): RangeCalendarView;
  /** Months side by side: `1` (default) or `2`. */
  months(value: 1 | 2): RangeCalendarView;
  labels(value: CalendarLabels): RangeCalendarView;
}
/** Bloom `TimeField`: a 24h `"HH:mm"` time, drawn in the reader's hour format. */
export interface TimeFieldView extends ViewModifiers<TimeFieldView> {
  /** The earliest and latest times (`"HH:mm"`); a typed time outside is pulled to them. */
  bounds(min: string | null, max?: string | null): TimeFieldView;
  /** Minutes an arrow moves and the grid a typed time snaps to (`15`, `30`); 1 by default. */
  step(value: number): TimeFieldView;
  /** How the time is drawn: `24h` (default) or `12h`; the value stays 24h. */
  hourFormat(value: HourFormat): TimeFieldView;
  /** `sm` (32 tall) or `md` (38, default). */
  size(value: 'sm' | 'md'): TimeFieldView;
  placeholder(value: string): TimeFieldView;
  disabled(value?: boolean): TimeFieldView;
}

/** Bloom `DatePicker`: the day the binding holds (`null` for none), set on Apply. */
export function DatePicker(selection: Binding<Date | null>): DatePickerView {
  return new Node('datePicker', { selection } satisfies SelectionProps<Date | null>, []);
}
/** Bloom `DateRangePicker`: the range the binding holds (`null` for none), set on Apply. */
export function DateRangePicker(selection: Binding<DateRange | null>): DateRangePickerView {
  return new Node('dateRangePicker', { selection }, []);
}
/** Bloom `Calendar`: the day the binding holds, set when a day is pressed. */
export function Calendar(selection: Binding<Date | null>): CalendarView {
  return new Node('calendar', { selection }, []);
}
/** Bloom `RangeCalendar`: the range the binding holds, set when a range is completed. */
export function RangeCalendar(selection: Binding<DateRange | null>): RangeCalendarView {
  return new Node('rangeCalendar', { selection }, []);
}
/** Bloom `TimeField`: the `"HH:mm"` time the binding holds (`null` while empty), set when committed. */
export function TimeField(selection: Binding<string | null>): TimeFieldView {
  return new Node('timeField', { selection }, []);
}

function selected(d: ControlDraw): Record<string, unknown> {
  const [value, onChange] = (d.node.props as SelectionProps<unknown>).selection;
  const props = d.props();
  props.value = value;
  props.onChange = onChange;
  return props;
}

/** The constraint props every calendar and picker shares. */
function constrained(d: ControlDraw): Record<string, unknown> {
  const props = selected(d);
  const bounds = d.own('bounds')?.value;
  if (bounds !== undefined) {
    props.minDate = bounds[0];
    props.maxDate = bounds[1];
  }
  props.isDateUnavailable = d.own('unavailable')?.value;
  props.weekStartsOn = d.own('weekStart')?.value;
  props.locale = d.own('locale')?.value;
  props.labels = d.own('labels')?.value;
  return props;
}

function picker(d: ControlDraw): Record<string, unknown> {
  const props = constrained(d);
  props.placeholder = d.own('placeholder')?.value;
  props.disabled = d.own('disabled')?.value;
  const presented = d.own('presented')?.value;
  if (presented !== undefined) {
    props.open = presented[0];
    props.onOpenChange = presented[1];
  }
  return props;
}

function calendar(d: ControlDraw): Record<string, unknown> {
  const props = constrained(d);
  props.defaultMonth = d.own('initialMonth')?.value;
  return props;
}

export const DATE_PICKERS: Record<DatePickerKind, ControlRenderer> = {
  datePicker: (d) => d.component(BloomDatePicker, picker(d)),
  dateRangePicker: (d) => {
    const props = picker(d);
    props.quickSelect = d.own('quickSelect')?.value;
    return d.component(BloomDateRangePicker, props);
  },
  calendar: (d) => d.component(BloomCalendar, calendar(d)),
  rangeCalendar: (d) => {
    const props = calendar(d);
    props.visibleMonths = d.own('months')?.value;
    return d.component(BloomRangeCalendar, props);
  },
  timeField: (d) => {
    const props = selected(d);
    const bounds = d.own('bounds')?.value;
    if (bounds !== undefined) {
      props.min = bounds[0] ?? undefined;
      props.max = bounds[1] ?? undefined;
    }
    props.step = d.own('step')?.value;
    props.hourFormat = d.own('hourFormat')?.value;
    props.size = d.own('size')?.value;
    props.placeholder = d.own('placeholder')?.value;
    props.disabled = d.own('disabled')?.value;
    return d.component(BloomTimeField, props);
  },
};
