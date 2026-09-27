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
