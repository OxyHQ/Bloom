/**
 * The drag's thresholds and the rail's geometry, in one place because they are
 * one decision: how far a finger travels before the row is considered to have
 * been opened rather than nudged.
 */

/** The widest a pane opens, per action. A 76 target is comfortable for a thumb. */
export const SWIPE_ACTION_WIDTH = 76;

/**
 * How far a row must travel, as a fraction of the pane's full width, before the
 * drag is committed rather than sprung back. Below it the row closes, so a
 * half-hearted drag never leaves a row stuck ajar.
 */
export const SWIPE_COMMIT_FRACTION = 0.4;

/** Below this many pixels the drag reads as a tap and the row springs straight back. */
export const SWIPE_TAP_SLOP = 10;

/** How long the snap to the resting position takes. Dropped under reduced motion. */
export const SWIPE_SNAP_DURATION = 160;

/** The corner radius a row's panes are clipped to, unless the caller says otherwise. */
export const SWIPE_ROW_RADIUS = 12;

/** How far the finger travels horizontally before the pan claims the touch. */
export const SWIPE_ACTIVATE_OFFSET = 12;
