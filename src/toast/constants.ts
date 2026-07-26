/**
 * Derived from sonner-native v0.26.4 — src/constants.ts and src/animations.ts
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * The two animation durations live HERE rather than in `animations.ts` so
 * `toast-store.ts` never has to import a Reanimated-dependent module: the store
 * stays pure JS and its suite needs zero React Native mocks.
 */
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
