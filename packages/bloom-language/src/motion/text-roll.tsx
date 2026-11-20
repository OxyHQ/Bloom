import {
  createElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from 'react';
import { View } from 'react-native';
import { usePrefersReducedMotion } from '@oxy.so/bloom/hooks';

import { usePlay } from './host';
import { defineKeyframes, type KeyframesValue } from './keyframes';
import type { AnimationScope, Outer } from './motion-node';
import type { Play } from './play';
import { resolveMotion, timingOf } from './tokens';

/** How far a rolling text travels, in px: the engagement bar's `ROLL_DISTANCE`. */
export const ROLL_DISTANCE = 10;

const rollFrames = (travel: number): { incoming: KeyframesValue; outgoing: KeyframesValue } => ({
  incoming: defineKeyframes([
    { at: 0, opacity: 0, translateY: travel },
    { at: 1, opacity: 1, translateY: 0 },
  ]),
  outgoing: defineKeyframes([
    { at: 0, opacity: 1, translateY: 0 },
    { at: 1, opacity: 0, translateY: -travel },
  ]),
});
const UP = rollFrames(ROLL_DISTANCE);
const DOWN = rollFrames(-ROLL_DISTANCE);

const CONTAINER = { alignItems: 'flex-start' } as const;
const OUTGOING = { position: 'absolute', top: 0, insetInlineStart: 0 } as const;
const HIDDEN = {
  'aria-hidden': true,
  importantForAccessibility: 'no-hide-descendants',
  accessibilityElementsHidden: true,
  pointerEvents: 'none',
} as const;

export interface TextRollProps {
  text: string;
  /** The number the text shows: it rolls up when this rose, down when it fell. */
  direction: number | undefined;
  scope: AnimationScope | undefined;
  /** Draws the text host with `text`, and `outer` on it while it rolls. */
  draw: (text: string, outer: Outer | undefined) => ReactElement;
}

interface Roll {
  shown: string;
  outgoing: string | null;
  up: boolean;
  id: number;
}

/**
 * `.contentTransition('roll')`: a change of the text inside an animation
 * (`.animation('roll', value)`) rolls the old text out and the new one in, the
 * new one rising into place when `direction` rose and falling into it when it
 * fell, over the scope's motion. At rest it is the plain text host; the two
 * layers exist only while a roll plays. The incoming text sizes the box; the
 * outgoing one is hidden from assistive technology.
 */
export function TextRoll({ text, direction, scope, draw }: TextRollProps): ReactElement {
  const reduced = usePrefersReducedMotion();
  const committed = useRef<{ value: unknown; direction: number | undefined } | undefined>(
    undefined,
  );
  const [roll, setRoll] = useState<Roll>({ shown: text, outgoing: null, up: true, id: 0 });

  if (roll.shown !== text) {
    const last = committed.current;
    const animating =
      !reduced &&
      scope !== undefined &&
      last !== undefined &&
      (!scope.gated || !Object.is(last.value, scope.value));
    const up =
      direction === undefined || last?.direction === undefined || direction >= last.direction;
    setRoll({ shown: text, outgoing: animating ? roll.shown : null, up, id: roll.id + 1 });
  }
  useLayoutEffect(() => {
    committed.current = { value: scope?.value, direction };
  });

  const rolling = roll.outgoing !== null && scope !== undefined;
  const timing = rolling ? timingOf(resolveMotion(scope.motion)) : undefined;
  const frames = roll.up ? UP : DOWN;
  const id = roll.id;
  const end = () => setRoll((state) => (state.id === id ? { ...state, outgoing: null } : state));
  const play = (keyframes: KeyframesValue, onEnd?: () => void): Play | undefined =>
    timing === undefined
      ? undefined
      : { id, keyframes, timing, fill: onEnd ? 'none' : 'forwards', glass: false, onEnd };

  const incomingRef = useRef<unknown>(null);
  const outgoingRef = useRef<unknown>(null);
  const incoming = usePlay(incomingRef, play(frames.incoming, end));
  const outgoing = usePlay(outgoingRef, play(frames.outgoing));

  if (!rolling || roll.outgoing === null) return draw(text, undefined);
  return createElement(
    View,
    { style: CONTAINER },
    draw(text, box(incomingRef, incoming, undefined)),
    draw(roll.outgoing, box(outgoingRef, outgoing, OUTGOING)),
  );
}

function box(
  ref: RefObject<unknown>,
  played: { style: object | undefined; props: object | undefined },
  extra: object | undefined,
): Outer {
  const style: unknown[] = [];
  if (extra !== undefined) style.push(extra);
  if (played.style !== undefined) style.push(played.style);
  return {
    ref,
    style,
    props: { ref, ...(extra === undefined ? null : HIDDEN), ...played.props },
    active: true,
    playId: undefined,
  };
}
