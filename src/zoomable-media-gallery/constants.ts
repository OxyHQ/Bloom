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

/** Minimum pinch-zoom scale of the active image (its un-zoomed size). */
export const MIN_ZOOM_SCALE = 1;
/** Maximum pinch-zoom scale of the active image. */
export const MAX_ZOOM_SCALE = 3;
/** Below this final pinch scale, the zoom snaps back to 1 (treated as un-zoomed). */
export const ZOOM_SNAP_THRESHOLD = 1.1;
/** Scale a double-tap zooms the active image to when it is currently un-zoomed. */
export const DOUBLE_TAP_ZOOM_SCALE = 2;
/** Fraction of finger travel applied while panning a zoomed image. */
export const ZOOM_PAN_DAMPING = 0.8;
/** Base clamp (px, multiplied by the current zoom) bounding a zoomed image's pan. */
export const ZOOM_PAN_MAX_BASE = 100;
/** Edge length (px) of each tile in the `thumbnails` indicator variant. */
export const THUMBNAIL_STRIP_TILE_SIZE = 52;
