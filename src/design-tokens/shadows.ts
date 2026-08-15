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

export type ShadowRole = 's' | 'm' | 'glass';

/**
 * The `box-shadow` strings. Subtle, brand-neutral elevation that reads on both
 * light and dark surfaces. Registered by the Tailwind preset as
 * `boxShadow.s/m/glass`.
 *
 * The GLASS rung is the drop shadow of a translucent surface that floats over
 * content. It is a third rung rather than a reuse of `s` or `m` because it is a
 * different weight from either: a near-contact `0 0 1px` seat plus a soft
 * `0 4px 8px` lift, which lands between them.
 *
 * It carries the DROP half only. The lit rim along the top edge — the inset
 * highlight that separates a pane of glass from a tinted card — is
 * `GLASS_RIM_HIGHLIGHT` in `theme/glass-colors.ts` instead, and the split is
 * forced rather than tidy: an inset shadow paints above the element's own
 * background but BELOW its children, so on a surface whose layers are
 * absolutely-positioned children (every glass surface, by construction) an inset
 * on the outer box is covered by the first layer that lands on it. It has to be
 * the TOP layer of the stack, which is a place a caller-applied shadow role
 * cannot reach.
 *
 * White and black at an alpha are not palette colours and are not derived from
 * one — the two existing rungs hardcode the same black, for the same reason: a
 * shadow is a light effect, not a themed surface.
 */
export const SHADOW_BOX: Record<ShadowRole, string> = {
  s: '0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.10)',
  m: '0 4px 12px rgb(0 0 0 / 0.08), 0 2px 6px rgb(0 0 0 / 0.12)',
  glass: '0 0 1px 0 rgb(0 0 0 / 0.12), 0 4px 8px 0 rgb(0 0 0 / 0.12)',
};

/**
 * Return the platform-appropriate shadow style for a role.
 *
 * On WEB this returns a `{ boxShadow }` style object (so it can also be applied
 * inline without Tailwind). The `.native.ts` fork returns RN
 * `shadowColor/shadowOffset/shadowOpacity/shadowRadius/elevation`.
 *
 * No widening needed: `boxShadow` is a first-class `ViewStyle` key on RN >= 0.76
 * and takes a CSS string, so this is not one of the web-only properties
 * `styles/web-view-style.ts` exists for.
 */
export function bloomShadowStyle(role: ShadowRole): ViewStyle {
  return { boxShadow: SHADOW_BOX[role] };
}
