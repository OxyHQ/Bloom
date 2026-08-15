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

  tint: string;
  icon: string;
  iconActive: string;

  success: string;
  error: string;
  warning: string;
  info: string;

  /**
   * The tinted status SURFACES and the text that is legible on them.
   *
   * Each `*Subtle` is a translucent tint of its status hue and each
   * `*SubtleForeground` is that family's `-text` member — the pair the colour
   * policy generates together and `policy-legibility.test.ts` checks at AA with
   * the tint composited over the page background. They exist so a status pill,
   * chip or badge never has to derive a tint by appending hex alpha to a fill:
   * the fills resolve to `rgb(...)`, so `` `${colors.error}18` `` is a malformed
   * string that react-native-web reads back as fully OPAQUE, painting the label
   * on its own colour at contrast 1.00.
   */
  successSubtle: string;
  successSubtleForeground: string;
  errorSubtle: string;
  errorSubtleForeground: string;
  warningSubtle: string;
  warningSubtleForeground: string;
  infoSubtle: string;
  infoSubtleForeground: string;

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
