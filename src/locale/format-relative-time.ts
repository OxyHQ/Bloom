import { FormatterCache } from './formatter-cache';

/**
 * How long ago (or from now) something is, in the reader's locale:
 * `3 minutes ago`, `hace 3 minutos`, `3 min. ago` (short), `yesterday`.
 *
 * Goes through `Intl.RelativeTimeFormat`, built once per locale and style (see
 * `formatter-cache.ts`). An engine without it (Hermes has no
 * `RelativeTimeFormat`) or that rejects the locale gets English words, so
 * nothing ever throws or renders empty.
 */

export type RelativeTimeStyle = 'long' | 'short' | 'narrow';

export interface RelativeTimeOptions {
  /** The reference instant (ms since the epoch). Default: `Date.now()`. */
  now?: number;
  /** `long` "3 minutes ago" (default), `short` "3 min. ago", `narrow` "3m ago". */
  style?: RelativeTimeStyle;
}

type Unit = Intl.RelativeTimeFormatUnit;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Under 45 s reads "now"; then the largest unit the gap reaches, rounded. */
const STEPS: ReadonlyArray<readonly [limit: number, unit: Unit, size: number]> = [
  [45 * SECOND, 'second', SECOND],
  [45 * MINUTE, 'minute', MINUTE],
  [22 * HOUR, 'hour', HOUR],
  [26 * DAY, 'day', DAY],
  [320 * DAY, 'month', 30 * DAY],
];
const YEARS = [Number.POSITIVE_INFINITY, 'year', 365 * DAY] as const;

const formats = new FormatterCache<Intl.RelativeTimeFormat | null>();

function createRelativeFormat(
  locale: string | undefined,
  style: RelativeTimeStyle,
): Intl.RelativeTimeFormat | null {
  if (typeof Intl === 'undefined' || typeof Intl.RelativeTimeFormat !== 'function') return null;
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style });
  } catch {
    try {
      return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style });
    } catch {
      return null;
    }
  }
}

function englishRelative(value: number, unit: Unit): string {
  if (unit === 'second') return 'now';
  const count = Math.abs(value);
  const label = `${count} ${unit}${count === 1 ? '' : 's'}`;
  return value < 0 ? `${label} ago` : `in ${label}`;
}

/**
 * `at` (a `Date` or epoch ms) relative to `now`: past is "ago", future is "in".
 * `formatRelativeTime(Date.now() - 3 * 60_000, 'en')` → `3 minutes ago`;
 * within 45 seconds → `now`.
 */
export function formatRelativeTime(
  at: Date | number,
  locale?: string,
  { now = Date.now(), style = 'long' }: RelativeTimeOptions = {},
): string {
  const diff = (typeof at === 'number' ? at : at.getTime()) - now;
  if (!Number.isFinite(diff)) return '';
  const abs = Math.abs(diff);
  const [, unit, size] = STEPS.find(([limit]) => abs < limit) ?? YEARS;
  const value = unit === 'second' ? 0 : Math.round(diff / size);
  const format = formats.get(locale, { style }, () => createRelativeFormat(locale, style));
  return format ? format.format(value, unit) : englishRelative(value, unit);
}
