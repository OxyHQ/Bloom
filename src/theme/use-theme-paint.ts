import { createElement, useContext, useId, useMemo } from 'react';
import { Platform } from 'react-native';
import { BloomThemeContext } from './BloomThemeProvider';
import { ThemeScopeContext } from './color-scope/context';
import { usePrepaintTheme, usePrepaintThemeConfig } from './prepaint-context';
import { themePaintRecipe, themePaintColors, themePaintCss, type ThemePaintModes } from './paint';
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import type { Theme, ThemeColors } from './types';

/** Internal boundary: colour arithmetic runs on RGB, the owner emits its sheet. */
export function useThemeRecipe<T>(resolve: (theme: Theme) => T) {
  const context = useContext(BloomThemeContext);
  const scope = useContext(ThemeScopeContext);
  const config = usePrepaintThemeConfig();
  const id = `bloom-paint-${useId().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  return useMemo(() => {
    if (!context) return null;
    const current = resolve(context.theme);
    if (Platform.OS !== 'web' || !config || !scope) {
      return { current, light: current, dark: current, paint: current, sheet: null };
    }
    const light = resolve(scope.resolveMode('light').theme);
    const dark = resolve(scope.resolveMode('dark').theme);
    const lightVars: Record<string, string> = {};
    const darkVars: Record<string, string> = {};
    const paint = themePaintRecipe(current, light, dark, `--${id}`, lightVars, darkVars);
    const css = themePaintCss(':root', lightVars, darkVars, config.defaultMode, scope.fixedMode);
    return { current, light, dark, paint, sheet: createElement(ServerStyleSheet, { id, css }) };
  }, [context, scope, config, id, resolve]);
}

/** Semantic colours for final styles; useTheme() retains RGB for colour math. */
export function useThemePaint(): ThemeColors {
  const context = useContext(BloomThemeContext);
  const prepaint = usePrepaintTheme();
  const colors = context?.theme.colors;
  const paint = useMemo(() => colors && Platform.OS === 'web' && prepaint ? themePaintColors(colors) : colors, [colors, prepaint]);
  if (!paint) throw new Error('useThemePaint must be used within a <BloomThemeProvider>');
  return paint;
}
