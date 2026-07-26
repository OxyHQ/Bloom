// Manual mock for the `expo-glass-effect` peer. The real module reaches into
// native modules (expo-modules-core → `ExpoGlassEffect`) that do not exist under
// node/jsdom, so `src/tab-bar/surface.native.tsx` renders this stand-in instead.
//
// LIMITATION — `isLiquidGlassAvailable()` always returns `false` here, so tests
// only ever exercise the SOLID-FALLBACK branch of `TabBarSurface`. That is the
// branch every non-iOS-26 platform takes, and it is the one a jest render can
// meaningfully assert on: the `GlassView` branch renders a native view whose
// material has no DOM/JS representation to inspect. The glass branch is verified
// on a real iOS 26 device, not here. Flipping this to `true` would NOT give a
// test more coverage — it would just swap one host string for another.
import React from 'react';

export type GlassStyle = 'clear' | 'regular' | 'none';

export const GlassView = React.forwardRef<unknown, Record<string, unknown>>(
  function GlassView(props, _ref) {
    return React.createElement('GlassView', props, props.children as React.ReactNode);
  },
);

export function isLiquidGlassAvailable(): boolean {
  return false;
}
