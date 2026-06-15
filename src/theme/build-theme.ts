import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName } from './color-presets';
import { getAdaptiveColors } from './adaptive-colors';
import { getResolvedTokens, hslToSrgb } from './token-registry';
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
 * Extract the integer hue from a shadcn-style raw HSL triple (`'H S% L%'`,
 * optionally with an alpha tail). Used to seed the computed brand tints below
 * from the preset's primary/destructive hue, exactly as pre-0.8.0.
 */
function extractHue(triple: string): number {
  const first = (triple.split(/\s+/)[0] ?? '0').replace(/deg$/i, '');
  const hue = parseInt(first, 10);
  return Number.isFinite(hue) ? hue : 0;
}

/**
 * Build the JS `theme.colors` object from the SAME canonical rgb token source
 * the web/native CSS-var writes use (`getResolvedTokens`). JS styles and the
 * `var(--x)` document tokens therefore share one rgb pipeline — no second,
 * drift-prone HSL conversion lives here.
 *
 * Token-backed values read straight from the resolved rgb map via `g(...)`.
 * The brand tints (primarySubtle/negative/contrast50/...) reproduce the EXACT
 * pre-0.8.0 colors — computed from the preset's primary/destructive HUE with
 * the historical `hsl(h, s%, l%)` math — but are emitted as `rgb(...)` by
 * routing the triple through the registry's `hslToSrgb`, so the single-format
 * pipeline is preserved. (`hsl(h,s%,l%)` and the `rgb(...)` of the same color
 * are byte-identical under the RN/RNW/browser parser.)
 */
function buildColorsFromPreset(
  preset: AppColorName,
  resolved: 'light' | 'dark',
): ThemeColors {
  const t = getResolvedTokens(preset, resolved);
  const isDark = resolved === 'dark';

  // Read a resolved `rgb(...)` token by its bare name (no leading `--`).
  const g = (k: string): string => t[`--${k}`] ?? 'rgb(0 0 0)';

  // Convert a computed `H S% L%` triple to the canonical `rgb(...)` via the
  // registry's single HSL→sRGB conversion (matches the old `hsl(h,s%,l%)`).
  const hslRgb = (h: number, s: number, l: number): string => hslToSrgb(`${h} ${s}% ${l}%`);

  // Brand hues seed the computed tints from the preset's raw HSL triples,
  // exactly as the pre-0.8.0 logic did.
  const presetTokens = isDark ? APP_COLOR_PRESETS[preset].dark : APP_COLOR_PRESETS[preset].light;
  const pHue = extractHue(presetTokens['--primary'] ?? '0 0% 50%');
  const dHue = extractHue(presetTokens['--destructive'] ?? '0 0% 0%');

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
    // Legacy aliases (see types.ts): `primaryLight` is the page surface tint,
    // `primaryDark` is the page background — retained for downstream consumers.
    primaryLight: g('surface'),
    primaryDark: g('background'),

    // `secondary` historically mirrors `primary`. Retained for compatibility.
    secondary: g('primary'),

    tint: g('primary'),
    icon: g('muted-foreground'),
    iconActive: g('primary'),

    ...STATUS_COLORS,

    primarySubtle: isDark ? hslRgb(pHue, 50, 10) : hslRgb(pHue, 70, 93),
    primarySubtleForeground: isDark ? hslRgb(pHue, 70, 65) : hslRgb(pHue, 90, 25),
    negative: hslRgb(dHue, 84, 45),
    negativeForeground: '#FFFFFF',
    negativeSubtle: isDark ? hslRgb(dHue, 50, 10) : hslRgb(dHue, 90, 95),
    negativeSubtleForeground: isDark ? hslRgb(dHue, 70, 65) : hslRgb(dHue, 80, 40),
    contrast50: isDark ? hslRgb(pHue, 15, 12) : hslRgb(pHue, 10, 93),

    card: g('surface'),
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
