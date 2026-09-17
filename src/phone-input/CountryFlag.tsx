import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { DEFAULT_FLAG_VIEWBOX, type FlagShape } from './flag-art';
import { COUNTRY_FLAGS } from './flags';
import type { CountryFlagProps } from './types';

/** `w-[18px]` — the flag width, in the trigger and every row. */
export const COUNTRY_FLAG_WIDTH = 18;
/** `rounded-[2px]`. */
export const COUNTRY_FLAG_RADIUS = 2;

function Shape({ shape }: { shape: FlagShape }) {
  const paint = shape[3];
  switch (shape[0]) {
    case 0:
      return <Path d={shape[2]} fill={shape[1]} {...paint} />;
    case 1: {
      const [cx, cy, r] = shape[2];
      return <Circle cx={cx} cy={cy} r={r} fill={shape[1]} {...paint} />;
    }
    case 2: {
      const [cx, cy, rx, ry] = shape[2];
      return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={shape[1]} {...paint} />;
    }
  }
}

/**
 * A country's 3x2 flag (`country-flag-icons`), drawn with react-native-svg so
 * it is the same artwork on native and web: `h-3 w-[18px] shrink-0
 * overflow-hidden rounded-[2px]` by default.
 *
 * Decorative unless given an `accessibilityLabel` — next to a country name or a
 * dial code the flag says nothing the text doesn't.
 */
export function CountryFlag({ iso2, size = COUNTRY_FLAG_WIDTH, accessibilityLabel, style }: CountryFlagProps) {
  const art = COUNTRY_FLAGS[iso2.toUpperCase()];
  if (!art) return null;
  const [viewBox, shapes] = art;
  const height = (size * 2) / 3;
  const named = accessibilityLabel !== undefined && accessibilityLabel !== '';

  return (
    <View
      {...(named
        ? { role: 'img' as const, accessibilityLabel }
        : {
            'aria-hidden': true,
            accessibilityElementsHidden: true,
            importantForAccessibility: 'no-hide-descendants' as const,
          })}
      style={[
        {
          width: size,
          height,
          flexShrink: 0,
          overflow: 'hidden',
          borderRadius: COUNTRY_FLAG_RADIUS,
        },
        style,
      ]}>
      <Svg width={size} height={height} viewBox={viewBox === 0 ? DEFAULT_FLAG_VIEWBOX : viewBox}>
        {shapes.map((shape, index) => (
          <Shape key={index} shape={shape} />
        ))}
      </Svg>
    </View>
  );
}
