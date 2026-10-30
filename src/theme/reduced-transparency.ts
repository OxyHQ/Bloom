import { createContext, useContext, type Context } from 'react';

declare global {
  var __oxy_so_bloom_reduced_transparency__: Context<boolean> | undefined;
}

/**
 * Whether transparency is reduced app-wide: `BloomThemeProvider
 * reduceTransparency`, or the platform's appearance (`appearance` capability)
 * asking for it. The provider resolves it once and every blurred material
 * follows it: the surface material through the document attribute it writes
 * (web CSS), the blurs drawn in JavaScript (`overlay` `Backdrop`,
 * `ProgressiveBlur`, the few hand-made web blurs) through this context.
 *
 * Anchored on `globalThis` for the reason `BloomThemeContext` is: several
 * physical copies of the theme module can coexist in one bundle, and each
 * would otherwise create its own context.
 */
function sharedContext(): Context<boolean> {
  globalThis.__oxy_so_bloom_reduced_transparency__ ??= createContext(false);
  return globalThis.__oxy_so_bloom_reduced_transparency__;
}

const ReducedTransparencyContext = sharedContext();

/** Mounted by `BloomThemeProvider` only. */
export const ReducedTransparencyProvider = ReducedTransparencyContext.Provider;

/**
 * True while transparency is reduced: draw no backdrop blur, and paint an
 * opaque colour where the blur's translucent tint was. False outside a Bloom
 * provider. The web's own `prefers-reduced-transparency` is not part of it:
 * the surface material follows that media query in CSS.
 */
export function useReducedTransparency(): boolean {
  return useContext(ReducedTransparencyContext);
}
