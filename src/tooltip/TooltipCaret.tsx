/**
 * The tooltip caret (`TOOLTIP_CARETS`): a 12×7 triangle filled with the
 * bubble's surface and stroked with its border, drawn as its own path per side
 * rather than one path rotated — a rotated box keeps its unrotated layout
 * footprint and leaves a gap against the bubble.
 *
 * Each path is left OPEN on the edge touching the bubble, so only the two outer
 * edges carry the hairline. The caret overlaps the bubble's 1px border by that
 * one pixel, so the fill covers the border where the two join and they read as
 * one outline.
 *
 * The soft `drop-shadow` is a CSS filter: web only.
 */
import React from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ARROW_DEPTH, ARROW_SIZE } from './constants';

const CARETS = {
  /** The bubble sits ABOVE the trigger; the caret points down. */
  top: { path: 'M0 0 L6 6 L12 0', shadow: 'drop-shadow(0 1.5px 1px rgba(0, 0, 0, 0.05))' },
  /** The bubble sits BELOW the trigger; the caret points up. */
  bottom: { path: 'M0 7 L6 1 L12 7', shadow: 'drop-shadow(0 -1.5px 1px rgba(0, 0, 0, 0.05))' },
} as const;

export function TooltipCaret({
  position,
  fill,
  stroke,
  style,
}: {
  position: 'top' | 'bottom';
  fill: string;
  stroke: string;
  style?: StyleProp<ViewStyle>;
}) {
  const caret = CARETS[position];
  return (
    <Svg
      width={ARROW_SIZE}
      height={ARROW_DEPTH}
      viewBox={`0 0 ${ARROW_SIZE} ${ARROW_DEPTH}`}
      pointerEvents="none"
      style={[
        { overflow: 'visible' },
        Platform.OS === 'web' ? { filter: caret.shadow } : null,
        style,
      ]}>
      <Path d={caret.path} fill={fill} stroke={stroke} strokeWidth={1} />
    </Svg>
  );
}
