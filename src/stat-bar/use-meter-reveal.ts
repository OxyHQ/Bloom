import { useLayoutEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useMeterRevealPolicy } from './use-meter-reveal-policy';
import type { MeterReveal } from './types';

/** Width animation on the native JS driver; layout properties cannot use the native driver. */
export function useMeterReveal(fraction: number, reveal?: MeterReveal) {
  const policy = useMeterRevealPolicy(fraction, reveal);
  const progress = useRef(new Animated.Value(reveal && policy.animate ? 0 : policy.fraction)).current;
  const [x1, y1, x2, y2] = policy.easing;
  const easing = useMemo(() => Easing.bezier(x1, y1, x2, y2), [x1, y1, x2, y2]);
  useLayoutEffect(() => {
    progress.stopAnimation();
    if (!policy.animate) { progress.setValue(policy.fraction); return; }
    const animation = Animated.timing(progress, { toValue: policy.fraction, duration: policy.duration,
      delay: policy.delay, easing, useNativeDriver: false, isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [progress, policy.fraction, policy.animate, policy.duration, policy.delay, easing]);
  return progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
}
