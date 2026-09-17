import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { addDays, buildMonthGrid, isSameMonth, startOfDay } from '../date-picker/calendar-grid';
import type { CalendarViewEvent } from './types';

export const IS_WEB = Platform.OS === 'web';

/** `dataSet` is react-native-web's channel for a `data-*` attribute; RN has no type for it. */
export type WebDataSet = { dataSet?: Record<string, string> };

/** Tailwind's breakpoints, the ones the calendar switches layout at. */
export const BREAKPOINT = { sm: 640, lg: 1024, xl: 1280, '2xl': 1536 } as const;

export type CalendarViewBreakpoint = 'base' | 'sm' | 'lg' | 'xl' | '2xl';

/** The viewport's breakpoint — layout keys off the viewport, not the container. */
export function useBreakpoint(): CalendarViewBreakpoint {
  const { width } = useWindowDimensions();
  if (width >= BREAKPOINT['2xl']) return '2xl';
  if (width >= BREAKPOINT.xl) return 'xl';
  if (width >= BREAKPOINT.lg) return 'lg';
  if (width >= BREAKPOINT.sm) return 'sm';
  return 'base';
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const MIN_ROWS = 6;

/**
 * The month grid: Sunday-first and ALWAYS six weeks (42 days), padded with
 * next-month days, so the card is the same height in every month. Built on the
 * date picker's own `buildMonthGrid` — this only adds the padding rows.
 */
export function sixWeekGrid(month: Date): { date: Date; inMonth: boolean }[] {
  const days = buildMonthGrid(month, 0).flat();
  let last = days[days.length - 1]!.date;
  while (days.length < MIN_ROWS * 7) {
    last = addDays(last, 1);
    days.push({ date: last, inMonth: isSameMonth(last, month) });
  }
  return days;
}

/**
 * Events grouped by day, earliest first. All-day events (no `time`) sort ahead
 * of timed ones (`"" < "HH:mm"`).
 */
export function useEventsByDay(events: readonly CalendarViewEvent[]): Map<string, CalendarViewEvent[]> {
  return useMemo(() => {
    const map = new Map<string, CalendarViewEvent[]>();
    for (const event of events) {
      const key = dayKey(startOfDay(event.date));
      const list = map.get(key);
      if (list) list.push(event);
      else map.set(key, [event]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    }
    return map;
  }, [events]);
}

/** More than 3 events in a cell shows the last 4 under a "+N more" label. */
export const MAX_VISIBLE_EVENTS = 3;
export const OVERFLOW_VISIBLE_EVENTS = 4;

export function visibleEvents(events: readonly CalendarViewEvent[]): {
  visible: readonly CalendarViewEvent[];
  hidden: number;
} {
  const visible = events.length > MAX_VISIBLE_EVENTS ? events.slice(-OVERFLOW_VISIBLE_EVENTS) : events;
  return { visible, hidden: events.length - visible.length };
}

/** `3h`, `45m`, `1h15m` — the time row's duration chip. Wraps past midnight. */
export function durationLabel(start: string, end: string): string {
  const [sh = 0, sm = 0] = start.split(':').map(Number);
  const [eh = 0, em = 0] = end.split(':').map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

/** `GMT+2` — the runtime's current offset. */
export function currentGmtLabel(now: Date = new Date()): string {
  const offset = -now.getTimezoneOffset() / 60;
  return `GMT${offset >= 0 ? '+' : ''}${offset}`;
}

function format(date: Date, locale: string | undefined, options: Intl.DateTimeFormatOptions): string | null {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return null;
  }
}

/** `Tue, Aug 11` — the details panel's date line. */
export function formatEventDate(date: Date, locale?: string): string {
  return (
    format(date, locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }) ?? date.toDateString()
  );
}

/** `Aug` — the month switcher's label below `sm`. */
export function formatShortMonth(date: Date, locale?: string): string {
  return format(date, locale, { month: 'short' }) ?? String(date.getMonth() + 1);
}

/** `Sun` … `Sat` — the month grid's weekday pills. */
export function weekdayShortLabels(locale?: string): { short: string; long: string }[] {
  const sunday = new Date(2023, 0, 1);
  const fallback = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return fallback.map((name, index) => {
    const date = addDays(sunday, index);
    return {
      short: format(date, locale, { weekday: 'short' }) ?? name,
      long: format(date, locale, { weekday: 'long' }) ?? name,
    };
  });
}
