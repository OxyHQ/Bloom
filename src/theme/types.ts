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

  /** Legacy alias: mirrors `primary` (`--primary`) for backwards compatibility. */
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
