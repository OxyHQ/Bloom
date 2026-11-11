import { FormatterCache } from './formatter-cache';
import { defineMessages, type MessageCatalog } from './messages';
import { pickMessages } from './messages';

/**
 * Numbers, money, percentages and file sizes in the reader's locale.
 *
 * Grouping and decimal marks are not one convention: `1,234.5` in English is
 * `1.234,5` in German and Spanish, `1 234,5` in French, `12,34,567` in Hindi,
 * and Spanish does not group four digits at all (`1234`). A percentage is
 * `%25` in Turkish, a euro amount `385.000 €` in Spanish and `€385,000` in
 * English. So every helper here goes through `Intl.NumberFormat` for the
 * resolved locale — which Hermes implements (unlike `PluralRules`) — and falls
 * back to plain English formatting if an engine rejects the locale or an
 * option, so nothing ever throws or renders empty.
 *
 * `locale` is what `useMessages`/`useBloomLocale` resolved; `undefined` means the
 * runtime's.
 */

function createNumberFormat(
  locale: string | undefined,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat | null {
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    try {
      return new Intl.NumberFormat(undefined, options);
    } catch {
      return null;
    }
  }
}

const numberFormats = new FormatterCache<Intl.NumberFormat | null>();

/**
 * The formatter for `locale` and `options`, built once and reused: a list of a
 * hundred prices formats a hundred times but builds one `Intl.NumberFormat`,
 * which is the expensive half (Hermes especially).
 */
function numberFormat(
  locale: string | undefined,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat | null {
  return numberFormats.get(locale, options, () => createNumberFormat(locale, options));
}

/** English grouping with up to `maximumFractionDigits` (default 3) — the fallback only. */
function plainNumber(value: number, maximumFractionDigits = 3): string {
  if (!Number.isFinite(value)) return String(value);
  const factor = 10 ** maximumFractionDigits;
  const fixed = (Math.round(Math.abs(value) * factor) / factor).toString();
  const [int = '0', frac] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = value < 0 && Number(fixed) !== 0 ? '-' : '';
  return frac ? `${sign}${grouped}.${frac}` : `${sign}${grouped}`;
}

/** `12500` → `12,500` (en), `12.500` (de), `12 500` (fr). Up to three fraction digits unless told otherwise. */
export function formatNumber(
  value: number,
  locale?: string,
  options: Intl.NumberFormatOptions = {},
): string {
  const format = numberFormat(locale, { maximumFractionDigits: 3, ...options });
  return format ? format.format(value) : plainNumber(value, options.maximumFractionDigits ?? 3);
}

/** A whole number with grouping: `1234567.8` → `1,234,568` (en). */
export function formatInteger(value: number, locale?: string): string {
  return formatNumber(Math.round(value), locale, { maximumFractionDigits: 0 });
}

/**
 * The short form an axis or a badge wants: `12.5K` (en), `12,5 mil` (es),
 * `1.3万` (ja). Below a thousand, the rounded number. An engine without compact
 * notation shows the full grouped number, which is longer but never wrong.
 */
export function formatCompactNumber(value: number, locale?: string): string {
  if (Math.abs(value) < 1000) return formatInteger(value, locale);
  const format = numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  if (format) return format.format(value);
  return value >= 1000
    ? `${Math.round(value / 100) / 10}K`.replace('.0K', 'K')
    : String(Math.round(value));
}

/** A ratio as a percentage: `0.25` → `25%` (en), `25 %` (es, fr), `%25` (tr). */
export function formatPercent(ratio: number, locale?: string, fractionDigits = 0): string {
  const format = numberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return format ? format.format(ratio) : `${(ratio * 100).toFixed(fractionDigits)}%`;
}

/**
 * A signed change as a percentage, sign always shown: `0.052` → `+5.2%`.
 * Zero has no sign.
 */
export function formatSignedPercent(
  ratio: number,
  locale?: string,
  fractionDigits: number | { minimum: number; maximum: number } = 1,
): string {
  const [minimum, maximum] =
    typeof fractionDigits === 'number'
      ? [fractionDigits, fractionDigits]
      : [fractionDigits.minimum, fractionDigits.maximum];
  const format = numberFormat(locale, {
    style: 'percent',
    signDisplay: 'exceptZero',
    minimumFractionDigits: minimum,
    maximumFractionDigits: maximum,
  });
  if (format) return format.format(ratio);
  const fixed = String(Math.round(Math.abs(ratio) * 100 * 10 ** maximum) / 10 ** maximum);
  return `${ratio > 0 ? '+' : ratio < 0 ? '-' : ''}${fixed}%`;
}

/**
 * Money in an ISO 4217 `currency`, placed and spaced the locale's way:
 * `formatCurrency(385000, 'EUR', 'es')` → `385.000 €`, in `en` → `€385,000`.
 * Whole units unless `fractionDigits` says otherwise; `'currency'` takes the
 * currency's own minor units (`$9.99`, `¥980`, `1.234,500 KWD`).
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale?: string,
  fractionDigits: number | { minimum: number; maximum: number } | 'currency' = 0,
): string {
  if (fractionDigits === 'currency') {
    const format = numberFormat(locale, { style: 'currency', currency });
    return format ? format.format(amount) : `${currency} ${plainNumber(amount, 2)}`;
  }
  const [minimum, maximum] =
    typeof fractionDigits === 'number'
      ? [fractionDigits, fractionDigits]
      : [fractionDigits.minimum, fractionDigits.maximum];
  const format = numberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: minimum,
    maximumFractionDigits: maximum,
  });
  return format ? format.format(amount) : `${currency} ${plainNumber(amount, maximum)}`;
}

/**
 * Money in the compact form an axis wants: `€385K`, `385 mil €`. Up to one
 * decimal by default (`$2.5K`); `0` rounds to whole units of the scale (`$6K`).
 */
export function formatCompactCurrency(
  amount: number,
  currency: string,
  locale?: string,
  maximumFractionDigits = 1,
): string {
  if (Math.abs(amount) < 1000) return formatCurrency(amount, currency, locale);
  const format = numberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits,
  });
  return format ? format.format(amount) : `${currency} ${formatCompactNumber(amount)}`;
}

export interface SizeUnits {
  byte: string;
  kilobyte: string;
  megabyte: string;
  gigabyte: string;
}

/** Byte-size unit symbols: French writes `Ko`/`Mo`/`Go`, Russian `КБ`/`МБ`/`ГБ`. */
export const FILE_SIZE_UNITS: MessageCatalog<SizeUnits> = defineMessages<SizeUnits>(
  'FILE_SIZE_UNITS',
  { byte: 'B', kilobyte: 'KB', megabyte: 'MB', gigabyte: 'GB' },
);

/**
 * `2400000` → `2.4 MB` (en), `2,4 MB` (es), `2,4 Mo` (fr). One decimal under
 * ten, whole above; never less than 1 KB for a non-empty file.
 */
export function formatFileSize(bytes: number, locale?: string): string {
  const units = pickMessages(FILE_SIZE_UNITS, locale);
  const scaled = (value: number) =>
    formatNumber(value >= 10 ? Math.round(value) : Math.round(value * 10) / 10, locale, {
      maximumFractionDigits: 1,
    });
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${scaled(gb)} ${units.gigabyte}`;
  const mb = bytes / 1024 ** 2;
  if (mb >= 1) return `${scaled(mb)} ${units.megabyte}`;
  if (bytes <= 0) return `0 ${units.byte}`;
  return `${formatInteger(Math.max(1, Math.round(bytes / 1024)), locale)} ${units.kilobyte}`;
}

/**
 * A byte count as a size, the whole ladder: `512` → `512 B`, `1536` → `1.5 KB`,
 * `2400000` → `2.3 MB` (en), `2,3 MB` (es), `2,3 Mo` (fr), `1.2 TB`.
 *
 * Unlike {@link formatFileSize} — the file picker's rule, never under 1 KB and
 * whole numbers above ten — this keeps an exact byte count under 1 KB and goes
 * on to terabytes, which is what a storage quota or a download wants. Binary
 * (1024) steps, up to `maximumFractionDigits` (default 1) decimals, trailing
 * zeros dropped. A negative or non-finite count reads as `0 B`.
 */
export function formatBytes(bytes: number, locale?: string, maximumFractionDigits = 1): string {
  const units = pickMessages(FILE_SIZE_UNITS, locale);
  const safe = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  if (safe < 1024) return `${formatInteger(Math.floor(safe), locale)} ${units.byte}`;
  const scaled = (value: number) => formatNumber(value, locale, { maximumFractionDigits });
  const kb = safe / 1024;
  if (kb < 1024) return `${scaled(kb)} ${units.kilobyte}`;
  const mb = kb / 1024;
  if (mb < 1024) return `${scaled(mb)} ${units.megabyte}`;
  const gb = mb / 1024;
  if (gb < 1024) return `${scaled(gb)} ${units.gigabyte}`;
  const tb = gb / 1024;
  const format = numberFormat(locale, {
    style: 'unit',
    unit: 'terabyte',
    unitDisplay: 'short',
    maximumFractionDigits,
  });
  return format ? format.format(tb) : `${scaled(tb)} TB`;
}

export type DurationStyle = 'narrow' | 'short' | 'long';

const DURATION_UNITS = [
  ['day', 86_400, 'd'],
  ['hour', 3600, 'h'],
  ['minute', 60, 'm'],
  ['second', 1, 's'],
] as const;

/**
 * A length of time as words, the two largest non-zero units: `65` → `1m 5s`,
 * `3725` → `1h 2m`, `90000` → `1d 1h` (en, `narrow`), `1 h 2 min` (es, `short`),
 * `1 hour, 2 minutes`-style with `long`. Seconds in; fractions are floored, and
 * under a second reads `0s`. For a media timestamp (`1:23`) use
 * {@link formatClock}; this is the prose a task or an uptime wants.
 *
 * Each part goes through `Intl.NumberFormat` units, so the unit names are the
 * locale's; an engine without them gets the English letters.
 */
export function formatDurationText(
  seconds: number,
  locale?: string,
  options: { style?: DurationStyle; maxUnits?: number } = {},
): string {
  const { style = 'narrow', maxUnits = 2 } = options;
  let rest = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const parts: string[] = [];
  for (const [unit, size, letter] of DURATION_UNITS) {
    if (parts.length >= maxUnits) break;
    const value = Math.floor(rest / size);
    if (value === 0 && !(unit === 'second' && parts.length === 0)) continue;
    rest -= value * size;
    const format = numberFormat(locale, {
      style: 'unit',
      unit,
      unitDisplay: style,
      maximumFractionDigits: 0,
    });
    parts.push(format ? format.format(value) : `${value}${letter}`);
  }
  return parts.join(' ');
}

/**
 * A running time as a clock: `83` → `1:23`, `3723` → `1:02:03`. The same in
 * every locale — a media timestamp is not localised prose.
 */
export function formatClock(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = String(safe % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}

/** A multiplier such as a playback speed: `1.5` → `1.5×` (en), `1,5×` (es); up to two decimals. */
export function formatMultiplier(value: number, locale?: string): string {
  return `${formatNumber(value, locale, { maximumFractionDigits: 2 })}×`;
}
