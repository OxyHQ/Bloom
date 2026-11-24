import type { ForwardedRef } from 'react';
import type Svg from 'react-native-svg';

import { type GlyphSpec, svgGlyph } from './glyph-svg';
import { type Props, useCommonSVGProps } from './shared';

export type { GlyphSpec } from './glyph-svg';

/**
 * Draws a Bloom icon. Here (the web, and Node) it is inline SVG, which costs
 * nothing extra in a browser; `glyph.native.tsx` is the native fork.
 */
export function useGlyph(glyph: GlyphSpec, props: Props, ref: ForwardedRef<Svg>) {
  return svgGlyph(glyph, useCommonSVGProps(props), ref);
}
