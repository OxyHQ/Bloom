import { getResolvedTokens } from '../token-registry';
import type { AppColorName } from '../color-presets';
import type { ExplicitAccents } from '../preset-vars';
import { withScopeAliases } from './seed-scope';

/**
 * Build the CSS custom-property map for a preset, ready to be applied to a
 * subtree. Every canonical `--x` token is resolved to an sRGB `rgb(...)` string
 * via `getResolvedTokens` — the single token pipeline shared by web and native.
 *
 * The returned map also includes Tailwind v4 `--color-x` aliases generated from
 * those same canonical values. Scoped aliases are required on web because
 * inherited custom properties like `--color-primary: var(--primary)` compute at
 * the document root and would otherwise keep pointing at the app-wide preset.
 */
export function buildScopeVars(
  colorPreset: AppColorName,
  mode: 'light' | 'dark',
  accents?: ExplicitAccents,
): Record<string, string> {
  return withScopeAliases(getResolvedTokens(colorPreset, mode, accents));
}
