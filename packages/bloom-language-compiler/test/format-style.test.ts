/**
 * The stdlib's FormatStyle: each form writes exactly what the TS it replaces writes, through
 * Intl, in English, Spanish, Japanese and Arabic.
 */

type D = Date;

// Required, not imported: see bloom.cost.test.tsx.
const f = require('./packages/format-app/Sources/App/FormatStyle.bloom') as {
  number: (x: number, locale: string) => string;
  atMostOne: (x: number, locale: string) => string;
  exact: (x: number, locale: string) => string;
  fixed: (x: number) => string;
  price: (x: number, code: string, locale: string) => string;
  wholePrice: (n: number, code: string, locale: string) => string;
  monthDay: (d: D, locale: string) => string;
  longDate: (d: D, locale: string) => string;
  clock: (d: D, locale: string) => string;
  styled: (d: D, locale: string) => string;
  dateOnly: (d: D, locale: string) => string;
  plain: (d: D, locale: string) => string;
  relative: (d: D, now: D) => string;
  numericDate: (d: D, locale: string) => string;
  numericDateTime: (d: D, locale: string) => string;
  clock12: (d: D, locale: string) => string;
  hourOnly: (d: D, locale: string) => string;
  hourNoAMPM: (d: D, locale: string) => string;
};

const LOCALES = ['en', 'es', 'ja', 'ar'];
const ms = Date.UTC(2026, 10, 26, 18, 5, 9);
const date: D = new Date(ms);

describe.each(LOCALES)('%s', (locale) => {
  it('writes numbers as toLocaleString does', () => {
    for (const x of [1234.5678, 0.5, -42, 1e6]) {
      expect(f.number(x, locale)).toBe(x.toLocaleString(locale));
      expect(f.atMostOne(x, locale)).toBe(x.toLocaleString(locale, { maximumFractionDigits: 1 }));
      expect(f.exact(x, locale)).toBe(
        x.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      );
    }
  });

  it('writes currencies as Intl does', () => {
    expect(f.price(1234.5, 'USD', locale)).toBe(
      (1234.5).toLocaleString(locale, { style: 'currency', currency: 'USD' }),
    );
    expect(f.price(99, 'EUR', locale)).toBe(
      (99).toLocaleString(locale, { style: 'currency', currency: 'EUR' }),
    );
    expect(f.wholePrice(1500, 'JPY', locale)).toBe(
      (1500).toLocaleString(locale, { style: 'currency', currency: 'JPY' }),
    );
  });

  it('writes dates field by field, and in styles, as Intl does', () => {
    const at = new Date(ms);
    expect(f.monthDay(date, locale)).toBe(
      at.toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    );
    expect(f.longDate(date, locale)).toBe(
      at.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Tokyo',
      }),
    );
    expect(f.clock(date, locale)).toBe(
      at.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }),
    );
    // `.hour(.twoDigits(amPM: .abbreviated))`: Intl's `hour12: true`, the 12-hour clock.
    expect(f.clock12(date, locale)).toBe(
      at.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      }),
    );
    expect(f.styled(date, locale)).toBe(
      at.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }),
    );
    expect(f.dateOnly(date, locale)).toBe(
      at.toLocaleDateString(locale, { dateStyle: 'long', timeZone: 'UTC' }),
    );
    expect(f.plain(date, locale)).toBe(
      at.toLocaleString(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
      }),
    );
  });
});

it('keeps formatted(fractionDigits: n) as toFixed, and .relative', () => {
  expect(f.fixed(3.14159)).toBe('3.14');
  expect(f.relative(date, new Date(ms + 120_000))).toBe('2 minutes ago');
});

it("writes DateStyle.numeric as Swift does: the full year, not Intl's short style", () => {
  // Swift's `Date.FormatStyle(date: .numeric)` in en_US: "11/26/2026", and with
  // `time: .shortened` "11/26/2026, 6:05 PM" (Intl's `short` style would write "11/26/26").
  expect(f.numericDate(date, 'en-US')).toBe('11/26/2026');
  expect(f.numericDateTime(date, 'en-US')).toBe('11/26/2026, 6:05 PM');
  expect(f.numericDate(date, 'es')).toBe('26/11/2026');
});

it("writes an hour without its AM/PM for amPM: .omitted, in the locale's clock", () => {
  // Swift's `.hour(.defaultDigits(amPM: .omitted))` in en_US at 18:05 is "6"; a 24-hour locale's is "18".
  expect(f.hourOnly(date, 'en-US')).toBe('6');
  expect(f.hourNoAMPM(date, 'en-US')).toBe('6:05');
  expect(f.hourNoAMPM(date, 'es')).toBe('18:05');
  expect(f.clock12(date, 'en-US')).toBe('06:05 PM');
});
