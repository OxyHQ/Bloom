import { createElement, useContext, useId, useMemo } from 'react';
import { Platform } from 'react-native';
import { useTheme } from './use-theme';
import { ThemeScopeContext } from './color-scope/context';
import { usePrepaintTheme, usePrepaintThemeConfig } from './prepaint/context';
import { themePaintRecipe, themePaintColors, themePaintCss, presetPaintCss } from './paint';
import { APP_COLOR_NAMES, type AppColorName } from './color-presets';
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import { useServerStyleText } from '../styles/use-server-style-text';
import type { Theme, ThemeColors } from './types';

/** Internal boundary: colour arithmetic runs on RGB, the owner emits its sheet. */
export function useThemeRecipe<T>(
  resolve: (theme: Theme, documentMode: 'light' | 'dark', documentPreset?: AppColorName) => T,
) {
  const theme = useTheme();
  const scope = useContext(ThemeScopeContext);
  const config = usePrepaintThemeConfig();
  const id = `bloom-paint-${useId().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const recipe = useMemo(() => {
    const mode = scope?.rootMode ?? theme.mode ?? (theme.isDark ? 'dark' : 'light');
    const current = resolve(theme, mode);
    const enabled = Platform.OS === 'web' && Boolean(config && scope);
    const presetValues = new Map<string, { value: T }>();
    const resolvePreset = (preset: AppColorName, documentMode: 'light' | 'dark') => {
      if (!scope) return current;
      const key = `${preset}/${documentMode}`;
      const cached = presetValues.get(key);
      if (cached) return cached.value;
      const palette =
        scope.resolvePreset?.(preset, scope.fixedMode ?? documentMode) ??
        scope.resolveMode(scope.fixedMode ?? documentMode);
      const value = resolve(palette.theme, documentMode, preset);
      presetValues.set(key, { value });
      return value;
    };
    if (!enabled || !scope || !config) {
      return {
        current,
        light: current,
        dark: current,
        paint: current,
        resolvePreset,
        serverCss: () => '',
        clientCss: () => '',
      };
    }
    const light = resolve(scope.resolveMode(scope.fixedMode ?? 'light').theme, 'light');
    const dark = resolve(scope.resolveMode(scope.fixedMode ?? 'dark').theme, 'dark');
    const lightVars: Record<string, string> = {};
    const darkVars: Record<string, string> = {};
    const persisted = Boolean(config.persistKey);
    const paint = themePaintRecipe(current, light, dark, `--${id}`, lightVars, darkVars, persisted);
    const clientCss = () =>
      Object.keys(lightVars).length
        ? themePaintCss(':root', lightVars, darkVars, config.defaultMode)
        : '';
    const serverCss = () => {
      if (!persisted) return clientCss();
      const variants = APP_COLOR_NAMES.map((preset) => {
        const l = resolvePreset(preset, 'light');
        const d = resolvePreset(preset, 'dark');
        const lightVars: Record<string, string> = {};
        const darkVars: Record<string, string> = {};
        themePaintRecipe(current, l, d, `--${id}`, lightVars, darkVars, true);
        return { preset, light: lightVars, dark: darkVars };
      });
      return presetPaintCss(variants, config.defaultColorPreset ?? 'oxy', config.defaultMode);
    };
    return { current, light, dark, paint, resolvePreset, serverCss, clientCss };
  }, [theme, scope, config, id, resolve]);
  const css = useServerStyleText(
    id,
    recipe.serverCss,
    recipe.clientCss,
    scope?.prepaintReady !== false,
    Boolean(config?.persistKey),
  );
  return {
    current: recipe.current,
    light: recipe.light,
    dark: recipe.dark,
    paint: recipe.paint,
    resolvePreset: recipe.resolvePreset,
    sheet: css ? createElement(ServerStyleSheet, { id, css, owned: true }) : null,
  };
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
