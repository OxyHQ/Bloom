/**
 * Helpers the rating catalog's strings share across languages.
 * Kept apart from `messages.ts` so a language module can use them without
 * linking the family's English strings (see `src/locale/translations`).
 */
import type { BloomLanguage } from '../locale/languages';
import { type PluralCategory, plural } from '../locale/plural';

/**
 * `plural` for a count that may be a preformatted string: the category comes
 * from its number when it has one, and `{n}` is the string as given.
 */
export function countForms(
  language: BloomLanguage,
  count: number | string,
  forms: Partial<Record<PluralCategory, string>> & { other: string },
): string {
  const n = typeof count === 'number' ? count : Number(count);
  const withSlot = Object.fromEntries(
    Object.entries(forms).map(([key, form]) => [key, form.replace('{n}', '\u0000')]),
  ) as typeof forms;
  return plural(language, Number.isFinite(n) ? n : 99, withSlot).replace('\u0000', String(count));
}
