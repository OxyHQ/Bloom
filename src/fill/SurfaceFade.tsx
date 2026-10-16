import React, { memo } from 'react';
import { View, type DimensionValue, type ViewStyle } from 'react-native';
import { useIsRtl } from '../hooks/use-is-rtl';
import { IS_WEB } from '../styles/platform';
import { useSurfaceFill } from '../styles/surface-levels';
import type { WebCssStyle } from '../styles/web-view-style';
import { parseRgb } from '../theme/color-utils';
import type { SurfaceFadeProps } from './types';

/** Gradient angle that runs FROM the content TO the edge, in physical terms. */
const ANGLE = { bottom: 180, top: 0, right: 90, left: 270 } as const;

/**
 * An overlay that fades whatever is under it — a photo, a hero — into the
 * colour of the surface it sits on, so the media ends in the page or panel
 * instead of in a black scrim. One linear gradient: CSS `backgroundImage` on
 * web, `experimental_backgroundImage` on native; no extra dependency.
 *
 * Place it last inside the media's (positioned, clipped) container.
 */
function SurfaceFadeComponent({
  edge = 'bottom',
  size = 0.5,
  color,
  style,
  testID,
}: SurfaceFadeProps) {
  const surface = useSurfaceFill();
  const rtl = useIsRtl();
  const end = color ?? surface;
  // From the same colour at zero alpha, so native interpolates no grey band;
  // CSS `transparent` (premultiplied) when the colour cannot be parsed.
  const rgb = parseRgb(end);
  const start = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)` : 'transparent';
  const physical =
    edge === 'start' ? (rtl ? 'right' : 'left') : edge === 'end' ? (rtl ? 'left' : 'right') : edge;
  const image = `linear-gradient(${ANGLE[physical]}deg, ${start} 0%, ${end} 100%)`;
  const extent: DimensionValue = size <= 1 ? `${size * 100}%` : size;
  const vertical = physical === 'top' || physical === 'bottom';
  const placement: ViewStyle = vertical
    ? { left: 0, right: 0, [physical]: 0, height: extent }
    : { top: 0, bottom: 0, [physical]: 0, width: extent };
  const paint: WebCssStyle = IS_WEB
    ? { backgroundImage: image }
    : { experimental_backgroundImage: image };
  return (
    <View
      testID={testID}
      pointerEvents="none"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ position: 'absolute' }, placement, paint, style]}
    />
  );
}

export const SurfaceFade = memo(SurfaceFadeComponent);
SurfaceFade.displayName = 'SurfaceFade';
