import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/**
 * Anchor a `<Dialog>` can render against.
 *
 * - `'center'` — the default centered modal card (current behavior).
 * - `'left'` / `'right'` — an anchored side-sheet / drawer.
 * - `'bottom'` — a bottom-sheet (drag handle, slide-up).
 */
export type DialogPlacement = 'center' | 'left' | 'right' | 'bottom';

/**
 * A `<Dialog>` placement that may vary by viewport width.
 *
 * Either a single `DialogPlacement` (applied at every width) or a responsive
 * map whose `base` applies below the first breakpoint and whose `sm`/`md`/`lg`/
 * `xl` keys override it at and above the matching Tailwind breakpoint.
 *
 * The common store-drawer case is `{ base: 'bottom', md: 'left' }`; the common
 * dialog-to-sheet case is `{ base: 'bottom', md: 'center' }`.
 */
export type ResponsiveDialogPlacement =
  | DialogPlacement
  | {
      base: DialogPlacement;
      sm?: DialogPlacement;
      md?: DialogPlacement;
      lg?: DialogPlacement;
      xl?: DialogPlacement;
    };

/**
 * Tailwind-default breakpoints (px). A responsive `placement` map resolves to
 * the value for the largest key whose min-width is `<=` the current viewport
 * width, falling back to `base`.
 */
export const BREAKPOINT_SM = 640;
export const BREAKPOINT_MD = 768;
export const BREAKPOINT_LG = 1024;
export const BREAKPOINT_XL = 1280;

/** Ordered breakpoint table, widest first, so the first match wins. */
const RESPONSIVE_KEYS = [
  ['xl', BREAKPOINT_XL],
  ['lg', BREAKPOINT_LG],
  ['md', BREAKPOINT_MD],
  ['sm', BREAKPOINT_SM],
] as const;

/** Default side-sheet width (px) on wide screens. */
export const DEFAULT_SIDE_WIDTH = 460;

/** Default centered-card max width (px). Matches the legacy `maxWidth: 480`. */
export const DEFAULT_CENTER_MAX_WIDTH = 480;

/** Default bottom-sheet max height as a fraction of the viewport height. */
export const DEFAULT_MAX_HEIGHT_RATIO = 0.9;

/** Corner radius shared by the side-sheet panel and the bottom-sheet top. */
export const PANEL_RADIUS = 20;

/** Open/close transition duration (ms). ~280ms ease-out reads smooth. */
export const ANIMATION_DURATION = 280;

/** Centered-card fade-out duration (ms) — preserves the legacy timing. */
export const CENTER_FADE_OUT_DURATION = 150;

/** CSS approximation of reanimated's `Easing.out(Easing.cubic)`. */
export const EASE_OUT = 'cubic-bezier(0.33, 1, 0.68, 1)';

/** Backdrop dim opacity once fully shown (matches `bg-black/40`). */
export const SHEET_BACKDROP_OPACITY = 0.4;

/** Stable testID for the dimmed backdrop of a side/bottom placement dialog. */
export const DIALOG_SHEET_BACKDROP_TESTID = 'bloom-dialog-sheet-backdrop';

/** Drag-handle pill geometry for the bottom-sheet. */
export const HANDLE_WIDTH = 36;
export const HANDLE_HEIGHT = 5;
export const HANDLE_RADIUS = 3;

/**
 * Minimum gutter kept between a wide side-sheet and the opposite viewport edge
 * when capping its width, so the panel never spans the full screen.
 */
export const SIDE_SHEET_MIN_GUTTER = 24;

/**
 * Resolve a (possibly responsive) `placement` to a concrete `DialogPlacement`
 * for the current viewport width.
 *
 * A plain string placement resolves to itself. A responsive map picks the
 * value for the largest breakpoint key whose min-width is `<=` the viewport
 * width, falling back to `base` below the first breakpoint.
 */
export function useResolvedPlacement(
  placement: ResponsiveDialogPlacement | undefined,
): DialogPlacement {
  const { width } = useWindowDimensions();

  return useMemo<DialogPlacement>(() => {
    if (placement === undefined) return 'center';
    if (typeof placement === 'string') return placement;
    for (const [key, minWidth] of RESPONSIVE_KEYS) {
      if (width >= minWidth) {
        const value = placement[key];
        if (value !== undefined) return value;
      }
    }
    return placement.base;
  }, [placement, width]);
}
