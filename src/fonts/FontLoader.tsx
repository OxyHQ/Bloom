import type React from 'react';
// Reach for the web variant explicitly. The default `./apply-font-faces`
// is a no-op stub on native — native loads its fonts via
// `useFonts(FONT_ASSETS)` in `FontLoader.native.tsx` and has no use for
// CSS `@font-face` injection. This file (`FontLoader.tsx`) is only picked
// up by web bundlers — Metro selects `FontLoader.native.tsx` on iOS/Android
// — so it is safe to take a direct dependency on the web implementation
// here.
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import { FONT_FACE_CSS } from './font-face-css.web';

export interface FontLoaderProps {
  /**
   * Whether to load and inject the Bloom font system. When false, this
   * component is a pass-through. Default true (set by `BloomThemeProvider`).
   */
  enabled: boolean;
  /**
   * Rendered while native fonts load. Ignored on web — the web variant
   * publishes CSS `@font-face` rules and uses `font-display: swap`
   * to handle the FOUT period.
   */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Publish font faces with the server-rendered content when the host opts into
 * SSR styles. The browser can discover fonts before the JavaScript bundle runs.
 * ServerStyleSheet adopts the same rules before removing their server node;
 * client-only hosts install them before paint without gating any content.
 *
 * Native consumers resolve `FontLoader.native.tsx` via the React Native /
 * Metro bundler's platform extension resolution — they never load this file.
 */
export function FontLoader({ enabled, children }: FontLoaderProps) {
  return (
    <>
      {enabled && <ServerStyleSheet id="bloom-fonts" css={FONT_FACE_CSS} />}
      {children}
    </>
  );
}
