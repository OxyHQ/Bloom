import type { PriceLineState } from './types';

/** The word drawn beside an amount that is not the answer yet. */
export const PRICE_STATE_LABELS: Record<Exclude<PriceLineState, 'final'>, string> = {
  estimated: 'Estimated',
  pending: 'Pending',
};

/** Drawn where the amount would be on a line that has none. */
export const PRICE_PENDING_PLACEHOLDER = '—';

/**
 * One line's minimum height. It is the 32 rung rather than the 20 a body line
 * needs, so that a line carrying the info affordance is the same height as the
 * lines around it — the glyph is a 32 round target and a row that grew only
 * where an explanation happened to exist read as a ragged column.
 */
export const PRICE_LINE_HEIGHT = 32;

/** The info affordance: a 32 round target with a 16 glyph. */
export const PRICE_INFO_SIZE = 32;
export const PRICE_INFO_GLYPH = 16;

/** Space between two lines, and around the rule above the total. */
export const PRICE_LINE_GAP = 4;
export const PRICE_RULE_SPACING = 8;
