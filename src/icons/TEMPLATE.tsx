import { forwardRef } from 'react';
import Svg, { Path } from 'react-native-svg';

import { type Props, useCommonSVGProps } from './common';

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
  return forwardRef<Svg, Props>(function IconImpl(props, ref) {
    const { fill, size, style, gradient, ...rest } = useCommonSVGProps(props);

    const hasStroke = strokeWidth > 0;

    return (
      <Svg
        fill="none"
        {...rest}
        ref={ref}
        viewBox={viewBox || '0 0 24 24'}
        width={size}
        height={size}
        style={[style]}>
        {gradient}
        <Path
          fill={hasStroke ? 'none' : fill}
          stroke={hasStroke ? fill : 'none'}
          strokeWidth={strokeWidth}
          strokeLinecap={strokeLinecap}
          strokeLinejoin={strokeLinejoin}
          fillRule="evenodd"
          clipRule="evenodd"
          d={path}
        />
      </Svg>
    );
  });
}

export function createMultiPathSVG({ paths, viewBox }: { paths: string[]; viewBox?: string }) {
  return forwardRef<Svg, Props>(function IconImpl(props, ref) {
    const { fill, size, style, gradient, ...rest } = useCommonSVGProps(props);

    return (
      <Svg
        fill="none"
        {...rest}
        ref={ref}
        viewBox={viewBox || '0 0 24 24'}
        width={size}
        height={size}
        style={[style]}>
        {gradient}
        {paths.map((path, i) => (
          <Path
            key={i}
            fill={fill}
            fillRule="evenodd"
            clipRule="evenodd"
            d={path}
          />
        ))}
      </Svg>
    );
  });
}
