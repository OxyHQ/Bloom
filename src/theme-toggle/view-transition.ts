/**
 * The circular theme reveal, for web.
 *
 * The next theme is revealed from the interaction point through the View
 * Transition API: the NEW root snapshot is masked by a soft-edged circle that
 * grows from the pointer (or the control's centre for keyboard activation)
 * until it covers the farthest viewport corner. Browsers without the API, and
 * anyone with reduced motion, get the same theme change immediately.
 *
 * Two implementation constraints, both forced by Bloom's own setup:
 *
 * - The `::view-transition-new(root)` keyframes are ADOPTED
 *   (`adoptStyleSheet`), never written into a `<style>` element — a style
 *   element's text is exactly what `style-src 'self'` blocks, silently.
 * - Bloom's mode lives in `BloomThemeProvider` state, which commits on
 *   React's schedule and applies its CSS variables in a layout effect, so
 *   the update callback waits for that commit (two macrotasks) before the
 *   browser captures the new snapshot.
 *   `flushSync` is not available here: this module is shared with native and
 *   must not import `react-dom`.
 *
 * No react-native import, so it costs nothing on native, where
 * {@link canRevealTheme} is always false.
 */
import { adoptStyleSheet, dropStyleSheet } from '../styles/adopt-style-sheet';

/** The theme transition's duration. */
export const THEME_TRANSITION_DURATION = 820;
/** The theme transition's easing. */
export const THEME_TRANSITION_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

const STYLE_ID = 'bloom-theme-toggle-reveal';

export interface RevealOrigin {
  x: number;
  y: number;
}

interface ViewTransitionLike {
  ready: Promise<void>;
  finished: Promise<void>;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => ViewTransitionLike;
};

let running = false;

/** Whether the animated reveal can run at all in this environment. */
export function canRevealTheme(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  if (typeof (document as ViewTransitionDocument).startViewTransition !== 'function') return false;
  const reduce =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return !reduce;
}

/** Blurred-circle mask: r 42 of 100 with a 2-unit gaussian edge. */
function blurCircleMask(): string {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
    '<defs><filter id="blur" x="-50%" y="-50%" width="200%" height="200%">',
    '<feGaussianBlur stdDeviation="2" /></filter></defs>',
    '<circle cx="50" cy="50" r="42" fill="white" filter="url(#blur)" />',
    '</svg>',
  ].join('');
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** The reveal's stylesheet, pure so it can be asserted without a DOM. */
export function revealCss({ x, y }: RevealOrigin, radius: number, duration: number): string {
  const mask = blurCircleMask();
  const size = radius * 2.5;
  const endX = x - size / 2;
  const endY = y - size / 2;
  return `
::view-transition-new(root) {
  -webkit-mask-image: ${mask};
  mask-image: ${mask};
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  animation: bloom-theme-mask-reveal ${duration}ms ${THEME_TRANSITION_EASING} both;
  transform-origin: ${x}px ${y}px;
  will-change: -webkit-mask-size, -webkit-mask-position, mask-size, mask-position;
}
@keyframes bloom-theme-mask-reveal {
  from {
    -webkit-mask-position: ${x}px ${y}px;
    mask-position: ${x}px ${y}px;
    -webkit-mask-size: 0px 0px;
    mask-size: 0px 0px;
  }
  to {
    -webkit-mask-position: ${endX}px ${endY}px;
    mask-position: ${endX}px ${endY}px;
    -webkit-mask-size: ${size}px ${size}px;
    mask-size: ${size}px ${size}px;
  }
}
`;
}

function waitForCommit(): Promise<void> {
  return new Promise((resolve) => setTimeout(() => setTimeout(resolve, 0), 0));
}

/**
 * Run `apply` inside a circular reveal from `origin`, or immediately when the
 * reveal cannot run. `origin` null means keyboard activation: the reveal starts
 * at `fallback` (the control's centre).
 */
export async function revealTheme(
  apply: () => void,
  {
    origin,
    fallback,
    duration = THEME_TRANSITION_DURATION,
  }: { origin: RevealOrigin | null; fallback: RevealOrigin | null; duration?: number },
): Promise<void> {
  if (!canRevealTheme()) {
    apply();
    return;
  }
  if (running) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const raw = origin ?? fallback ?? { x: vw / 2, y: vh / 2 };
  const point = {
    x: Math.min(Math.max(raw.x, 0), vw),
    y: Math.min(Math.max(raw.y, 0), vh),
  };
  const radius = Math.hypot(Math.max(point.x, vw - point.x), Math.max(point.y, vh - point.y));

  running = true;
  adoptStyleSheet(STYLE_ID, revealCss(point, radius, duration));
  try {
    const transition = (document as ViewTransitionDocument).startViewTransition!(async () => {
      apply();
      await waitForCommit();
    });
    await transition.ready;
    await transition.finished;
  } catch {
    // An aborted transition still has to leave the theme changed; `apply` is
    // idempotent (it sets a mode), so running it again is safe.
    apply();
  } finally {
    dropStyleSheet(STYLE_ID);
    running = false;
  }
}
