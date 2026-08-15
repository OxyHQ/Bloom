import { type ViewStyle } from 'react-native';

/**
 * NATIVE variant of the shadow tokens (see `shadows.ts` for the rationale and
 * the web `box-shadow` path). Metro selects this file on iOS/Android.
 *
 * The `SHADOW_BOX` map is kept identical to the web file so any code that reads
 * the raw string (e.g. to feed a NativeWind `boxShadow` utility on a host that
 * supports it) stays in lockstep; the canonical native styling path is
 * `bloomShadowStyle`, which returns RN elevation + shadow props tuned to match
 * the web `shadow-s` / `shadow-m` visual weight.
 *
 * `glass` is the ONE role that does not take that path, and that is a decision
 * rather than an omission. Its two layers are a near-contact seat and a soft
 * lift with DIFFERENT radii, and RN's single `shadowRadius`/`elevation` pair can
 * express one shadow, not two — collapsing them would have quietly shipped a
 * different material on native than on web. So `glass` returns the same
 * multi-layer `boxShadow` string on both platforms: React Native has supported
 * `boxShadow` (string form, multiple layers, and `inset`) as a first-class
 * `ViewStyle` key since 0.76, and `BoxShadowValue.inset` is in the typings of
 * the version this package develops against — which is also what lets
 * `GlassSurface` paint its rim highlight universally.
 *
 * CONSEQUENCE, stated rather than discovered later: Bloom's `react-native` peer
 * floor is lower than 0.76, so on an older consumer this role degrades to NO
 * shadow rather than to an approximate one. `s` and `m` are unaffected — they
 * keep the elevation path.
 */

export type ShadowRole = 's' | 'm' | 'glass';

/**
 * The `box-shadow` strings, identical to the web file.
 *
 * The GLASS rung is the DROP shadow of a translucent surface that floats over
 * content — a near-contact `0 0 1px` seat plus a soft `0 4px 8px` lift, a weight
 * that lands between `s` and `m` rather than matching either. The lit rim along
 * its top edge is `GLASS_RIM_HIGHLIGHT` in `theme/glass-colors.ts`, because an
 * inset shadow paints below an element's CHILDREN and every glass surface is
 * built out of absolutely-positioned children — see the web file for the full
 * note.
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

const NATIVE_SHADOWS: Record<ShadowRole, ViewStyle> = {
  // The one role that keeps the web string on native — see the note at the top
  // of the file for why an inset highlight has no elevation equivalent.
  glass: { boxShadow: SHADOW_BOX.glass },
  s: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  m: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
};

/**
 * RN shadow/elevation style matching the web `shadow-<role>` weight. Apply to a
 * React Native `View`/surface: `style={bloomShadowStyle('m')}`.
 */
export function bloomShadowStyle(role: ShadowRole): ViewStyle {
  return NATIVE_SHADOWS[role];
}
