/**
 * Shared default constants for `ResponsiveSheet`.
 *
 * Platform-agnostic — imported by both the default/web CSS implementation
 * (`ResponsiveSheet.tsx`) and the native reanimated implementation
 * (`ResponsiveSheet.native.tsx`) so the two variants stay in lockstep.
 */

/** Below this viewport width the sheet renders as a bottom-sheet. */
export const DEFAULT_BREAKPOINT = 768;

/** Side-sheet width (px) on wide screens. Capped to fit the viewport. */
export const DEFAULT_WIDTH = 460;

/** Bottom-sheet maximum height as a fraction of the viewport height. */
export const DEFAULT_MAX_HEIGHT_RATIO = 0.9;

/** Anchored edge of the side-sheet on wide screens. */
export const DEFAULT_SIDE = 'left' as const;

/**
 * Open/close transition duration (ms). ~280–300ms ease-out reads as smooth
 * without feeling sluggish; shared by the CSS transition and the native
 * reanimated timing so both platforms match.
 */
export const ANIMATION_DURATION = 280;

/**
 * Standard CSS approximation of reanimated's `Easing.out(Easing.cubic)` so the
 * web transition curve matches the native one.
 */
export const EASE_OUT = 'cubic-bezier(0.33, 1, 0.68, 1)';

/** Corner radius for the side-sheet panel and the top of the bottom-sheet. */
export const PANEL_RADIUS = 20;

/** Backdrop dim opacity once fully shown (matches `bg-black/40`). */
export const BACKDROP_OPACITY = 0.4;

/** Drag-handle pill geometry for the bottom-sheet. */
export const HANDLE_WIDTH = 36;
export const HANDLE_HEIGHT = 5;
export const HANDLE_RADIUS = 3;

/**
 * Minimum gutter kept between a wide side-sheet and the opposite viewport edge
 * when capping its width, so the panel never spans the full screen on a narrow
 * desktop window that is still above the breakpoint.
 */
export const SIDE_SHEET_MIN_GUTTER = 24;

/** A11y label fallback when the host does not provide one. */
export const DEFAULT_LABEL = 'Sheet';
