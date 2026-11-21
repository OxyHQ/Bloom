import { useCallback, useMemo, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  GestureStateManager,
  useCompetingGestures,
  useNativeGesture,
  usePanGesture,
  useTapGesture,
  type GestureTouchEvent,
  type PanGestureConfig,
} from 'react-native-gesture-handler';
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
export function useStableCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
): (...args: Args) => void;
export function useStableCallback<Args extends unknown[]>(
  callback: ((...args: Args) => void) | undefined,
): ((...args: Args) => void) | undefined;
export function useStableCallback<Args extends unknown[]>(
  callback: ((...args: Args) => void) | undefined,
): ((...args: Args) => void) | undefined {
  const latest = useRef(callback);
  latest.current = callback;
  const stable = useCallback((...args: Args) => latest.current?.(...args), []);
  return callback === undefined ? undefined : stable;
}

export type Axis = 'x' | 'y';

/** A gesture another one holds the same touch with (`simultaneousWith`). */
export type GestureRelation = NonNullable<PanGestureConfig['simultaneousWith']>;

/** What a manually activated drag does with a touch so far: take it, give it up, or wait. */
export type DragActivation = 'activate' | 'fail' | 'wait';

export interface DragOptions {
  axis: Axis;
  /** Bounds of the value while dragging. */
  min?: number;
  max?: number;
  /**
   * Past `min` and `max`, the share of the finger's travel the value still
   * follows. Default 0: it holds at the bound.
   */
  overdrag?: number;
  /**
   * Travel along the axis before the drag takes the touch. `null`: the pan's
   * own rule, past the platform's touch slop in any direction.
   */
  activeOffset?: number | null;
  /** Travel across the axis that hands the touch back (to a scroll). */
  failOffset?: number;
  enabled?: boolean;
  /**
   * Gestures that hold the same touch alongside the drag: a scroll view's
   * (`useScrollGesture`), another drag. Gesture Handler makes it mutual.
   */
  simultaneousWith?: GestureRelation;
  /**
   * Worklet: the drag takes a touch only when this says so (manual
   * activation), from the finger's travel along the axis since it landed; it
   * is asked on every move. The offsets then play no part.
   */
  activation?: (travel: number) => DragActivation;
  /**
   * Where the drag moves the value from: where it is when the touch lands
   * (`'touch'`, the default) or when the drag takes the touch
   * (`'activation'`).
   */
  startOn?: 'touch' | 'activation';
  /**
   * Worklet, at the start: whether this touch drags the value at all. A touch
   * it refuses moves nothing and releases nothing.
   */
  takes?: () => boolean;
  /**
   * Worklet, on every move: whether the value follows it. `next` is where it
   * would go, before the bounds. A refused move leaves the value as it is.
   */
  follows?: (travel: number, next: number) => boolean;
  /** JS, once per touch, when it lands. */
  onBegin?: () => void;
  /**
   * JS, once per touch, when it ends (released, cancelled or never taken):
   * where the value is and the finger's velocity along the axis.
   */
  onEnd?: (end: { value: number; velocity: number }) => void;
  /**
   * Worklet (the UI thread, on native), when a touch the drag took ends:
   * where the value is and the finger's velocity along the axis as the
   * gesture reports its end, so where it goes from there (`animateMotionValue`)
   * starts in the same frame.
   */
  onRelease?: (end: { value: number; velocity: number }) => void;
}

function bounded(
  next: number,
  min: number | undefined,
  max: number | undefined,
  overdrag: number,
): number {
  'worklet';
  if (min !== undefined && next < min) return min + (next - min) * overdrag;
  if (max !== undefined && next > max) return max + (next - max) * overdrag;
  return next;
}

/**
 * A pan that moves `value` with the finger along one axis, from where the
 * value was when the touch landed. Hand the gesture to a `GestureDetector`.
 *
 * The worklet options (`activation`, `takes`, `follows`, `onRelease`) are
 * read by the gesture's own callbacks, so a new one builds a new gesture:
 * keep each one the same function while what it reads is the same.
 */
export function useDrag(value: MotionValue, options: DragOptions) {
  const {
    axis,
    min,
    max,
    overdrag = 0,
    activeOffset = 10,
    failOffset,
    enabled = true,
    simultaneousWith,
    activation,
    startOn = 'touch',
    takes,
    follows,
    onRelease,
  } = options;
  const onBegin = useStableCallback(options.onBegin);
  const onEnd = useStableCallback(options.onEnd);
  const start = useMotionValue(0);
  const velocity = useMotionValue(0);
  // Whether this touch drags the value (`takes`), and where it landed along the axis (`activation`).
  const taken = useMotionValue(1);
  const landed = useMotionValue(0);
  const config = useMemo(() => {
    const active: [number, number] | undefined =
      activeOffset === null || activation ? undefined : [-activeOffset, activeOffset];
    const fail: [number, number] | undefined =
      failOffset === undefined ? undefined : [-failOffset, failOffset];
    const startDrag = () => {
      'worklet';
      setMotionValue(start, getMotionValue(value));
      setMotionValue(taken, takes === undefined || takes() ? 1 : 0);
    };
    return {
      enabled,
      manualActivation: activation !== undefined,
      simultaneousWith,
      activeOffsetX: axis === 'x' ? active : undefined,
      activeOffsetY: axis === 'y' ? active : undefined,
      failOffsetX: axis === 'y' ? fail : undefined,
      failOffsetY: axis === 'x' ? fail : undefined,
      onBegin: () => {
        'worklet';
        if (startOn === 'touch') startDrag();
        setMotionValue(velocity, 0);
        if (onBegin) runOnJS(onBegin)();
      },
      onActivate:
        startOn === 'activation'
          ? () => {
              'worklet';
              startDrag();
            }
          : undefined,
      // A finger that lands measures the travel the activation reads afresh,
      // and the drag starts again from where the value is.
      onTouchesDown: activation
        ? (event: GestureTouchEvent) => {
            'worklet';
            const touch = event.changedTouches[0];
            if (touch) setMotionValue(landed, axis === 'x' ? touch.absoluteX : touch.absoluteY);
            if (startOn === 'touch') startDrag();
          }
        : undefined,
      onTouchesMove: activation
        ? (event: GestureTouchEvent) => {
            'worklet';
            const touch = event.changedTouches[0];
            if (!touch) return;
            const at = axis === 'x' ? touch.absoluteX : touch.absoluteY;
            const decision = activation(at - getMotionValue(landed));
            if (decision === 'activate') GestureStateManager.activate(event.handlerTag);
            else if (decision === 'fail') GestureStateManager.fail(event.handlerTag);
          }
        : undefined,
      onUpdate: (event: {
        translationX: number;
        translationY: number;
        velocityX: number;
        velocityY: number;
      }) => {
        'worklet';
        const travel = axis === 'x' ? event.translationX : event.translationY;
        setMotionValue(velocity, axis === 'x' ? event.velocityX : event.velocityY);
        if (getMotionValue(taken) === 0) return;
        const next = getMotionValue(start) + travel;
        if (follows && !follows(travel, next)) return;
        setMotionValue(value, bounded(next, min, max, overdrag));
      },
      onDeactivate: onRelease
        ? (event: { velocityX: number; velocityY: number }) => {
            'worklet';
            if (getMotionValue(taken) === 0) return;
            onRelease({
              value: getMotionValue(value),
              velocity: axis === 'x' ? event.velocityX : event.velocityY,
            });
          }
        : undefined,
      onFinalize: () => {
        'worklet';
        if (onEnd)
          runOnJS(onEnd)({ value: getMotionValue(value), velocity: getMotionValue(velocity) });
      },
    };
  }, [
    value,
    axis,
    min,
    max,
    overdrag,
    activeOffset,
    failOffset,
    enabled,
    simultaneousWith,
    activation,
    startOn,
    takes,
    follows,
    onRelease,
    onBegin,
    onEnd,
    start,
    velocity,
    taken,
    landed,
  ]);
  return usePanGesture(config);
}

/** No options: one object for the gesture's life. */
const SCROLL_GESTURE = {};

/**
 * A scroll view's own gesture, for a drag to share its touches with
 * (`simultaneousWith`): wrap the scroll view in a `GestureDetector` with it.
 */
export function useScrollGesture() {
  return useNativeGesture(SCROLL_GESTURE);
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
