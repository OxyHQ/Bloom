import { getPresetVars } from '../preset-vars';
import type { AppColorName } from '../color-presets';

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
