import type { TextStyle } from 'react-native';

import { TYPE_SCALE, type TypeScaleVariant } from '../typography/scale';

/** Inter's `hhea` ascender / descender (1984 / 494 over 2048 units per em). */
const INTER_ASCENT = 1984 / 2048;
const INTER_DESCENT = 494 / 2048;

/**
 * Where a Bloom `Text` box has to start so its first baseline lands where an
 * SVG `<text y dy>` puts it. Chart cards draw labels as `Text` over the SVG
 * (so they take the sans font on both platforms), but recharts positions
 * text by baseline: the line box adds half the leading above Inter's ascent.
 */
export function textTopForBaseline(baseline: number, type: Pick<TextStyle, 'fontSize' | 'lineHeight'>): number {
  const fontSize = type.fontSize ?? 14;
  const lineHeight = type.lineHeight ?? fontSize * 1.5;
  const content = fontSize * (INTER_ASCENT + INTER_DESCENT);
  return baseline - ((lineHeight - content) / 2 + fontSize * INTER_ASCENT);
}

/** A ramp step as an SVG `fontSize` would draw it: no tracking (SVG text sets none). */
export function svgTextType(variant: TypeScaleVariant): TextStyle {
  return { ...TYPE_SCALE[variant], letterSpacing: 0 };
}
