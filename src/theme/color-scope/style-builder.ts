import { Platform, type StyleProp, type ViewStyle } from 'react-native';

import { getPresetVars } from '../preset-vars';
import type { AppColorName } from '../color-presets';
import { lazyRequire } from '../../utils/lazy-require';

interface NativeWindVarsModule {
  vars: (record: Record<string, string>) => StyleProp<ViewStyle>;
}

const getNativeWindVars = lazyRequire<NativeWindVarsModule>('nativewind');

/**
 * Build the CSS custom-property map for a preset, ready to be applied to a
 * subtree. Always includes the resolved `--color-*` vars so Tailwind v4
 * `@theme` utilities (e.g. `bg-background`) honour the scope.
 */
export function buildScopeVars(
  colorPreset: AppColorName,
  mode: 'light' | 'dark',
): Record<string, string> {
  return getPresetVars(colorPreset, mode, { includeResolvedColorVars: true });
}

/**
 * Build a native style object carrying every CSS var of the preset, using
 * NativeWind's `vars()` when available. Returns `undefined` on web (where the
 * provider writes vars to `documentElement` instead) or when `nativewind` is
 * not installed.
 */
export function buildNativePresetStyle(
  colorPreset: AppColorName,
  mode: 'light' | 'dark',
): StyleProp<ViewStyle> {
  if (Platform.OS === 'web') return undefined;
  const module = getNativeWindVars();
  if (!module || typeof module.vars !== 'function') return undefined;
  return module.vars(buildScopeVars(colorPreset, mode));
}
