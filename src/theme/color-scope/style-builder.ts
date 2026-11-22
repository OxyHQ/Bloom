import { getResolvedTokens } from '../token-registry';
import type { AppColorName } from '../color-presets';
import type { ExplicitAccents } from '../preset-vars';

/**
 * Build the CSS custom-property map for a preset, ready to be applied to a
 * subtree. Every canonical `--x` token is resolved to an sRGB `rgb(...)` string
 * via `getResolvedTokens` — the single token pipeline shared by web and native.

 */
export function buildScopeVars(
  colorPreset: AppColorName,
  mode: 'light' | 'dark',
  accents?: ExplicitAccents,
): Record<string, string> {
  return getResolvedTokens(colorPreset, mode, accents);
}
