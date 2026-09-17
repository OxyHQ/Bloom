/**
 * The calendar's date maths — plain `Date`s at LOCAL midnight, no dependency
 * on react-aria or `@internationalized/date`: the month layout
 * (leading/trailing days, week rows), the per-cell selection state a range
 * paints from, min/max/unavailable, keyboard moves and the chip's
 * `DD/MM/YYYY` round-trip.
 *
 * Every function is pure and every returned `Date` is a fresh local-midnight
 * instance, so a caller can hand one straight to `onChange` without it aliasing
 * internal state. The time of day on an input is ignored.
 */

import type { DateRange, WeekStart } from './types';

const MS_PER_DAY = 86_400_000;

/** A fresh `Date` at local midnight of `date`'s calendar day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Today, at local midnight. */
export function today(): Date {
  return startOfDay(new Date());
}

/** Same calendar day, whatever the time. */
export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return (
    a != null &&
    b != null &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Negative when `a` is an earlier day than `b`, zero on the same day. */
export function compareDays(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** `months` later, clamping the day into the target month (Jan 31 + 1 → Feb 28). */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const day = Math.min(date.getDate(), daysInMonth(target.getFullYear(), target.getMonth()));
  return new Date(target.getFullYear(), target.getMonth(), day);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31);
}

/** The first day of `date`'s week. */
export function startOfWeek(date: Date, weekStartsOn: WeekStart = 0): Date {
  const offset = (date.getDay() - weekStartsOn + 7) % 7;
  return addDays(date, -offset);
}

export function endOfWeek(date: Date, weekStartsOn: WeekStart = 0): Date {
  return addDays(startOfWeek(date, weekStartsOn), 6);
}

/** One position in a month's grid. Outside-month positions render as empty space. */
export interface CalendarGridDay {
  date: Date;
  /** Whether `date` belongs to the month the grid was built for. */
  inMonth: boolean;
}

/**
 * The month as week rows of seven. Leading positions belong to the previous
 * month and trailing ones to the next — they are real dates (so keyboard moves
 * and range bands have something to compute from), flagged `inMonth: false`.
 * Only as many rows as the month needs: 4 to 6, the way react-aria lays it out.
 */
export function buildMonthGrid(month: Date, weekStartsOn: WeekStart = 0): CalendarGridDay[][] {
  const first = startOfMonth(month);
  const leading = (first.getDay() - weekStartsOn + 7) % 7;
  const total = leading + daysInMonth(first.getFullYear(), first.getMonth());
  const rows = Math.ceil(total / 7);
  const start = addDays(first, -leading);
  const weeks: CalendarGridDay[][] = [];
  for (let row = 0; row < rows; row++) {
    const week: CalendarGridDay[] = [];
    for (let column = 0; column < 7; column++) {
      const date = addDays(start, row * 7 + column);
      week.push({ date, inMonth: date.getMonth() === first.getMonth() });
    }
    weeks.push(week);
  }
  return weeks;
}

const FALLBACK_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Column headers in grid order: a two-letter `short` weekday
 * (`day.slice(0, 2)`), plus the full name for assistive tech.
 */
export function weekdayLabels(
  weekStartsOn: WeekStart = 0,
  locale?: string,
): { short: string; long: string }[] {
  // 2023-01-01 was a Sunday.
  const sunday = new Date(2023, 0, 1);
  return Array.from({ length: 7 }, (_, column) => {
    const date = addDays(sunday, (weekStartsOn + column) % 7);
    const long = format(date, locale, { weekday: 'long' }) ?? FALLBACK_WEEKDAYS[date.getDay()]!;
    const short = format(date, locale, { weekday: 'short' }) ?? long;
    return { short: short.slice(0, 2), long };
  });
}

function format(date: Date, locale: string | undefined, options: Intl.DateTimeFormatOptions): string | null {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return null;
  }
}

/** `September 2026` — the month panel's title. */
export function formatMonthTitle(month: Date, locale?: string): string {
  return (
    format(month, locale, { month: 'long', year: 'numeric' }) ??
    `${month.getMonth() + 1}/${month.getFullYear()}`
  );
}

/** `Sep 16, 2026` — the trigger's label. */
export function formatTriggerDate(date: Date, locale?: string): string {
  return format(date, locale, { month: 'short', day: 'numeric', year: 'numeric' }) ?? formatChipDate(date);
}

/** `Wednesday, September 16, 2026` — a day button's accessible name. */
export function formatAccessibleDate(date: Date, locale?: string): string {
  return (
    format(date, locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) ??
    formatChipDate(date)
  );
}

/** `DD/MM/YYYY` — the editable chip's format. */
export function formatChipDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

/**
 * Parse the chip's `DD/MM/YYYY` back, or `null` when the text is not a real
 * date. Unlike `new Date(y, m, d)`, an impossible day (Feb 30) is rejected
 * rather than rolled into the next month.
 */
export function parseChipDate(text: string): Date | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month - 1)) return null;
  return new Date(year, month - 1, day);
}

export interface DateConstraints {
  minDate?: Date | null;
  maxDate?: Date | null;
  isDateUnavailable?: (date: Date) => boolean;
}

/** Before `minDate`, after `maxDate`, or rejected by `isDateUnavailable`. */
export function isDateDisabled(date: Date, { minDate, maxDate, isDateUnavailable }: DateConstraints): boolean {
  if (minDate && compareDays(date, minDate) < 0) return true;
  if (maxDate && compareDays(date, maxDate) > 0) return true;
  return isDateUnavailable?.(date) ?? false;
}

/** Order two days into a range. */
export function normalizeRange(a: Date, b: Date): DateRange {
  return compareDays(a, b) <= 0
    ? { start: startOfDay(a), end: startOfDay(b) }
    : { start: startOfDay(b), end: startOfDay(a) };
}

/** Inclusive day count: a one-day range is 1. */
export function daysInRange(range: DateRange): number {
  // Rounded, so a DST shift inside the range cannot drop or add a day.
  return Math.round((startOfDay(range.end).getTime() - startOfDay(range.start).getTime()) / MS_PER_DAY) + 1;
}

/** What a day cell paints from — a subset of react-aria's `CalendarCellRenderProps`. */
export interface DayCellState {
  isSelected: boolean;
  isSelectionStart: boolean;
  isSelectionEnd: boolean;
}

export function singleCellState(date: Date, value: Date | null | undefined): DayCellState {
  const isSelected = isSameDay(date, value);
  return { isSelected, isSelectionStart: isSelected, isSelectionEnd: isSelected };
}

export function rangeCellState(date: Date, range: DateRange | null | undefined): DayCellState {
  if (!range) return { isSelected: false, isSelectionStart: false, isSelectionEnd: false };
  const isSelected = compareDays(date, range.start) >= 0 && compareDays(date, range.end) <= 0;
  return {
    isSelected,
    isSelectionStart: isSameDay(date, range.start),
    isSelectionEnd: isSameDay(date, range.end),
  };
}

/**
 * Where a day cell's two background layers sit.
 *
 * `band` is the light range background behind the cell. Cells sit 12px apart, so
 * a band that is not a range END reaches 6px (`-left-1.5` / `-right-1.5`) toward
 * its selected neighbour — except in the first and last column, where there is
 * no neighbour and the band rounds instead. A range END band covers only the
 * inner half of its cell, under the edge pill.
 *
 * `edge` is the darker pill on a range end or a single selected day: rounded all
 * round for a single day, on the outer side only for a range end.
 */
export interface DayCellPaint {
  band: {
    visible: boolean;
    left: number;
    right: number;
    roundLeft: boolean;
    roundRight: boolean;
  };
  edge: {
    visible: boolean;
    roundLeft: boolean;
    roundRight: boolean;
  };
}

/** Half of the 12px cell gap. */
export const RANGE_BRIDGE = 6;

export function dayCellPaint(
  state: DayCellState,
  column: number,
  isRange: boolean,
  cellSize: number,
): DayCellPaint {
  const { isSelected, isSelectionStart, isSelectionEnd } = state;
  const isSingleDay = isRange ? isSelectionStart && isSelectionEnd : isSelected;
  const isEdge = isRange ? isSelectionStart || isSelectionEnd : isSelected;
  const extendLeft = isRange && isSelected && !isSelectionStart && column !== 0;
  const extendRight = isRange && isSelected && !isSelectionEnd && column !== 6;
  const half = cellSize / 2;

  return {
    band: {
      visible: isSelected && !isSingleDay,
      left: isSelectionStart ? half : extendLeft ? -RANGE_BRIDGE : 0,
      right: isSelectionEnd ? half : extendRight ? -RANGE_BRIDGE : 0,
      roundLeft: !isSelectionStart && column === 0,
      roundRight: !isSelectionEnd && column === 6,
    },
    edge: {
      visible: isEdge,
      roundLeft: isSingleDay || (isSelectionStart && !isSingleDay),
      roundRight: isSingleDay || (isSelectionEnd && !isSingleDay),
    },
  };
}

/** The keys a focused day moves on, react-aria's calendar set. */
export type CalendarNavigationKey =
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'Home'
  | 'End'
  | 'PageUp'
  | 'PageDown';

/** The day focus moves to for `key`, or `null` for any other key. */
export function moveFocusedDate(date: Date, key: string, weekStartsOn: WeekStart = 0): Date | null {
  switch (key) {
    case 'ArrowLeft':
      return addDays(date, -1);
    case 'ArrowRight':
      return addDays(date, 1);
    case 'ArrowUp':
      return addDays(date, -7);
    case 'ArrowDown':
      return addDays(date, 7);
    case 'Home':
      return startOfWeek(date, weekStartsOn);
    case 'End':
      return endOfWeek(date, weekStartsOn);
    case 'PageUp':
      return addMonths(date, -1);
    case 'PageDown':
      return addMonths(date, 1);
    default:
      return null;
  }
}

/** Clamp a day into `[minDate, maxDate]`. */
export function clampDate(date: Date, { minDate, maxDate }: DateConstraints): Date {
  if (minDate && compareDays(date, minDate) < 0) return startOfDay(minDate);
  if (maxDate && compareDays(date, maxDate) > 0) return startOfDay(maxDate);
  return startOfDay(date);
}

/** Quick-select presets, relative to `now`. */
export function quickSelectPresets(now: Date = today()): { label: string; range: DateRange }[] {
  const lastMonth = addMonths(now, -1);
  const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const yesterday = addDays(now, -1);
  return [
    { label: 'Today', range: { start: now, end: now } },
    { label: 'Yesterday', range: { start: yesterday, end: yesterday } },
    { label: 'Last week', range: { start: addDays(now, -7), end: yesterday } },
    { label: 'This month', range: { start: startOfMonth(now), end: endOfMonth(now) } },
    { label: 'Last month', range: { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) } },
    { label: 'This year', range: { start: startOfYear(now), end: endOfYear(now) } },
    { label: 'Last year', range: { start: startOfYear(lastYear), end: endOfYear(lastYear) } },
    { label: 'All time', range: { start: addMonths(now, -120), end: now } },
  ];
}

export function isSameRange(a: DateRange | null | undefined, b: DateRange | null | undefined): boolean {
  return a != null && b != null && isSameDay(a.start, b.start) && isSameDay(a.end, b.end);
}
