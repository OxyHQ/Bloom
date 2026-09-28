import type { BloomLanguage } from './languages';

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * The CLDR cardinal category of a whole number, for Bloom's languages.
 *
 * Written out rather than read from `Intl.PluralRules` because Hermes — React
 * Native's engine — does not implement `PluralRules`: a catalog that called it
 * would pluralise on web and throw on a phone. Whole numbers only; a count of
 * days or minutes is never fractional.
 */
export function pluralCategory(language: BloomLanguage, count: number): PluralCategory {
  const n = Math.abs(Math.trunc(count));
  const mod10 = n % 10;
  const mod100 = n % 100;
  switch (language) {
    case 'ja':
    case 'zh':
    case 'id':
      return 'other';
    case 'fr':
    case 'pt':
    case 'hi':
    case 'bn':
      return n === 0 || n === 1 ? 'one' : 'other';
    case 'ru':
      if (mod10 === 1 && mod100 !== 11) return 'one';
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
      return 'many';
    case 'ar':
      if (n === 0) return 'zero';
      if (n === 1) return 'one';
      if (n === 2) return 'two';
      if (mod100 >= 3 && mod100 <= 10) return 'few';
      if (mod100 >= 11) return 'many';
      return 'other';
    default:
      return n === 1 ? 'one' : 'other';
  }
}

/** Arabic-Indic, Persian, Devanagari and Bengali digits, as their ASCII values. */
const NATIVE_DIGITS = /[\u0660-\u0669\u06f0-\u06f9\u0966-\u096f\u09e6-\u09ef]/g;

/**
 * The whole number a count reads as, whether it came as a number or already
 * formatted for display: `1234`, `"1,234"`, `"1.234"`, `"1 234"`, `"١٬٢٣٤"`.
 * Group marks and spaces are dropped; a fraction is ignored. `NaN` when there
 * are no digits at all.
 */
export function countValue(count: number | string): number {
  if (typeof count === 'number') return count;
  const ascii = count.replace(NATIVE_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    const zero = [0x0660, 0x06f0, 0x0966, 0x09e6].find((base) => code >= base && code <= base + 9) ?? code;
    return String(code - zero);
  });
  // A decimal part only exists after the LAST mark when it is not three digits long.
  const whole = ascii.replace(/[.,\u066b](\d{1,2}|\d{4,})\s*$/, '');
  const digits = whole.replace(/\D/g, '');
  return digits ? Number(digits) : Number.NaN;
}

/**
 * Picks the form for `count` and puts the count in it. `other` is required; a
 * category a language uses but the caller left out falls back to it. A count
 * given as a string (already formatted: `"1,234"`) is shown exactly as given
 * and pluralised by the number it reads as.
 */
export function plural(
  language: BloomLanguage,
  count: number | string,
  forms: Partial<Record<PluralCategory, string>> & { other: string },
): string {
  return (forms[pluralCategory(language, countValue(count))] ?? forms.other).replace('{n}', String(count));
}
