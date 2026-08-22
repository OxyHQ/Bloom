/**
 * The Bloom Tailwind / NativeWind preset — the SINGLE opt-in that gives every
 * Oxy app the same semantic design-token utility classes.
 *
 * Consumers add it to their Tailwind config:
 *
 *   // tailwind.config.js  (web Tailwind v3/v4 AND native NativeWind)
 *   const { bloomTailwindPreset } = require('@oxyhq/bloom/tailwind-preset');
 *   module.exports = {
 *     presets: [bloomTailwindPreset],
 *     content: [ ...existing globs ],
 *     theme: { extend: { ...existing app overrides } },
 *   };
 *
 * The preset only EXTENDS `theme` (everything lives under `theme.extend`), so it
 * is purely additive: existing Tailwind built-ins (`p-4`, `rounded-lg`,
 * `text-sm`) and the app's own `var(--x)`-backed color utilities keep working.
 *
 * Cross-platform: NativeWind reads the same `tailwind.config.js`, so the SAME
 * class names (`bg-fill`, `text-text-tertiary`, `p-space-8`, `rounded-radius-20`,
 * `text-body`, `font-body`, `shadow-s`) resolve on web (Tailwind → CSS) and
 * native (NativeWind → react-native-css). Color roles are `var(--x)` references
 * that Bloom's `BloomThemeProvider` populates at runtime on both platforms.
 *
 * Type: returned as a `TailwindPreset` (a structural subset of Tailwind's
 * `Config`) so Bloom does not need to depend on `tailwindcss` types.
 */

import { ACCENT_TEXT_ROLES, BORDER_ROLES, FILL_ROLES, TEXT_ROLES } from './color-roles';
import {
  BORDER_WIDTH,
  FONT_FAMILY_VARS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  type TypeRoleName,
} from './scales';
import { SHADOW_BOX } from './shadows';

/** A Tailwind `fontSize` value: `[size, { lineHeight }]`. */
type FontSizeValue = [string, { lineHeight: string }];
/** A Tailwind `fontFamily` value: `[family, { fontWeight }]`. */
type FontFamilyValue = [string, { fontWeight: string }];

export interface TailwindPresetThemeExtend {
  colors: Record<string, string>;
  backgroundColor: Record<string, string>;
  textColor: Record<string, string>;
  borderColor: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  borderWidth: Record<string, string>;
  fontSize: Record<string, FontSizeValue>;
  fontFamily: Record<string, FontFamilyValue>;
  boxShadow: Record<string, string>;
}

export interface TailwindPreset {
  theme: { extend: TailwindPresetThemeExtend };
}

const px = (n: number): string => `${n}px`;

/** `{ 'space-8': 8 }` → `{ 'space-8': '8px' }`. */
function toPxMap(scale: Record<string, number>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(scale)) {
    // 9999 (radius-max) and large values are still valid px; pill shapes clamp.
    out[key] = px(value);
  }
  return out;
}

/** Build the `fontSize` extension: `text-<role>` → `[size, { lineHeight }]`. */
function buildFontSize(): Record<string, FontSizeValue> {
  const out: Record<string, FontSizeValue> = {};
  for (const name of Object.keys(TYPOGRAPHY) as TypeRoleName[]) {
    const role = TYPOGRAPHY[name];
    out[name] = [px(role.size), { lineHeight: px(role.lineHeight) }];
  }
  return out;
}

/** Build the `fontFamily` extension: `font-<role>` → `[family, { fontWeight }]`. */
function buildFontFamily(): Record<string, FontFamilyValue> {
  const out: Record<string, FontFamilyValue> = {};
  for (const name of Object.keys(TYPOGRAPHY) as TypeRoleName[]) {
    const role = TYPOGRAPHY[name];
    out[name] = [FONT_FAMILY_VARS[role.family], { fontWeight: role.weight }];
  }
  // Also expose the raw Bloom families directly: `font-bloom-sans`, etc.
  out['bloom-sans'] = [FONT_FAMILY_VARS.sans, { fontWeight: '400' }];
  out['bloom-display'] = [FONT_FAMILY_VARS.display, { fontWeight: '700' }];
  out['bloom-mono'] = [FONT_FAMILY_VARS.mono, { fontWeight: '400' }];
  return out;
}

const SPACING_PX = toPxMap(SPACING);
const RADIUS_PX = toPxMap({ ...RADIUS });
const BORDER_WIDTH_PX = toPxMap(BORDER_WIDTH);

/**
 * Color roles are exposed via `colors` (so they reach `bg-*`, `text-*`,
 * `border-*`, `ring-*`, `divide-*`, `fill-*` …) AND via the dedicated
 * `backgroundColor` / `textColor` / `borderColor` maps (so the namespaced roles
 * land on exactly the intended utility families even where the role name would
 * otherwise be ambiguous). All values are `var(--canonical)` references.
 */
const COLOR_ROLES: Record<string, string> = {
  ...FILL_ROLES,
  ...TEXT_ROLES,
  ...ACCENT_TEXT_ROLES,
  ...BORDER_ROLES,
};

/**
 * The Bloom Tailwind/NativeWind preset. Frozen so accidental mutation by a
 * consumer's config merge cannot corrupt the shared vocabulary.
 */
export const bloomTailwindPreset: TailwindPreset = Object.freeze({
  theme: {
    extend: {
      // Generic color bucket — feeds every color utility family.
      colors: { ...COLOR_ROLES },
      // Targeted buckets so the namespaced roles resolve on the right utility.
      backgroundColor: { ...FILL_ROLES },
      textColor: { ...TEXT_ROLES, ...ACCENT_TEXT_ROLES },
      borderColor: { ...BORDER_ROLES },

      spacing: SPACING_PX,
      borderRadius: RADIUS_PX,
      borderWidth: BORDER_WIDTH_PX,

      fontSize: buildFontSize(),
      fontFamily: buildFontFamily(),

      boxShadow: { s: SHADOW_BOX.s, m: SHADOW_BOX.m },
    },
  },
});
