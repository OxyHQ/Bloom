// Manual mock for the optional `expo-blur` peer. The real module reaches into
// native modules (expo-modules-core) that are unavailable under jsdom/node, so
// tests render this lightweight stand-in `BlurView` instead.
import React from 'react';

export const BlurView = React.forwardRef<unknown, Record<string, unknown>>(
  function BlurView(props, _ref) {
    return React.createElement('BlurView', props, props.children as React.ReactNode);
  },
);
