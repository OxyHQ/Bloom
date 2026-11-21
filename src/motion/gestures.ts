import { useCallback, useMemo, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import {
  animateMotionValue,
  getMotionValue,
  setMotionValue,
  useMotionValue,
  type MotionTarget,
  type MotionValue,
} from './motion-value';

/**
 * Bloom's gestures: Gesture Handler 3's hooks, writing motion values from
 * their own callbacks. Native: the callbacks are worklets on the UI thread, so
 * a drag or a swipe runs no JS per frame; JS runs once, when the touch ends.
 * Web: Gesture Handler web, and the values restyle their views directly.
 *
 * A gesture's config is one object for as long as what it reads is the same:
 * Gesture Handler 3 rebuilds a gesture for every new config object (it sends
 * the config to the native handler again and shares its worklets with the UI
 * runtime again), so a config made in render rebuilt a toast's swipe on every
 * render of its row. The caller's JS callbacks are reached through
 * `useStableCallback`, so a new callback never makes a new config.
 */

/**
 * The caller's JS callback behind one function for the hook's life, which
 * calls the latest one; `undefined` while there is none, so a worklet calls
 * nothing on the JS thread then.
 */
function useStableCallback<Args extends unknown[]>(
  callback: ((...args: Args) => void) | undefined,
): ((...args: Args) => void) | undefined {
  const latest = useRef(callback);
  latest.current = callback;
  const stable = useCallback((...args: Args) => latest.current?.(...args), []);
  return callback === undefined ? undefined : stable;
}

export type Axis = 'x' | 'y';

export interface DragOptions {
  axis: Axis;
  /** Bounds of the value while dragging. */
  min?: number;
  max?: number;
  /** Travel along the axis before the drag takes the touch. */
  activeOffset?: number;
  /** Travel across the axis that hands the touch back (to a scroll). */
  failOffset?: number;
  enabled?: boolean;
  /** JS, once per touch, when it lands. */
  onBegin?: () => void;
  /**
   * JS, once per touch, when it ends (released, cancelled or never taken):
   * where the value is and the finger's velocity along the axis.
   */
  onEnd?: (end: { value: number; velocity: number }) => void;
}

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  'worklet';
  let out = value;
  if (min !== undefined && out < min) out = min;
  if (max !== undefined && out > max) out = max;
  return out;
}

/**
 * A pan that moves `value` with the finger along one axis, from where the
 * value was when the touch landed. Hand the gesture to a `GestureDetector`.
 */
export function useDrag(value: MotionValue, options: DragOptions) {
  const { axis, min, max, activeOffset = 10, failOffset, enabled = true } = options;
  const onBegin = useStableCallback(options.onBegin);
  const onEnd = useStableCallback(options.onEnd);
  const start = useMotionValue(0);
  const velocity = useMotionValue(0);
  const config = useMemo(() => {
    const active: [number, number] = [-activeOffset, activeOffset];
    const fail: [number, number] | undefined =
      failOffset === undefined ? undefined : [-failOffset, failOffset];
    return {
      enabled,
      activeOffsetX: axis === 'x' ? active : undefined,
      activeOffsetY: axis === 'y' ? active : undefined,
      failOffsetX: axis === 'y' ? fail : undefined,
      failOffsetY: axis === 'x' ? fail : undefined,
      onBegin: () => {
        'worklet';
        setMotionValue(start, getMotionValue(value));
        setMotionValue(velocity, 0);
        if (onBegin) runOnJS(onBegin)();
      },
      onUpdate: (event: {
        translationX: number;
        translationY: number;
        velocityX: number;
        velocityY: number;
      }) => {
        'worklet';
        const travel = axis === 'x' ? event.translationX : event.translationY;
        setMotionValue(velocity, axis === 'x' ? event.velocityX : event.velocityY);
        setMotionValue(value, clamp(getMotionValue(start) + travel, min, max));
      },
      onFinalize: () => {
        'worklet';
        if (onEnd)
          runOnJS(onEnd)({ value: getMotionValue(value), velocity: getMotionValue(velocity) });
      },
    };
  }, [value, axis, min, max, activeOffset, failOffset, enabled, onBegin, onEnd, start, velocity]);
  return usePanGesture(config);
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/** Travel that still reads as a tap: a release short of it never swipes vertically. */
const TAP_SLOP = 16;
/** The share of the window a horizontal swipe crosses to go. */
const HORIZONTAL_SWIPE_FRACTION = 0.25;

export interface SwipeOptions {
  /** How far the view flies when it goes (a positive distance). Default: the window along the axis. */
  distance?: number;
  /**
   * Travel in the direction past which a release swipes. Default: a quarter
   * of the window across, past a tap's slop up or down (a toast's).
   */
  threshold?: number;
  /**
   * Against the direction: `'none'` holds the view at rest, `'elastic'`
   * follows with growing resistance. Default: `'none'` across, `'elastic'`
   * up or down.
   */
  resist?: 'none' | 'elastic';
  /** How the view goes, and how it comes back (after travel against the direction: `backAgainst`). */
  away?: MotionTarget;
  back?: MotionTarget;
  backAgainst?: MotionTarget;
  enabled?: boolean;
  reducedMotion?: boolean;
  /** JS, once per touch: when it lands, and when it ends. */
  onBegin?: () => void;
  onFinalize?: () => void;
  /** JS: a tap on the view (no travel), at its point in the view. */
  onTap?: (point: { x: number; y: number }) => void;
}

/** Progressive resistance: the further the drag goes, the less the view follows. */
export function elasticResistance(distance: number): number {
  'worklet';
  const BASE_RESISTANCE = 0.4;
  const PROGRESSIVE_DAMPENING = 0.02;
  return distance * BASE_RESISTANCE * (1 / (1 + distance * PROGRESSIVE_DAMPENING));
}

/**
 * A view that leaves by a swipe: it follows the finger in `direction`, meets
 * `resist` against it, and on release either flies `distance` out (`away`) and
 * calls `onSwipe`, or comes back to rest (`back`). The returned `value` is its
 * offset along the axis, in screen coordinates: bind it (`useMotionStyle`).
 * With `onTap`, a tap competes with the swipe, as one gesture.
 */
export function useSwipe(
  direction: SwipeDirection,
  onSwipe: () => void,
  options: SwipeOptions = {},
) {
  const window = useWindowDimensions();
  const axis: Axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const {
    distance = axis === 'x' ? window.width : window.height,
    threshold = axis === 'x' ? window.width * HORIZONTAL_SWIPE_FRACTION : TAP_SLOP,
    resist = axis === 'x' ? 'none' : 'elastic',
    away = 'dismiss',
    back = 'select',
    backAgainst = back,
    enabled = true,
    reducedMotion = false,
    onBegin,
    onFinalize,
    onTap,
  } = options;
  const begin = useStableCallback(onBegin);
  const finalize = useStableCallback(onFinalize);
  const tapped = useStableCallback(onTap);
  const swiped = useStableCallback(onSwipe);
  const value = useMotionValue(0);
  // Travel in the direction is positive.
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;
  const panConfig = useMemo(
    () => ({
      enabled,
      onBegin: () => {
        'worklet';
        if (begin) runOnJS(begin)();
      },
      onUpdate: (event: { translationX: number; translationY: number }) => {
        'worklet';
        const travel = (axis === 'x' ? event.translationX : event.translationY) * sign;
        if (travel >= 0) setMotionValue(value, travel * sign);
        else setMotionValue(value, resist === 'elastic' ? -elasticResistance(-travel) * sign : 0);
      },
      onFinalize: () => {
        'worklet';
        const travel = getMotionValue(value) * sign;
        if (travel < 0) animateMotionValue(value, 0, backAgainst, reducedMotion);
        else if (travel < threshold) animateMotionValue(value, 0, back, reducedMotion);
        else animateMotionValue(value, distance * sign, away, reducedMotion, swiped);
        if (finalize) runOnJS(finalize)();
      },
    }),
    [
      enabled,
      begin,
      finalize,
      swiped,
      axis,
      sign,
      value,
      resist,
      threshold,
      distance,
      away,
      back,
      backAgainst,
      reducedMotion,
    ],
  );
  const pan = usePanGesture(panConfig);
  const tapConfig = useMemo(
    () => ({
      enabled: tapped !== undefined,
      onDeactivate: (event: { x: number; y: number; canceled: boolean }) => {
        'worklet';
        if (tapped && !event.canceled) runOnJS(tapped)({ x: event.x, y: event.y });
      },
    }),
    [tapped],
  );
  const tap = useTapGesture(tapConfig);
  const gesture = useCompetingGestures(tap, pan);
  return { gesture, value };
}
