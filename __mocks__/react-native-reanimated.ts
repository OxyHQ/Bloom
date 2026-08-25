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
  // Mirror useSharedValue: a stable box whose `.value` is the derivation result.
  useDerivedValue: (fn: () => unknown) => {
    const ref = useRef<{ value: unknown } | null>(null);
    if (ref.current === null) ref.current = { value: undefined };
    ref.current.value = fn();
    return ref.current;
  },
  // A shared value created OUTSIDE a component. `media-flight/store.ts` needs
  // one per flight because the flight is started by an imperative call and only
  // read by the layer, so there is no hook position to create it in. The real
  // one is a box with a `.value`; so is this.
  makeMutable: (init: unknown) => ({ value: init }),
  useAnimatedStyle: (fn: () => Record<string, unknown>) => fn(),
  useAnimatedProps: (fn: () => Record<string, unknown>) => fn(),
  useAnimatedScrollHandler: () => jest.fn(),
  // Reduced motion defaults to off in tests; suites that need it on can override.
  useReducedMotion: () => false,
  // Mirrors `withTiming` below: the real `withSpring` also takes a completion
  // callback and calls it with `finished`. Without it here, any code that ends
  // a spring by releasing something (media-flight's landing leg) never
  // completes under jest, and the omission reads as the code being broken.
  withSpring: (val: number, _config?: unknown, cb?: (finished: boolean) => void) => {
    cb?.(true);
    return val;
  },
  withTiming: (val: number, _config?: unknown, cb?: (finished: boolean) => void) => {
    cb?.(true);
    return val;
  },
  withRepeat: (val: number, _count?: number, _reverse?: boolean) => val,
  withDelay: (_delay: number, val: number) => val,
  withSequence: (...vals: number[]) => (vals.length > 0 ? vals[vals.length - 1] : 0),
  interpolate: (value: number, inputRange: number[], outputRange: number[]) => {
    if (inputRange.length < 2 || outputRange.length < 2) return outputRange[0] ?? 0;
    const ratio = (value - inputRange[0]!) / (inputRange[1]! - inputRange[0]!);
    return outputRange[0]! + ratio * (outputRange[1]! - outputRange[0]!);
  },
  // Extrapolation enum (the `interpolate` mock ignores the mode, but mappers read
  // `Extrapolation.CLAMP` — it must be a real object, not undefined).
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  // No color-space blending: it returns the endpoint the value is closest to.
  // Callers (the tab bar's label tint) only ever assert the ENDPOINTS — which
  // color a fully-active or fully-inactive tab resolves to — and a real
  // interpolation would produce a blended value that no test could name.
  interpolateColor: (value: number, inputRange: number[], outputRange: string[]) => {
    const from = inputRange[0] ?? 0;
    const to = inputRange[1] ?? 1;
    const ratio = to === from ? 0 : (value - from) / (to - from);
    return (ratio < 0.5 ? outputRange[0] : outputRange[1]) ?? '';
  },
  runOnJS: (fn: (...args: unknown[]) => void) => fn,
  cancelAnimation: (_sv: unknown) => {},
  Easing: {
    out: (fn: unknown) => fn,
    in: (fn: unknown) => fn,
    inOut: (fn: unknown) => fn,
    cubic: (t: number) => t * t * t,
    linear: (t: number) => t,
    exp: (t: number) => t,
    ease: (t: number) => t,
    bezier: () => (t: number) => t,
    // `bezierFn` returns the easing function directly (no `.factory()` hop).
    bezierFn: () => (t: number) => t,
    elastic: () => (t: number) => t,
  },
  default: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    ScrollView: 'Animated.ScrollView',
    createAnimatedComponent: (component: unknown) => component,
  },
  ScrollView: 'Animated.ScrollView',
};

// Layout-animation builders (`FadeIn`, `SlideInRight`, …). The real package
// exposes chainable static configurators (`.duration()`, `.easing()`, …); the
// mock returns a self-chaining stub so `entering=`/`exiting=` props resolve.
// The string host used for `Animated.View` ignores the value at render time.
type LayoutBuilder = {
  duration: (ms: number) => LayoutBuilder;
  delay: (ms: number) => LayoutBuilder;
  easing: (fn: unknown) => LayoutBuilder;
  springify: () => LayoutBuilder;
  build: () => () => { initialValues: Record<string, unknown>; animations: Record<string, unknown> };
};

const makeLayoutBuilder = (): LayoutBuilder => {
  const builder: LayoutBuilder = {
    duration: () => builder,
    delay: () => builder,
    easing: () => builder,
    springify: () => builder,
    build: () => () => ({ initialValues: {}, animations: {} }),
  };
  return builder;
};

export const FadeIn = makeLayoutBuilder();
export const FadeOut = makeLayoutBuilder();
export const SlideInLeft = makeLayoutBuilder();
export const SlideInRight = makeLayoutBuilder();
export const SlideOutLeft = makeLayoutBuilder();
export const SlideOutRight = makeLayoutBuilder();
// Layout transitions share the builder shape (`.easing()`, `.duration()`, …).
export const LinearTransition = makeLayoutBuilder();

// `Keyframe` is a real class upstream (`ReanimatedKeyframe`) whose configurators
// mutate and return the instance — which is why callers must cache one instance
// per animation shape rather than reusing a shared definition object. The mock
// keeps `definitions` readable so tests can assert what was built.
export class Keyframe {
  definitions: Record<string, Record<string, unknown>>;
  // Field names mirror upstream's `InnerKeyframe` so an assertion written against
  // the mock is an assertion about the real class's state, not about the mock.
  durationV: number | undefined;
  delayV: number | undefined;

  constructor(definitions: Record<string, Record<string, unknown>>) {
    this.definitions = definitions;
  }

  duration(ms: number): this {
    this.durationV = ms;
    return this;
  }

  delay(ms: number): this {
    this.delayV = ms;
    return this;
  }
}

export const makeMutable = Reanimated.makeMutable;
export const useSharedValue = Reanimated.useSharedValue;
export const useDerivedValue = Reanimated.useDerivedValue;
export const useAnimatedStyle = Reanimated.useAnimatedStyle;
export const useAnimatedProps = Reanimated.useAnimatedProps;
export const useAnimatedScrollHandler = Reanimated.useAnimatedScrollHandler;
export const useReducedMotion = Reanimated.useReducedMotion;
export const withSpring = Reanimated.withSpring;
export const withTiming = Reanimated.withTiming;
export const withRepeat = Reanimated.withRepeat;
export const withDelay = Reanimated.withDelay;
export const withSequence = Reanimated.withSequence;
export const interpolate = Reanimated.interpolate;
export const interpolateColor = Reanimated.interpolateColor;
export const Extrapolation = Reanimated.Extrapolation;
export const runOnJS = Reanimated.runOnJS;
export const cancelAnimation = Reanimated.cancelAnimation;
export const Easing = Reanimated.Easing;
export default Reanimated.default;
