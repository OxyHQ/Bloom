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
//
// The export surface matches the real package from 56.x on, `isGlassEffectAPIAvailable`
// included: `surface.native.tsx` consults it only when it exists (it postdates the
// `>=0.1.5` peer floor), so a mock missing it would quietly stop covering that
// call. `TabBarGlassFallback.test.tsx` re-mocks the module per scenario for the
// unhealthy installs this stand-in deliberately does not represent.
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

// Whether the platform exposes the glass API at all — a separate question from
// whether the app is USING liquid glass. A healthy install answers `true`; it is
// the iOS 26 betas that do not, and they crash natively without this check.
export function isGlassEffectAPIAvailable(): boolean {
  return true;
}
