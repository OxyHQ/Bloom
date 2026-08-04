export type ThemeMode = 'light' | 'dark' | 'system' | 'adaptive';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  text: string;
  textSecondary: string;
  textTertiary: string;

  border: string;
  borderLight: string;

  primary: string;
  primaryForeground: string;
  /** Legacy alias: the page surface tint (`--surface`), NOT a brand accent. */
  primaryLight: string;
  /** Legacy alias: the page background (`--background`), NOT the focus ring. */
  primaryDark: string;

  /** The M3 secondary accent — a real contrast colour (no longer a mirror of primary). */
  secondary: string;
  secondaryForeground: string;
  /** The M3 tertiary accent, completing the primary/secondary/tertiary trio. */
  tertiary: string;
  tertiaryForeground: string;
  /**
   * The solid-BUTTON member of each accent: the same hue, deep enough to carry a
   * white label. The accent itself sits at its hue's peak tone, where nothing but
   * black survives — fine for a tile or a chip, wrong for a FAB.
   */
  secondaryStrong: string;
  secondaryStrongForeground: string;
  tertiaryStrong: string;
  tertiaryStrongForeground: string;

  tint: string;
  icon: string;
  iconActive: string;

  success: string;
  error: string;
  warning: string;
  info: string;

  primarySubtle: string;
  primarySubtleForeground: string;
  negative: string;
  negativeForeground: string;
  negativeSubtle: string;
  negativeSubtleForeground: string;
  contrast50: string;

  card: string;
  shadow: string;
  overlay: string;
}

/**
 * A single named gradient: an ordered list of `[offset, color]` stops where
 * `offset` runs 0–1 along the gradient axis and `color` is any RN/CSS color.
 */
export interface ThemeGradient {
  values: Array<[number, string]>;
}

/** Map of named gradients exposed on the theme (`theme.gradients`). */
export type ThemeGradients = Record<string, ThemeGradient>;

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  /** Brand-neutral named linear-gradient palettes. Theme-agnostic (same in light/dark). */
  gradients: ThemeGradients;
  isDark: boolean;
  isLight: boolean;
}
