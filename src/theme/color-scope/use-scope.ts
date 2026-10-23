import { useContext, useMemo } from 'react';
import { BloomThemeContext } from '../BloomThemeProvider';
import { buildTheme } from '../build-theme';
import { buildThemeFromSeed } from '../build-theme-from-seed';
import { buildSeedScopeVars } from './seed-scope';
import type { AppColorName } from '../color-presets';
import { ThemeScopeContext, type ScopePalette, type ScopeState } from './context';
import { buildScopeVars } from './style-builder';
import { applyScopeTokens } from './resolve-scope';
import type { BloomColorScopeTokens } from './types';

export function useScope(
  colorPreset?: AppColorName,
  mode?: 'light' | 'dark',
  tokens?: BloomColorScopeTokens,
  seed?: string,
) {
  const parent = useContext(BloomThemeContext);
  const inherited = useContext(ThemeScopeContext);
  const active =
    seed !== undefined || colorPreset !== undefined || mode !== undefined || tokens !== undefined;
  const state = useMemo<ScopeState | null>(() => {
    if (!parent || !active) return inherited;
    const palettes = new Map<string, ScopePalette>();
    const resolvePreset = (preset: AppColorName, resolved: 'light' | 'dark'): ScopePalette => {
      // A fixed local source is independent of the requested document preset.
      // Its backing remains a separate recipe axis; only its own palette is shared.
      const source = seed !== undefined ? `seed:${seed}` : `preset:${colorPreset ?? preset}`;
      const key = `${source}/${resolved}`;
      const cached = palettes.get(key);
      if (cached) return cached;
      const base =
        seed !== undefined
          ? {
              theme: buildThemeFromSeed(seed, resolved),
              vars: buildSeedScopeVars({ seed, mode: resolved }),
            }
          : colorPreset !== undefined || !inherited
            ? {
                theme: buildTheme(colorPreset ?? preset, resolved),
                vars: buildScopeVars(colorPreset ?? preset, resolved),
              }
            : (inherited.resolvePreset?.(preset, resolved) ?? inherited.resolveMode(resolved));
      const palette = applyScopeTokens(base, tokens);
      palettes.set(key, palette);
      return palette;
    };
    const resolveMode = (resolved: 'light' | 'dark') => resolvePreset(parent.colorPreset, resolved);
    return {
      ...resolveMode(mode ?? parent.theme.mode),
      resolveMode,
      resolvePreset,
      fixedMode: mode ?? inherited?.fixedMode,
      rootMode: inherited?.rootMode ?? parent.theme.mode,
      prepaintReady: inherited?.prepaintReady,
    };
  }, [parent, inherited, active, colorPreset, mode, tokens, seed]);
  const context = useMemo(
    () =>
      parent && active && state
        ? {
            ...parent,
            theme: state.theme,
            colorPreset:
              seed !== undefined ? parent.colorPreset : (colorPreset ?? parent.colorPreset),
            mode: mode ?? parent.mode,
          }
        : parent,
    [parent, active, state, colorPreset, mode, seed],
  );
  if (!parent) throw new Error('BloomColorScope must be used within a <BloomThemeProvider>');
  return { context: context!, state, vars: active ? state?.vars : undefined };
}
