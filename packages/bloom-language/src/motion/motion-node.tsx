import {
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { usePrefersReducedMotion } from '@oxy.so/bloom/hooks';

import { defineKeyframes, type KeyframesValue } from './keyframes';
import type { Frame, Namespace } from './namespace';
import type { Play, Transform } from './play';
import { transitionStyle, usePlay, usePressScale, PRESS_SCALE_CLASS } from './host';
import { resolveMotion, timingOf, type MotionToken, type Timing } from './tokens';
import type { TransitionValue } from './transition';

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
  /** The resting transform (scale, offset, rotation tokens), interned by `transformKey`. */
  transform: Transform;
  transformKey: string;
  /** The node's own `.animation()`, which also scopes its subtree. */
  animation: AnimationScope | undefined;
  transition: TransitionValue | undefined;
  keyframes: { value: KeyframesValue; trigger: unknown } | undefined;
  matched: { id: string; namespace: Namespace } | undefined;
  pressScale: boolean;
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

/** A node's exit in a keyed list: the list sets it while the node leaves. */
export interface Leaving {
  readonly onLeft: () => void;
}

export interface MotionNodeProps {
  motion: MotionPlan;
  /** Keyed by `.id()`, so a list can tell its removal from a reorder. */
  identified: boolean;
  scope: AnimationScope | undefined;
  leaving: Leaving | undefined;
  /** Draws the node with `outer` on its outermost box. */
  content: (outer: Outer) => ReactNode;
}

const ORIGIN_TOP_LEFT = { transformOrigin: 'left top' };

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
 * matched move, then the insertion.
 */
function useMotion(
  { motion, scope, leaving }: MotionNodeProps,
  press: { style: readonly unknown[]; ownsTransform: boolean },
) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<unknown>(null);
  const own = motion.animation ?? scope;
  const committed = useRef<Committed | undefined>(undefined);
  const last = committed.current;

  // A state change of the resting transform or opacity animates with the scope's motion.
  let timing: Timing | undefined;
  if (!reduced && own !== undefined) {
    if (animates(own, last)) timing = timingOf(resolveMotion(own.motion));
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

  let play: Play | undefined;
  if (leaving !== undefined && motion.transition !== undefined) {
    const remove = motion.transition.remove;
    const removeTiming = remove.timing(own?.motion);
    if (removeTiming !== undefined && !reduced) {
      play = {
        id: -1,
        keyframes: remove,
        timing: removeTiming,
        fill: 'forwards',
        glass: motion.glass,
        onEnd: leaving.onLeft,
      };
    }
  } else if (keyframes.on && motion.keyframes !== undefined) {
    const kfTiming = motion.keyframes.value.timing(own?.motion);
    if (kfTiming !== undefined) {
      play = {
        id: keyframes.id,
        keyframes: motion.keyframes.value,
        timing: kfTiming,
        fill: 'none',
        glass: motion.glass,
        onEnd: () =>
          setKeyframes((state) => (state.id === keyframes.id ? { ...state, on: false } : state)),
      };
    }
  } else if (moved !== undefined && own !== undefined) {
    play = {
      id: moved.id,
      keyframes: moved.frames,
      timing: timingOf(resolveMotion(own.motion)),
      fill: 'none',
      glass: motion.glass,
      onEnd: undefined,
    };
  } else if (motion.transition !== undefined && !reduced) {
    const insert = motion.transition.insert;
    const insertTiming = insert.timing(own?.motion);
    if (insertTiming !== undefined) {
      play = {
        id: 0,
        keyframes: insert,
        timing: insertTiming,
        fill: 'none',
        glass: motion.glass,
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
    committed.current = { value: own?.value, transformKey: motion.transformKey, timing };
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
  if (timing !== undefined && motion.stable) style.push(transitionStyle(timing));
  if (matched !== undefined) style.push(ORIGIN_TOP_LEFT);
  style.push(...press.style);
  if (played.style !== undefined) style.push(played.style);

  const props: Record<string, unknown> = { ref, ...played.props };
  if (matched !== undefined) {
    props.onLayout = () => {
      const frame = measure(ref.current);
      if (frame !== undefined)
        matched.namespace.frames.set(matched.id, { frame, value: own?.value });
    };
  }
  return { style, props, play };
}

const NO_PRESS = { style: [] as readonly unknown[], ownsTransform: false };

export function MotionNode(props: MotionNodeProps): ReactNode {
  const { style, props: hostProps, play } = useMotion(props, NO_PRESS);
  return props.content({
    ref: hostProps.ref as RefObject<unknown>,
    style,
    props: hostProps,
    active: props.motion.stable || play !== undefined,
    playId: play?.id,
  });
}
MotionNode.displayName = 'BloomMotion';

/** On the web, press feedback is a class (`PRESS_SCALE_CLASS`), as react-native-web takes one. */
const PRESS_CLASS = PRESS_SCALE_CLASS ? [{ $$css: true, pressScale: PRESS_SCALE_CLASS }] : [];

/** A node with `.pressScale()`: the same, plus press feedback on its outermost box. */
export function PressMotionNode(props: MotionNodeProps): ReactNode {
  const reduced = usePrefersReducedMotion();
  const press = usePressScale(!reduced, props.motion.transform);
  const {
    style,
    props: hostProps,
    play,
  } = useMotion(
    props,
    press.style !== undefined
      ? { style: [press.style], ownsTransform: true }
      : { style: PRESS_CLASS, ownsTransform: false },
  );
  if (press.onPressIn !== undefined) {
    hostProps.onPressIn = press.onPressIn;
    hostProps.onPressOut = press.onPressOut;
  }
  return props.content({
    ref: hostProps.ref as RefObject<unknown>,
    style,
    props: hostProps,
    active: true,
    playId: play?.id,
  });
}
PressMotionNode.displayName = 'BloomPressMotion';

// ── Keyed lists: a leaving child stays until its removal ends ─────────────

interface PresenceState {
  /** The children as last rendered, in order. */
  rendered: readonly ReactElement[];
  /** Children that left, by key, while their removal plays. */
  leaving: ReadonlyMap<string, { element: ReactElement; index: number }>;
}

/** Whether an element is a keyed node with a transition, so it can leave. */
function canLeave(element: ReactNode): element is ReactElement<MotionNodeProps> {
  return (
    isValidElement(element) &&
    (element.type === MotionNode || element.type === PressMotionNode) &&
    element.key !== null &&
    (element.props as MotionNodeProps).identified &&
    (element.props as MotionNodeProps).motion.transition !== undefined
  );
}

/**
 * A list slot (`items.map(…)`) that keeps a removed child until its removal
 * transition ends. Only children keyed by `.id()` can leave: by index, a removal
 * and a reorder look the same. A list with no such child is passed through.
 */
export function Presence({ items }: { items: readonly ReactNode[] }): ReactNode {
  const [state, setState] = useState<PresenceState>(() => ({ rendered: [], leaving: new Map() }));
  const current = items.filter(isValidElement) as ReactElement[];
  const tracked = state.leaving.size > 0 || current.some(canLeave) || state.rendered.some(canLeave);
  if (!tracked) return items;

  const keys = new Set(current.map((element) => element.key));
  if (!sameList(state.rendered, current)) {
    const leaving = new Map(state.leaving);
    for (const key of keys) if (key !== null) leaving.delete(key);
    state.rendered.forEach((element, index) => {
      if (
        element.key !== null &&
        !keys.has(element.key) &&
        canLeave(element) &&
        !leaving.has(element.key)
      ) {
        leaving.set(element.key, { element, index });
      }
    });
    setState({ rendered: current, leaving });
  }

  const out: ReactNode[] = [...current];
  for (const [key, { element, index }] of state.leaving) {
    if (keys.has(key)) continue;
    const leave: Leaving = {
      onLeft: () =>
        setState((now) => {
          if (!now.leaving.has(key)) return now;
          const next = new Map(now.leaving);
          next.delete(key);
          return { ...now, leaving: next };
        }),
    };
    out.splice(
      Math.min(index, out.length),
      0,
      cloneElement(element as ReactElement<MotionNodeProps>, { leaving: leave }),
    );
  }
  return out;
}
Presence.displayName = 'BloomPresence';

function sameList(a: readonly ReactElement[], b: readonly ReactElement[]): boolean {
  return a.length === b.length && a.every((element, i) => element === b[i]);
}
