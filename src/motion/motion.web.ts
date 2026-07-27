/**
 * WEB FORK of `motion.ts`. Same three names, same contract ("a value you hand to
 * an `Animated.View`'s `entering` / `exiting`"), different mechanism — because on
 * web the native mechanism does nothing at all and the obvious replacement is
 * worse than nothing.
 *
 * WHY THE DEFAULT FILE CANNOT SERVE WEB. `motion.ts` exports custom
 * `EntryExitAnimationFunction` worklet builders. Reanimated's web layout-animation
 * manager resolves an animation by NAME: `tryGetAnimationConfig` reads
 * `config.presetName` off the function, a custom builder has none, and
 * `checkUndefinedAnimationFail` then bails to `makeElementVisible(element, 0)`.
 * Measured in Chrome 5.x/reanimated 4.5.0: the card mounts at `transform: none`,
 * `opacity: 1` and stays there for every sampled frame of both directions, with
 * one `[Reanimated] Couldn't load entering/exiting animation` warning per element.
 * Native is unaffected — it runs the builder directly, with no name lookup.
 *
 * WHY THE ENTER AND THE EXITS USE DIFFERENT MECHANISMS. Rebuilding all three as
 * `Keyframe`s is the obvious fix and is only HALF right, because reanimated's two
 * web directions differ in one decisive argument:
 *
 *   - `exiting` -> `handleExitingAnimation` calls `setElementAnimation` on a
 *     throwaway clone with `shouldSavePosition` FALSE. The custom keyframe's
 *     `duration x 5` cleanup only tears that clone down, which is what it is for.
 *     A `Keyframe` here is safe AND exact: it compiles to a real CSS `@keyframes`
 *     rule, so the full scale + opacity shape survives.
 *   - `entering` -> `chooseAction` calls `setElementAnimation` on the REAL element
 *     with `shouldSavePosition` TRUE, and since a custom keyframe's generated
 *     `REA-ENTERING-n` name is absent from reanimated's built-in `Animations`
 *     map, `scheduleAnimationCleanup` fires
 *     `setElementPosition` at `duration x 5` — `position: absolute`, a frozen
 *     `top`/`left`/`width`/`height` snapshot, `transform` cleared. The animation
 *     plays and the element is then pinned, silently, one and a half seconds
 *     later. That is failure mode (C) in `~/Oxy/AGENTS.md` and it is strictly
 *     worse than the inert animation it would replace.
 *
 * So the enter uses a PREDEFINED builder, whose `presetName` IS in `Animations`
 * and therefore skips `scheduleAnimationCleanup` entirely. Predefined builders
 * cannot combine a fade with a scale, so the web enter keeps the fade and drops
 * the 0.7 -> 1 growth. `ScreenTransition` in this same folder already made that
 * trade for the same reason ("on web the slide is intentionally dropped").
 *
 * The imperative shared-value drive (failure mode (A)'s remedy, and what
 * `toast/ToastRow.tsx` uses for its own enter) is the third option and is not
 * available here: these are exported VALUES, not components, so there is no
 * render to hang a `useSharedValue` off — and it could not express an exit at
 * all, since keeping an unmounting element alive is exactly what `exiting` is for.
 *
 * WEB EASING IS LINEAR. `Keyframe` has no `.easing()` modifier, and a per-stop
 * easing only survives `convertAnimationObjectToKeyframes` when it resolves to one
 * of reanimated's seven `WebEasings` names (all of them ease-IN curves), while
 * `.easing(Easing.bezier(...))` needs the `__closure` the worklets babel plugin
 * adds — absent in every Oxy web build — and degrades to linear WITH a warning.
 * `ShrinkAndPop` therefore carries an extra midpoint stop so its piecewise-linear
 * web curve tracks the native `withTiming` segments closely rather than cutting
 * the corner.
 */
import {
  FadeIn,
  Keyframe,
  type EntryOrExitLayoutType,
} from 'react-native-reanimated';

/** `withTiming`'s default, which is what the native builders animate over. */
const DEFAULT_DURATION = 300;
/** `ShrinkAndPop`: 75ms shrink + 150ms overshoot, with the fade ending with it. */
const POP_DURATION = 250;

/**
 * Entering: fade in.
 *
 * The scale is dropped on web — see the header. `FadeIn`'s own default duration
 * is already 300ms, matching the native builder, and the bare class is exported
 * rather than a `.duration()` instance so nothing shares a mutable builder.
 */
export const ScaleAndFadeIn: EntryOrExitLayoutType = FadeIn;

/** Exiting counterpart to {@link ScaleAndFadeIn}: fade out while shrinking to 70%. */
export const ScaleAndFadeOut: EntryOrExitLayoutType = new Keyframe({
  from: { opacity: 1, transform: [{ scale: 1 }] },
  to: { opacity: 0, transform: [{ scale: 0.7 }] },
}).duration(DEFAULT_DURATION);

/**
 * Exiting with a brief "pop": the scale dips to 70%, overshoots to 110%, and the
 * element fades out.
 *
 * Stops are the native timeline sampled at its own breakpoints, so every property
 * is declared at every stop and nothing depends on CSS's cross-stop interpolation:
 * scale reaches 0.7 at 75ms (30%) and 1.1 at 225ms (90%); opacity holds until
 * 125ms (50%) and then falls to 0 by 250ms. The 50% stop's 0.8333 scale and the
 * 90% stop's 0.2 opacity are the native values at those instants.
 */
export const ShrinkAndPop: EntryOrExitLayoutType = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  30: { opacity: 1, transform: [{ scale: 0.7 }] },
  50: { opacity: 1, transform: [{ scale: 0.8333 }] },
  90: { opacity: 0.2, transform: [{ scale: 1.1 }] },
  100: { opacity: 0, transform: [{ scale: 1.1 }] },
}).duration(POP_DURATION);
