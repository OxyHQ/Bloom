/**
 * Helpers the navigation-banner catalog's strings share across languages.
 * Kept apart from `messages.ts` so a language module can use them without
 * linking the family's English strings (see `src/locale/translations`).
 */

export const words = (...parts: ReadonlyArray<string | undefined>) =>
  parts.filter(Boolean).join(' ');
/** The first letter lowercased: the rest may be a noun or a proper name that keeps its case. */
export const midSentence = (word: string | undefined, locale?: string) =>
  word ? word.charAt(0).toLocaleLowerCase(locale) + word.slice(1) : undefined;
