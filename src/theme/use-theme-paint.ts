import { createElement, type DependencyList, useContext, useId, useMemo } from 'react';
import { Platform } from 'react-native';
import { useTheme } from './use-theme';
import { ThemeScopeContext } from './color-scope/context';
import { usePrepaintTheme, usePrepaintThemeConfig } from './prepaint/context';
import { themePaintRecipe, themePaintColors, themePaintCss, presetPaintCss } from './paint';
import { APP_COLOR_NAMES, type AppColorName } from './color-presets';
import { ServerStyleSheetFactory } from '../styles/ServerStyleSheetFactory';
import type { Theme, ThemeColors } from './types';

/**
 * Internal boundary: colour arithmetic runs on RGB, the owner emits its sheet.
 *
 * `deps` are what `resolve` reads besides its arguments, as `useMemo`'s are
 * (Biome checks them: `biome.json`). The recipe is the same object for as long
 * as the theme and those stay the same, so a recipe published through context
 * (a `SurfaceLevelProvider`'s `fillModes`) or handed to another recipe changes
 * only when its paint does. Keyed on `resolve` itself, every caller's inline
 * function made a new recipe at every render: a Screen drawing again (its
 * bottom bar's text changing) published new fill modes and redrew everything
 * that reads its surface, the whole header and toolbar with it.
 */
export function useThemeRecipe<T>(
  resolve: (theme: Theme, documentMode: 'light' | 'dark', documentPreset?: AppColorName) => T,
  deps: DependencyList,
) {
  const theme = useTheme();
  const scope = useContext(ThemeScopeContext);
  const config = usePrepaintThemeConfig();
  const id = `bloom-paint-${useId().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  // One memo, the only hook beyond `useId`: a surface on native allocates no
  // more than it did (SurfacePaintHooks.test.tsx). The sheet reads the scope
  // and the config, both immutable context values, so they key it as well.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `resolve` is keyed by the caller's deps, checked at each call
  return useMemo(() => {
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
      return { current, light: current, dark: current, paint: current, resolvePreset, sheet: null };
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
    const sheet = createElement(ServerStyleSheetFactory, {
      id,
      server: serverCss,
      client: clientCss,
      liveReady: scope.prepaintReady !== false,
      reuseServer: persisted,
    });
    return { current, light, dark, paint, resolvePreset, sheet };
  }, [theme, scope, config, id, ...deps]);
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
