// `useSharedValue` must return a STABLE object across re-renders (the real
// reanimated does — a shared value is a persistent box). Several components
// (e.g. BottomSheet) capture a shared value in a `useMemo`/gesture closure and
// later mutate `.value` from a different render; a fresh object per render would
// desync those reads. Back it with a ref so identity is preserved per call site.
const { useRef } = require('react') as typeof import('react');

const Reanimated = {
  useSharedValue: (init: unknown) => {
    const ref = useRef<{ value: unknown } | null>(null);
    if (ref.current === null) ref.current = { value: init };
    return ref.current;
  },
  useAnimatedStyle: (fn: () => Record<string, unknown>) => fn(),
  useAnimatedScrollHandler: () => jest.fn(),
  withSpring: (val: number) => val,
  withTiming: (val: number, _config?: unknown, cb?: (finished: boolean) => void) => {
    cb?.(true);
    return val;
  },
  interpolate: (value: number, inputRange: number[], outputRange: number[]) => {
    if (inputRange.length < 2 || outputRange.length < 2) return outputRange[0] ?? 0;
    const ratio = (value - inputRange[0]!) / (inputRange[1]! - inputRange[0]!);
    return outputRange[0]! + ratio * (outputRange[1]! - outputRange[0]!);
  },
  runOnJS: (fn: (...args: unknown[]) => void) => fn,
  cancelAnimation: (_sv: unknown) => {},
  Easing: {
    out: (fn: unknown) => fn,
    cubic: (t: number) => t * t * t,
  },
  default: {
    View: 'Animated.View',
    ScrollView: 'Animated.ScrollView',
  },
  ScrollView: 'Animated.ScrollView',
};

export const useSharedValue = Reanimated.useSharedValue;
export const useAnimatedStyle = Reanimated.useAnimatedStyle;
export const useAnimatedScrollHandler = Reanimated.useAnimatedScrollHandler;
export const withSpring = Reanimated.withSpring;
export const withTiming = Reanimated.withTiming;
export const interpolate = Reanimated.interpolate;
export const runOnJS = Reanimated.runOnJS;
export const cancelAnimation = Reanimated.cancelAnimation;
export const Easing = Reanimated.Easing;
export default Reanimated.default;
