import type { ForwardedRef } from 'react';
import Svg, { Path } from 'react-native-svg';

import type { CommonSVGProps } from './shared';

/** One glyph as its factory describes it: its path data and how it paints. */
export interface GlyphSpec {
  /** `single` paths fill or stroke as `strokeWidth` says; `multi` paths always fill. */
  kind: 'single' | 'multi';
  paths: readonly string[];
  viewBox: string;
  /** 0 fills; a width (in viewBox units) strokes the path in the fill colour. */
  strokeWidth: number;
  strokeLinecap: 'butt' | 'round' | 'square';
  strokeLinejoin: 'miter' | 'round' | 'bevel';
}

/** The glyph as react-native-svg (and, on the web, inline SVG) draws it. */
export function svgGlyph(
  glyph: GlyphSpec,
  { fill, size, style, gradient, ...rest }: CommonSVGProps,
  ref: ForwardedRef<Svg>,
) {
  const hasStroke = glyph.strokeWidth > 0;
  return (
    <Svg
      fill="none"
      {...rest}
      ref={ref}
      viewBox={glyph.viewBox}
      width={size}
      height={size}
      style={[style]}
    >
      {gradient}
      {glyph.kind === 'single' ? (
        <Path
          fill={hasStroke ? 'none' : fill}
          stroke={hasStroke ? fill : 'none'}
          strokeWidth={glyph.strokeWidth}
          strokeLinecap={glyph.strokeLinecap}
          strokeLinejoin={glyph.strokeLinejoin}
          fillRule="evenodd"
          clipRule="evenodd"
          d={glyph.paths[0]}
        />
      ) : (
        glyph.paths.map((path, i) => (
          <Path key={i} fill={fill} fillRule="evenodd" clipRule="evenodd" d={path} />
        ))
      )}
    </Svg>
  );
}
