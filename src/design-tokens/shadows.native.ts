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
 */

export type ShadowRole = 's' | 'm';

export const SHADOW_BOX: Record<ShadowRole, string> = {
  s: '0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.10)',
  m: '0 4px 12px rgb(0 0 0 / 0.08), 0 2px 6px rgb(0 0 0 / 0.12)',
};

const NATIVE_SHADOWS: Record<ShadowRole, ViewStyle> = {
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
