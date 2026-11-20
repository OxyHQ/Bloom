/**
 * The toast's enter and exit, as keyframes on Bloom's motion engine
 * (`motion/keyframes.ts`): Reanimated's CSS animations on native, the Web
 * Animations API on the web, one definition for both platforms. The enter
 * plays when a row mounts; the exit while the toaster's `Presence` keeps a
 * dismissed row, which leaves when the exit ends.
 *
 * Both used to be Reanimated layout animations, which on the web took two
 * workarounds: a custom `Keyframe` passed as `entering` freezes the row at five
 * times its duration (failure mode C), so the web enter was driven by a shared
 * value instead; and an exit that faded the row's copy flattened its material,
 * so the web fade was the surface presence's. Neither is needed now: the
 * engine plays keyframes without Reanimated on the web, and a fade of a box
 * that holds a material goes to the material's own layers and the content on
 * it (`Play.material`).
 *
 * A consumer's own Reanimated builders (`animation.enter`, `animation.exit`)
 * still play through `entering` / `exiting`.
 *
 * Derived from sonner-native v0.26.4 (MIT © Gunnar Torfi Steinarsson): the
 * distances and the exit's stops.
 */
import { Easing } from 'react-native-reanimated';

import { defineKeyframes, type KeyframesValue } from '../motion/keyframes';
import { MOTION } from '../motion/tokens';
import { toastDefaults } from './constants';
import { useToastContext } from './context';
import type { ToastAnimation, ToastEntryExitAnimation, ToastPosition } from './types';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

/** Worklet-callable easings for the stack's and the swipe's shared values. */
export const easeOutQuartFn = Easing.bezierFn(0.165, 0.84, 0.44, 1);
export const easeInOutCircFn = Easing.bezierFn(0.785, 0.135, 0.15, 0.86);

/** How far a row travels on the way in, per position. */
const ENTER_TRANSLATE_Y: Record<ToastPosition, number> = {
  'top-center': -20,
  'bottom-center': 50,
  'bottom-right': 50,
  center: 50,
};

/** Exit stays near its resting slot instead of throwing the card offscreen. */
const EXIT_TRANSLATE_Y_SINGLE = 12;
export const EXIT_DURATION = MOTION.exit.duration;

const enters = new Map<ToastPosition, KeyframesValue>();

/** The row rises (or drops, from the top) into its slot as it fades in. */
export function toastEnterKeyframes(position: ToastPosition): KeyframesValue {
  let keyframes = enters.get(position);
  if (keyframes === undefined) {
    keyframes = defineKeyframes(
      [
        { at: 0, opacity: 0, translateY: ENTER_TRANSLATE_Y[position] },
        { at: 1, opacity: 1, translateY: 0 },
      ],
      MOTION.enter,
    );
    enters.set(position, keyframes);
  }
  return keyframes;
}

const exits = new Map<string, KeyframesValue>();

/**
 * The row fades through 0.35 at half way and moves away from its stack by up to
 * 12 px (the stack gap, when it is smaller), linearly between the stops. A row
 * culled by `visibleToasts` is buried under the stack, so it only fades.
 */
export function toastExitKeyframes({
  position,
  isHiddenByLimit,
  isSingle,
  stackGap,
}: {
  position: ToastPosition;
  isHiddenByLimit: boolean;
  isSingle: boolean;
  stackGap: number;
}): KeyframesValue {
  const distance = isHiddenByLimit
    ? 0
    : isSingle
      ? EXIT_TRANSLATE_Y_SINGLE
      : Math.min(EXIT_TRANSLATE_Y_SINGLE, Math.max(0, stackGap));
  const translateY = position === 'top-center' ? -distance : distance;
  const key = `${translateY}`;
  let keyframes = exits.get(key);
  if (keyframes === undefined) {
    keyframes = defineKeyframes(
      [
        { at: 0, opacity: 1, translateY: 0 },
        { at: 0.5, opacity: 0.35, translateY: translateY * 0.75 },
        { at: 1, opacity: 0, translateY },
      ],
      MOTION.exit,
    );
    exits.set(key, keyframes);
  }
  return keyframes;
}

type ResolvedAnimation = Exclude<ToastEntryExitAnimation, 'default'>;

/** Per-toast animation wins over the outlet's; `'default'` opts back in to Bloom's. */
const overrideOf = (
  toastValue: ToastEntryExitAnimation | undefined,
  toasterValue: ToastEntryExitAnimation | undefined,
): ResolvedAnimation | undefined => {
  const resolved = toastValue !== undefined ? toastValue : toasterValue;
  return resolved === undefined || resolved === 'default' ? undefined : resolved;
};

export interface ToastMotion {
  /** Bloom's enter, or `undefined` under reduced motion or a consumer override. */
  enter: KeyframesValue | undefined;
  /** Bloom's exit, likewise. */
  exit: KeyframesValue | undefined;
  /** A consumer's Reanimated builder for the enter (`entering`). */
  entering: ResolvedAnimation | undefined;
  /** A consumer's Reanimated builder for the exit (`exiting`). */
  exiting: ResolvedAnimation | undefined;
}

export const useToastMotion = (
  positionProp: ToastPosition | undefined,
  animationProp: ToastAnimation | undefined,
  isHiddenByLimit: boolean,
  numberOfToasts: number,
): ToastMotion => {
  const { position: positionCtx, gap, animation: animationCtx } = useToastContext();
  const position = positionProp ?? positionCtx;
  const stackGap = gap ?? toastDefaults.stackGap;
  const reducedMotion = usePrefersReducedMotion();
  if (reducedMotion) {
    return { enter: undefined, exit: undefined, entering: undefined, exiting: undefined };
  }
  const entering = overrideOf(animationProp?.enter, animationCtx?.enter);
  // An overflow-culled row always uses Bloom's fade: a consumer's custom exit
  // would animate a row the user cannot even see.
  const exiting = isHiddenByLimit ? undefined : overrideOf(animationProp?.exit, animationCtx?.exit);
  return {
    enter: entering === undefined ? toastEnterKeyframes(position) : undefined,
    exit:
      exiting === undefined
        ? toastExitKeyframes({ position, isHiddenByLimit, isSingle: numberOfToasts <= 1, stackGap })
        : undefined,
    entering,
    exiting,
  };
};
