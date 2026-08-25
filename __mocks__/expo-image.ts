// Manual mock for the `expo-image` peer that `media-flight/MediaSurface` (and
// through it the media gallery) requires.
// The real module reaches into expo-modules-core, unavailable under node — and
// an unresolvable import is not a partial failure: the whole suite fails to
// load, which is why that family had no test at all.
import React from 'react';

export const Image = React.forwardRef<unknown, Record<string, unknown>>(
  function Image(props, _ref) {
    return React.createElement('ExpoImage', props, props.children as React.ReactNode);
  },
);
