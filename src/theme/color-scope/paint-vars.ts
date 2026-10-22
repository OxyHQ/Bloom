import { createElement, useId, useMemo } from 'react';
import { themePaintVars, themePaintRecipe, themePaintCss } from '../paint';
import { usePrepaintThemeConfig } from '../prepaint/context';
import { ServerStyleSheet } from '../../styles/ServerStyleSheet';
import type { ScopeState } from './context';

/** Preserve scoped aliases and explicit local mode across DOM and portal hosts. */
export function useScopePaint(scope: ScopeState | null | undefined, active = true) {
  const config = usePrepaintThemeConfig();
  const id = `bloom-scope-paint-${useId().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  return useMemo(() => {
    if (!scope || !active) return { vars: undefined, sheet: null };
    if (!config) return { vars: scope.vars, sheet: null };
    const palette = (mode: 'light' | 'dark') => {
      const resolved = scope.resolveMode(scope.fixedMode ?? mode);
      return { ...resolved.vars, ...themePaintVars(resolved.theme.colors) };
    };
    const light = palette('light');
    const dark = palette('dark');
    const current = { ...scope.vars, ...themePaintVars(scope.theme.colors) };
    const lightVars: Record<string, string> = {};
    const darkVars: Record<string, string> = {};
    const vars = themePaintRecipe(current, light, dark, `--${id}`, lightVars, darkVars);
    const css = Object.keys(lightVars).length
      ? themePaintCss(':root', lightVars, darkVars, config.defaultMode, scope.fixedMode)
      : '';
    return {
      vars: { ...vars, ...(scope.fixedMode ? { colorScheme: scope.fixedMode } : undefined) },
      sheet: css ? createElement(ServerStyleSheet, { id, css, owned: true }) : null,
    };
  }, [config, id, scope, active]);
}
