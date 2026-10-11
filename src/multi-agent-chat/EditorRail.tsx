import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useIsRtl } from '../hooks/use-is-rtl';
import { StyledView } from '../styles/styled-primitives';
const AnimatedView = Animated.createAnimatedComponent(StyledView);
/** Retain the closing editor until its occupied width has eased to zero. */
export function EditorRail({ active, children }: { active: boolean; children: ReactNode }) {
  const sign = useIsRtl() ? -1 : 1,
    reduced = useReducedMotion();
  const progress = useSharedValue(active ? 1 : 0),
    content = useRef(children);
  const [mounted, setMounted] = useState(active);
  if (active) content.current = children;
  useEffect(() => {
    if (active) setMounted(true);
    progress.value = withTiming(
      active ? 1 : 0,
      { duration: reduced ? 0 : 360, easing: Easing.bezier(0.22, 1, 0.36, 1) },
      (finished) => {
        if (finished && !active) runOnJS(setMounted)(false);
      },
    );
  }, [active, progress, reduced]);
  const outer = useAnimatedStyle(() => ({ width: 356 * progress.value }), [progress]);
  const inner = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ translateX: 20 * sign * (1 - progress.value) }],
    }),
    [progress, sign],
  );
  return (
    <AnimatedView
      {...(Platform.OS === 'web' && !active ? { inert: true } : {})}
      pointerEvents={active ? 'auto' : 'none'}
      aria-hidden={!active}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      style={[{ minHeight: 0, flexShrink: 0, overflow: 'hidden' }, outer]}
    >
      {mounted && (
        <AnimatedView style={[{ height: '100%', width: 356, paddingInlineStart: 16 }, inner]}>
          {content.current}
        </AnimatedView>
      )}
    </AnimatedView>
  );
}
