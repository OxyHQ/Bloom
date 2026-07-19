import { APP_COLOR_PRESETS, type AppColorName, type PresetTokens } from './color-presets';
import { generateRoleColors, type RoleColors } from './color-engine';
// Circular at the module graph level (`token-registry` imports `getPresetVars`
// from here), but safe: `getResolvedTokens` is only referenced inside the
// `applyPresetVarsToDocument` function body — i.e. at call time, after both
// modules have finished evaluating — never during module initialization.
import { getResolvedTokens } from './token-registry';

/**
 * Map a preset (seed + variant) and mode onto Bloom's canonical CSS-var token
 * set, sourcing EVERY colour from the colour engine's Material-3 role output.
 *
 * This replaces the old hand-authored HSL triples: the engine derives a full,
 * self-consistent, WCAG-legible role set from the seed for light and dark, and
 * this function assigns those roles to Bloom's token names. The token NAMES are
 * unchanged (see `CANONICAL_TOKENS` in `token-registry.ts`) — only the SOURCE of
 * each colour moved to the engine, so every downstream consumer keeps working.
 *
 * Values are full `rgb(r g b)` strings straight from the engine. `getResolvedTokens`
 * passes non-HSL-triple values through untouched, so these flow through the whole
 * pipeline (web document writes, native `rootVariables`, JS `ThemeColors`) unchanged.
 *
 * This is the single source of truth for extended theming vars — consumer apps
 * must not redefine these per-app.
 */
export function getPresetVars(
  colorName: AppColorName,
  mode: 'light' | 'dark',
): PresetTokens {
  const preset = APP_COLOR_PRESETS[colorName];
  const r: RoleColors = generateRoleColors({
    seed: preset.hex,
    variant: preset.variant,
    isDark: mode === 'dark',
  });

  return {
    // --- base shadcn palette ---
    '--background': r.background,
    '--foreground': r.onBackground,
    '--surface': r.surfaceContainerLow,
    '--surface-foreground': r.onSurface,
    '--popover': r.surfaceContainer,
    '--popover-foreground': r.onSurface,
    '--primary': r.primary,
    '--primary-foreground': r.onPrimary,
    // The FIX: `secondary` is now a REAL contrast colour (the engine's secondary
    // role), not a mirror of `primary`.
    '--secondary': r.secondary,
    '--secondary-foreground': r.onSecondary,
    // The third accent of the M3 trio, exposed so `bg-tertiary` / `colors.tertiary`
    // work alongside primary + secondary.
    '--tertiary': r.tertiary,
    '--tertiary-foreground': r.onTertiary,
    '--muted': r.surfaceContainerHigh,
    '--muted-foreground': r.onSurfaceVariant,
    '--accent': r.secondaryContainer,
    '--accent-foreground': r.onSecondaryContainer,
    '--destructive': r.error,
    '--border': r.outlineVariant,
    '--input': r.outlineVariant,
    '--ring': r.primary,
    '--sidebar': r.surfaceContainerLow,

    // --- extended tokens ---
    // The FIX: `card` is the LIGHTEST surface (lighter than `background` in
    // light, correctly darker than `background` in dark) via `surfaceContainerLowest`.
    '--card': r.surfaceContainerLowest,
    '--card-foreground': r.onSurface,
    // Chart series: a sensible 5-step ramp across the accent trio + containers.
    '--chart-1': r.primary,
    '--chart-2': r.secondary,
    '--chart-3': r.tertiary,
    '--chart-4': r.primaryContainer,
    '--chart-5': r.tertiaryContainer,
    '--content-area': r.background,
    '--sidebar-foreground': r.onSurface,
    '--sidebar-primary': r.primary,
    '--sidebar-primary-foreground': r.onPrimary,
    '--sidebar-accent': r.secondaryContainer,
    '--sidebar-accent-foreground': r.onSecondaryContainer,
    '--sidebar-border': r.outlineVariant,
    '--sidebar-ring': r.primary,
  };
}

/**
 * Apply a preset's extended vars to `document.documentElement`. Web-only no-op
 * on native. `BloomThemeProvider` already writes the base preset vars on web;
 * call this only when an app needs the extended (card/chart/sidebar) tokens on
 * the document root.
 *
 * Tokens are resolved via the single canonical `getResolvedTokens` pipeline
 * (already full `rgb(...)` colours from the engine), so `var(--x)` — the form
 * Tailwind v4 `@theme inline` compiles its color utilities to — resolves
 * directly to a valid color on web.
 */
export function applyPresetVarsToDocument(
  colorName: AppColorName,
  mode: 'light' | 'dark',
): void {
  // Web-only: on native `document` is undefined, so this is a no-op there
  // without needing a `react-native` Platform import (keeping this module —
  // and `getPresetVars` — free of any RN dependency so it is importable from
  // pure/web/test environments).
  if (typeof document === 'undefined') return;

  const vars = getResolvedTokens(colorName, mode);
  const root = document.documentElement.style;
  for (const [key, value] of Object.entries(vars)) {
    root.setProperty(key, value);
  }
}
