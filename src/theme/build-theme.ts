import { Platform } from 'react-native';
import type { AppColorName } from './color-presets';
import { getAdaptiveColors } from './adaptive-colors';
import { getResolvedTokens } from './token-registry';
import { parseRgbString, srgbToRgbString } from './color-space';
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
 * Build the JS `theme.colors` object from the SAME canonical rgb token source
 * the web/native CSS-var writes use (`getResolvedTokens`). JS styles and the
 * `var(--x)` document tokens therefore share one rgb pipeline — no second,
 * drift-prone HSL conversion lives here. Subtle/alpha mixes derive from the
 * resolved rgb via `parseRgbString` + `srgbToRgbString`.
 */
function buildColorsFromPreset(
  preset: AppColorName,
  resolved: 'light' | 'dark',
): ThemeColors {
  const t = getResolvedTokens(preset, resolved);
  const isDark = resolved === 'dark';

  // Read a resolved `rgb(...)` token by its bare name (no leading `--`).
  const g = (k: string): string => t[`--${k}`] ?? 'rgb(0 0 0)';
  // Re-emit a resolved token at a given alpha (sRGB rgb-with-alpha).
  const mix = (k: string, a: number): string => srgbToRgbString(parseRgbString(g(k)), a);

  return {
    background: g('background'),
    backgroundSecondary: g('surface'),
    backgroundTertiary: g('muted'),

    text: g('foreground'),
    textSecondary: g('muted-foreground'),
    textTertiary: g('muted-foreground'),

    border: g('border'),
    borderLight: g('input'),

    primary: g('primary'),
    primaryForeground: g('primary-foreground'),
    // Corrected aliases (see types.ts): `primaryLight` is the preset accent
    // tint, `primaryDark` is the focus-ring shade — NOT the surface/background.
    primaryLight: g('accent'),
    primaryDark: g('ring'),

    // Corrected: `secondary` is the preset's secondary surface, NOT a primary mirror.
    secondary: g('secondary'),

    tint: g('primary'),
    icon: g('muted-foreground'),
    iconActive: g('primary'),

    ...STATUS_COLORS,

    primarySubtle: mix('primary', isDark ? 0.16 : 0.12),
    primarySubtleForeground: g('primary'),
    negative: g('destructive'),
    negativeForeground: '#FFFFFF',
    negativeSubtle: mix('destructive', isDark ? 0.16 : 0.12),
    negativeSubtleForeground: g('destructive'),
    contrast50: mix('foreground', 0.5),

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
): Theme {
  const adaptive = isAdaptive && Platform.OS !== 'web' ? getAdaptiveColors() : undefined;
  const colors = adaptive ?? buildColorsFromPreset(preset, resolved);

  return {
    mode: resolved,
    colors,
    isDark: resolved === 'dark',
    isLight: resolved === 'light',
  };
}
