import { MOTION_RECIPES } from './recipes';
import { ReduceMotion, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

/** Interruptible capsule movement, shared by navigation and grouped controls. */
export const SELECTION_SPRING = MOTION_RECIPES.select;
export const SELECTION_FADE = { duration: 160, reduceMotion: ReduceMotion.System };

/**
 * A missing selection fades in place; a fully hidden capsule appears at its
 * next target. A visible capsule springs from its current position, including
 * during an interrupted fade. A pager/gesture driver can retain position
 * ownership while using the same visibility transition.
 *
 * Safe inside gesture/reaction worklets. Scheduling onto the UI thread belongs
 * to the caller, so direct manipulation never gains a second position writer.
 */
export function moveSelection(
  position: SharedValue<number>,
  opacity: SharedValue<number>,
  target: number | null,
  driven = false,
): void {
  'worklet';
  if (target === null) {
    opacity.value = withTiming(0, SELECTION_FADE);
    return;
  }
  if (!driven) {
    position.value = opacity.value === 0 ? target : withSpring(target, SELECTION_SPRING);
  }
  opacity.value = withTiming(1, SELECTION_FADE);
}
