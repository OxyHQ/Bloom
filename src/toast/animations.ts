/**
 * Derived from sonner-native v0.26.4 — src/animations.ts, src/animation-utils.ts
 * and src/easings.ts (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * W1 — THE EXIT DEFAULT IS A `Keyframe` INSTANCE, NOT A WORKLET BUILDER.
 *
 * Upstream returns a custom `EntryExitAnimationFunction` for both directions. On
 * web that produces NO animation at all: reanimated's web layout-animation
 * manager looks the builder up by preset name, finds none, logs a warning per
 * toast and falls through to `makeElementVisible`, so a toast simply appears and
 * disappears. A `ReanimatedKeyframe` compiles to a real CSS `@keyframes` rule on
 * web and to the same interpolation on native, so one definition covers both
 * platforms — which is what the exit default below is.
 *
 * ON WEB THE ENTER IS NOT A LAYOUT ANIMATION — NEVER HAND IT TO `entering`
 * THERE. This is the fix for a blocker where a second toast landed exactly on top
 * of the first, and it MUST NOT be undone by "simplifying" the web enter back
 * into a `Keyframe`:
 *
 *   reanimated's web ENTERING path calls `setElementAnimation(element, config,
 *   true)`, whose third argument is `shouldSavePosition`. For any animation name
 *   that is not one of its own predefined presets — which is every `Keyframe`,
 *   since those mint a fresh `REA-ENTERING-n` rule — it also schedules
 *   `scheduleAnimationCleanup(name, duration, cb)`, and that callback runs
 *   `setElementPosition(element, snapshot)`: `position: absolute`, an explicit
 *   `top`/`left`/`width`/`height` and `transform: ''`, taken from a snapshot
 *   captured when the enter animation ENDED. The timeout is `duration * 5`, so at
 *   Bloom's 300ms enter the row is frozen in VIEWPORT coordinates 1500ms after it
 *   appeared, and its parent collapses to `height: 0`. A row that moves inside
 *   that window — i.e. any row that is still on screen when the next toast
 *   arrives — has its stack translate exactly cancelled and redraws on top of the
 *   newcomer. It is completely silent: no error, no warning.
 *
 * So on web the enter is driven imperatively instead: `ToastRow` seeds a shared
 * value at 0 and animates it to 1 (`useAnimatedTarget`'s `from`), interpolating
 * opacity and `ENTER_TRANSLATE_Y` to the same distances and curve the `Keyframe`
 * uses, without touching reanimated's web layout-animation machinery.
 *
 * NATIVE KEEPS THE `Keyframe` ON `entering`. `ENTER_DRIVER` below is the ONE
 * switch: there is no `setElementPosition` on native — that whole pin is a web-DOM
 * behaviour — so native pays nothing for the web bug, and driving the enter
 * imperatively there instead regressed it hard (a `bottom-center` toast stopped
 * painting altogether). Native runs the device-verified layout-animation path and
 * never starts a mount-time `withTiming` for the enter at all.
 *
 * The EXIT goes through `exiting` on BOTH platforms, which is safe: reanimated
 * pins the throwaway dummy clone it animates (`shouldSavePosition` is false for
 * the real element), and it is what keeps a dismissed row mounted long enough to
 * animate.
 *
 * Consumer-supplied *predefined* builders (`FadeIn`, `SlideInUp`) keep working on
 * both platforms for both enter and exit, and always go through `entering` /
 * `exiting`. A consumer's own custom worklet builder still animates on native and
 * is silently ignored on web, and a consumer's custom `Keyframe` passed as
 * `animation.enter` will hit the pin described above on web — both are reanimated
 * limitations Bloom cannot bridge.
 *
 * Exit instances are cached per animation shape because building one is not free
 * and, more importantly, because `Keyframe.parseDefinitions()` MUTATES the
 * definition object it was constructed with (it rewrites `from`/`to` into
 * `0`/`100` and deletes them). Each cached instance therefore owns its own
 * definition object; sharing one definition across two instances would make the
 * second throw "Please provide 0 or 'from' keyframe". Re-parsing a single
 * instance is idempotent, so one instance is safely shared by every row of the
 * same shape.
 */
import { Platform } from 'react-native';
import {
  Easing,
  Keyframe,
  useReducedMotion,
  type ReanimatedKeyframe,
} from 'react-native-reanimated';

import { ENTERING_ANIMATION_DURATION, toastDefaults } from './constants';
import { useToastContext } from './context';
import type {
  ToastAnimation,
  ToastEntryExitAnimation,
  ToastPosition,
} from './types';

/**
 * `Easing.bezier()` (not `bezierFn`) returns an easing *factory*, which is what
 * `Keyframe` accepts on both platforms — reanimated's dev-only worklet assertion
 * short-circuits on the `.factory` property, so these pass without the worklets
 * babel plugin too.
 */
const EASE_OUT_QUART = Easing.bezier(0.165, 0.84, 0.44, 1);
const EASE_IN_OUT_CUBIC = Easing.bezier(0.645, 0.045, 0.355, 1);

export type ToastEnterDriver = 'imperative' | 'layoutAnimation';

/**
 * THE one platform switch in the toast engine: which mechanism plays Bloom's
 * DEFAULT enter animation. See the header for why the two platforms cannot share
 * one mechanism.
 */
export const TOAST_ENTER_DRIVER: ToastEnterDriver =
  Platform.OS === 'web' ? 'imperative' : 'layoutAnimation';

/** Worklet-callable easing for `withTiming` inside mappers and layout transitions. */
export const easeOutQuartFn = Easing.bezierFn(0.165, 0.84, 0.44, 1);
export const easeInOutCircFn = Easing.bezierFn(0.785, 0.135, 0.15, 0.86);

/** How far a row travels on the way in, per position. */
const ENTER_TRANSLATE_Y: Record<ToastPosition, number> = {
  'top-center': -20,
  'bottom-center': 50,
  center: 50,
};

/** A lone row leaves the screen entirely; a stacked one only slides by `stackGap`. */
const EXIT_TRANSLATE_Y_SINGLE = 150;

/**
 * Bounded so an animated `gap` cannot grow the cache without limit. The natural
 * key space is 3 enter shapes + 3 positions x hidden x single x one stackGap = 15
 * entries, so this leaves room for a few gap values while staying O(1) memory.
 */
export const MAX_CACHED_ANIMATIONS = 32;

const animationCache = new Map<string, ReanimatedKeyframe>();

function cachedAnimation(
  key: string,
  build: () => ReanimatedKeyframe,
): ReanimatedKeyframe {
  const hit = animationCache.get(key);
  if (hit) {
    return hit;
  }

  if (animationCache.size >= MAX_CACHED_ANIMATIONS) {
    // Map iterates in insertion order, so this evicts the least recently added.
    const oldest = animationCache.keys().next();
    if (!oldest.done) {
      animationCache.delete(oldest.value);
    }
  }

  const built = build();
  animationCache.set(key, built);
  return built;
}

/** Exported so the bounded-growth invariant above is testable. */
export function toastAnimationCacheSize(): number {
  return animationCache.size;
}

/** Native only — on web the same shape is played imperatively by `ToastRow`. */
export function getToastEnterAnimation(
  position: ToastPosition,
): ReanimatedKeyframe {
  return cachedAnimation(
    `enter|${position}`,
    () =>
      new Keyframe({
        from: {
          opacity: 0,
          transform: [{ translateY: ENTER_TRANSLATE_Y[position] }],
        },
        to: {
          opacity: 1,
          transform: [{ translateY: 0 }],
          easing: EASE_OUT_QUART,
        },
      }).duration(ENTERING_ANIMATION_DURATION),
  );
}

export function getToastExitAnimation({
  position,
  isHiddenByLimit,
  isSingle,
  stackGap,
}: {
  position: ToastPosition;
  isHiddenByLimit: boolean;
  isSingle: boolean;
  stackGap: number;
}): ReanimatedKeyframe {
  return cachedAnimation(
    `exit|${position}|${isHiddenByLimit}|${isSingle}|${stackGap}`,
    () => {
      // A row culled by `visibleToasts` is buried under the stack; sliding it
      // would look wrong, so it only fades.
      if (isHiddenByLimit) {
        return new Keyframe({
          from: { opacity: 1 },
          to: { opacity: 0, easing: EASE_IN_OUT_CUBIC },
        }).duration(ENTERING_ANIMATION_DURATION);
      }

      const distance = isSingle ? EXIT_TRANSLATE_Y_SINGLE : stackGap;
      const translateY = position === 'top-center' ? -distance : distance;

      return (
        new Keyframe({
          from: { opacity: 1, transform: [{ translateY: 0 }] },
          to: { opacity: 0, transform: [{ translateY }], easing: EASE_IN_OUT_CUBIC },
        })
          // Matches the store's overlay teardown delay, which is also
          // ENTERING_ANIMATION_DURATION — a longer exit would be cut off.
          .duration(ENTERING_ANIMATION_DURATION)
      );
    },
  );
}

type ResolvedAnimation = Exclude<ToastEntryExitAnimation, 'default'>;

export type ResolvedEnterAnimation = {
  entering: ResolvedAnimation | undefined;
  enterTranslateY: number | undefined;
};

/**
 * Pure so the platform split is testable without a renderer.
 *
 * INVARIANT: exactly ONE of `entering` / `enterTranslateY` is ever set. Both
 * would play the enter twice; neither would leave the row with no enter animation
 * at all and — on the imperative path — parked at `opacity: 0`, one full
 * `enterTranslateY` away from its slot. A consumer override always wins and always
 * goes through `entering`, on both platforms.
 */
export function resolveToastEnterAnimation({
  position,
  enterOverride,
  driver,
}: {
  position: ToastPosition;
  enterOverride: ToastEntryExitAnimation | undefined;
  driver: ToastEnterDriver;
}): ResolvedEnterAnimation {
  if (enterOverride !== undefined && enterOverride !== 'default') {
    return { entering: enterOverride, enterTranslateY: undefined };
  }
  return driver === 'imperative'
    ? { entering: undefined, enterTranslateY: ENTER_TRANSLATE_Y[position] }
    : { entering: getToastEnterAnimation(position), enterTranslateY: undefined };
}

/** Per-toast animation wins over the outlet's; `'default'` opts back in to Bloom's. */
export const resolveAnimationField = (
  toastValue: ToastEntryExitAnimation | undefined,
  toasterValue: ToastEntryExitAnimation | undefined,
  defaultValue: ResolvedAnimation,
): ResolvedAnimation => {
  const resolved = toastValue !== undefined ? toastValue : toasterValue;
  if (resolved === undefined || resolved === 'default') {
    return defaultValue;
  }
  return resolved;
};

export const useToastLayoutAnimations = (
  positionProp: ToastPosition | undefined,
  animationProp: ToastAnimation | undefined,
  isHiddenByLimit: boolean,
  numberOfToasts: number,
): {
  entering: ResolvedAnimation | undefined;
  exiting: ResolvedAnimation | undefined;
  /**
   * How far `ToastRow`'s imperative enter travels, or `undefined` when nothing
   * should be driven imperatively — because `entering` is playing the enter
   * instead (native, or a consumer override on either platform), or because
   * reduced motion is on and there is no enter animation at all.
   */
  enterTranslateY: number | undefined;
} => {
  const {
    position: positionCtx,
    gap,
    animation: animationCtx,
  } = useToastContext();
  const position = positionProp ?? positionCtx;
  const stackGap = gap ?? toastDefaults.stackGap;
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return { entering: undefined, exiting: undefined, enterTranslateY: undefined };
  }

  const defaultExiting = getToastExitAnimation({
    position,
    isHiddenByLimit,
    isSingle: numberOfToasts <= 1,
    stackGap,
  });

  return {
    ...resolveToastEnterAnimation({
      position,
      enterOverride:
        animationProp?.enter !== undefined
          ? animationProp.enter
          : animationCtx?.enter,
      driver: TOAST_ENTER_DRIVER,
    }),
    // An overflow-culled row always uses Bloom's fade: a consumer's custom exit
    // would animate a row the user cannot even see.
    exiting: isHiddenByLimit
      ? defaultExiting
      : resolveAnimationField(
          animationProp?.exit,
          animationCtx?.exit,
          defaultExiting,
        ),
  };
};
