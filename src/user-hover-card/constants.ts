import { space } from '../styles/tokens';

/**
 * The card's geometry, in one place, because two of these numbers are now a
 * CONTRACT rather than an implementation detail: the card has two consumer
 * slots, and a consumer cannot size content for a width it has to discover by
 * overflowing.
 *
 * The card does not clip (see `UserHoverCard`), so content wider than
 * {@link USER_HOVER_CARD_CONTENT_WIDTH} paints OUTSIDE the card's border rather
 * than being cut off — the louder failure of the two, and still a failure.
 */

/**
 * Usable inner width, and the number a consumer sizes slot content against.
 *
 * This is the DECIDED number; the card's width is derived from it. That is the
 * inversion the slots forced: the family's width was an unexplained `280` from
 * the day it shipped (0.9.0), and the inner width that fell out of it — 248 —
 * missed the first real slot content by ONE pixel. A contribution graph of 18
 * columns at `cellSize={11} gap={3}` is 249px, and 18 columns is what 119 days
 * spans once the leading partial week is counted.
 *
 * 256 is a step up on the 8px grid the spacing scale follows, it is 16× the
 * inset, and it clears that measured requirement with room rather than exactly
 * — a number chosen to be sized against, not nudged to fit one consumer.
 */
export const USER_HOVER_CARD_CONTENT_WIDTH = 256;

/** Padding on all four sides. */
export const USER_HOVER_CARD_INSET = space.lg;

/**
 * Total card width — derived, never the other way round. Anything positioning
 * the card (see `AvatarGroup`'s web hover card) reads this rather than keeping
 * its own copy: two spellings of one number centre the card off its anchor the
 * first time either moves.
 */
export const USER_HOVER_CARD_WIDTH =
  USER_HOVER_CARD_CONTENT_WIDTH + USER_HOVER_CARD_INSET * 2;
