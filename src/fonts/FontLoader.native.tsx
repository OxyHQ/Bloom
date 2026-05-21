import React from 'react';
import { useFonts } from 'expo-font';
import { FONT_ASSETS } from './font-assets';

export interface FontLoaderProps {
  /**
   * Whether to gate rendering on fonts being loaded. When false the
   * component is a pass-through that still calls `useFonts` (the hook must
   * run unconditionally per the Rules of Hooks).
   */
  enabled: boolean;
  /** Rendered while native fonts load. Defaults to `null`. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Native font loader. Calls `expo-font`'s `useFonts` with the Bloom font
 * asset map and gates `children` on the load result. The hook is invoked
 * unconditionally — `enabled` only affects what's rendered, not whether
 * fonts get loaded. This keeps Hook order stable across renders and means
 * `<BloomThemeProvider fonts={false}>` still gets fonts pre-loaded if the
 * provider tree ever flips `fonts` back on.
 */
export function FontLoader({ enabled, fallback, children }: FontLoaderProps) {
  const [loaded] = useFonts(FONT_ASSETS);
  if (!enabled) return <>{children}</>;
  if (!loaded) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
