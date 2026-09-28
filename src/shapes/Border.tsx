import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { resolve } from './resolve';
import { assertSize, assertWidth } from './validation';
import { useSvgId } from './use-svg-id';
import { svgColor } from './svg-color';
import type { BorderProps } from './types';

/** A border contained inside the outline. A shape clip removes the outer stroke half. */
export function Border({
  shape = 'circle',
  size,
  width,
  colors,
  gradientDirection = 'diagonal',
}: BorderProps) {
  const id = useSvgId('shape-border');
  assertSize(size);
  assertWidth(width);
  const outline = resolve(shape);
  const list = Array.isArray(colors) ? colors : [colors];
  const gradient = list.length > 1;
  const thickness = Math.min(Math.max(0, width), size / 2);
  if (thickness === 0) return null;
  if (!outline && !gradient)
    return (
      <View
        pointerEvents="none"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: list[0] ?? 'transparent',
        }}
      />
    );
  const span = outline?.viewBox ?? size;
  const stroke = gradient ? `url(#${id}-gradient)` : (list[0] ?? 'transparent');
  return (
    <Svg
      pointerEvents="none"
      accessible={false}
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${span} ${span}`}
    >
      <Defs>
        {outline && (
          <ClipPath id={`${id}-clip`}>
            <Path d={outline.d} />
          </ClipPath>
        )}
        {gradient && (
          <LinearGradient
            id={`${id}-gradient`}
            x1="0"
            y1="0"
            x2={gradientDirection === 'vertical' ? '0' : '1'}
            y2={gradientDirection === 'horizontal' ? '0' : '1'}
          >
            {list.map((color, index) => {
              const stop = svgColor(color);
              return (
                <Stop
                  key={index}
                  offset={index / (list.length - 1)}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity}
                />
              );
            })}
          </LinearGradient>
        )}
      </Defs>
      {outline ? (
        <Path
          d={outline.d}
          fill="none"
          stroke={stroke}
          strokeWidth={(2 * thickness * span) / size}
          clipPath={`url(#${id}-clip)`}
        />
      ) : (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={(size - thickness) / 2}
          fill="none"
          stroke={stroke}
          strokeWidth={thickness}
        />
      )}
    </Svg>
  );
}
