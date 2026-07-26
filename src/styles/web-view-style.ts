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
