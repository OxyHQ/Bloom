import type { HourFormat } from './types';

/**
 * Time of day as the family already spells it: a 24-hour `"HH:mm"` string.
 * `MeetingScheduler`'s `timeSlots` and `MeetingSchedulerValue.time` are the same
 * shape, so a `TimeField` value drops straight into one.
 *
 * Everything here is pure, exported, and where the parsing rules live — a field
 * that keeps its own draft cannot be tested through the DOM for every spelling
 * somebody might type.
 */

/** Minutes since midnight, `0..1439`. */
export type Minutes = number;

const HH_MM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** `"14:30"` → 870. `null` for anything that is not a 24h `HH:mm`. */
export function toMinutes(value: string): Minutes | null {
  const match = HH_MM.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** 870 → `"14:30"`. Wraps within the day, so 1440 is `"00:00"`. */
export function fromMinutes(minutes: Minutes): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** `"14:30"` → `"14:30"` (24h) or `"2:30 PM"` (12h). */
export function formatTime(value: string, hourFormat: HourFormat): string {
  const minutes = toMinutes(value);
  if (minutes == null) return value;
  if (hourFormat === '24h') return fromMinutes(minutes);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * What somebody typed → `"HH:mm"`, or `null` when it is not a time.
 *
 * Deliberately forgiving, because a field that only accepts what it printed is
 * a field people fight: `9`, `930`, `9.30`, `9:3`, `0930`, `9 30`, `9pm`,
 * `9:30 p.m.` and `21:30` all parse. A bare number under 24 is an HOUR (`9` is
 * 09:00), four digits are `HHMM` (`0930`); `AM`/`PM` decides the half of the
 * day whatever `hourFormat` says, because somebody who typed `pm` means pm.
 * Without a marker, 24h reads the hour as given and 12h keeps `1..12` in the
 * morning — the value is still `"HH:mm"`, so a caller never has to know which.
 */
export function parseTime(text: string, hourFormat: HourFormat = '24h'): string | null {
  const raw = text.trim().toLowerCase();
  if (raw === '') return null;
  const period = /(^|[^a-z])(a\.?m\.?|p\.?m\.?)\s*$/.exec(raw);
  const meridiem = period ? (period[2]!.startsWith('a') ? 'am' : 'pm') : null;
  const digits = (meridiem ? raw.slice(0, period!.index + period![1]!.length) : raw).trim();

  let hour: number;
  let minute: number;
  const separated = /^(\d{1,2})\s*[:.\s]\s*(\d{1,2})$/.exec(digits);
  if (separated) {
    hour = Number(separated[1]);
    minute = Number(separated[2]!.padEnd(2, '0'));
  } else if (/^\d{3,4}$/.test(digits)) {
    hour = Number(digits.slice(0, digits.length - 2));
    minute = Number(digits.slice(-2));
  } else if (/^\d{1,2}$/.test(digits)) {
    hour = Number(digits);
    minute = 0;
  } else {
    return null;
  }

  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    hour = meridiem === 'pm' ? (hour % 12) + 12 : hour % 12;
  } else if (hour > 23) {
    return null;
  }
  return fromMinutes(hour * 60 + minute);
}

/**
 * The nearest multiple of `step` minutes (or the next one up/down, per
 * `round`), at or after `min` and at or before `max`. `step` counts from
 * MIDNIGHT, so 15 gives :00 :15 :30 :45 whatever the bounds are — a step
 * measured from `min` would put the round times off the grid the moment a shop
 * opened at 09:10. Never crosses the end of the day: 23:59 rounded up to a
 * 30-minute grid stays inside it rather than wrapping to the other end.
 */
export function snapTime(
  value: string,
  {
    step = 1,
    min,
    max,
    round = 'nearest',
  }: { step?: number; min?: string; max?: string; round?: 'nearest' | 'up' | 'down' } = {},
): string | null {
  const minutes = toMinutes(value);
  if (minutes == null) return null;
  const size = Math.max(1, Math.round(step));
  const scaled = minutes / size;
  let snapped =
    (round === 'up' ? Math.ceil(scaled) : round === 'down' ? Math.floor(scaled) : Math.round(scaled)) *
    size;
  const low = min ? toMinutes(min) : null;
  const high = max ? toMinutes(max) : null;
  if (low != null && high != null && low > high) return null;
  if (low != null && snapped < low) snapped = low;
  if (high != null && snapped > high) snapped = high;
  // Never past the end of the day: rounding 23:59 up to a 30-minute grid lands
  // on 24:00, which `fromMinutes` would wrap to midnight — the other end.
  if (snapped > 1439) snapped = high ?? 1439;
  if (snapped < 0) snapped = low ?? 0;
  return fromMinutes(snapped);
}

/**
 * One arrow press: `direction * step` minutes from `value`, or the first time
 * inside the bounds when there is no value yet. Clamps at the bounds rather
 * than wrapping — a wrap past `max` back to `min` reads as the field refusing
 * the key.
 */
export function stepTime(
  value: string | null,
  direction: 1 | -1,
  { step = 1, min, max }: { step?: number; min?: string; max?: string } = {},
): string | null {
  const size = Math.max(1, Math.round(step));
  const low = min ? toMinutes(min) : null;
  const high = max ? toMinutes(max) : null;
  if (low != null && high != null && low > high) return null;
  const current = value ? toMinutes(value) : null;
  if (current == null) {
    // Into the range, not past it: up from the earliest allowed time rounds UP
    // onto the grid, down from the latest rounds DOWN.
    const start = direction === 1 ? (low ?? 0) : (high ?? 1439);
    return snapTime(fromMinutes(start), {
      step: size,
      min,
      max,
      round: direction === 1 ? 'up' : 'down',
    });
  }
  let next = current + direction * size;
  if (low != null && next < low) next = low;
  if (high != null && next > high) next = high;
  if (next < 0) next = 0;
  if (next > 1439) next = 1439;
  return fromMinutes(next);
}
