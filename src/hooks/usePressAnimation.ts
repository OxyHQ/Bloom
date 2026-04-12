import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';

import { animation } from '../styles/tokens';

/**
 * Hook that provides press-scale animation feedback.
 *
 * Returns an `Animated.Value` for the scale transform and press-in/press-out
 * handlers that spring the value between 1 and the target scale.
 *
 * @param pressScale - Scale value when pressed (e.g. 0.97). Pass `undefined` to disable.
 */
export function usePressAnimation(pressScale: number | undefined = 0.97) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const enabled = pressScale !== undefined;

  const onPressIn = useCallback(() => {
    if (!enabled) return;
    Animated.spring(scaleAnim, {
      toValue: pressScale!,
      useNativeDriver: true,
      ...animation.spring.snappy,
    }).start();
  }, [scaleAnim, enabled, pressScale]);

  const onPressOut = useCallback(() => {
    if (!enabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...animation.spring.gentle,
    }).start();
  }, [scaleAnim, enabled]);

  return { scaleAnim, onPressIn, onPressOut, enabled } as const;
}
