import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName, type PresetTokens } from './color-presets';
// Circular at the module graph level (`token-registry` imports `getPresetVars`
// from here), but safe: `getResolvedTokens` is only referenced inside the
// `applyPresetVarsToDocument` function body — i.e. at call time, after both
// modules have finished evaluating — never during module initialization.
import { getResolvedTokens } from './token-registry';

function extractHue(hslVar: string): number {
  return parseInt(hslVar.split(' ')[0] ?? '0', 10);
}

function extractSat(hslVar: string): number {
  return parseInt(hslVar.split(' ')[1] ?? '0', 10);
}

/**
 * Bloom's base preset tokens extended with the surface/card/chart/sidebar
 * tokens that apps layer on top of the core shadcn palette. Synthesized from
 * the preset's primary hue so every preset stays in sync automatically.
 *
 * This is the single source of truth for extended theming vars — consumer apps
 * must not redefine these per-app.
 *
 * Values are platform-agnostic **raw HSL triples** (`'185 100% 20%'`, optionally
 * with a `/ A` alpha tail). The single canonical resolver `getResolvedTokens`
 * (in `token-registry.ts`) converts these to sRGB `rgb(...)` for BOTH web and
 * native runtime writes — this function only produces the raw triple map.
 */
export function getPresetVars(
  colorName: AppColorName,
  mode: 'light' | 'dark',
): PresetTokens {
  const preset = APP_COLOR_PRESETS[colorName];
  const base = mode === 'light' ? preset.light : preset.dark;
  const get = (key: string): string => base[key] ?? '0 0% 0%';
  const primary = get('--primary');
  const foreground = get('--foreground');
  const hue = extractHue(primary);
  const sat = Math.min(extractSat(primary), 80);
  const isDark = mode === 'dark';

  const extended: PresetTokens = {
    ...base,
    // Light cards carry the same bold preset tint as `--popover` (H 55% 97%)
    // so they read as part of the preset family rather than a pure-white slab —
    // mirroring how dark cards (H 30% 10%) carry the accent hue into near-black.
    '--card': isDark ? `${hue} 30% 10%` : `${hue} 55% 97%`,
    '--card-foreground': foreground,
    '--chart-1': `${hue} ${sat}% 85%`,
    '--chart-2': `${hue} ${sat}% 75%`,
    '--chart-3': `${hue} ${sat}% 65%`,
    '--chart-4': `${hue} ${sat}% ${isDark ? 55 : 75}%`,
    '--chart-5': `${hue} ${sat}% ${isDark ? 45 : 65}%`,
    '--content-area': isDark ? `${hue} 30% 8%` : get('--surface'),
    '--sidebar-foreground': foreground,
    '--sidebar-primary': primary,
    '--sidebar-primary-foreground': get('--primary-foreground'),
    '--sidebar-accent': isDark ? get('--sidebar') : get('--accent'),
    '--sidebar-accent-foreground': isDark ? foreground : get('--accent-foreground'),
    '--sidebar-border': get('--border'),
    '--sidebar-ring': get('--ring'),
  };

  return extended;
}

/**
 * Apply a preset's extended vars to `document.documentElement`. Web-only no-op
 * on native. `BloomThemeProvider` already writes the base preset vars on web;
 * call this only when an app needs the extended (card/chart/sidebar) tokens on
 * the document root.
 *
 * Tokens are resolved to sRGB `rgb(...)` via the single canonical
 * `getResolvedTokens` pipeline, so `var(--x)` — the form Tailwind v4
 * `@theme inline` compiles its color utilities to — resolves directly to a
 * valid color on web.
 */
export function applyPresetVarsToDocument(
  colorName: AppColorName,
  mode: 'light' | 'dark',
): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const vars = getResolvedTokens(colorName, mode);
  const root = document.documentElement.style;
  for (const [key, value] of Object.entries(vars)) {
    root.setProperty(key, value);
  }
}
