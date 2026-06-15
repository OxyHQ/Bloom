import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName } from './color-presets';
import { getResolvedTokens } from './token-registry';

export function applyDarkClass(resolved: 'light' | 'dark') {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }
}

/**
 * Apply a color preset's CSS custom properties to the document root.
 * No-op on native — only affects web (early-returns on `Platform.OS !== 'web'`).
 *
 * Web var contract (the form Tailwind v4 `@theme inline` compiles to)
 * -------------------------------------------------------------------
 * The shadcn/Tailwind-v4 web apps compile their color utilities to reference the
 * BASE token directly (`.bg-background { background-color: var(--background) }`),
 * so on web the base `--x` tokens MUST be FULL CSS colors. `getResolvedTokens`
 * returns every canonical token already resolved to an sRGB `rgb(...)` string,
 * so `var(--x)` resolves to a valid color directly — no per-value wrapping. The
 * same rgb values feed native (`color-mix` alpha utilities resolve on sRGB), so
 * web and native share one canonical token pipeline.
 *
 * Includes extended tokens (card, chart-*, content-area, sidebar-*) so consumer
 * apps don't need to synthesize them.
 */
export function applyColorPresetVars(preset: AppColorName, resolved: 'light' | 'dark') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (!APP_COLOR_PRESETS[preset]) return;

  const vars = getResolvedTokens(preset, resolved);
  const root = document.documentElement.style;

  for (const [key, value] of Object.entries(vars)) {
    root.setProperty(key, value);
  }
}
