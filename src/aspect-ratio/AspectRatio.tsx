/**
 * A box that keeps a fixed width-to-height ratio while its width is decided by
 * the layout around it. The usual job: a media well that must not jump as an
 * image loads, because its height was known before the image was.
 *
 * NOT a port. react-native-reusables' `aspect-ratio.tsx` is four lines
 * re-exporting `@rn-primitives/aspect-ratio`'s Root — a primitive that exists on
 * web because CSS needed `padding-bottom` tricks before `aspect-ratio` landed.
 * React Native has had `aspectRatio` as an ordinary style property the whole
 * time, so there was nothing to copy; what earns the name here is the shadcn
 * spelling and the two decisions below, not any imported code.
 *
 * `width: '100%'` is the first: an aspect box with no width is zero-sized, and
 * "fill the parent, derive the height" is what every call site wants — a caller
 * who needs a fixed width passes it through `style`, which lands last.
 *
 * One owner for `aspectRatio`, and that is the second: `ratio` sets it, so a
 * caller does not also set it in `style`. Wrap the box in a `View` for the
 * surrounding layout.
 */
import { View } from 'react-native';

import type { AspectRatioProps } from './types';

/** A square, used both for an omitted `ratio` and for one that is not a ratio. */
const DEFAULT_RATIO = 1;

export function AspectRatio({ ratio = DEFAULT_RATIO, children, style, testID }: AspectRatioProps) {
  // A ratio is width ÷ height, and a box has positive finite lengths on both
  // axes, so the only coherent values are positive and finite. `0`, `NaN`,
  // `Infinity` and negatives are not choices a caller can make on purpose —
  // they are what the ONE piece of arithmetic every call site writes returns
  // before an image has loaded: `0 / 0` is `NaN`, `w / 0` is `Infinity`, and
  // `0 / h` is `0`. All three arrive from the same accident, so `0` is not a
  // deliberate value this guard is taking away.
  //
  // Passed through, each leaves the box with no usable height — it collapses,
  // which is the exact layout jump this component exists to prevent, silently
  // and with no error on either platform. A default parameter rescues only
  // `undefined`, and `ratio || 1` would still let `Infinity` and a negative
  // through, so the test is for a positive finite number rather than a falsy
  // one. The fallback is the documented default and not a throw: "I could not
  // compute a ratio yet" is the same situation as "I did not give you one",
  // and a media well must not crash a screen during an image's loading window.
  const aspectRatio = ratio > 0 && Number.isFinite(ratio) ? ratio : DEFAULT_RATIO;

  return (
    <View style={[{ width: '100%', aspectRatio }, style]} testID={testID}>
      {children}
    </View>
  );
}

AspectRatio.displayName = 'AspectRatio';
