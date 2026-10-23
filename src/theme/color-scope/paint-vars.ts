import { createElement, useId, useMemo } from 'react';
import { themePaintVars, themePaintRecipe, themePaintCss, presetPaintCss } from '../paint';
import { APP_COLOR_NAMES, type AppColorName } from '../color-presets';
import { usePrepaintThemeConfig } from '../prepaint/context';
import { ServerStyleSheet } from '../../styles/ServerStyleSheet';
import { useServerStyleText } from '../../styles/use-server-style-text';
import type { ScopeState } from './context';

/** Preserve scoped aliases and explicit local mode across DOM and portal hosts. */
export function useScopePaint(scope: ScopeState | null | undefined, active = true) {
  const config = usePrepaintThemeConfig();
  const id = `bloom-scope-paint-${useId().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const recipe = useMemo(() => {
    const empty = { serverCss: () => '', clientCss: () => '' };
    if (!scope || !active) return { vars: undefined, ...empty };
    if (!config) return { vars: scope.vars, ...empty };
    const palette = (mode: 'light' | 'dark', preset?: AppColorName) => {
      const resolved =
        preset && scope.resolvePreset
          ? scope.resolvePreset(preset, scope.fixedMode ?? mode)
          : scope.resolveMode(scope.fixedMode ?? mode);
      return { ...resolved.vars, ...themePaintVars(resolved.theme.colors) };
    };
    const light = palette('light');
    const dark = palette('dark');
    const current = { ...scope.vars, ...themePaintVars(scope.theme.colors) };
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
  }, [config, id, scope, active]);
  const css = useServerStyleText(
    id,
    recipe.serverCss,
    recipe.clientCss,
    scope?.prepaintReady !== false,
    Boolean(config?.persistKey),
  );
  return {
    vars: recipe.vars,
    sheet: css ? createElement(ServerStyleSheet, { id, css, owned: true }) : null,
  };
}
