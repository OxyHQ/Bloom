/**
 * `@oxyhq/bloom/design-tokens` — the centralized, semantic design-token
 * vocabulary for the Oxy Unified Design Language.
 *
 * Exposes:
 *   - `bloomTailwindPreset` — the Tailwind/NativeWind preset (web + native) that
 *     adds the semantic utility classes (`bg-fill`, `text-text-tertiary`,
 *     `p-space-8`, `rounded-radius-20`, `text-body`, `font-body`, `shadow-s`).
 *   - `bloomThemeCss` / `bloomThemeBlock` — the Tailwind v4 `@theme` equivalent
 *     for CSS-configured web apps.
 *   - `getPresetVars` / `buildSeedScopeVars` — the resolved token VALUES behind
 *     that alias layer, for a named preset or an arbitrary brand seed.
 *   - The raw token maps (`FILL_ROLES`, `TEXT_ROLES`, `ACCENT_TEXT_ROLES`, `BORDER_ROLES`, `SPACING`,
 *     `RADIUS`, `TYPOGRAPHY`, `SHADOW_BOX`) for direct programmatic use.
 *   - `bloomShadowStyle` — platform-correct shadow style object (web box-shadow /
 *     native elevation) so a consumer writes one call for both platforms.
 *
 * Additive and non-breaking: every export here is NEW. It does not change any
 * existing Bloom token, theme value, or utility class.
 */

export { bloomTailwindPreset } from './tailwind-preset';
export type {
  TailwindPreset,
  TailwindPresetThemeExtend,
} from './tailwind-preset';

export { bloomThemeCss, bloomThemeBlock } from './theme-css';

/* The same tokens as a data structure rather than a stylesheet, for a consumer
 * that is not a browser (`@oxyhq/bloom/design-tokens/tokens.json` is the
 * generated artifact; these rebuild it in memory). Both come from the colour
 * engine, so the JSON and the CSS cannot disagree. */
export {
  bloomDesignTokens,
  renderBloomTokensJson,
  resolvedColorToHex,
} from './tokens-json';
export type {
  BloomDesignTokens,
  DesignToken,
  PresetExtensions,
  PresetGroup,
} from './tokens-json';

/* The resolved counterpart of `bloomThemeCss()`. That emits the alias layer
 * (`--color-x: var(--x)`); these resolve `--x` itself, so a build script can
 * write a static `:root` / `.dark` block and a prerendered page paints the real
 * theme before `BloomThemeProvider` runs — instead of a hand-written palette
 * that drifts from the preset it claims to mirror.
 *
 * `getPresetVars` returns the canonical tokens alone, which is all a document
 * root needs. `buildSeedScopeVars` also returns the `--color-x` aliases, which a
 * SCOPED block (a brand section, a forced-dark region) does need: a `--color-x`
 * alias substitutes where it is declared, so overriding `--x` on a subtree does
 * not move an alias declared at `:root`.
 *
 * Both are pure — no React, no react-native — so they run in a plain node/bun
 * build script as well as in an app. */
export { getPresetVars } from '../theme/preset-vars';
export type { ExplicitAccents } from '../theme/preset-vars';
export { buildSeedScopeVars } from '../theme/color-scope/seed-scope';
export type { SeedScopeOptions } from '../theme/color-scope/seed-scope';

export {
  FILL_ROLES,
  TEXT_ROLES,
  ACCENT_TEXT_ROLES,
  BORDER_ROLES,
} from './color-roles';
export type { FillRole, TextRole, AccentTextRole, BorderRole } from './color-roles';

export {
  SPACING,
  RADIUS,
  BORDER_WIDTH,
  TYPOGRAPHY,
  FONT_FAMILY_VARS,
} from './scales';
export type { TypeRole, TypeRoleName } from './scales';

export { SHADOW_BOX, bloomShadowStyle } from './shadows';
export type { ShadowRole } from './shadows';
