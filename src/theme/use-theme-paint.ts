import { createElement, useContext, useId, useMemo } from 'react';
import { Platform } from 'react-native';
import { useTheme } from './use-theme';
import { ThemeScopeContext } from './color-scope/context';
import { usePrepaintTheme, usePrepaintThemeConfig } from './prepaint-context';
import { themePaintRecipe, themePaintColors, themePaintCss } from './paint';
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import type { Theme, ThemeColors } from './types';

/** Internal boundary: colour arithmetic runs on RGB, the owner emits its sheet. */
export function useThemeRecipe<T>(resolve: (theme: Theme, documentMode: 'light' | 'dark') => T) {
  const theme = useTheme();
  const scope = useContext(ThemeScopeContext);
  const config = usePrepaintThemeConfig();
  const id = `bloom-paint-${useId().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  return useMemo(() => {
    const mode = scope?.rootMode ?? theme.mode ?? (theme.isDark ? 'dark' : 'light');
    const current = resolve(theme, mode);
    if (Platform.OS !== 'web' || !config || !scope) {
      return { current, light: current, dark: current, paint: current, sheet: null };
    }
    const light = resolve(scope.resolveMode(scope.fixedMode ?? 'light').theme, 'light');
    const dark = resolve(scope.resolveMode(scope.fixedMode ?? 'dark').theme, 'dark');
    const lightVars: Record<string, string> = {};
    const darkVars: Record<string, string> = {};
    const paint = themePaintRecipe(current, light, dark, `--${id}`, lightVars, darkVars);
    const css = Object.keys(lightVars).length
      ? themePaintCss(':root', lightVars, darkVars, config.defaultMode)
      : '';
    return {
      current,
      light,
      dark,
      paint,
      sheet: css ? createElement(ServerStyleSheet, { id, css, owned: true }) : null,
    };
  }, [theme, scope, config, id, resolve]);
}

/** Semantic colours for final styles; useTheme() retains RGB for colour math. */
export function useThemePaint(): ThemeColors {
  const theme = useTheme();
  const prepaint = usePrepaintTheme();
  const colors = theme.colors;
  const paint = useMemo(
    () => (colors && Platform.OS === 'web' && prepaint ? themePaintColors(colors) : colors),
    [colors, prepaint],
  );
  if (!paint) throw new Error('useThemePaint must be used within a <BloomThemeProvider>');
  return paint;
}
