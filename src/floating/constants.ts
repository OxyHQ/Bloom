/** Minimum distance an anchored surface keeps from every viewport edge. */
export const VIEWPORT_GUTTER = 8;

/**
 * Default gap between an anchor and its surface, matching shadcn/RNR's
 * `sideOffset={4}` so a ported call site lands in the same place.
 */
export const DEFAULT_SIDE_OFFSET = 4;

/** Default shift along the alignment axis. Radix's default is 0. */
export const DEFAULT_ALIGN_OFFSET = 0;

/** Floor for a menu panel, so a one-word menu is still a menu-shaped surface. */
export const MENU_MIN_WIDTH = 180;
