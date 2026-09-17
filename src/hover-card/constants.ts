/**
 * Hover intent timings. A card that opens the instant a cursor crosses a name
 * flashes across every link the pointer travels over on its way somewhere else;
 * one that closes the instant the cursor leaves the trigger can never be
 * reached. The open delay filters the first, the close delay bridges the second
 * — the cursor crosses the `HOVER_CARD_SIDE_OFFSET` gap well inside it.
 */
export const HOVER_CARD_OPEN_DELAY = 400;
export const HOVER_CARD_CLOSE_DELAY = 150;

/** Gap between the trigger and the card. */
export const HOVER_CARD_SIDE_OFFSET = 8;

/** Panel inset, the same one `UserHoverCard` draws on its own. */
export const HOVER_CARD_INSET = 15;

/** What a trigger announces it opens. */
export const HOVER_CARD_TRIGGER_POPUP = 'dialog';
