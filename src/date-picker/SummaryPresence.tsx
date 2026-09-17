import React, { useEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * The footer summary motion: the date chips (and the "N days selected" pill)
 * drop in from 12px above while fading in, over 250ms on
 * `cubic-bezier(0.34, 1.2, 0.64, 1)` — a slight overshoot — and leave the
 * same way before unmounting, including on the popover's first paint. Snaps
 * under reduced motion.
 */
const DURATION = 250;
const EASE = Easing.bezier(0.34, 1.2, 0.64, 1);
const OFFSET = -12;

export function SummaryPresence({
  show,
  style,
  children,
}: {
  show: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(show);
  // The last content shown, so a leaving summary keeps it while it animates out.
  const lastChildren = useRef(children);
  if (show) lastChildren.current = children;
  // Starts at 0 even when mounted present (no `initial={false}` equivalent),
  // so a popover opening on a chosen day drops its chip in.
  const progress = useSharedValue(0);

  useEffect(() => {
    if (show) setMounted(true);
    const target = show ? 1 : 0;
    if (reducedMotion) {
      progress.value = target;
      if (!show) setMounted(false);
      return;
    }
    progress.value = withTiming(target, { duration: DURATION, easing: EASE }, (finished) => {
      'worklet';
      if (finished && target === 0) runOnJS(setMounted)(false);
    });
  }, [show, reducedMotion, progress]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: Math.min(1, Math.max(0, progress.value)),
      transform: [{ translateY: (1 - progress.value) * OFFSET }],
    }),
    [progress],
  );

  if (!mounted) return null;
  return <Animated.View style={[style, animatedStyle]}>{lastChildren.current}</Animated.View>;
}
