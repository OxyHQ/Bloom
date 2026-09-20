/**
 * The three decisions a tag input makes that have nothing to do with rendering:
 * what a typed string BECOMES, whether it may be added, and what to offer next.
 *
 * They are here because every one of them is a silent failure in a component
 * test: a duplicate that is added anyway renders a perfectly ordinary second
 * chip, and a suggestion list that forgot to exclude what is already committed
 * renders a perfectly ordinary list.
 */
import type { TagSuggestion } from './types';

/** The default normalisation: surrounding whitespace is not part of a tag. */
export function normalizeTag(raw: string): string {
  return raw.trim();
}

/** A bare string suggestion is shorthand for `{ value }`. */
export function toSuggestion(entry: string | TagSuggestion): TagSuggestion {
  return typeof entry === 'string' ? { value: entry } : entry;
}

/**
 * Whether `candidate` is already in `value`.
 *
 * Case-INSENSITIVE, because "Design" and "design" are one tag to everybody
 * except a string comparison, and a list that holds both is the bug a tag input
 * exists to prevent. Callers that want them distinct pass their own `normalize`
 * — which runs first, and can encode any answer including this one.
 */
export function isDuplicate(value: ReadonlyArray<string>, candidate: string): boolean {
  const key = candidate.toLocaleLowerCase();
  return value.some((tag) => tag.toLocaleLowerCase() === key);
}

export interface TagCommitResult {
  /** The next list, or `null` when nothing changed. */
  next: ReadonlyArray<string> | null;
  /** Why it did not change. `'full'` is the one the caller reports; the rest are silent. */
  rejected?: 'empty' | 'duplicate' | 'full' | 'unknown';
}

/**
 * Try to commit one typed string.
 *
 * **A duplicate is rejected QUIETLY.** No error, no shake, no hint: the tag the
 * user asked for is already there, so the field is already in the state they
 * wanted and telling them off for it is noise. Being FULL is the one refusal
 * with a consequence a caller may want to announce, so it is the one that is
 * named back.
 */
export function commitTag(
  value: ReadonlyArray<string>,
  raw: string,
  options: {
    normalize?: (raw: string) => string;
    max?: number;
    allowCreate?: boolean;
    known?: ReadonlyArray<string>;
  } = {},
): TagCommitResult {
  const { normalize = normalizeTag, max, allowCreate = true, known } = options;
  const tag = normalize(raw);
  if (tag === '') return { next: null, rejected: 'empty' };
  if (isDuplicate(value, tag)) return { next: null, rejected: 'duplicate' };
  if (!allowCreate) {
    const inVocabulary = (known ?? []).some(
      (entry) => entry.toLocaleLowerCase() === tag.toLocaleLowerCase(),
    );
    if (!inVocabulary) return { next: null, rejected: 'unknown' };
  }
  if (max !== undefined && value.length >= max) return { next: null, rejected: 'full' };
  return { next: [...value, tag] };
}

/**
 * What to offer, given what is typed and what is already committed.
 *
 * Committed tags are excluded — offering one that is already a chip is offering
 * a no-op. The match is a case-insensitive SUBSTRING rather than a prefix: tag
 * vocabularies are compound ("Q3 planning", "planning — legacy") and a prefix
 * match hides the entry the typist was looking for.
 */
export function filterSuggestions(
  suggestions: ReadonlyArray<string | TagSuggestion>,
  query: string,
  committed: ReadonlyArray<string>,
  limit: number,
): ReadonlyArray<TagSuggestion> {
  const q = query.trim().toLocaleLowerCase();
  const out: TagSuggestion[] = [];
  for (const entry of suggestions) {
    const suggestion = toSuggestion(entry);
    if (isDuplicate(committed, suggestion.value)) continue;
    if (q !== '' && !`${suggestion.value} ${suggestion.label ?? ''}`.toLocaleLowerCase().includes(q)) {
      continue;
    }
    out.push(suggestion);
    if (out.length >= limit) break;
  }
  return out;
}
