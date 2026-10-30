import { createContext, useContext, type Context } from 'react';

declare global {
  var __oxy_so_bloom_increased_contrast__: Context<boolean> | undefined;
}

/**
 * Whether contrast is increased app-wide: `BloomThemeProvider increaseContrast`,
 * the platform's appearance (`appearance` capability) or the system's own
 * setting (iOS Increase Contrast, Android high-contrast text, the browser's
 * `prefers-contrast: more` or `forced-colors`). Increased contrast reduces
 * transparency too, and every material host draws a hairline edge that holds
 * 3:1 against its body instead of the edge light.
 *
 * Anchored on `globalThis` for the reason `BloomThemeContext` is: several
 * physical copies of the theme module can coexist in one bundle.
 */
function sharedContext(): Context<boolean> {
  globalThis.__oxy_so_bloom_increased_contrast__ ??= createContext(false);
  return globalThis.__oxy_so_bloom_increased_contrast__;
}

const IncreasedContrastContext = sharedContext();

/** Mounted by `BloomThemeProvider` only. */
export const IncreasedContrastProvider = IncreasedContrastContext.Provider;

/** True while contrast is increased. False outside a Bloom provider. */
export function useIncreasedContrast(): boolean {
  return useContext(IncreasedContrastContext);
}
