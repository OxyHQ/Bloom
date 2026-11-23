import { useMemo, useState } from 'react';
import {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import type { MotionLike } from './keyframes';
import { useSameItems } from './same-items';
import { animateShared } from './shared-motion';
import type { Timing } from './timing';

/**
 * A number a gesture drives and a view's geometry follows (`useMotionStyle`):
 * the one way Bloom ties a drag, a swipe or a pager to what moves. Native: a
 * Reanimated shared value, written on the UI thread by the gesture's own
 * callbacks, so a drag runs no JS per frame. `motion-value.web.ts` is the web's.
 */
export interface MotionValue {
  readonly kind: 'motion-value';
  /** @internal The shared value underneath (native). */
  readonly shared: SharedValue<number>;
}

/** What `animateMotionValue` plays: a motion name, a spec (springs keep their physics) or a timing. */
export type MotionTarget = MotionLike | Timing;

export function isMotionValue(value: unknown): value is MotionValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'motion-value'
  );
}

export function useMotionValue(initial: number): MotionValue {
  const shared = useSharedValue(initial);
  return useState<MotionValue>(() => ({ kind: 'motion-value', shared }))[0];
}

/**
 * A motion value over a Reanimated shared value that something else also
 * writes or reads in its frames: a keyboard tracker's height, a sheet's
 * position that its backdrop and its owner's progress follow. Native: the
 * shared value is the motion value's own. Web: it moves in Reanimated's
 * frames, not by a CSS transition, so every reader of the shared value sees
 * each frame's number and the views bound to it are written with it.
 */
export function useMotionValueOf(shared: SharedValue<number>): MotionValue {
  return useMemo<MotionValue>(() => ({ kind: 'motion-value', shared }), [shared]);
}

/**
 * A value computed from others by a pure function of their numbers (a
 * worklet: it runs on the UI thread on native). It follows them; it is never
 * written.
 */
export function useDerivedMotionValue(
  inputs: readonly MotionValue[],
  derive: (...values: number[]) => number,
): MotionValue {
  // The inputs are the value's for its life: one array, so the worklet is made once.
  const same = useSameItems(inputs);
  const shared = useMemo(() => same.map((input) => input.shared), [same]);
  const derived = useDerivedValue(() => derive(...readAll(shared)), [shared, derive]);
  return useState<MotionValue>(() => ({
    kind: 'motion-value',
    shared: derived as SharedValue<number>,
  }))[0];
}

/** Moves the value at once (a finger's position). Callable from a gesture's callbacks. */
export function setMotionValue(value: MotionValue, next: number): void {
  'worklet';
  value.shared.value = next;
}

export function getMotionValue(value: MotionValue): number {
  'worklet';
  return value.shared.value;
}

function readAll(shared: readonly SharedValue<number>[]): number[] {
  'worklet';
  const values: number[] = [];
  for (const input of shared) values.push(input.value);
  return values;
}

/**
 * Eases the value to `target`, from where it is. A spec's spring keeps its
 * physics and starts at `velocity` (units per second: a released finger's); a
 * timing plays its curve. Reduced motion lands at once. `onEnd` runs on the JS
 * thread when it lands. Callable from a gesture's callbacks.
 */
export function animateMotionValue(
  value: MotionValue,
  target: number,
  motion: MotionTarget,
  reducedMotion = false,
  onEnd?: () => void,
  velocity = 0,
): void {
  'worklet';
  animateShared(value.shared, target, motion, reducedMotion, onEnd, velocity);
}

/** A style property bound to motion values: their sum (`[base, drag]`), constants included. */
export type MotionBinding = MotionValue | number | readonly (MotionValue | number)[];

/**
 * What a view's style takes from motion values. Transforms compose in
 * translate, rotate (degrees), scale order; `width` and `height` never go
 * below 0.
 */
export interface MotionBindings {
  translateX?: MotionBinding;
  translateY?: MotionBinding;
  rotate?: MotionBinding;
  scale?: MotionBinding;
  opacity?: MotionBinding;
  width?: MotionBinding;
  height?: MotionBinding;
}

export const BOUND_KEYS = [
  'translateX',
  'translateY',
  'rotate',
  'scale',
  'opacity',
  'width',
  'height',
] as const;
export type BoundKey = (typeof BOUND_KEYS)[number];

export function bindingList(binding: MotionBinding | undefined): readonly (MotionValue | number)[] {
  if (binding === undefined) return [];
  return Array.isArray(binding) ? binding : [binding as MotionValue | number];
}

/** What `useMotionStyle` hands a view: spread its `style` and `ref` onto an animated host. */
export interface MotionStyleProps {
  readonly style: object;
  readonly ref?: (node: unknown) => void;
}

type Bound = SharedValue<number> | number;

function sumOf(list: readonly Bound[]): number {
  'worklet';
  let sum = 0;
  for (const item of list) sum += typeof item === 'number' ? item : item.value;
  return sum;
}

/** The style the bound keys make: what the mapper returns on every run. */
function boundStyle(keys: readonly BoundKey[], lists: readonly (readonly Bound[])[]) {
  'worklet';
  const out: Record<string, unknown> = {};
  const transform: Record<string, number | string>[] = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as BoundKey;
    const sum = sumOf(lists[i] as readonly Bound[]);
    if (key === 'opacity') out.opacity = sum;
    else if (key === 'width' || key === 'height') out[key] = Math.max(sum, 0);
    else transform.push({ [key]: key === 'rotate' ? `${sum}deg` : sum });
  }
  if (transform.length > 0) out.transform = transform;
  return out;
}

/**
 * The one mapper: a view's style from its bindings, as an animated style. It
 * lists every bound value in its deps (trap B), writes every bound key on every
 * run, and starts no animation (trap A). The bindings' shape is the view's for
 * its life.
 */
export function useMotionStyle(bindings: MotionBindings): MotionStyleProps {
  // One keys and lists pair while the bindings are the same, so the mapper is made once.
  const items = useSameItems(BOUND_KEYS.flatMap((key) => [key, ...bindingList(bindings[key])]));
  const { keys, lists } = useMemo(() => {
    const keys: BoundKey[] = [];
    const lists: Bound[][] = [];
    for (const item of items) {
      if (typeof item === 'string') {
        keys.push(item);
        lists.push([]);
      } else {
        (lists[lists.length - 1] as Bound[]).push(typeof item === 'number' ? item : item.shared);
      }
    }
    // A key with no values is not bound.
    const bound = lists.flatMap((list, i) => (list.length > 0 ? [i] : []));
    return {
      keys: bound.map((i) => keys[i] as BoundKey),
      lists: bound.map((i) => lists[i] as Bound[]),
    };
  }, [items]);
  const style = useAnimatedStyle(() => boundStyle(keys, lists), [keys, lists]);
  return { style };
}
