/**
 * `Intl.DateTimeFormat` pinned to the GREGORIAN calendar, keeping the locale's
 * language, digits and order.
 *
 * Bloom's grids lay out and return Gregorian `Date`s. A locale whose default
 * calendar is another one — `fa-IR` (Persian, year 1405), `th-TH` (Buddhist,
 * 2569), some `ar-*` — would otherwise title a Gregorian September with
 * another calendar's month and year, so the day a reader picks and the day the
 * app receives disagree. `null` when the runtime cannot format at all (a bad
 * tag), for the caller's own fallback.
 */
export function formatGregorian(
  date: Date,
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): string | null {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, calendar: 'gregory' }).format(date);
  } catch {
    // An engine that rejects the `calendar` option still formats the locale's
    // words; only a tag it cannot read at all falls through to `null`.
    try {
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch {
      return null;
    }
  }
}

const ENGLISH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * The twelve month names, January first, in the locale's words on the
 * Gregorian calendar: `long` ("January", "enero", "январь") or `short`
 * ("Jan", "ene", "янв."). Falls back to English when the runtime cannot format.
 */
export function monthNames(locale: string | undefined, width: 'long' | 'short' = 'long'): string[] {
  return ENGLISH_MONTHS.map(
    (english, month) =>
      formatGregorian(new Date(2024, month, 15), locale, { month: width }) ?? (width === 'long' ? english : english.slice(0, 3)),
  );
}
