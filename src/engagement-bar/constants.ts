import { hitSlop } from '../styles/tokens';

/** The glyph box, in px. */
export const ENGAGEMENT_ICON_SIZE = 20;

/** The glyph a busy action spins in its place. */
export const ENGAGEMENT_SPINNER_SIZE = 16;

/**
 * The action's own padding. The bar bleeds by the horizontal half, so the first
 * and last glyphs line up with the content edge while the press wash still has
 * room around them.
 */
export const ENGAGEMENT_PAD_X = 6;
export const ENGAGEMENT_PAD_Y = 2;

/** Glyph-to-count gap. */
export const ENGAGEMENT_COUNT_GAP = 4;

export const ENGAGEMENT_HIT_SLOP = hitSlop.md;

/** How far a rolling count travels, in px. */
export const ROLL_DISTANCE = 10;

/** What the web sheet hangs off: react-native-web forwards `dataSet` as `data-*`. */
export const ENGAGEMENT_ACTION_SELECTOR = '[data-bloom-engagement-action]';
