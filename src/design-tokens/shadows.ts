import { type ViewStyle } from 'react-native';

/**
 * Elevation / shadow tokens for the Oxy Unified Design Language.
 *
 * Two roles: `shadow-s` (subtle raise — cards, chips) and `shadow-m` (overlays —
 * menus, popovers, dialogs). Consumers write ONE class (`shadow-s` / `shadow-m`)
 * and Bloom owns the platform split:
 *   - Web: the Bloom Tailwind preset registers `boxShadow.s` / `boxShadow.m`
 *     (the `SHADOW_BOX` strings below) → `shadow-s` / `shadow-m` utilities.
 *   - Native: NativeWind cannot translate a multi-layer web `box-shadow` to RN
 *     elevation reliably, so apps that need the shadow on a React Native surface
 *     apply the matching style object from `bloomShadowStyle('s' | 'm')` (this
 *     module is platform-forked: `.native.ts` returns RN `shadow*`/`elevation`).
 *
 * This default file is the WEB / consumer-tsc variant. Metro selects the sibling
 * `shadows.native.ts` on iOS/Android. Web bundlers and a consumer's `tsc` see
 * this file (the `box-shadow` CSS string path), matching Bloom's existing
 * `.native`/`.web` split convention.
 */

export type ShadowRole = 's' | 'm';

/**
 * Web `box-shadow` strings. Subtle, brand-neutral elevation that reads on both
 * light and dark surfaces. Registered by the Tailwind preset as `boxShadow.s/m`.
 */
export const SHADOW_BOX: Record<ShadowRole, string> = {
  s: '0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.10)',
  m: '0 4px 12px rgb(0 0 0 / 0.08), 0 2px 6px rgb(0 0 0 / 0.12)',
};

/**
 * Return the platform-appropriate shadow style for a role.
 *
 * On WEB this returns a `{ boxShadow }` style object (so it can also be applied
 * inline without Tailwind). The `.native.ts` fork returns RN
 * `shadowColor/shadowOffset/shadowOpacity/shadowRadius/elevation`.
 */
export function bloomShadowStyle(role: ShadowRole): ViewStyle {
  return { boxShadow: SHADOW_BOX[role] } as ViewStyle;
}
