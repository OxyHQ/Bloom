import React, { useCallback, useEffect, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

/**
 * `AnimatePresence` + `height: 0 ↔ auto` and opacity, 250ms `ease-out`: the
 * strip mounts on arrival, the clip grows to its measured height, and it
 * unmounts once the collapse finishes. Mounted-open does not animate.
 */
export function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(open ? 1 : 0);
  const measured = useSharedValue(0);

  useEffect(() => {
    if (open) setMounted(true);
    const target = open ? 1 : 0;
    if (reducedMotion) {
      progress.value = target;
      if (!open) setMounted(false);
      return;
    }
    progress.value = withTiming(target, { duration: 250, easing: EASE_OUT }, (finished) => {
      'worklet';
      if (finished && target === 0) runOnJS(setMounted)(false);
    });
  }, [open, reducedMotion, progress]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      measured.value = event.nativeEvent.layout.height;
    },
    [measured],
  );
  const style = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      height: progress.value >= 1 ? 'auto' : progress.value * measured.value,
    }),
    [progress, measured],
  );

  if (!mounted) return null;
  return (
    <Animated.View style={[{ overflow: 'hidden' }, style]}>
      <View onLayout={onLayout}>{children}</View>
    </Animated.View>
  );
}
