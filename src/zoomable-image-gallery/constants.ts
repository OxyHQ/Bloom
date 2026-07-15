import { RADIUS } from '../design-tokens';

/** Fraction of the screen the fitted "big" image is allowed to occupy. */
export const FIT_FRACTION = 0.9;
/** Drag distance (as a fraction of screen height) that fully fades the backdrop. */
export const MAX_DRAG_FRACTION = 0.3;
/** Drag distance (as a fraction of screen height) over which scale floors out. */
export const SCALE_DRAG_FRACTION = 0.5;
/** Minimum scale reached while dragging to dismiss. */
export const MIN_DRAG_SCALE = 0.5;
/** Drag distance (as a fraction of screen height) past which a drag dismisses. */
export const DISMISS_FRACTION = 0.15;
/** Axis-decision threshold (px): the vertical dismiss pan only claims drags past this. */
export const AXIS_DECISION_OFFSET = 12;

export const OPEN_DURATION_WEB = 300;
export const CLOSE_DURATION_WEB = 280;
export const OPACITY_DURATION = 200;

export const OPEN_SPRING = { damping: 18, stiffness: 400, mass: 0.4 } as const;
export const CLOSE_SPRING = { damping: 22, stiffness: 450, mass: 0.35 } as const;
export const SNAP_BACK_SPRING = { damping: 20, stiffness: 400, mass: 0.4 } as const;

/** Default corner radius for the zoomed images — Bloom's `radius-12` token. */
export const DEFAULT_CORNER_RADIUS = RADIUS['radius-12'];
