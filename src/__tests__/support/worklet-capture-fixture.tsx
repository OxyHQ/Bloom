/**
 * Positive control for `worklet-captures.test.ts`. Never rendered: the gate
 * builds a program over this file and reads its worklets.
 *
 * `history` carries a `Date` and `slot` a React element — the two shapes the
 * native worklet runtime cannot copy — and each is captured whole by a mapper.
 * `hasHistory` is the fix: the primitive derived OUTSIDE the worklet, which the
 * gate must leave alone.
 */
import type { ReactNode } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

interface Conversation {
  title: string;
  createdAt: Date;
}

export function useWorkletCaptureFixture(history: Conversation[] | undefined, slot: ReactNode) {
  const progress = useSharedValue(0);
  const hasHistory = Boolean(history);
  const whole = useAnimatedStyle(() => ({ opacity: history ? progress.value : 1 }), [progress, history]);
  const derived = useAnimatedStyle(() => ({ opacity: hasHistory ? progress.value : 1 }), [progress, hasHistory]);
  const pan = Gesture.Pan().onUpdate(() => {
    progress.value = slot ? 1 : 0;
  });
  return { whole, derived, pan };
}
