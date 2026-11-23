import {
  createElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { View } from 'react-native';
import { usePrefersReducedMotion } from '@oxy.so/bloom/hooks';

import {
  rollKeyframes,
  timingOf,
  usePlay,
  type KeyframesValue,
  type Play,
  type Timing,
} from '@oxy.so/bloom/motion';

import type { AnimationScope, Outer } from './motion-node';
import { resolveMotion } from './tokens';

/** How far a rolling text travels, in px: the engagement bar's `ROLL_DISTANCE`. */
export const ROLL_DISTANCE = 10;
const UP = rollKeyframes(ROLL_DISTANCE);
const DOWN = rollKeyframes(-ROLL_DISTANCE);

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
 * A text that rolls a change inside an animation: the text shown, the one
 * leaving while a roll plays, which way it rolls, and the roll's timing (none
 * at rest). The roll is over when `end` runs.
 */
function useRoll(text: string, direction: number | undefined, scope: AnimationScope | undefined) {
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

  const timing =
    roll.outgoing !== null && scope !== undefined
      ? timingOf(resolveMotion(scope.motion))
      : undefined;
  const id = roll.id;
  const end = () => setRoll((state) => (state.id === id ? { ...state, outgoing: null } : state));
  return { roll, timing, end };
}

function playOf(
  id: number,
  timing: Timing | undefined,
  keyframes: KeyframesValue,
  onEnd?: () => void,
): Play | undefined {
  return timing === undefined
    ? undefined
    : { id, keyframes, timing, fill: onEnd ? 'none' : 'forwards', material: false, onEnd };
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
  const { roll, timing, end } = useRoll(text, direction, scope);
  const frames = roll.up ? UP : DOWN;
  const incomingRef = useRef<unknown>(null);
  const outgoingRef = useRef<unknown>(null);
  const incoming = usePlay(incomingRef, playOf(roll.id, timing, frames.incoming, end));
  const outgoing = usePlay(outgoingRef, playOf(roll.id, timing, frames.outgoing));

  if (timing === undefined || roll.outgoing === null) return draw(text, undefined);
  return createElement(
    View,
    { style: CONTAINER },
    draw(text, box(incomingRef, incoming, undefined)),
    draw(roll.outgoing, box(outgoingRef, outgoing, OUTGOING)),
  );
}

export interface NumericRollProps extends TextRollProps {
  /** Draws the row a roll plays in, with the node's box, named by the whole text. */
  row: (text: string, ...pieces: ReactNode[]) => ReactElement;
  /** Draws a piece of the text in the node's type, with `outer` on it while it rolls. */
  piece: (text: string, outer: Outer | undefined) => ReactElement;
}

/**
 * `.contentTransition('numeric')`: SwiftUI's `numericText`. A change of the
 * text inside an animation rolls each character that changed (a digit of a
 * count, a price's cents) out and its new one in, as `roll` rolls the whole
 * text, while the characters that stayed stay put. The two texts are matched
 * from their ends, so a count gaining a digit keeps its units on the same
 * places; a character that is new rolls in, one that went rolls out beside it.
 * At rest it is the plain text host; the row of pieces exists only while a
 * roll plays, named by the whole text, its pieces hidden from assistive
 * technology.
 */
export function NumericRoll({
  text,
  direction,
  scope,
  draw,
  row,
  piece,
}: NumericRollProps): ReactElement {
  const { roll, timing, end } = useRoll(text, direction, scope);
  if (timing === undefined || roll.outgoing === null) return draw(text, undefined);

  const before = Array.from(roll.outgoing);
  const after = Array.from(text);
  const length = Math.max(before.length, after.length);
  const pieces: ReactNode[] = [];
  let still = '';
  let ends = true;
  for (let i = 0; i < length; i++) {
    const was = before[i - (length - before.length)];
    const is = after[i - (length - after.length)];
    if (was === is) {
      still += is as string;
      continue;
    }
    if (still !== '') pieces.push(piece(still, undefined));
    still = '';
    pieces.push(
      createElement(Place, {
        // Keyed from the end, as the characters are matched.
        key: `${roll.id}:${length - i}`,
        was,
        is,
        id: roll.id,
        up: roll.up,
        timing,
        // The first change that plays tells the roll it is over: they all take the same time.
        onEnd: ends ? end : undefined,
        piece,
      }),
    );
    ends = false;
  }
  if (still !== '') pieces.push(piece(still, undefined));
  return row(text, ...pieces);
}

interface PlaceProps {
  was: string | undefined;
  is: string | undefined;
  id: number;
  up: boolean;
  timing: Timing;
  onEnd: (() => void) | undefined;
  piece: NumericRollProps['piece'];
}

const GONE = { position: 'absolute', top: 0, insetInlineEnd: 0 } as const;

/** One character's place in a numeric roll: the old one out, the new one in, on the engine. */
function Place({ was, is, id, up, timing, onEnd, piece }: PlaceProps): ReactElement {
  const frames = up ? UP : DOWN;
  const incomingRef = useRef<unknown>(null);
  const outgoingRef = useRef<unknown>(null);
  const incoming = usePlay(incomingRef, playOf(id, timing, frames.incoming, onEnd));
  const outgoing = usePlay(
    outgoingRef,
    // With no new character, the old one's leaving is what ends the roll.
    playOf(id, timing, frames.outgoing, is === undefined ? onEnd : undefined),
  );
  return createElement(
    View,
    { style: CONTAINER },
    is === undefined ? null : piece(is, box(incomingRef, incoming, undefined)),
    // A character that went has no place of its own: it leaves beside the next one.
    was === undefined
      ? null
      : piece(was, box(outgoingRef, outgoing, is === undefined ? GONE : OUTGOING)),
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
