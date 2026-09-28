import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { resolve } from './resolve';
import { assertSize } from './validation';
import type { FillProps } from './types';

/** Draws only a background; does not mask arbitrary React Native children. */
export function Fill({ shape = 'circle', size, color }: FillProps) {
  assertSize(size);
  const outline = resolve(shape);
  if (!outline)
    return (
      <View
        pointerEvents="none"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    );
  return (
    <Svg
      pointerEvents="none"
      accessible={false}
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${outline.viewBox} ${outline.viewBox}`}
    >
      <Path d={outline.d} fill={color} />
    </Svg>
  );
}
