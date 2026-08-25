// Manual mock for the OPTIONAL `expo-video` peer.
//
// Two things make it necessary. The real module reaches into
// expo-modules-core, which is unavailable under node, and an unresolvable
// import is not a partial failure — the whole suite fails to load. And the
// boundary in `media-flight/expo-video-module.ts` deliberately loads through a
// dynamic `require`, so without a mock every video path in the tree would
// degrade to its poster and every assertion about a rendered video surface
// would pass against a still image.
//
// The host name (`ExpoVideoView`) is what suites match on, exactly as
// `ExpoImage` is for the image mock.
import React from 'react';

export const VideoView = React.forwardRef<unknown, Record<string, unknown>>(
  function VideoView(props, _ref) {
    return React.createElement('ExpoVideoView', props, props.children as React.ReactNode);
  },
);
