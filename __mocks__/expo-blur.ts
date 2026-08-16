// Manual mock for the optional `expo-blur` peer. The real module reaches into
// native modules (expo-modules-core) that are unavailable under jsdom/node, so
// tests render this lightweight stand-in `BlurView` instead.
import React from 'react';

export const BlurView = React.forwardRef<unknown, Record<string, unknown>>(
  function BlurView(props, _ref) {
    return React.createElement('BlurView', props, props.children as React.ReactNode);
  },
);

/**
 * The Android-only container a `BlurView` points at through `blurTarget`. Real
 * on Android, a plain `View` everywhere else; here it is a host element so a
 * test can assert what the glass layer wraps and what it hands downwards.
 */
export const BlurTargetView = React.forwardRef<unknown, Record<string, unknown>>(
  function BlurTargetView(props, _ref) {
    return React.createElement('BlurTargetView', props, props.children as React.ReactNode);
  },
);
