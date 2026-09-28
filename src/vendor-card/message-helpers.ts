/**
 * Helpers the vendor-card catalog's strings share across languages.
 * Kept apart from `messages.ts` so a language module can use them without
 * linking the family's English strings (see `src/locale/translations`).
 */
import type { BloomLanguage } from '../locale/languages';
import { type PluralCategory, plural, pluralCategory } from '../locale/plural';

/** A count the app may hand over as a number or as its own text ("1.2k"). */
export function counted(
  language: BloomLanguage,
  count: number | string,
  forms: Partial<Record<PluralCategory, string>> & { other: string },
): string {
  if (typeof count === 'number') return plural(language, count, forms);
  const form = /^\d+$/.test(count) ? forms[pluralCategory(language, Number(count))] : undefined;
  return (form ?? forms.other).replace('{n}', count);
}
export const has = (reviews: number | string | undefined): reviews is number | string =>
  reviews != null && reviews !== '';
