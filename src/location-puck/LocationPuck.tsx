import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { MapAreaCircle } from '../map-marker/MapAreaCircle';
import { useTheme } from '../theme/use-theme';
import {
  LOCATION_PUCK_GEOMETRY,
  LOCATION_PUCK_PULSE_MS,
  LOCATION_PUCK_STALE_OPACITY,
} from './constants';
import { HeadingCone } from './HeadingCone';
import {
  chevronPoints,
  coneHalfAngle,
  describeLocationPuck,
  puckBoxSize,
  puckRotation,
  resolveLocationPuckPaint,
} from './shared';
import type { LocationPuckProps } from './types';

/**
 * WHERE YOU ARE, drawn on a map the app owns.
 *
 * Three layers, all centred on one point, bottom to top:
 *
 *   halo     the accuracy circle — `MapAreaCircle` at the radius the app
 *            computed in pixels. It is not a second implementation of that
 *            circle: an accuracy halo IS the approximate-area circle
 *            `map-marker` already publishes, down to the accent fill at 15%
 *            and the 1.5 edge.
 *   cone     the heading wedge, fading along its length, as wide as the device
 *            is unsure. Absent entirely when the heading is unknown, and when
 *            the chevron is drawn instead.
 *   puck     an 18 dot in the accent inside a 3 ring of that accent's OWN
 *            on-colour, with `map-marker`'s `shadow-m`. In `navigating` it is a
 *            chevron in the same two colours. A stale dot and its ring are the
 *            other pair — see `resolveLocationPuckPaint`.
 *
 * ── IT POSITIONS NOTHING ────────────────────────────────────────────────────
 *
 * The same contract every `map-marker` piece publishes: the component draws one
 * square box and centres every layer in it, and the APP centres that box on the
 * coordinate. There is no absolute positioning here, no offsets, and nothing
 * that assumes a particular map library.
 *
 * ── THE SHADOW IS ON THE DOT, NOT ON THE CHEVRON ────────────────────────────
 *
 * A drop shadow is the shadow of a node's BOX, and the chevron's box is a
 * square containing a wedge — so a shadow on it draws a rectangle floating
 * under a triangle. The chevron is separated from the map by its ring-coloured
 * STROKE instead, which traces the shape it actually has.
 *
 * ── MOTION ──────────────────────────────────────────────────────────────────
 *
 * Only `locating` moves: the dot swells 18% and the halo breathes, once every
 * 1600ms, out of one shared driver. A pulse that never stops is a battery cost
 * and a distraction, so it stops the moment there is a fix — and
 * `useReducedMotion()` (or the `reducedMotion` prop) stops it outright. The
 * driver is written IMPERATIVELY from an effect and only READ in
 * `useAnimatedStyle`, with every shared value in the deps array, which is what
 * `docs/motion.mdx` requires for the animation to tick on web at all.
 */

/** The chevron's outline. Reserved in the viewBox, so no half of it is clipped. */
const CHEVRON_STROKE = 2.5;
/** How far the dot swells at the crest of the pulse. */
const PULSE_SCALE = 0.18;

/** One full-size layer that centres whatever it holds on the box's centre. */
const layerStyle: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  alignItems: 'center',
  justifyContent: 'center',
};

function LocationPuckComponent({
  state = 'located',
  mode = 'following',
  heading,
  headingAccuracy,
  headingUnknown = false,
  accuracyRadius,
  coneLength,
  accessibilityLabel,
  stateLabels,
  reducedMotion,
  style,
  testID,
}: LocationPuckProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveLocationPuckPaint(theme), [theme]);
  const systemReduceMotion = useReducedMotion();
  const animate = state === 'locating' && !(reducedMotion ?? systemReduceMotion);

  const progress = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(progress);
    if (!animate) {
      progress.value = 0;
      return;
    }
    const easing = Easing.inOut(Easing.quad);
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: LOCATION_PUCK_PULSE_MS / 2, easing }),
        withTiming(0, { duration: LOCATION_PUCK_PULSE_MS / 2, easing }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [animate, progress]);

  const haloRest = state === 'stale' ? LOCATION_PUCK_STALE_OPACITY : 1;

  const dotPulse = useAnimatedStyle(
    () => ({ transform: [{ scale: animate ? 1 + progress.value * PULSE_SCALE : 1 }] }),
    [animate, progress],
  );
  const haloBreath = useAnimatedStyle(
    () => ({
      opacity: animate ? haloRest * (0.6 + progress.value * 0.4) : haloRest,
      transform: [{ scale: animate ? 0.94 + progress.value * 0.1 : 1 }],
    }),
    [animate, haloRest, progress],
  );

  const navigating = mode === 'navigating';
  const drawsCone = !navigating && !headingUnknown;
  const rotation = puckRotation(mode, heading);
  const length = coneLength ?? LOCATION_PUCK_GEOMETRY.cone;
  const size = puckBoxSize({ accuracyRadius, coneLength: length, cone: drawsCone });
  const stale = state === 'stale';
  const dotColor = stale ? paint.staleDot : paint.dot;
  const ringColor = stale ? paint.staleRing : paint.ring;
  const puck = LOCATION_PUCK_GEOMETRY.dot + LOCATION_PUCK_GEOMETRY.ring * 2;
  const chevronBox = LOCATION_PUCK_GEOMETRY.chevron;

  return (
    <View
      // A PROP, never a style entry: the puck is drawn over a map whose
      // gestures belong to the app, and a box this size swallowing a pan would
      // freeze the map wherever the user happens to be standing.
      pointerEvents="none"
      role="img"
      accessibilityLabel={
        accessibilityLabel ??
        describeLocationPuck({ state, mode, heading, headingUnknown, labels: stateLabels })
      }
      testID={testID}
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      {accuracyRadius !== undefined ? (
        <View style={layerStyle}>
          <Animated.View style={haloBreath}>
            <MapAreaCircle radius={accuracyRadius} testID={testID ? `${testID}-halo` : undefined} />
          </Animated.View>
        </View>
      ) : null}

      {drawsCone ? (
        <View style={layerStyle}>
          <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
            <HeadingCone
              length={length}
              halfAngle={coneHalfAngle(headingAccuracy)}
              color={paint.cone}
              testID={testID ? `${testID}-cone` : undefined}
            />
          </View>
        </View>
      ) : null}

      <View style={layerStyle}>
        {navigating ? (
          <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
            <Svg
              width={chevronBox}
              height={chevronBox}
              // The stroke straddles the outline, so half of it lies outside
              // the shape. The viewBox gives that half room rather than nudging
              // the points inward by a number nobody can read off the drawing.
              viewBox={`${-CHEVRON_STROKE / 2} ${-CHEVRON_STROKE / 2} ${chevronBox + CHEVRON_STROKE} ${chevronBox + CHEVRON_STROKE}`}
              testID={testID ? `${testID}-chevron` : undefined}
            >
              <Polygon
                points={chevronPoints(chevronBox)}
                fill={dotColor}
                stroke={ringColor}
                strokeWidth={CHEVRON_STROKE}
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        ) : (
          <Animated.View
            testID={testID ? `${testID}-dot` : undefined}
            style={[
              {
                width: puck,
                height: puck,
                borderRadius: puck / 2,
                borderWidth: LOCATION_PUCK_GEOMETRY.ring,
                borderColor: ringColor,
                backgroundColor: dotColor,
                ...bloomShadowStyle('m'),
              },
              dotPulse,
            ]}
          />
        )}
      </View>
    </View>
  );
}

export const LocationPuck = memo(LocationPuckComponent);
LocationPuck.displayName = 'LocationPuck';
