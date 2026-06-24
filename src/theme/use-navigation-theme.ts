import { useMemo } from 'react';
import { useTheme } from './use-theme';

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
 * the active color preset. Returns a structural object — no react-navigation
 * import — so Bloom stays decoupled. Replaces the per-app copies in
 * test-app-expo / inbox / accounts.
 */
export function useNavigationTheme(): NavigationTheme {
  const { mode, colors } = useTheme();
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
