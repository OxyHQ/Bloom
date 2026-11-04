import { ORDER_CONFIRMATION_MESSAGES } from './messages';

/**
 * The English words the confirmation says when the app says nothing. The
 * component itself says them in the app's language (`ORDER_CONFIRMATION_MESSAGES`).
 */
export const ORDER_CONFIRMATION_TITLE = ORDER_CONFIRMATION_MESSAGES.en.title;
export const ORDER_CONFIRMATION_REFERENCE_LABEL = ORDER_CONFIRMATION_MESSAGES.en.referenceLabel;
export const ORDER_CONFIRMATION_ITEMS_LABEL = ORDER_CONFIRMATION_MESSAGES.en.itemsLabel;

/**
 * The drawn-on check. 56 is the size at which the 4px stroke of
 * `AnimatedCheck`'s 52-unit canvas reads as a mark rather than as an icon —
 * below ~40 it looks like a status glyph, which is the opposite of what a
 * finished flow is saying.
 */
export const ORDER_CONFIRMATION_MARK = 56;

/** Between the blocks of the receipt. */
export const ORDER_CONFIRMATION_GAP = 16;
