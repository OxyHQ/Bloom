import { useCallback, useEffect, useRef, useState } from 'react';

import { useSameItems } from './same-items';

import type { MotionLike } from './keyframes';
import type { MotionSpec } from './spec';
import { cssCurve, timingOf, type Timing } from './timing';
import { MOTION } from './tokens';

/**
 * Web: a number with the views bound to it. A write restyles those views
 * directly (no React render, no Reanimated); an animation is a CSS transition
 * of their style to where the value lands, so the browser plays it with no JS
 * per frame and retargets it from wherever it is when a newer write comes.
 * A drag writes once per pointer event, which is all the JS a drag needs.
 */
export interface MotionValue {
  readonly kind: 'motion-value';
  /** @internal */
  readonly web: WebValue;
}

export type MotionTarget = MotionLike | Timing;

type Listener = (timing: Timing | undefined) => void;

/** @internal */
export interface WebValue {
  current: number;
  readonly listeners: Set<Listener>;
  timer: ReturnType<typeof setTimeout> | undefined;
}

function createValue(initial: number): MotionValue {
  return {
    kind: 'motion-value',
    web: { current: initial, listeners: new Set(), timer: undefined },
  };
}

function emit(value: WebValue, timing: Timing | undefined): void {
  for (const listener of value.listeners) listener(timing);
}

export function isMotionValue(value: unknown): value is MotionValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'motion-value'
  );
}

export function useMotionValue(initial: number): MotionValue {
  return useState(() => createValue(initial))[0];
}

/** A value computed from others by a pure function of their numbers; it follows them. */
export function useDerivedMotionValue(
  inputs: readonly MotionValue[],
  derive: (...values: number[]) => number,
): MotionValue {
  const read = () => derive(...inputs.map((input) => input.web.current));
  const [derived] = useState(() => createValue(read()));
  const latest = useRef(read);
  latest.current = read;
  // Kept current at render too, so a view's first style reads the right number.
  derived.web.current = read();
  const same = useSameItems(inputs);
  useEffect(() => {
    // An input's animation is the derived value's too: the views bound to it
    // transition with the input's timing.
    const follow: Listener = (timing) => {
      derived.web.current = latest.current();
      emit(derived.web, timing);
    };
    for (const input of same) input.web.listeners.add(follow);
    return () => {
      for (const input of same) input.web.listeners.delete(follow);
    };
  }, [derived, same]);
  return derived;
}

export function setMotionValue(value: MotionValue, next: number): void {
  const web = value.web;
  if (web.timer !== undefined) {
    clearTimeout(web.timer);
    web.timer = undefined;
  }
  web.current = next;
  emit(web, undefined);
}

export function getMotionValue(value: MotionValue): number {
  return value.web.current;
}

function timingFor(motion: MotionTarget): Timing {
  if (typeof motion === 'object' && 'curve' in motion) return motion;
  const spec: MotionSpec = typeof motion === 'string' ? MOTION[motion] : motion;
  return timingOf(spec);
}

/**
 * Moves the value to `target` with a motion: the bound views transition there
 * (a spring as its `linear()` curve). Under reduced motion it lands at once. `onEnd` runs when the motion's time is up.
 */
export function animateMotionValue(
  value: MotionValue,
  target: number,
  motion: MotionTarget,
  reducedMotion = false,
  onEnd?: () => void,
): void {
  const web = value.web;
  if (web.timer !== undefined) {
    clearTimeout(web.timer);
    web.timer = undefined;
  }
  const timing = timingFor(motion);
  const instant = reducedMotion || timing.duration <= 0;
  web.current = target;
  emit(web, instant ? undefined : timing);
  if (onEnd === undefined) return;
  if (instant) onEnd();
  else {
    web.timer = setTimeout(() => {
      web.timer = undefined;
      onEnd();
    }, timing.duration);
  }
}

export type MotionBinding = MotionValue | number | readonly (MotionValue | number)[];

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

function valuesOf(binding: MotionBinding | undefined): MotionValue[] {
  return bindingList(binding).filter((item): item is MotionValue => typeof item !== 'number');
}

export interface MotionStyleProps {
  readonly style: object;
  readonly ref?: (node: unknown) => void;
}

type CssProperty = 'transform' | 'opacity' | 'width' | 'height';

function cssPropertyOf(key: BoundKey): CssProperty {
  return key === 'opacity' || key === 'width' || key === 'height' ? key : 'transform';
}

function sumOf(binding: MotionBinding | undefined): number {
  let sum = 0;
  for (const item of bindingList(binding))
    sum += typeof item === 'number' ? item : item.web.current;
  return sum;
}

/** The bound style as React Native Web takes it (a view's first paint and every render). */
function styleOf(bindings: MotionBindings): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const transform: Record<string, number | string>[] = [];
  for (const key of BOUND_KEYS) {
    if (bindings[key] === undefined) continue;
    const sum = sumOf(bindings[key]);
    if (key === 'opacity') out.opacity = sum;
    else if (key === 'width' || key === 'height') out[key] = Math.max(sum, 0);
    else transform.push({ [key]: key === 'rotate' ? `${sum}deg` : sum });
  }
  if (transform.length > 0) out.transform = transform;
  return out;
}

/** The bound style as the DOM takes it, for the writes between renders. */
function cssOf(bindings: MotionBindings): Record<CssProperty, string | undefined> {
  const parts: string[] = [];
  const css: Record<CssProperty, string | undefined> = {
    transform: undefined,
    opacity: undefined,
    width: undefined,
    height: undefined,
  };
  for (const key of BOUND_KEYS) {
    if (bindings[key] === undefined) continue;
    const sum = sumOf(bindings[key]);
    if (key === 'opacity') css.opacity = String(sum);
    else if (key === 'width' || key === 'height') css[key] = `${Math.max(sum, 0)}px`;
    else if (key === 'rotate') parts.push(`rotate(${sum}deg)`);
    else if (key === 'scale') parts.push(`scale(${sum})`);
    else parts.push(`${key}(${sum}px)`);
  }
  if (parts.length > 0) css.transform = parts.join(' ');
  return css;
}

interface StyledElement {
  style: Record<string, string>;
}

/**
 * The one mapper, web: the view's style from its bindings at render, then
 * written straight to its element whenever a bound value moves. A write that
 * animates sets a CSS transition on the properties it moves (its timing); a
 * write that does not clears it, so a finger's position is never eased.
 */
export function useMotionStyle(bindings: MotionBindings): MotionStyleProps {
  const latest = useRef(bindings);
  latest.current = bindings;
  const element = useRef<StyledElement | null>(null);
  const transitions = useRef(new Map<CssProperty, string>());

  const ref = useCallback((node: unknown) => {
    element.current = (node as StyledElement | null) ?? null;
  }, []);

  // Each bound key, then the values it sums: one array while they are the same.
  const items = useSameItems(BOUND_KEYS.flatMap((key) => [key, ...valuesOf(bindings[key])]));
  useEffect(() => {
    const write = (property: CssProperty, timing: Timing | undefined) => {
      const node = element.current;
      if (node === null) return;
      if (timing === undefined) transitions.current.delete(property);
      else {
        transitions.current.set(
          property,
          `${property} ${timing.duration}ms ${cssCurve(timing.curve)}`,
        );
      }
      node.style.transition = [...transitions.current.values()].join(', ');
      const css = cssOf(latest.current);
      for (const name of Object.keys(css) as CssProperty[]) {
        const next = css[name];
        if (next !== undefined) node.style[name] = next;
      }
    };
    const listeners: Array<[MotionValue, Listener]> = [];
    let property: CssProperty = 'transform';
    for (const item of items) {
      if (typeof item === 'string') {
        property = cssPropertyOf(item);
        continue;
      }
      const moves = property;
      const listener: Listener = (timing) => write(moves, timing);
      item.web.listeners.add(listener);
      listeners.push([item, listener]);
    }
    return () => {
      for (const [value, listener] of listeners) value.web.listeners.delete(listener);
    };
  }, [items]);

  return { style: styleOf(bindings), ref };
}
