import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/** `animate-number-fade`: 220ms `ease-out` from 0.35. */
export const NUMBER_FADE_MS = 220;
const NUMBER_FADE_FROM = 0.35;

export interface FadeOnChangeProps {
  /** Every change of this key replays the fade (e.g. `` `${rangeId}:${activeIndex}` ``). */
  fadeKey: string | number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * `animate-number-fade`, restarted by re-keying the number's
 * element: each time `fadeKey` changes the child fades in from 0.35 over
 * 220ms. The first render does not fade. Snaps under reduced motion.
 */
export function FadeOnChange({ fadeKey, style, children }: FadeOnChangeProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reducedMotion) return;
    opacity.setValue(NUMBER_FADE_FROM);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: NUMBER_FADE_MS,
      easing: Easing.bezier(0, 0, 0.58, 1),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [fadeKey, opacity, reducedMotion]);
  return <Animated.View style={[{ opacity, flexShrink: 1, minWidth: 0 }, style]}>{children}</Animated.View>;
}
