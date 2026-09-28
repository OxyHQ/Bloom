/**
 * Helpers the shapes catalog's strings share across languages.
 * Kept apart from `messages.ts` so a language module can use them without
 * linking the family's English strings (see `src/locale/translations`).
 */
import type { NamedShapeName } from './paths';
import type { CookieShape, CloverShape } from './messages';

/**
 * One language's shape names. The cookies and clovers are one phrase each with
 * the count in it, so each language says "a cookie with N sides" once.
 */
export function shapeNames(
  names: Omit<Record<NamedShapeName, string>, CookieShape | CloverShape>,
  cookie: (sides: number) => string,
  clover: (leaves: number) => string,
): Record<NamedShapeName, string> {
  return {
    ...names,
    '4-sided-cookie': cookie(4),
    '6-sided-cookie': cookie(6),
    '7-sided-cookie': cookie(7),
    '9-sided-cookie': cookie(9),
    '12-sided-cookie': cookie(12),
    '4-leaf-clover': clover(4),
    '8-leaf-clover': clover(8),
  };
}
