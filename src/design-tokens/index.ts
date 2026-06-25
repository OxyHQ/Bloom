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
 *   - The raw token maps (`FILL_ROLES`, `TEXT_ROLES`, `BORDER_ROLES`, `SPACING`,
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

export {
  FILL_ROLES,
  TEXT_ROLES,
  BORDER_ROLES,
} from './color-roles';
export type { FillRole, TextRole, BorderRole } from './color-roles';

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
