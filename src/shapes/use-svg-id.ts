import { useId } from 'react';

/** Encode punctuation rather than deleting it, keeping React IDs unique and URL-safe. */
export function useSvgId(prefix: string): string {
  const id = useId();
  return `bloom-${prefix}-${Array.from(id, (char) => char.codePointAt(0)!.toString(16)).join('-')}`;
}
