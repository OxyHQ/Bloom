import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName, type PresetTokens } from './color-presets';
import { getAdaptiveColors } from './adaptive-colors';
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
 * Convert a shadcn-style HSL CSS variable (`'H S% L%'` or `'H S% L% / A'`)
 * into a fully-resolved `hsl()` / `hsla()` color string consumable by both
 * web `style` and React Native.
 */
function hslVarToColor(hslVar: string): string {
  const parts = hslVar.split('/').map((p) => p.trim());
  const triple = parts[0] ?? '0 0% 0%';
  const components = triple.replace(/\s+/g, ', ');

  if (parts.length === 2) {
    const alpha = parseFloat(parts[1] ?? '100') / 100;
    return `hsla(${components}, ${alpha})`;
  }
  return `hsl(${components})`;
}

function extractHue(hslVar: string): number {
  const first = hslVar.split(/\s+/)[0] ?? '0';
  const hue = parseInt(first, 10);
  return Number.isFinite(hue) ? hue : 0;
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function readToken(tokens: PresetTokens, key: string, fallback = '0 0% 0%'): string {
  return hslVarToColor(tokens[key] ?? fallback);
}

function buildColorsFromPreset(
  preset: AppColorName,
  resolved: 'light' | 'dark',
): ThemeColors {
  const config = APP_COLOR_PRESETS[preset];
  const tokens = resolved === 'dark' ? config.dark : config.light;
  const isDark = resolved === 'dark';

  const primaryHue = extractHue(tokens['--primary'] ?? '0 0% 50%');
  const destructiveHue = extractHue(tokens['--destructive'] ?? '0 0% 0%');

  const background = readToken(tokens, '--background');
  const surface = readToken(tokens, '--surface');
  const mutedForeground = readToken(tokens, '--muted-foreground', '0 0% 50%');
  const primaryColor = readToken(tokens, '--primary', '0 0% 50%');
  const primaryForeground = readToken(tokens, '--primary-foreground', '0 0% 100%');

  return {
    background,
    backgroundSecondary: surface,
    backgroundTertiary: readToken(tokens, '--muted'),

    text: readToken(tokens, '--foreground', '0 0% 100%'),
    textSecondary: mutedForeground,
    textTertiary: mutedForeground,

    border: readToken(tokens, '--border', '0 0% 20%'),
    borderLight: readToken(tokens, '--input', '0 0% 20%'),

    primary: primaryColor,
    primaryForeground,
    // Legacy aliases retained for backwards compatibility with downstream
    // consumers. `primaryLight` should be a brand tint, not the surface, but
    // changing this is a breaking change handled in a separate major.
    primaryLight: surface,
    primaryDark: background,

    // `secondary` historically mirrored `primary`. Retained for compatibility.
    secondary: primaryColor,

    tint: primaryColor,
    icon: mutedForeground,
    iconActive: primaryColor,

    ...STATUS_COLORS,

    primarySubtle: isDark ? hsl(primaryHue, 50, 10) : hsl(primaryHue, 70, 93),
    primarySubtleForeground: isDark ? hsl(primaryHue, 70, 65) : hsl(primaryHue, 90, 25),
    negative: hsl(destructiveHue, 84, 45),
    negativeForeground: '#FFFFFF',
    negativeSubtle: isDark ? hsl(destructiveHue, 50, 10) : hsl(destructiveHue, 90, 95),
    negativeSubtleForeground: isDark ? hsl(destructiveHue, 70, 65) : hsl(destructiveHue, 80, 40),
    contrast50: isDark ? hsl(primaryHue, 15, 12) : hsl(primaryHue, 10, 93),

    card: surface,
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
