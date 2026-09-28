/**
 * Helpers the place-card catalog's strings share across languages.
 * Kept apart from `messages.ts` so a language module can use them without
 * linking the family's English strings (see `src/locale/translations`).
 */
import type { BloomLanguage } from '../locale/languages';
import { type PluralCategory, plural } from '../locale/plural';

/** `plural` for a count that may arrive pre-formatted: a string takes `other`. */
export function countOf(
  language: BloomLanguage,
  count: number | string,
  forms: Partial<Record<PluralCategory, string>> & { other: string },
): string {
  return typeof count === 'number' ? plural(language, count, forms) : forms.other.replace('{n}', count);
}
export const withReviews = (sentence: string, reviews: string | undefined) =>
  reviews === undefined ? sentence : `${sentence}, ${reviews}`;
