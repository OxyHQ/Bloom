import { generateRoleColors, type RoleColors, type SchemeVariant } from './color-engine';
import { buildSeedScopeVars } from './color-scope/seed-scope';
import { STATUS_COLORS } from './build-theme';
import { THEME_GRADIENTS } from './gradients';
import type { Theme, ThemeColors } from './types';

/**
 * Build the JS `theme.colors` object from an ARBITRARY seed colour — the dynamic
 * counterpart of `buildTheme(preset, …)`.
 *
 * This mirrors `buildColorsFromPreset` (`build-theme.ts`) field-for-field, but
 * sources its tokens from `buildSeedScopeVars({ seed })` instead of a named
 * preset, so a preset's seed reproduces that preset's JS theme exactly. Keeping
 * the two in lockstep is enforced by `__tests__/build-theme-from-seed-parity.test.ts`.
 *
 * Token-backed fields read the resolved `rgb(...)` token map; the brand-tint
 * family (primarySubtle / negative / …) reads the engine's container/error roles
 * directly — identical to the preset path.
 */
export function buildColorsFromSeed(
  seed: string,
  resolved: 'light' | 'dark',
  variant?: SchemeVariant,
  contrastLevel?: number,
): ThemeColors {
  const t = buildSeedScopeVars({ seed, mode: resolved, variant, contrastLevel });
  const isDark = resolved === 'dark';

  // Read a resolved `rgb(...)` token by its bare name (no leading `--`).
  const g = (k: string): string => t[`--${k}`] ?? 'rgb(0 0 0)';

  const r: RoleColors = generateRoleColors({
    seed,
    variant,
    isDark,
    contrastLevel,
  });

  return {
    background: g('background'),
    backgroundSecondary: g('surface'),
    backgroundTertiary: g('popover'),

    text: g('foreground'),
    textSecondary: g('muted-foreground'),
    textTertiary: r.outline,

    border: g('border'),
    borderLight: g('input'),

    primary: g('primary'),
    primaryForeground: g('primary-foreground'),
    primaryLight: g('surface'),
    primaryDark: g('background'),

    secondary: g('secondary'),
    secondaryForeground: g('secondary-foreground'),
    tertiary: g('tertiary'),
    tertiaryForeground: g('tertiary-foreground'),

    tint: g('primary'),
    icon: g('muted-foreground'),
    iconActive: g('primary'),

    ...STATUS_COLORS,

    primarySubtle: r.primaryContainer,
    primarySubtleForeground: r.onPrimaryContainer,
    negative: r.error,
    negativeForeground: r.onError,
    negativeSubtle: r.errorContainer,
    negativeSubtleForeground: r.onErrorContainer,
    contrast50: g('muted'),

    card: g('card'),
    shadow: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  };
}

/**
 * Build a full `Theme` from a seed colour and a resolved light/dark mode. Unlike
 * `buildTheme`, there is no adaptive (Material You / iOS dynamic) override — a
 * seed IS the dynamic source here.
 */
export function buildThemeFromSeed(
  seed: string,
  resolved: 'light' | 'dark',
  variant?: SchemeVariant,
  contrastLevel?: number,
): Theme {
  return {
    mode: resolved,
    colors: buildColorsFromSeed(seed, resolved, variant, contrastLevel),
    gradients: THEME_GRADIENTS,
    isDark: resolved === 'dark',
    isLight: resolved === 'light',
  };
}
