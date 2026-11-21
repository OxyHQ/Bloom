import {
  createElement,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { mergeRefs, usePrefersReducedMotion } from '@oxy.so/bloom/hooks';
import {
  COLOR_TRANSITION_PROPS,
  SCALE,
  LeavingContext,
  defineKeyframes,
  timingOf,
  transitionStyle,
  useDrag,
  useMotionStyle,
  useMotionValue,
  usePlay,
  usePressScale,
  useSwipe,
  withDelay,
  type KeyframesValue,
  type MotionBinding,
  type MotionValue,
  type Play,
  type Timing,
  type Transform,
  type TransitionValue,
} from '@oxy.so/bloom/motion';
import { useThemePaint } from '@oxy.so/bloom/theme';

import type { DragSpec, SwipeDirection } from '../node';
import type { Geometry } from '../paint';
import type { Frame, Namespace } from './namespace';
import { resolveMotion, type MotionToken } from './tokens';

/**
 * The animation in scope: a `.animation(motion, value?)` on this view or above
 * it in the same body. `gated` scopes animate only on a render where `value`
 * differs from the last one committed.
 */
export interface AnimationScope {
  readonly motion: MotionToken;
  readonly value: unknown;
  readonly gated: boolean;
}

/** What a node's motion modifiers ask for, collected once by the renderer's plan. */
export interface MotionPlan {
  /**
   * The resting transform (scale, offset, rotation tokens), interned by
   * `transformKey`, and the same by component. Empty when the node's box
   * draws it instead (render.tsx, `placeGeometry`).
   */
  transform: Transform;
  transformKey: string;
  geometry: Geometry;
  /** The point it scales and rotates about (`.anchor()`), as a transform-origin. */
  anchor: string | undefined;
  /** The node's own `.animation()`, which also scopes its subtree. */
  animation: AnimationScope | undefined;
  /** `.animatesColors()`: its box's colour changes play with the animation in scope. */
  colors: boolean;
  transition: TransitionValue | undefined;
  keyframes: { value: KeyframesValue; trigger: unknown } | undefined;
  /** `.repeatForever()`: keyframes that play again and again while nothing else plays. */
  loop: KeyframesValue | undefined;
  /** `.delay()`, in ms: what this node plays waits that long. */
  delay: number;
  matched: { id: string; namespace: Namespace } | undefined;
  pressScale: boolean;
  /**
   * Bound geometry (a `MotionValue` in `.offset()`, `.scale()` or
   * `.rotation()`, or a swipe's own offset): the one mapper writes the whole
   * transform, the tokens as constants beside the values.
   */
  bound:
    | {
        translateX: MotionBinding;
        translateY: MotionBinding;
        rotate: MotionBinding;
        scale: MotionBinding;
      }
    | undefined;
  drag: { value: MotionValue; options: DragSpec } | undefined;
  swipe: { direction: SwipeDirection; onSwipe: () => void } | undefined;
  /** The node is glass: on the web its fades go through the material (see `Play`). */
  glass: boolean;
  /**
   * The node rests moved or animates its resting state (a geometry or opacity
   * modifier, a transition, a matched geometry, press feedback), so its box is
   * animated from the first render on: a CSS transition needs the host it plays
   * on to exist before the change. Without, the box is animated only while
   * keyframes play on it.
   */
  stable: boolean;
}

/**
 * What the outermost box of a moving node takes on top of its own style and
 * props. The renderer puts it on the node's outermost host (its animated twin
 * on native), or around a Bloom component in one box (`MotionWrapper`).
 */
export interface Outer {
  readonly ref: RefObject<unknown>;
  readonly style: readonly unknown[];
  readonly props: Record<string, unknown>;
  /** Whether anything is applied now; a Bloom component is boxed only while it is. */
  readonly active: boolean;
  /** Which playing the box shows: a Bloom component's box is keyed by it, so each one starts over. */
  readonly playId: number | undefined;
}

export interface MotionNodeProps {
  motion: MotionPlan;
  /**
   * Keyed by `.id()` and with a transition, so a list's `Presence` keeps it
   * while it leaves (by index, a removal and a reorder look the same).
   */
  exit: boolean;
  scope: AnimationScope | undefined;
  /**
   * Native, a node that animates its colours: the palette it paints with
   * (`ThemedMotion`), so the render a theme switch makes changes them at once.
   */
  theme?: unknown;
  /** Draws the node with `outer` on its outermost box. */
  content: (outer: Outer) => ReactNode;
}

const ORIGIN_TOP_LEFT = { transformOrigin: 'left top' };
/** A loop's playing: one id of its own, so it starts over after any other. */
const LOOP_ID = -2;

const anchors = new Map<string, object>();
function anchorStyle(origin: string): object {
  let style = anchors.get(origin);
  if (style === undefined) {
    style = Object.freeze({ transformOrigin: origin });
    anchors.set(origin, style);
  }
  return style;
}

/** Whether a scope animates this render, given the value the last commit saw. */
function animates(scope: AnimationScope | undefined, last: { value: unknown } | undefined) {
  if (scope === undefined) return false;
  if (!scope.gated) return true;
  return last !== undefined && !Object.is(last.value, scope.value);
}

interface Committed {
  value: unknown;
  transformKey: string;
  timing: Timing | undefined;
  theme: unknown;
}

/** The keyframes a matched view plays to come from `from` to where it is. */
function moveFrom(from: Frame, to: Frame): KeyframesValue | undefined {
  if (to.width === 0 || to.height === 0) return undefined;
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  if (dx === 0 && dy === 0 && sx === 1 && sy === 1) return undefined;
  return defineKeyframes([
    { at: 0, translateX: dx, translateY: dy, scaleX: sx, scaleY: sy },
    { at: 1, translateX: 0, translateY: 0, scaleX: 1, scaleY: 1 },
  ]);
}

function measure(node: unknown): Frame | undefined {
  const target = node as { getBoundingClientRect?: () => Frame } | null;
  const rect = target?.getBoundingClientRect?.();
  return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : undefined;
}

/**
 * A node with motion modifiers: the one component that holds motion state
 * (which keyframes play, a matched move, the last value of a gated scope), so
 * nodes without motion stay plain elements with no hooks.
 *
 * At most one playing at a time, by priority: leaving, then keyframes, then a
 * matched move, then the insertion, then a loop (which starts once the
 * insertion ends). Everything it plays waits the node's `.delay()`; a delayed
 * playing holds its first frame while it waits.
 */
function useMotion(
  { motion, scope, theme }: MotionNodeProps,
  press: { style: readonly unknown[]; ownsTransform: boolean; bound?: boolean },
) {
  const reduced = usePrefersReducedMotion();
  // Set while a list's Presence keeps this node after it left.
  // Only a node with a transition is the leaver; one inside it plays nothing
  // and must not let the child go.
  const context = useContext(LeavingContext);
  const leaving = motion.transition === undefined ? undefined : context;
  const ref = useRef<unknown>(null);
  const own = motion.animation ?? scope;
  const committed = useRef<Committed | undefined>(undefined);
  const last = committed.current;
  const delayed = (of: Timing | undefined) =>
    of === undefined ? undefined : withDelay(of, motion.delay);
  const fill = motion.delay > 0 ? 'backwards' : 'none';
  // Native: a theme switch re-renders a node that animates its colours with a
  // new palette; that render changes them at once, and the next plays them again.
  const switched = last !== undefined && last.theme !== theme;
  const [, replay] = useState(0);

  // A state change of the resting transform, opacity or colours animates with the scope's motion.
  let timing: Timing | undefined;
  if (!reduced && own !== undefined) {
    if (animates(own, last)) timing = delayed(timingOf(resolveMotion(own.motion)));
    else if (own.gated && last !== undefined && last.transformKey === motion.transformKey) {
      timing = last.timing;
    }
  }

  // Keyframes: each change of the trigger to a truthy value plays them once.
  const [keyframes, setKeyframes] = useState({
    trigger: motion.keyframes?.trigger,
    id: 0,
    on: false,
  });
  const trigger = motion.keyframes?.trigger;
  if (!Object.is(trigger, keyframes.trigger)) {
    const play = Boolean(trigger) && !reduced;
    setKeyframes({ trigger, id: keyframes.id + (play ? 1 : 0), on: play || keyframes.on });
  }

  // A matched move, found after layout (see the effect below).
  const [moved, setMoved] = useState<{ id: number; frames: KeyframesValue } | undefined>();
  // A loop waits for the insertion to end.
  const [inserted, setInserted] = useState(false);
  const loop = motion.loop;

  let play: Play | undefined;
  if (leaving !== undefined && motion.transition !== undefined) {
    const remove = motion.transition.remove;
    const removeTiming = delayed(remove.timing(own?.motion));
    if (removeTiming !== undefined && !reduced) {
      play = {
        id: -1,
        keyframes: remove,
        timing: removeTiming,
        fill: 'forwards',
        material: motion.glass,
        onEnd: leaving.onLeft,
      };
    }
  } else if (keyframes.on && motion.keyframes !== undefined) {
    const kfTiming = delayed(motion.keyframes.value.timing(own?.motion));
    if (kfTiming !== undefined) {
      play = {
        id: keyframes.id,
        keyframes: motion.keyframes.value,
        timing: kfTiming,
        fill,
        material: motion.glass,
        onEnd: () =>
          setKeyframes((state) => (state.id === keyframes.id ? { ...state, on: false } : state)),
      };
    }
  } else if (moved !== undefined && own !== undefined) {
    play = {
      id: moved.id,
      keyframes: moved.frames,
      timing: withDelay(timingOf(resolveMotion(own.motion)), motion.delay),
      fill,
      material: motion.glass,
      onEnd: undefined,
    };
  } else if (motion.transition !== undefined && !reduced && !(loop !== undefined && inserted)) {
    const insert = motion.transition.insert;
    const insertTiming = delayed(insert.timing(own?.motion));
    if (insertTiming !== undefined) {
      play = {
        id: 0,
        keyframes: insert,
        timing: insertTiming,
        fill,
        material: motion.glass,
        onEnd: loop === undefined ? undefined : () => setInserted(true),
      };
    }
  }
  if (play === undefined && loop !== undefined && leaving === undefined && !reduced) {
    // Its own motion (a loop token's), else the scope's: a loop with neither plays nothing.
    const loopTiming = delayed(loop.timing(own?.motion));
    if (loopTiming !== undefined) {
      play = {
        id: LOOP_ID,
        keyframes: loop,
        timing: loopTiming,
        fill,
        repeat: true,
        material: motion.glass,
        onEnd: undefined,
      };
    }
  }
  const played = usePlay(ref, play);

  // Leaving under reduced motion (or with no motion to leave by): gone at once.
  const leavesAtOnce = leaving !== undefined && play === undefined;
  useLayoutEffect(() => {
    if (leavesAtOnce) leaving?.onLeft();
  }, [leavesAtOnce, leaving]);

  const matched = motion.matched;
  useLayoutEffect(() => {
    committed.current = { value: own?.value, transformKey: motion.transformKey, timing, theme };
    if (switched) replay((count) => count + 1);
    if (matched === undefined) return;
    const frame = measure(ref.current);
    if (frame === undefined) return;
    const { frames } = matched.namespace;
    const before = frames.get(matched.id);
    frames.set(matched.id, { frame, value: own?.value });
    if (before === undefined || reduced || own === undefined) return;
    if (own.gated && Object.is(before.value, own.value)) return;
    const move = moveFrom(before.frame, frame);
    if (move !== undefined) setMoved((state) => ({ id: (state?.id ?? 0) + 1, frames: move }));
  });

  const style: unknown[] = [];
  if (motion.transform.length > 0 && !press.ownsTransform)
    style.push({ transform: motion.transform });
  if (motion.anchor !== undefined) style.push(anchorStyle(motion.anchor));
  // A change plays on the box: its geometry and opacity, and its colours when
  // it animates them. A bound view's geometry follows its values; `.animation()`
  // does not ease it.
  if (timing !== undefined && motion.stable && !press.bound)
    style.push(transitionStyle(timing, motion.colors && !switched));
  if (matched !== undefined) style.push(ORIGIN_TOP_LEFT);
  style.push(...press.style);
  if (played.style !== undefined) style.push(played.style);

  const props: Record<string, unknown> = {
    ref,
    ...played.props,
    ...(motion.colors ? COLOR_TRANSITION_PROPS : undefined),
  };
  if (matched !== undefined) {
    props.onLayout = () => {
      const frame = measure(ref.current);
      if (frame !== undefined)
        matched.namespace.frames.set(matched.id, { frame, value: own?.value });
    };
  }
  return { style, props, play };
}

/** A leaver's leaving is its own: what is inside it does not leave with it. */
function leaverOnly(motion: MotionPlan, node: ReactNode): ReactNode {
  return motion.transition === undefined ? (
    node
  ) : (
    <LeavingContext.Provider value={undefined}>{node}</LeavingContext.Provider>
  );
}

const NO_PRESS = { style: [] as readonly unknown[], ownsTransform: false };

/**
 * Native, a node that animates its colours: its motion node with the palette
 * it paints with, so it alone of the moving nodes re-renders on a theme switch.
 * The web needs none: a switch there is the document's (`applyThemeAtOnce`).
 */
export function ThemedMotion({
  node,
  ...props
}: MotionNodeProps & { node: (props: MotionNodeProps) => ReactNode }): ReactNode {
  return createElement(node, { ...props, theme: useThemePaint() });
}
ThemedMotion.displayName = 'BloomThemedMotion';

export function MotionNode(props: MotionNodeProps): ReactNode {
  const { style, props: hostProps, play } = useMotion(props, NO_PRESS);
  return leaverOnly(
    props.motion,
    props.content({
      ref: hostProps.ref as RefObject<unknown>,
      style,
      props: hostProps,
      active: props.motion.stable || play !== undefined,
      playId: play?.id,
    }),
  );
}
MotionNode.displayName = 'BloomMotion';

/** A node with `.pressScale()`: the same, plus press feedback on its outermost box. */
export function PressMotionNode(props: MotionNodeProps): ReactNode {
  const reduced = usePrefersReducedMotion();
  const press = usePressScale(!reduced, props.motion.transform, SCALE.pressed);
  // Native: the press's one mapper writes the transform, the resting one first.
  // Web: a class scales with the CSS `scale` property, beside the transform.
  const {
    style,
    props: hostProps,
    play,
  } = useMotion(props, { style: [press.style], ownsTransform: press.onPressIn !== undefined });
  if (press.onPressIn !== undefined) {
    hostProps.onPressIn = press.onPressIn;
    hostProps.onPressOut = press.onPressOut;
  }
  return leaverOnly(
    props.motion,
    props.content({
      ref: hostProps.ref as RefObject<unknown>,
      style,
      props: hostProps,
      active: true,
      playId: play?.id,
    }),
  );
}
PressMotionNode.displayName = 'BloomPressMotion';

const NO_SWIPE = () => {};

/**
 * A node with bound geometry or a gesture (`.drag()`, `.swipe()`): Bloom's
 * gesture layer writes the values from Gesture Handler's callbacks, and the
 * one mapper (`useMotionStyle`) moves the box. Native: no JS per frame.
 */
export function GestureMotionNode(props: MotionNodeProps): ReactNode {
  const { motion } = props;
  const reduced = usePrefersReducedMotion();
  const idle = useMotionValue(0);
  const drag = motion.drag;
  const dragGesture = useDrag(drag?.value ?? idle, {
    axis: drag?.options.axis ?? 'y',
    min: drag?.options.min,
    max: drag?.options.max,
    enabled: drag !== undefined,
    onEnd: drag?.options.onEnd,
  });
  const swipe = useSwipe(motion.swipe?.direction ?? 'up', motion.swipe?.onSwipe ?? NO_SWIPE, {
    enabled: motion.swipe !== undefined,
    reducedMotion: reduced,
  });
  const gesture = useMemo(
    () => Gesture.Race(dragGesture, swipe.gesture),
    [dragGesture, swipe.gesture],
  );

  const bound = motion.bound ?? { translateX: 0, translateY: 0, rotate: 0, scale: 1 };
  const across = motion.swipe?.direction === 'left' || motion.swipe?.direction === 'right';
  const withSwipe = (binding: MotionBinding, axis: boolean) =>
    motion.swipe !== undefined && axis ? [binding, swipe.value].flat() : binding;
  const mapped = useMotionStyle({
    translateX: withSwipe(bound.translateX, across),
    translateY: withSwipe(bound.translateY, !across),
    rotate: bound.rotate,
    scale: bound.scale,
  });
  const {
    style,
    props: hostProps,
    play,
  } = useMotion(props, { style: [mapped.style], ownsTransform: true, bound: true });
  const own = hostProps.ref as RefObject<unknown>;
  const ref = useMemo(() => mergeRefs([own, mapped.ref]), [own, mapped.ref]);
  hostProps.ref = ref;
  return leaverOnly(
    motion,
    <GestureDetector gesture={gesture}>
      {props.content({ ref: own, style, props: hostProps, active: true, playId: play?.id })}
    </GestureDetector>,
  );
}
GestureMotionNode.displayName = 'BloomGestureMotion';
