/**
 * Bloom colour engine — public surface.
 *
 * A dependency-free tonal colour system (HCT + tonal palettes + dynamic roles)
 * reimplemented in Bloom from the Material Color Utilities algorithm (Apache-2.0)
 * and verified byte-for-byte against it. Give it ANY seed colour and it derives a
 * full, self-consistent, WCAG-legible set of roles for light and dark at any
 * contrast level — the same dynamic theming MaterialKolor does, but ours.
 *
 * This barrel is the engine's PUBLIC surface — `@oxyhq/bloom/theme` publishes it
 * whole, as the `ColorEngine` namespace. Keep it to what a consumer deriving a
 * theme actually calls; the ports underneath (`Hct`, `TonalPalette`,
 * `DynamicScheme`, `ColorRole`, `Roles`, `buildScheme`, `quantizeWu`, `score`)
 * are implementation and are imported from their own modules by the handful of
 * files inside Bloom that need them — adding one back here publishes it.
 */
export type { SchemeVariant, AccentSources } from './scheme-variants';
export type { RoleName } from './color-roles';
export { quantizeImage, seedsFromImagePixels, seedHexFromImagePixels } from './seed-from-image';
export {
  argbFromRgb,
  redFromArgb,
  greenFromArgb,
  blueFromArgb,
  argbFromHex,
  hexFromArgb,
} from './color-utils';
export { generateRoleColors } from './generate-role-colors';
export type { RoleColors, GenerateOptions } from './generate-role-colors';
