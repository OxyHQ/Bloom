/**
 * Derived from sonner-native v0.26.4 — src/constants.ts and src/animations.ts
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * The two animation durations live HERE rather than in `animations.ts` so
 * `toast-store.ts` never has to import a Reanimated-dependent module: the store
 * stays pure JS and its suite needs zero React Native mocks.
 */
import { space } from '../styles/tokens';
import type {
  AutoWiggle,
  ToastPosition,
  ToastSwipeDirection,
  ToastTheme,
  ToastVariant,
} from './types';

/** Fallback row height until a toast has been measured. */
export const ESTIMATED_TOAST_HEIGHT = 70;
export const CLOSE_BUTTON_HIT_AREA = 60;
export const OUTSIDE_PRESS_PADDING = 20;
/** However deep a stack gets, a buried row never narrows past this scale. */
export const MIN_STACK_SCALE_X = 0.8;

/**
 * W12 — HOW WIDE A TOAST ROW IS ALLOWED TO GET.
 *
 * sonner-native has no cap: the row is `width: '100%'` and the card inside it is
 * inset by `marginHorizontal: space.lg`, so the card is always
 * screen-width-minus-32. That is correct for the platform it was written for and
 * wrong everywhere else — on a 1280px desktop viewport it produces a ~1248px
 * card, which reads as a page banner rather than a toast. sonner (web) instead
 * fixes the card at `--width: 356px`.
 *
 * The cap therefore sizes the ROW BOX, which carries the card's two `space.lg`
 * gutters, so the visible card lands on sonner's 356px on any viewport wide
 * enough to reach it. `maxWidth` needs no platform fork because it degrades by
 * itself: below a 388px viewport the row is still screen-width and the card is
 * still screen-width-minus-32, exactly as before, so phone portrait — the case
 * the mobile sizing was right for — is untouched. Above it (desktop, tablet,
 * phone landscape) the row caps and centres.
 *
 * `ToastSwipeHandler`'s dismiss threshold and `calculateStackScaleX`'s depth cue
 * are fractions of this row width, NOT of the window: at 1280px a
 * window-relative threshold would demand a 320px drag from a 388px card, and a
 * window-relative squeeze would shrink a buried row by 4px instead of 16px.
 * A consumer who overrides the cap through `toastOptions.toastContainerStyle`
 * moves the card only; both of those keep measuring against this default.
 */
export const TOAST_MAX_ROW_WIDTH = 356 + space.lg * 2;

/** Enter animation length; also the auto-close timer's head start and the overlay teardown delay. */
export const ENTERING_ANIMATION_DURATION = 300;
export const STACKING_ANIMATION_DURATION = 600;

export const toastDefaults: {
  duration: number;
  position: ToastPosition;
  offset: number;
  swipeToDismissDirection: ToastSwipeDirection;
  variant: ToastVariant | undefined;
  visibleToasts: number;
  closeButton: boolean;
  dismissible: boolean;
  unstyled: boolean;
  invert: boolean;
  pauseWhenPageIsHidden: boolean;
  gap: number;
  theme: ToastTheme;
  autoWiggleOnUpdate: AutoWiggle;
  richColors: boolean;
  enableStacking: boolean;
  stackGap: number;
  allowFontScaling: boolean;
} = {
  duration: 3000,
  position: 'bottom-center',
  /**
   * 0 means "derive from the safe-area inset" — `getInsetValues` then yields
   * `inset + 8`, or 16 when there is no inset. A non-zero default would pin the
   * stack to a fixed offset and ignore the notch / home indicator entirely.
   */
  offset: 0,
  swipeToDismissDirection: 'left',
  /**
   * No default variant: a plain `toast('Saved')` must render neutral. Upstream
   * defaults this to `'info'`, which silently gives every unqualified toast
   * info styling.
   */
  variant: undefined,
  visibleToasts: 3,
  closeButton: false,
  dismissible: true,
  unstyled: false,
  invert: false,
  pauseWhenPageIsHidden: true,
  gap: 8,
  theme: 'system',
  autoWiggleOnUpdate: 'never',
  richColors: false,
  enableStacking: false,
  stackGap: 8,
  allowFontScaling: true,
};
