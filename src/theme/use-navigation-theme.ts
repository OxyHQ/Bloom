import { useMemo } from 'react';
import { useTheme } from './use-theme';
import { useThemePaint } from './use-theme-paint';

export interface NavigationThemeFont {
  fontFamily: string;
  fontWeight: '400' | '500' | '700' | '900';
}

export interface NavigationTheme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
  fonts: {
    regular: NavigationThemeFont;
    medium: NavigationThemeFont;
    bold: NavigationThemeFont;
    heavy: NavigationThemeFont;
  };
}

const NAV_FONTS: NavigationTheme['fonts'] = {
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium: { fontFamily: 'System', fontWeight: '500' },
  bold: { fontFamily: 'System', fontWeight: '700' },
  heavy: { fontFamily: 'System', fontWeight: '900' },
};

/**
 * Projects Bloom's resolved theme into a react-navigation `Theme` POJO for
 * expo-router's <ThemeProvider>. Keeps Bloom the single source of truth for
 * navigator chrome (Stack headers, screen backgrounds, modal) so it tracks
 * the active color preset. Opted-in web navigators receive prepaint CSS colors
 * for final chrome styles; native values and the behavioral dark flag stay concrete. Returns a structural object — no react-navigation
 * import — so Bloom stays decoupled. Replaces the per-app copies in
 * test-app-expo / inbox / accounts.
 */
export function useNavigationTheme(): NavigationTheme {
  const { mode } = useTheme();
  const colors = useThemePaint();
  return useMemo(
    () => ({
      dark: mode === 'dark',
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.error,
      },
      fonts: NAV_FONTS,
    }),
    [mode, colors],
  );
}
