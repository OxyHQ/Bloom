/**
 * Lightweight stub for `react-native-reanimated` used inside Storybook on
 * web. Reanimated's worklets and native modules can't run in the browser,
 * so we expose only the surface Bloom touches (createAnimatedComponent,
 * useSharedValue, useAnimatedStyle, etc.) and resolve them to no-ops.
 */
import { createElement, forwardRef, type ComponentType } from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';

const passthrough = <P extends object>(Component: ComponentType<P>) =>
  forwardRef<unknown, P>((props, ref) =>
    createElement(Component as ComponentType<P & { ref?: unknown }>, {
      ...props,
      ref,
    }),
  );

const AnimatedView = passthrough<ViewProps>(View);
AnimatedView.displayName = 'AnimatedView';

const AnimatedScrollView = passthrough<ScrollViewProps>(ScrollView);
AnimatedScrollView.displayName = 'AnimatedScrollView';

const Animated = {
  View: AnimatedView,
  ScrollView: AnimatedScrollView,
  Text: View,
  Image: View,
  createAnimatedComponent: <P extends object>(Component: ComponentType<P>) =>
    passthrough(Component),
};

const noop = () => {};

interface SharedValue<T> {
  value: T;
  get: () => T;
  set: (v: T) => void;
  addListener: () => void;
  removeListener: () => void;
  modify: (fn: (v: T) => T) => void;
}

export function useSharedValue<T>(initial: T): SharedValue<T> {
  return {
    value: initial,
    get: () => initial,
    set: noop,
    addListener: noop,
    removeListener: noop,
    modify: noop,
  };
}

export function useAnimatedStyle<T extends object>(_factory: () => T): T {
  return {} as T;
}

export function useAnimatedScrollHandler<T>(_handler: T): T {
  return _handler;
}

export function useAnimatedRef<T>() {
  return { current: null as T | null };
}

export const withSpring = <T,>(v: T): T => v;
export const withTiming = <T,>(v: T): T => v;
export const withDecay = <T,>(v: T): T => v;
export const withDelay = <T,>(_d: number, v: T): T => v;
export const withSequence = <T,>(...values: T[]): T => values[values.length - 1] as T;
export const withRepeat = <T,>(v: T): T => v;
export const cancelAnimation = noop;
export const interpolate = (input: number) => input;
export const interpolateColor = (_input: number, _inputRange: number[], outputRange: string[]) =>
  outputRange[0] ?? '#000000';
export const runOnJS =
  <Fn extends (...args: never[]) => unknown>(fn: Fn) =>
  (...args: Parameters<Fn>) =>
    fn(...args);
export const runOnUI =
  <Fn extends (...args: never[]) => unknown>(fn: Fn) =>
  (...args: Parameters<Fn>) =>
    fn(...args);

export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
} as const;

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  bezier: () => (t: number) => t,
  in: (fn: (t: number) => number) => fn,
  out: (fn: (t: number) => number) => fn,
  inOut: (fn: (t: number) => number) => fn,
};

export const FadeIn = { duration: () => FadeIn };
export const FadeOut = { duration: () => FadeOut };
export const SlideInDown = { duration: () => SlideInDown };
export const SlideOutDown = { duration: () => SlideOutDown };

export default Animated;
