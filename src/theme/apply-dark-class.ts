import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName } from './color-presets';
import { getPresetVars, toWebColorValue } from './preset-vars';

// Re-exported so the web var-contract helper is reachable from this file (the
// home of the web write path). Defined in `preset-vars.ts` next to the related
// HSL parsing so native (which never imports this module) doesn't pull it in.
export { toWebColorValue } from './preset-vars';

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
 * so on web the base `--x` tokens MUST be FULL CSS colors. We therefore write
 * them as `hsl(...)` (e.g. `--primary: hsl(185 100% 20%)`) — `var(--primary)`
 * then resolves to a valid color. The resolved `--color-*` vars are written
 * verbatim as `rgb(...)` (already full colors, used by native `color-mix` alpha
 * utilities; harmless on web). Non-color tokens (`--radius`, etc.) pass through
 * unchanged. See `toWebColorValue`.
 *
 * NATIVE writes the SAME tokens as RAW HSL triples (no `hsl()` wrapper) via
 * `rootVariables` (`native-root-vars.native.ts`), consumed through bloom's
 * native `global.css` `hsl(var(--x))` indirection — that path is untouched here.
 * Includes extended tokens (card, chart-*, content-area, sidebar-*) so consumer
 * apps don't need to synthesize them.
 */
export function applyColorPresetVars(preset: AppColorName, resolved: 'light' | 'dark') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (!APP_COLOR_PRESETS[preset]) return;

  const vars = getPresetVars(preset, resolved, { includeResolvedColorVars: true });
  const root = document.documentElement.style;

  for (const [key, value] of Object.entries(vars)) {
    root.setProperty(key, toWebColorValue(key, value));
  }
}
