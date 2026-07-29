import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Z_INDEX } from '../styles/z-index';
import { SQUIRCLE_PATH } from './squircle-path';
import type { AvatarRingGradientDirection, AvatarShape } from './types';

// Module counter for unique gradient element ids — mirrors the `clipIdCounter`
// pattern in `Avatar.tsx`. Deterministic (no `Math.random()`) so ids are stable
// per mounted instance.
let ringGradientIdCounter = 0;

/**
 * Size of the box the ring occupies. With `gap === 0` the ring overlays the
 * avatar edge and the box equals the avatar size (footprint unchanged). With
 * `gap > 0` the ring sits OUTSIDE the avatar, so the box grows and the avatar is
 * centered inside it. Exported so `Avatar` reserves the same footprint with a
 * single source for the geometry formula.
 */
export function getRingOuterSize(size: number, width: number, gap: number): number {
  return gap > 0 ? size + 2 * (width + gap) : size;
}

interface AvatarRingProps {
  /** Avatar diameter in px (the inner content size, before any gap). */
  size: number;
  /** Matches the avatar shape. */
  shape: AvatarShape;
  /** Solid ring: one color. Gradient ring: 2+ colors. */
  colors: string | string[];
  /** Ring stroke width in px. */
  width: number;
  /** Gap between the avatar edge and the ring (0 = overlay the edge). */
  gap: number;
  /** Gradient sweep direction for multi-color rings. */
  gradientDirection: AvatarRingGradientDirection;
}

function gradientCoords(direction: AvatarRingGradientDirection) {
  switch (direction) {
    case 'horizontal':
      return { x1: '0', y1: '0', x2: '1', y2: '0' };
    case 'vertical':
      return { x1: '0', y1: '0', x2: '0', y2: '1' };
    case 'diagonal':
    default:
      return { x1: '0', y1: '0', x2: '1', y2: '1' };
  }
}

/**
 * Single ring primitive shared by the `live` indicator and the public `ring`
 * prop. Renders either a solid or a gradient ring, for both `circle` and
 * `squircle` avatars.
 *
 * - Solid circle → a plain bordered `<View>` (no `react-native-svg` needed).
 * - Solid squircle → an SVG `<Path>` stroking the squircle outline.
 * - Gradient (either shape) → an SVG `<LinearGradient>` stroke.
 *
 * Internal to the avatar family — not exported from the package.
 */
const AvatarRingComponent: React.FC<AvatarRingProps> = ({
  size,
  shape,
  colors,
  width,
  gap,
  gradientDirection,
}) => {
  const gradientId = useMemo(() => `bloom-ring-grad${ringGradientIdCounter++}`, []);

  const colorList = Array.isArray(colors) ? colors : [colors];
  const wantsGradient = colorList.length >= 2;
  const solidColor = colorList[0] ?? '#000000';

  const outer = getRingOuterSize(size, width, gap);
  // The ring's visible band is always the outermost `width` px inside the outer
  // box; drawn as a plain border it is a full circle → radius `outer / 2`.
  const ringRadius = outer / 2;

  // SVG is only needed for gradients (both shapes) and for the squircle
  // outline. A solid circle ring is a plain bordered View — cheaper, and it
  // keeps the common case off the SVG renderer entirely.
  const needsSvg = wantsGradient || shape === 'squircle';

  if (!needsSvg) {
    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: outer,
          height: outer,
          borderRadius: ringRadius,
          borderColor: solidColor,
          borderWidth: width,
          zIndex: gap > 0 ? Z_INDEX.base : Z_INDEX.raised,
        }}
      />
    );
  }

  const stroke = wantsGradient ? `url(#${gradientId})` : solidColor;
  const coords = gradientCoords(gradientDirection);
  const gradientDefs = wantsGradient ? (
    <Defs>
      <LinearGradient id={gradientId} x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2}>
        {colorList.map((color, index) => (
          <Stop
            key={`${gradientId}-${index}`}
            offset={colorList.length === 1 ? 0 : index / (colorList.length - 1)}
            stopColor={color}
          />
        ))}
      </LinearGradient>
    </Defs>
  ) : null;

  // The overlay fills its parent; the SVG within is sized to the ring box so a
  // `gap === 0` ring overlays the avatar edge exactly and a `gap > 0` ring sits
  // on the reserved outer perimeter.
  const overlayStyle = [
    StyleSheet.absoluteFill,
    { zIndex: gap > 0 ? Z_INDEX.base : Z_INDEX.raised },
  ];

  if (shape === 'squircle') {
    // The path lives in 0–1 space, so the stroke width is expressed in the same
    // units; center-stroking it and letting the viewport clip the outer half
    // yields a ~`width`-px band on the inner edge of the outer box.
    return (
      <View pointerEvents="none" style={overlayStyle}>
        <Svg width={outer} height={outer} viewBox="0 0 1 1">
          {gradientDefs}
          <Path d={SQUIRCLE_PATH} fill="none" stroke={stroke} strokeWidth={(width / outer) * 2} />
        </Svg>
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={overlayStyle}>
      <Svg width={outer} height={outer} viewBox={`0 0 ${outer} ${outer}`}>
        {gradientDefs}
        <Circle
          cx={outer / 2}
          cy={outer / 2}
          r={(outer - width) / 2}
          fill="none"
          stroke={stroke}
          strokeWidth={width}
        />
      </Svg>
    </View>
  );
};

export const AvatarRing = memo(AvatarRingComponent);
AvatarRing.displayName = 'AvatarRing';
