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

/**
 * Picks the form for `count`. `other` is required; a category a language
 * uses but the caller left out falls back to it.
 */
export function plural(
  language: BloomLanguage,
  count: number,
  forms: Partial<Record<PluralCategory, string>> & { other: string },
): string {
  return (forms[pluralCategory(language, count)] ?? forms.other).replace('{n}', String(count));
}
