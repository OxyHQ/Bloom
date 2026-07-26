// Manual mock for the `react-native-screens` peer. The real module resolves
// Fabric native components that do not exist under node/jsdom.
//
// Two Bloom code paths touch this package, for different reasons:
//   - `toast/` never imports it — `FullWindowOverlay` is injected by the
//     consumer through `ToasterOverlayWrapper` rather than hard-depended on.
//     This stub lets a test exercise that injection path.
//   - `tab-bar/expo-router/fading-tab-screen.tsx` DOES import `Screen`, to
//     mirror expo-router's own `TabSlot` render with a fade added.
//
// LIMITATION — `Screen` here is an inert host element. The real component's
// `activityState` detaching and `freezeOnBlur` freezing are native/react-freeze
// behaviours with no jsdom equivalent; the stub only preserves the props and
// children so a render can assert what was passed down.
import React from 'react';

export const FullWindowOverlay = ({ children }: { children: React.ReactNode }) => children;

export const Screen = React.forwardRef<unknown, Record<string, unknown>>(
  function Screen(props, _ref) {
    return React.createElement('Screen', props, props.children as React.ReactNode);
  },
);
