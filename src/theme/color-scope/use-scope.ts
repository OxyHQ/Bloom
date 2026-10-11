import { useContext, useMemo } from 'react';
import { BloomThemeContext } from '../BloomThemeProvider';
import { buildTheme } from '../build-theme';
import type { AppColorName } from '../color-presets';
import { ThemeScopeContext, type ScopePalette, type ScopeState } from './context';
import { buildScopeVars } from './style-builder';
import { applyScopeTokens } from './resolve-scope';
import type { BloomColorScopeTokens } from './types';

export function useScope(
  colorPreset?: AppColorName,
  mode?: 'light' | 'dark',
  tokens?: BloomColorScopeTokens,
) {
  const parent = useContext(BloomThemeContext);
  const inherited = useContext(ThemeScopeContext);
  const active = colorPreset !== undefined || mode !== undefined || tokens !== undefined;
  const state = useMemo<ScopeState | null>(() => {
    if (!parent || !active) return inherited;
    const resolveMode = (resolved: 'light' | 'dark'): ScopePalette => {
      const base =
        colorPreset !== undefined || !inherited
          ? {
              theme: buildTheme(colorPreset ?? parent.colorPreset, resolved),
              vars: buildScopeVars(colorPreset ?? parent.colorPreset, resolved),
            }
          : inherited.resolveMode(resolved);
      return applyScopeTokens(base, tokens);
    };
    return { ...resolveMode(mode ?? parent.theme.mode), resolveMode };
  }, [parent, inherited, active, colorPreset, mode, tokens]);
  const context = useMemo(
    () =>
      parent && active && state
        ? {
            ...parent,
            theme: state.theme,
            colorPreset: colorPreset ?? parent.colorPreset,
            mode: mode ?? parent.mode,
          }
        : parent,
    [parent, active, state, colorPreset, mode],
  );
  if (!parent) throw new Error('BloomColorScope must be used within a <BloomThemeProvider>');
  return { context: context!, state, vars: active ? state?.vars : undefined };
}
