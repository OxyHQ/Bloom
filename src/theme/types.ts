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
  /** Preset accent tint (`--accent`) — a soft brand-tinted surface, NOT the page surface. */
  primaryLight: string;
  /** Focus-ring shade (`--ring`) — the preset's emphasized ring/border color, NOT the page background. */
  primaryDark: string;

  /** Preset secondary surface (`--secondary`) — a muted companion surface, NOT a mirror of `primary`. */
  secondary: string;

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

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  isDark: boolean;
  isLight: boolean;
}
