/** Stable option identity for a field that retains focus while choosing a suggestion. */
export function suggestionOptionId(listboxId: string, suggestionId: string): string {
  return `${listboxId}-option-${encodeURIComponent(suggestionId)}`;
}
