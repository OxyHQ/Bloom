import type React from 'react';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { FONT_ASSETS } from './font-assets.native';

export interface FontLoaderProps {
  /**
   * Whether to gate rendering on fonts being loaded. When false the
   * component is a pass-through that still calls `useFonts` (the hook must
   * run unconditionally per the Rules of Hooks).
   */
  enabled: boolean;
  /**
   * Rendered while native fonts load. Defaults to `null`. If a font fails to
   * load, the children render anyway, in the system font.
   */
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
 *
 * Loading is all it does. Which family a text draws is named by the text:
 * Bloom's `Text` names its own, and a raw React Native `Text` or `TextInput`
 * that names none gets Inter from `@oxy.so/app-preset`'s Metro config, which
 * bundles NativeWind's two components over a host that puts Inter first. This
 * loader once set `Text.defaultProps.style` instead, but React 19 applies
 * `defaultProps` to class components only, and `Text` is a function component,
 * so that default never reached a text.
 *
 * A font that fails to load must not hide the app: `useFonts` then reports an
 * error and never `loaded`, so the gate opens on the error and the app
 * renders in the system font. The failure is reported once.
 */
export function FontLoader({ enabled, fallback, children }: FontLoaderProps) {
  const [loaded, error] = useFonts(FONT_ASSETS);

  useEffect(() => {
    if (error) {
      console.error(
        `[bloom] Bloom's fonts failed to load; text renders in the system font. ${error.message}`,
      );
    }
  }, [error]);

  if (!enabled) return <>{children}</>;
  if (!loaded && !error) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
