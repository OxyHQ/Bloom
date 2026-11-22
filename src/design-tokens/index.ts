/**
 * `@oxy.so/bloom/design-tokens` — the centralized, semantic design-token
 * vocabulary for the Oxy Unified Design Language.
 *
 * Exposes:
 *   - `getPresetVars` / `buildSeedScopeVars` — the resolved token values, for a
 *     named preset or an arbitrary brand seed.
 *   - The raw token maps (`FILL_ROLES`, `TEXT_ROLES`, `ACCENT_TEXT_ROLES`, `BORDER_ROLES`, `SPACING`,
 *     `RADIUS`, `TYPOGRAPHY`, `SHADOW_BOX`) for direct programmatic use.
 *   - `bloomShadowStyle` — platform-correct shadow style object (web box-shadow /
 *     native elevation) so a consumer writes one call for both platforms.
 *
 * Additive and non-breaking: every export here is NEW. It does not change any
 * existing Bloom token, theme value, or utility class.
 */

/* The same tokens as a data structure rather than a stylesheet, for a consumer
 * that is not a browser (`@oxy.so/bloom/design-tokens/tokens.json` is the
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

/* The resolved token values (`--x`), so a build script can write a static
 * `:root` / `.dark` block and a prerendered page paints the real theme before
 * `BloomThemeProvider` runs — instead of a hand-written palette that drifts from
 * the preset it claims to mirror.
 *
 * Both are pure — no React, no react-native — so they run in a plain node/bun
 * build script as well as in an app. */
export { getPresetBackground, getPresetVars } from '../theme/preset-vars';
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

export { SURFACE_SHAPES } from './shapes';
