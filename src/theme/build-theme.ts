import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName } from './color-presets';
import { generateRoleColors, type RoleColors } from './color-engine';
import type { ExplicitAccents } from './preset-vars';
import { getAdaptiveColors } from './adaptive-colors';
import { getResolvedTokens } from './token-registry';
import { THEME_GRADIENTS } from './gradients';
import type { Theme, ThemeColors } from './types';

/**
 * Status colors used across the design system. Independent of the accent
 * preset so semantic intent stays stable across themes.
 */
export const STATUS_COLORS = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const;

/**
 * Build the JS `theme.colors` object from the SAME engine-derived colours the
 * web/native CSS-var writes use. Token-backed fields read from the resolved rgb
 * token map (`getResolvedTokens`, which sources from the engine via
 * `getPresetVars`); the brand-tint family (primarySubtle/negative/…) reads the
 * engine's container/error roles directly. JS styles and the `var(--x)` document
 * tokens therefore share one engine-backed pipeline — no second HSL conversion.
 *
 * The two intentional fixes land here too: `card` is now the lightest surface
 * (`--card` → engine `surfaceContainerLowest`) and `secondary` is a real
 * contrast colour (engine `secondary` role), not a mirror of `primary`.
 */
function buildColorsFromPreset(
  preset: AppColorName,
  resolved: 'light' | 'dark',
  accents?: ExplicitAccents,
): ThemeColors {
  const t = getResolvedTokens(preset, resolved, accents);
  const isDark = resolved === 'dark';

  // Read a resolved `rgb(...)` token by its bare name (no leading `--`).
  const g = (k: string): string => t[`--${k}`] ?? 'rgb(0 0 0)';

  // The full engine role set — for fields that map to roles Bloom's canonical
  // token set does not surface (containers, error family). An app-wide accent
  // override wins over the preset's own declared accent (else derived).
  const config = APP_COLOR_PRESETS[preset];
  const r: RoleColors = generateRoleColors({
    seed: config.hex,
    variant: config.variant,
    isDark,
    secondarySeed: accents?.secondaryHex ?? config.secondaryHex,
    tertiarySeed: accents?.tertiaryHex ?? config.tertiaryHex,
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
    // Legacy aliases (see types.ts): `primaryLight` is the page surface tint,
    // `primaryDark` is the page background — retained for downstream consumers.
    primaryLight: g('surface'),
    primaryDark: g('background'),

    // The M3 accent trio: secondary is a real contrast colour (engine `secondary`),
    // and tertiary completes primary/secondary/tertiary.
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

    // The FIX: `card` is the lightest surface (engine `surfaceContainerLowest`).
    card: g('card'),
    shadow: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  };
}

/**
 * Build a `Theme` from a color preset and a resolved light/dark mode.
 *
 * When `isAdaptive` is true and the platform exposes adaptive (Material You /
 * iOS dynamic) colors, those override the preset-derived palette.
 */
export function buildTheme(
  preset: AppColorName,
  resolved: 'light' | 'dark',
  isAdaptive: boolean = false,
  accents?: ExplicitAccents,
): Theme {
  const adaptive = isAdaptive && Platform.OS !== 'web' ? getAdaptiveColors() : undefined;
  const colors = adaptive ?? buildColorsFromPreset(preset, resolved, accents);

  return {
    mode: resolved,
    colors,
    gradients: THEME_GRADIENTS,
    isDark: resolved === 'dark',
    isLight: resolved === 'light',
  };
}
