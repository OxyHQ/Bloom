/**
 * Helpers the call-ui catalog's strings share across languages.
 * Kept apart from `messages.ts` so a language module can use them without
 * linking the family's English strings (see `src/locale/translations`).
 */
import type { CallPipCorner } from './types';

/** A corner's name, or the raw key for a value outside the four (never thrown on). */
export const corner = (corners: Record<CallPipCorner, string>, value: CallPipCorner): string => corners[value] ?? String(value);
