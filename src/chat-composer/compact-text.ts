/** Existing longer drafts remain intact; edits may shorten or replace them without growing. */
export function acceptsComposerText(current: string, next: string, maxLength: number): boolean {
  return next.length <= maxLength || (current.length > maxLength && next.length <= current.length);
}
