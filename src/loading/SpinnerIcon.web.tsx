import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { StyledView } from '../styles/styled-primitives';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';

interface SpinnerIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: ViewStyle;
}

/**
 * iOS-style spinner — 8 rotating blades with an opacity-gradient trail.
 *
 * Web fork of `./SpinnerIcon`. The native variant draws the blades with
 * `react-native-svg` and spins them with `react-native-reanimated`. Neither
 * dependency exists in a plain web bundle (and importing reanimated statically
 * breaks any web bundler — its Babel worklets plugin has no web equivalent), so
 * this fork renders the blades as plain `View`s and spins the container with a
 * CSS `@keyframes` rotation injected once into `<head>`.
 *
 * The geometry mirrors the native SVG exactly. The SVG draws each blade on a
 * 100×100 canvas as a `28×10` rounded rect with its top-left at `(67, 45)` —
 * i.e. a blade whose centre sits `31` units to the right of the canvas centre
 * `(50, 50)` — then rotates copies of it about the centre at
 * `-90…225°` in `45°` steps with opacities `0…0.875`. Here each blade is a
 * `View` centred on the container, then `rotate(θ) translateX(radius)` places
 * its centre at distance `radius` from the container centre at angle `θ`. All
 * lengths scale by `size / 100` so any `size` is pixel-identical to native.
 */
const SVG_CANVAS = 100;
const BLADE_WIDTH = 28;
const BLADE_HEIGHT = 10;
/** Distance from canvas centre to a blade's centre: (67 + 28/2) − 50 = 31. */
const BLADE_RADIUS = 31;
const BLADE_RADIUS_CORNER = BLADE_HEIGHT / 2;

/** Angle (deg) / opacity for each of the 8 blades, matching the native SVG. */
const BLADES: ReadonlyArray<{ angle: number; opacity: number }> = [
  { angle: -90, opacity: 0 },
  { angle: -45, opacity: 0.125 },
  { angle: 0, opacity: 0.25 },
  { angle: 45, opacity: 0.375 },
  { angle: 90, opacity: 0.5 },
  { angle: 135, opacity: 0.625 },
  { angle: 180, opacity: 0.75 },
  { angle: 225, opacity: 0.875 },
];

const SPIN_DURATION_MS = 400;
const KEYFRAMES_ID = 'bloom-spinner-keyframes';
const SPIN_ANIMATION_NAME = 'bloomSpinnerRotate';

/**
 * CSS keyframes powering the spin. Injected once into `<head>` (keyed by id so
 * multiple spinners and re-mounts don't duplicate the rule). Mirrors the
 * native `withRepeat(withTiming(360, { duration: 400, easing: linear }))`.
 */
export const BLOOM_SPINNER_CSS = `
@keyframes ${SPIN_ANIMATION_NAME} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/**
 * `animation` is a real CSS prop on web; react-native-web passes it through to
 * the DOM node. RN's `ViewStyle` has no `animation` key, which is what
 * `WebCssStyle` covers.
 */
const SPIN_STYLE: WebCssStyle = {
  animation: `${SPIN_ANIMATION_NAME} ${SPIN_DURATION_MS}ms linear infinite`,
};

function useKeyframes(): void {
  useEffect(() => {
    adoptStyleSheet(KEYFRAMES_ID, BLOOM_SPINNER_CSS);
  }, []);
}

export const SpinnerIcon: React.FC<SpinnerIconProps> = ({
  color = 'currentColor',
  size = 26,
  className,
  style,
}) => {
  useKeyframes();

  const scale = size / SVG_CANVAS;
  const bladeWidth = BLADE_WIDTH * scale;
  const bladeHeight = BLADE_HEIGHT * scale;
  const bladeRadius = BLADE_RADIUS * scale;
  const bladeCorner = BLADE_RADIUS_CORNER * scale;

  return (
    <StyledView
      className={className}
      style={[styles.container, { width: size, height: size }, SPIN_STYLE, style]}
    >
      {BLADES.map(({ angle, opacity }) => (
        <View
          key={angle}
          style={[
            styles.blade,
            {
              width: bladeWidth,
              height: bladeHeight,
              borderRadius: bladeCorner,
              backgroundColor: color,
              opacity,
              marginLeft: -bladeWidth / 2,
              marginTop: -bladeHeight / 2,
              transform: [{ rotate: `${angle}deg` }, { translateX: bladeRadius }],
            },
          ]}
        />
      ))}
    </StyledView>
  );
};

SpinnerIcon.displayName = 'SpinnerIcon';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blade: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
});
