import React, { useRef } from 'react';
// Reach for the web variant explicitly. The default `./apply-font-faces`
// is a no-op stub on native — native loads its fonts via
// `useFonts(FONT_ASSETS)` in `FontLoader.native.tsx` and has no use for
// CSS `@font-face` injection. This file (`FontLoader.tsx`) is only picked
// up by web bundlers — Metro selects `FontLoader.native.tsx` on iOS/Android
// — so it is safe to take a direct dependency on the web implementation
// here.
import { applyFontFaces } from './apply-font-faces.web';

export interface FontLoaderProps {
  /**
   * Whether to load and inject the Bloom font system. When false, this
   * component is a pass-through. Default true (set by `BloomThemeProvider`).
   */
  enabled: boolean;
  /**
   * Rendered while native fonts load. Ignored on web — the web variant
   * applies CSS `@font-face` rules synchronously and uses `font-display: swap`
   * to handle the FOUT period.
   */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Web font loader. Applies the Bloom `@font-face` rules and CSS variables
 * to `:root` on first render, before the first paint, using the same
 * `useRef`-during-render pattern as `BloomThemeProvider`'s color application.
 *
 * No `useEffect`: the side effect runs synchronously inside the render phase,
 * gated by a ref so it only executes once. Subsequent renders short-circuit.
 *
 * Native consumers resolve `FontLoader.native.tsx` via the React Native /
 * Metro bundler's platform extension resolution — they never load this file.
 */
export function FontLoader({ enabled, children }: FontLoaderProps) {
  const applied = useRef(false);
  if (enabled && !applied.current) {
    applied.current = true;
    applyFontFaces();
  }
  return <>{children}</>;
}
