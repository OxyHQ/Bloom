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
 * No `className`, and that is the second. `aspectRatio` is the ONE property this
 * component exists to set, and react-native-css merges utilities BEFORE inline
 * style, so a caller writing `className="aspect-video"` would have it silently
 * overwritten by the `ratio` prop with no error anywhere. One owner per
 * property: use this component with `ratio`, or a plain `View` with the class,
 * never both. Wrap it in a `StyledView` for the surrounding layout classes.
 */
import React from 'react';
import { View } from 'react-native';

import type { AspectRatioProps } from './types';

export function AspectRatio({ ratio = 1, children, style, testID }: AspectRatioProps) {
  return (
    <View style={[{ width: '100%', aspectRatio: ratio }, style]} testID={testID}>
      {children}
    </View>
  );
}

AspectRatio.displayName = 'AspectRatio';
