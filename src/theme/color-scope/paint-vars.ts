import {
  resolveSurfaceLevel,
  SURFACE_FILL_VAR,
  type SurfaceLevel,
} from '../../styles/surface-levels';
import { createElement, useId, useMemo } from 'react';
import { themePaintVars, themePaintRecipe, themePaintCss, presetPaintCss } from '../paint';
import { APP_COLOR_NAMES, type AppColorName } from '../color-presets';
import { usePrepaintThemeConfig } from '../prepaint/context';
import { ServerStyleSheetFactory } from '../../styles/ServerStyleSheetFactory';
import type { ScopeState } from './context';

/** Preserve scoped aliases and explicit local mode across DOM and portal hosts. */
export function useScopePaint(
  scope: ScopeState | null | undefined,
  active = true,
  surfaceLevel?: SurfaceLevel,
) {
  const config = usePrepaintThemeConfig();
  const id = `bloom-scope-paint-${useId().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const recipe = useMemo(() => {
    const empty = { serverCss: () => '', clientCss: () => '' };
    if (!scope || !active) return { vars: undefined, ...empty };
    const surfaceVars = (theme: typeof scope.theme) =>
      surfaceLevel === undefined
        ? {}
        : { [SURFACE_FILL_VAR]: resolveSurfaceLevel(theme, surfaceLevel).background };
    if (!config) return { vars: { ...scope.vars, ...surfaceVars(scope.theme) }, ...empty };
    const palette = (mode: 'light' | 'dark', preset?: AppColorName) => {
      const resolved =
        preset && scope.resolvePreset
          ? scope.resolvePreset(preset, scope.fixedMode ?? mode)
          : scope.resolveMode(scope.fixedMode ?? mode);
      return {
        ...resolved.vars,
        ...themePaintVars(resolved.theme.colors),
        ...surfaceVars(resolved.theme),
      };
    };
    const light = palette('light');
    const dark = palette('dark');
    const current = {
      ...scope.vars,
      ...themePaintVars(scope.theme.colors),
      ...surfaceVars(scope.theme),
    };
    const lightVars: Record<string, string> = {};
    const darkVars: Record<string, string> = {};
    const persisted = Boolean(config.persistKey);
    const vars = themePaintRecipe(current, light, dark, `--${id}`, lightVars, darkVars, persisted);
    const clientCss = () =>
      Object.keys(lightVars).length
        ? themePaintCss(':root', lightVars, darkVars, config.defaultMode, scope.fixedMode)
        : '';
    const serverCss = () => {
      if (!persisted) return clientCss();
      const variants = APP_COLOR_NAMES.map((preset) => {
        const lightVars: Record<string, string> = {};
        const darkVars: Record<string, string> = {};
        themePaintRecipe(
          current,
          palette('light', preset),
          palette('dark', preset),
          `--${id}`,
          lightVars,
          darkVars,
          true,
        );
        return { preset, light: lightVars, dark: darkVars };
      });
      return presetPaintCss(variants, config.defaultColorPreset ?? 'oxy', config.defaultMode);
    };
    return {
      vars: { ...vars, ...(scope.fixedMode ? { colorScheme: scope.fixedMode } : undefined) },
      serverCss,
      clientCss,
    };
  }, [config, id, scope, active, surfaceLevel]);
  return {
    vars: recipe.vars,
    sheet:
      scope && active && config
        ? createElement(ServerStyleSheetFactory, {
            id,
            server: recipe.serverCss,
            client: recipe.clientCss,
            liveReady: scope.prepaintReady !== false,
            reuseServer: Boolean(config.persistKey),
          })
        : null,
  };
}
