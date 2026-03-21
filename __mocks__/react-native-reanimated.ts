const Reanimated = {
  useSharedValue: (init: unknown) => ({ value: init }),
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
export default Reanimated.default;
