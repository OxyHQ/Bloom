import { forwardRef } from 'react';
import type Svg from 'react-native-svg';

import { type GlyphSpec, useGlyph } from './glyph';
import type { Props } from './shared';

/**
 * The icon component of one glyph. What draws it is the platform's: inline SVG
 * on the web, one native view per icon on native when the app's binary has it
 * (`glyph.native.tsx`), react-native-svg otherwise.
 */
function iconComponent(glyph: GlyphSpec) {
  return forwardRef<Svg, Props>(function IconImpl(props, ref) {
    return useGlyph(glyph, props, ref);
  });
}

export function createSinglePathSVG({
  path,
  viewBox,
  strokeWidth = 0,
  strokeLinecap = 'butt',
  strokeLinejoin = 'miter',
}: {
  path: string;
  viewBox?: string;
  strokeWidth?: number;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
}) {
  return iconComponent({
    kind: 'single',
    paths: [path],
    viewBox: viewBox || '0 0 24 24',
    strokeWidth,
    strokeLinecap,
    strokeLinejoin,
  });
}

export function createMultiPathSVG({ paths, viewBox }: { paths: string[]; viewBox?: string }) {
  return iconComponent({
    kind: 'multi',
    paths,
    viewBox: viewBox || '0 0 24 24',
    strokeWidth: 0,
    strokeLinecap: 'butt',
    strokeLinejoin: 'miter',
  });
}
