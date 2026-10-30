import {
  ReduceMotion,
  runOnJS,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/** Intent owns timing; geometry and gesture velocity remain with the component. */
export const MOTION_RECIPES = {
  press: { duration: 120, reduceMotion: ReduceMotion.System },
  select: { duration: 420, dampingRatio: 0.82, reduceMotion: ReduceMotion.System },
  expand: { duration: 380, dampingRatio: 1, reduceMotion: ReduceMotion.System },
  present: { duration: 220, reduceMotion: ReduceMotion.System },
  dismiss: { duration: 150, reduceMotion: ReduceMotion.System },
} as const;
export type MotionIntent = keyof typeof MOTION_RECIPES;

/**
 * Retarget the existing value: no reset, timer, or second animation owner.
 * `onLanded` hears (on the JS thread) that an animation reached `target`; a
 * value set at once is the caller's to know.
 */
export function animateMotion(
  value: SharedValue<number>,
  target: number,
  intent: MotionIntent,
  reducedMotion = false,
  onLanded?: (target: number) => void,
): void {
  'worklet';
  const landed = onLanded
    ? (finished?: boolean) => {
        'worklet';
        if (finished) runOnJS(onLanded)(target);
      }
    : undefined;
  if (reducedMotion) {
    value.value = target;
  } else if (intent === 'select' || intent === 'expand') {
    value.value = landed
      ? withSpring(target, MOTION_RECIPES[intent], landed)
      : withSpring(target, MOTION_RECIPES[intent]);
  } else {
    value.value = landed
      ? withTiming(target, MOTION_RECIPES[intent], landed)
      : withTiming(target, MOTION_RECIPES[intent]);
  }
}
