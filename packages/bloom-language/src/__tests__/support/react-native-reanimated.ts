/**
 * Reanimated as host names and plain data: what the renderer hands the CSS
 * engine (animation and transition props) is asserted directly, and a shared
 * value is a box whose mapper runs on every render.
 */
const names = new Map<unknown, string>([
  ['View', 'Animated.View'],
  ['Text', 'Animated.Text'],
  ['Pressable', 'Animated.Pressable'],
]);
function createAnimatedComponent(component: unknown): string {
  return names.get(component) ?? `Animated(${String(component)})`;
}
const Animated = { View: 'Animated.View', Text: 'Animated.Text', createAnimatedComponent };
export default Animated;

export const cubicBezier = (...points: number[]) => ({ cubicBezier: points });
export const linear = (...points: number[]) => ({ linear: points });
export type CSSAnimationKeyframes = Record<string, Record<string, unknown>>;
export type SharedValue<T> = { value: T };

export const useSharedValue = <T>(value: T): SharedValue<T> => ({ value });
export const useAnimatedStyle = (mapper: () => object): object => mapper();
export const withTiming = (target: number, config: object) => ({ withTiming: target, config });
export const withSpring = (target: number, config: object) => ({ withSpring: target, config });
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
  constructor(readonly definitions: Record<string, unknown>) {}
  duration(ms: number): this {
    this.durationV = ms;
    return this;
  }
}
