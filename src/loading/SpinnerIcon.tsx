import React, { useMemo } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { StyledView } from '../styles/styled-primitives';
import { SQRT2, STEPS_PER_SEGMENT, VIEWBOX } from './morph/constants';
import { getMorphFrames, morphPathD } from './morph/frames';

interface SpinnerIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: ViewStyle;
}

/**
 * Material 3 morphing loader: a solid shape that turns into the next shape of
 * the loop while the whole thing slowly rotates.
 *
 * `react-native-svg` and `react-native-reanimated` are both REQUIRED peers and
 * both are imported statically. Reanimated in particular must never be loaded at
 * runtime: the worklets Babel plugin performs build-time closure analysis
 * (`__closure` metadata) that fails on a runtime require, which crashes the UI
 * thread with "Tried to synchronously call a non-worklet function `addListener`".
 *
 * The outline is a fixed number of points per frame (`./morph/frames`), so one
 * frame callback only has to blend two frames into a path `d` on the UI thread.
 *
 * Native only — `SpinnerIcon.web.tsx` draws the same loop without reanimated, so
 * this file is never reached by a web bundler.
 */
const MORPH_MS = 650;
const ROTATION_MS = 5000;
/** The shapes spin, so the canvas is the diagonal of the box or the corners clip. */
const CANVAS_RATIO = SQRT2;
const CANVAS_VIEWBOX = VIEWBOX * CANVAS_RATIO;
const CANVAS_MIN = (VIEWBOX - CANVAS_VIEWBOX) / 2;

const AnimatedPath = Animated.createAnimatedComponent(Path);
// The class lands on the node the PARENT lays out — the sized box, which carries
// the caller's `style` — not on the inner `<Svg>`, which is sized from `size`.
const AnimatedStyledView = Animated.createAnimatedComponent(StyledView);

export const SpinnerIcon: React.FC<SpinnerIconProps> = ({
  color = 'currentColor',
  size = 26,
  className,
  style,
}) => {
  const rotation = useSharedValue(0);
  const phase = useSharedValue(0);
  const { flat, frameCount } = useMemo(getMorphFrames, []);

  useFrameCallback((frame) => {
    const dt = frame.timeSincePreviousFrame ?? 16.6667;
    rotation.value = (rotation.value + (dt * 360) / ROTATION_MS) % 360;
    phase.value = (phase.value + (dt * STEPS_PER_SEGMENT) / MORPH_MS) % frameCount;
  });

  // Shared values MUST be in the deps arrays: on web without the worklets Babel
  // plugin, the animated hooks do not auto-track shared-value reads and would
  // freeze at frame 1. Native (plugin present) auto-tracks and ignores the deps.
  const rotateStyle = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
    [rotation],
  );
  const pathProps = useAnimatedProps(
    () => ({ d: morphPathD(flat, frameCount, phase.value) }),
    [phase, flat, frameCount],
  );

  const canvas = size * CANVAS_RATIO;

  return (
    <AnimatedStyledView
      className={className}
      style={[{ width: size, height: size }, styles.box, rotateStyle, style]}
    >
      <Svg
        viewBox={`${CANVAS_MIN} ${CANVAS_MIN} ${CANVAS_VIEWBOX} ${CANVAS_VIEWBOX}`}
        width={canvas}
        height={canvas}
        style={styles.canvas}
      >
        <AnimatedPath animatedProps={pathProps} fill={color} />
      </Svg>
    </AnimatedStyledView>
  );
};

SpinnerIcon.displayName = 'SpinnerIcon';

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  canvas: { position: 'absolute' },
});
