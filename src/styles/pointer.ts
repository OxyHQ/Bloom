/**
 * Whether the running target is a touch-capable WEB browser (coarse pointer).
 *
 * Two affordances key off it in opposite directions, which is why it is one
 * constant rather than a rule stated twice:
 *
 * - A press-SCALE only makes sense where a finger obscures the element. With a
 *   mouse it reads as jitter, so it is suppressed on non-touch web
 *   (`usePressAnimation`, `PressableScale`).
 * - A HOVER wash only makes sense with a hovering pointer, so it is suppressed
 *   ON touch web, matching native, which has no hover at all (`SubtleHover`).
 *
 * Resolved once at module load: a pointer type does not change under a running
 * app in any way worth a subscription, and both consumers need the answer during
 * render rather than after an effect.
 */
import { Platform } from 'react-native';

export const IS_WEB_TOUCH_DEVICE =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches;

/**
 * Whether a press-scale affordance should run at all on this target. True on
 * native always, and on web only with a coarse pointer.
 *
 * This is the POINTER half of the decision — the OS "reduce motion" setting is
 * the other half and is read per-component (it is a subscription, not a
 * constant). Both are applied together inside `usePressAnimation`.
 */
export const SUPPORTS_PRESS_SCALE = Platform.OS !== 'web' || IS_WEB_TOUCH_DEVICE;
