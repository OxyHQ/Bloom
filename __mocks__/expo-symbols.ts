// Manual mock for the `expo-symbols` peer. The real module resolves a native
// view manager (`SymbolModule`) through expo-modules-core, which is unavailable
// under node/jsdom, so `src/tab-bar/glyph.native.tsx` renders this stand-in.
//
// LIMITATION — jest has no platform-extension resolution, so `./glyph` in
// `tab-bar/index.ts` lands on the NEUTRAL `glyph.tsx`; `glyph.native.tsx` is
// only reached by a test that imports it by its full path. Where it is, the
// element below stands in for a real SF Symbol: the stub records the props it
// was handed, it does not render a glyph. Actual symbol rendering is verified on
// an iOS device.
import React from 'react';

/**
 * Upstream types this as a union of every SF Symbol name (from
 * `sf-symbols-typescript`). `string` is the right stand-in: the union is only
 * used at the `glyph.native.tsx` boundary to narrow `TabBarItem.sfSymbol`, and
 * pinning the real union here would make the mock depend on a transitive
 * package for no test value.
 */
export type SFSymbol = string;

export const SymbolView = React.forwardRef<unknown, Record<string, unknown>>(
  function SymbolView(props, _ref) {
    return React.createElement('SymbolView', props);
  },
);
