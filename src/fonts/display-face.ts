import type { StyleProp, TextStyle } from 'react-native';

/**
 * BlomusModernus ships two cuts, Regular (400) and Bold (700), and the two
 * platforms address them differently.
 *
 * The web declares both as ONE family with two `@font-face` weights
 * (`font-face-css.web.ts`), and CSS font matching picks the cut from the
 * resolved `font-weight`. Native has no such matching for a font loaded from a
 * file: `expo-font` registers each file under its own family name
 * (`font-assets.native.ts`), and a text naming the Regular family at weight 600
 * or 700 is drawn as a synthesized bold of the Regular outlines. So the cut is
 * chosen here, by naming the family the web's matching would have picked.
 */
export const DISPLAY_FACE_FAMILIES = {
  regular: 'BlomusModernus',
  bold: 'BlomusModernus-Bold',
} as const;

/** React Native's named weights, as numbers (`normal` and `bold` are CSS's). */
const NAMED_WEIGHTS: Readonly<Record<string, number>> = {
  thin: 100,
  ultralight: 200,
  light: 300,
  normal: 400,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
  black: 900,
};

/** A resolved `fontWeight` as a number; unset is CSS's initial `normal` (400). */
export function numericFontWeight(weight: unknown): number {
  if (typeof weight === 'number') return weight;
  if (typeof weight !== 'string') return 400;
  const named = NAMED_WEIGHTS[weight];
  if (named !== undefined) return named;
  const parsed = Number(weight);
  return Number.isFinite(parsed) ? parsed : 400;
}

/**
 * The cut CSS font matching draws for a family with faces at 400 and 700
 * (CSS Fonts 4, §5.2): a desired weight above 500 looks upward first and lands
 * on 700; 500 and below land on 400. So 600 (semibold) draws the Bold cut and
 * 500 (medium) the Regular one.
 */
export function displayFaceFamily(weight: unknown): string {
  return numericFontWeight(weight) > 500
    ? DISPLAY_FACE_FAMILIES.bold
    : DISPLAY_FACE_FAMILIES.regular;
}

/**
 * The Bold cut, requested at its own weight. Chromium synthesizes bold only
 * when the requested weight exceeds the face's by more than 200, Android's
 * text stack (minikin) at a difference of 200 or more, so a `font-black` (900)
 * on the 700 cut would be thickened on Android alone. Asking for the face's own
 * weight draws the outlines the web draws.
 */
const BOLD_CUT: TextStyle = { fontFamily: DISPLAY_FACE_FAMILIES.bold, fontWeight: '700' };

interface Face {
  family?: unknown;
  weight?: unknown;
}

/** The last `fontFamily` and `fontWeight` in a style, later entries winning. */
function readFace(style: unknown, face: Face): void {
  if (!style || typeof style !== 'object') return;
  if (Array.isArray(style)) {
    for (let i = style.length - 1; i >= 0; i--) {
      if (face.family !== undefined && face.weight !== undefined) return;
      readFace(style[i], face);
    }
    return;
  }
  const entry = style as { fontFamily?: unknown; fontWeight?: unknown };
  if (face.family === undefined && entry.fontFamily !== undefined) face.family = entry.fontFamily;
  if (face.weight === undefined && entry.fontWeight !== undefined) face.weight = entry.fontWeight;
}

/**
 * NATIVE ONLY. Draw display text in the cut its weight selects.
 *
 * Reads the style a text node is finally given, after `react-native-css` has
 * resolved its className, so a weight from a variant, a heading's scale, a
 * `font-semibold`/`font-bold` utility (at any breakpoint or state) or an inline
 * `fontWeight` all count, exactly as the web's cascade counts them. Only text
 * whose resolved family is the Regular display family changes; every other
 * style is returned as it came.
 */
export function withDisplayFaceCut(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const face: Face = {};
  readFace(style, face);
  if (face.family !== DISPLAY_FACE_FAMILIES.regular) return style;
  return displayFaceFamily(face.weight) === DISPLAY_FACE_FAMILIES.bold ? [style, BOLD_CUT] : style;
}
