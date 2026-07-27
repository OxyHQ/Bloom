import type { ViewStyle } from 'react-native';

/**
 * `position: fixed`, typed for React Native's `ViewStyle`.
 *
 * RN types `position` as `'absolute' | 'relative' | 'static'` — what Yoga
 * implements — while react-native-web renders real CSS, where `'fixed'` is the
 * only way for a portaled overlay to anchor to the VIEWPORT instead of the
 * nearest positioned ancestor. This is the ONE place Bloom crosses between the
 * two, so web forks import it instead of writing their own cast.
 *
 * Deliberately not a `declare module 'react-native'` augmentation, for two
 * reasons. It does not work: `position` lives on `interface FlexStyle`, which RN
 * re-exports from a submodule, so augmenting `'react-native'` neither merges nor
 * errors — verified with tsc, the identical `TS2322` appears with and without it,
 * which makes it strictly worse than a cast because it looks like a fix. And even
 * if it worked, widening `ViewStyle` would ship through `/// <reference path>` to
 * every consumer, so `position: 'fixed'` would start compiling in NATIVE code
 * where Yoga silently ignores it.
 */
export const WEB_POSITION_FIXED = 'fixed' as ViewStyle['position'];

/**
 * A `ViewStyle` that may ALSO carry CSS react-native-web forwards straight to the
 * DOM node but React Native does not model at all.
 *
 * This is the OTHER shape of the same RN/RNW type gap `WEB_POSITION_FIXED`
 * covers, and it needs a different escape hatch because the two are structurally
 * different: `position` is a key RN DOES model, just with a narrower value union,
 * so a value-level cast is enough and it can still be written inside an ordinary
 * style object. The properties below have no key on `ViewStyle` at all, so the
 * whole OBJECT has to cross the boundary.
 *
 * ANNOTATE, DO NOT CAST. Every `.web` fork used to spell this `{ … } as ViewStyle`
 * inline. That is not a widening, it is SILENCING: `as` only requires the two
 * types to be COMPARABLE, so `{ animatoin: '…' } as ViewStyle` compiles happily
 * and the typo ships as a style key react-native-web drops on the floor.
 * Annotating with this interface restores excess-property checking — a key that
 * is neither a real RN style nor a listed web-only property is a compile error —
 * and, unlike a widening helper function, it erases completely, so the emitted
 * JavaScript is byte-identical to the cast it replaces.
 *
 * ```ts
 * const glass: WebCssStyle = { backdropFilter: 'blur(24px)' };
 * // …then pass it anywhere a `ViewStyle` is expected.
 * ```
 *
 * Only add a key here once react-native-web is confirmed to pass it through and
 * RN has no equivalent. Several near-misses do NOT belong: RN 0.83 models
 * `cursor`, `boxShadow`, `filter` and `pointerEvents` on `ViewStyle` directly, so
 * those need no widening at all (`userSelect` is the trap — RN declares it on
 * `TextStyle` only). Prefixed spellings sit alongside the standard ones because
 * Safari still needs them for `backdrop-filter` and `mask-image`.
 */
export interface WebCssStyle extends ViewStyle {
  /** CSS `animation` shorthand. Bloom's web forks self-inject the `@keyframes`. */
  animation?: string;
  animationDelay?: string;
  transitionProperty?: string;
  transitionDuration?: string;
  transitionTimingFunction?: string;
  backdropFilter?: string;
  WebkitBackdropFilter?: string;
  maskImage?: string;
  WebkitMaskImage?: string;
  backgroundImage?: string;
  scrollbarWidth?: 'auto' | 'thin' | 'none';
  scrollbarColor?: string;
  /** RN declares this on `TextStyle`, not `ViewStyle`. */
  userSelect?: 'auto' | 'none' | 'text' | 'contain' | 'all';
}
