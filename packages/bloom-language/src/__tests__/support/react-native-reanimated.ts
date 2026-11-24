import { useRef } from 'react';

import { Pressable, usePressHost } from './react-native';

function AnimatedPressable(props: Record<string, unknown>) {
  return usePressHost('Animated.Pressable', props);
}

/**
 * Reanimated as host names and plain data: what the renderer hands the CSS
 * engine (animation and transition props) is asserted directly, and a shared
 * value is a box whose mapper runs on every render.
 */
const names = new Map<unknown, unknown>([
  ['View', 'Animated.View'],
  ['Text', 'Animated.Text'],
  [Pressable, AnimatedPressable],
]);
function createAnimatedComponent(component: unknown): unknown {
  return names.get(component) ?? `Animated(${String(component)})`;
}
const Animated = { View: 'Animated.View', Text: 'Animated.Text', createAnimatedComponent };
export default Animated;

export const cubicBezier = (...points: number[]) => ({ cubicBezier: points });
export const linear = (...points: number[]) => ({ linear: points });
export type CSSAnimationKeyframes = Record<string, Record<string, unknown>>;
export type SharedValue<T> = { value: T };

export const useSharedValue = <T>(value: T): SharedValue<T> => ({ value });
/** A derived value: one box for the component's life, its function run on every render. */
export const useDerivedValue = <T>(derive: () => T): SharedValue<T> => {
  const box = useRef<SharedValue<T> | null>(null);
  if (box.current === null) box.current = { value: derive() };
  else box.current.value = derive();
  return box.current;
};
export const runOnJS =
  <A extends unknown[]>(fn: (...args: A) => void) =>
  (...args: A) =>
    fn(...args);
export const useAnimatedStyle = (mapper: () => object): object => mapper();
/** An animation as data; it lands at once, calling back as Reanimated does when it ends. */
export const withTiming = (target: number, config: object, done?: (finished: boolean) => void) => {
  done?.(true);
  return { withTiming: target, config };
};
export const withSpring = (target: number, config: object, done?: (finished: boolean) => void) => {
  done?.(true);
  return { withSpring: target, config };
};
export const Easing = {
  bezier: (...points: number[]) => ({ bezier: points }),
  linear: 'linear',
  inOut: (easing: unknown) => easing,
  quad: 'quad',
};
export const ReduceMotion = { System: 'system' };
export const css = { keyframes: (blocks: Record<string, unknown>) => ({ keyframes: blocks }) };
export type CSSKeyframesRule = { keyframes: Record<string, unknown> };

/** A layout Keyframe as data: its definitions and duration. */
export class Keyframe {
  durationV: number | undefined;
  delayV: number | undefined;
  constructor(readonly definitions: Record<string, unknown>) {}
  duration(ms: number): this {
    this.durationV = ms;
    return this;
  }
  delay(ms: number): this {
    this.delayV = ms;
    return this;
  }
}
