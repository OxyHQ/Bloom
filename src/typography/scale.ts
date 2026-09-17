import type { TextStyle } from 'react-native';

/**
 * Bloom's type ramp (`styles/typography.css`), one entry
 * per `<family>-<weight>`: `large-title` 64/80 down to `caption-2`. Each entry
 * sets size, line height, tracking and weight TOGETHER, exactly as the
 * composite `text-*` utilities do — never rebuild a style by stacking a size
 * and a weight.
 *
 * Generated from the stylesheet; values in px. Pair with the `sans`
 * family (Inter) — see `fonts/tokens.ts`.
 */
export type TypeScaleFamily = 'large-title' | 'display-1' | 'display-2' | 'display-3' | 'display-4' | 'title-1' | 'title-2' | 'title-3' | 'headline' | 'body' | 'body-2' | 'caption-1' | 'caption-2';
export type TypeScaleWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TypeScaleVariant = `${TypeScaleFamily}-${TypeScaleWeight}`;

export interface TypeScaleStyle {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: NonNullable<TextStyle['fontWeight']>;
}

export const TYPE_SCALE: Record<TypeScaleVariant, TypeScaleStyle> = {
  'large-title-regular': { fontSize: 64, lineHeight: 80, letterSpacing: 0, fontWeight: '400' },
  'large-title-medium': { fontSize: 64, lineHeight: 80, letterSpacing: 0, fontWeight: '500' },
  'large-title-semibold': { fontSize: 64, lineHeight: 80, letterSpacing: 0, fontWeight: '600' },
  'large-title-bold': { fontSize: 64, lineHeight: 80, letterSpacing: 0, fontWeight: '700' },
  'display-1-regular': { fontSize: 56, lineHeight: 72, letterSpacing: 0, fontWeight: '400' },
  'display-1-medium': { fontSize: 56, lineHeight: 72, letterSpacing: 0, fontWeight: '500' },
  'display-1-semibold': { fontSize: 56, lineHeight: 72, letterSpacing: 0, fontWeight: '600' },
  'display-1-bold': { fontSize: 56, lineHeight: 72, letterSpacing: 0, fontWeight: '700' },
  'display-2-regular': { fontSize: 48, lineHeight: 64, letterSpacing: 0, fontWeight: '400' },
  'display-2-medium': { fontSize: 48, lineHeight: 64, letterSpacing: 0, fontWeight: '500' },
  'display-2-semibold': { fontSize: 48, lineHeight: 64, letterSpacing: 0, fontWeight: '600' },
  'display-2-bold': { fontSize: 48, lineHeight: 64, letterSpacing: 0, fontWeight: '700' },
  'display-3-regular': { fontSize: 40, lineHeight: 54, letterSpacing: 0, fontWeight: '400' },
  'display-3-medium': { fontSize: 40, lineHeight: 54, letterSpacing: 0, fontWeight: '500' },
  'display-3-semibold': { fontSize: 40, lineHeight: 54, letterSpacing: 0, fontWeight: '600' },
  'display-3-bold': { fontSize: 40, lineHeight: 54, letterSpacing: 0, fontWeight: '700' },
  'display-4-regular': { fontSize: 32, lineHeight: 44, letterSpacing: 0, fontWeight: '400' },
  'display-4-medium': { fontSize: 32, lineHeight: 44, letterSpacing: 0, fontWeight: '500' },
  'display-4-semibold': { fontSize: 32, lineHeight: 44, letterSpacing: 0, fontWeight: '600' },
  'display-4-bold': { fontSize: 32, lineHeight: 44, letterSpacing: 0, fontWeight: '700' },
  'title-1-regular': { fontSize: 24, lineHeight: 34, letterSpacing: 0, fontWeight: '400' },
  'title-1-medium': { fontSize: 24, lineHeight: 34, letterSpacing: 0, fontWeight: '500' },
  'title-1-semibold': { fontSize: 24, lineHeight: 34, letterSpacing: 0, fontWeight: '600' },
  'title-1-bold': { fontSize: 24, lineHeight: 34, letterSpacing: 0, fontWeight: '700' },
  'title-2-regular': { fontSize: 20, lineHeight: 26, letterSpacing: 0, fontWeight: '400' },
  'title-2-medium': { fontSize: 20, lineHeight: 26, letterSpacing: 0, fontWeight: '500' },
  'title-2-semibold': { fontSize: 20, lineHeight: 26, letterSpacing: 0, fontWeight: '600' },
  'title-2-bold': { fontSize: 20, lineHeight: 26, letterSpacing: 0, fontWeight: '700' },
  'title-3-regular': { fontSize: 18, lineHeight: 24, letterSpacing: 0, fontWeight: '400' },
  'title-3-medium': { fontSize: 18, lineHeight: 26, letterSpacing: 0, fontWeight: '500' },
  'title-3-semibold': { fontSize: 18, lineHeight: 26, letterSpacing: 0, fontWeight: '600' },
  'title-3-bold': { fontSize: 18, lineHeight: 26, letterSpacing: 0, fontWeight: '700' },
  'headline-regular': { fontSize: 16, lineHeight: 22, letterSpacing: 0, fontWeight: '400' },
  'headline-medium': { fontSize: 16, lineHeight: 22, letterSpacing: 0, fontWeight: '500' },
  'headline-semibold': { fontSize: 16, lineHeight: 22, letterSpacing: 0, fontWeight: '600' },
  'headline-bold': { fontSize: 16, lineHeight: 22, letterSpacing: 0, fontWeight: '700' },
  'body-regular': { fontSize: 14, lineHeight: 20, letterSpacing: 0, fontWeight: '400' },
  'body-medium': { fontSize: 14, lineHeight: 20, letterSpacing: 0, fontWeight: '500' },
  'body-semibold': { fontSize: 14, lineHeight: 20, letterSpacing: 0, fontWeight: '600' },
  'body-bold': { fontSize: 14, lineHeight: 20, letterSpacing: 0, fontWeight: '700' },
  'body-2-regular': { fontSize: 13, lineHeight: 18, letterSpacing: 0, fontWeight: '400' },
  'body-2-medium': { fontSize: 13, lineHeight: 18, letterSpacing: 0, fontWeight: '500' },
  'body-2-semibold': { fontSize: 13, lineHeight: 18, letterSpacing: 0, fontWeight: '600' },
  'body-2-bold': { fontSize: 13, lineHeight: 18, letterSpacing: 0, fontWeight: '700' },
  'caption-1-regular': { fontSize: 12, lineHeight: 16, letterSpacing: 0.15, fontWeight: '400' },
  'caption-1-medium': { fontSize: 12, lineHeight: 16, letterSpacing: 0.15, fontWeight: '500' },
  'caption-1-semibold': { fontSize: 12, lineHeight: 16, letterSpacing: 0.15, fontWeight: '600' },
  'caption-1-bold': { fontSize: 12, lineHeight: 16, letterSpacing: 0.15, fontWeight: '700' },
  'caption-2-regular': { fontSize: 11, lineHeight: 15, letterSpacing: 0.2, fontWeight: '400' },
  'caption-2-medium': { fontSize: 11, lineHeight: 15, letterSpacing: 0.2, fontWeight: '500' },
  'caption-2-semibold': { fontSize: 11, lineHeight: 15, letterSpacing: 0.2, fontWeight: '600' },
  'caption-2-bold': { fontSize: 11, lineHeight: 15, letterSpacing: 0.2, fontWeight: '700' },
};

/** The style object for one step of the ramp. */
export function typeScale(variant: TypeScaleVariant): TypeScaleStyle {
  return TYPE_SCALE[variant];
}
