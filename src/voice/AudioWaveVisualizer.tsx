import React, { memo } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';

import { resolveBloomColors } from '../appearance';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { DEFAULT_WAVE_BARS, WAVE_METRICS } from './constants';
import type { AudioWaveVisualizerProps } from './types';
import { useWaveLevels } from './use-wave-levels';

/**
 * One bar. Its height is its slice of the eased levels, read on the UI thread:
 * a level change restyles this node and renders nothing in React. `eased` is in
 * the deps because without the worklets Babel plugin (web) a mapper re-runs only
 * when something in its array changes.
 */
const WaveBar = memo(function WaveBar({
  index,
  eased,
  thickness,
  rest,
  span,
  color,
}: {
  index: number;
  eased: SharedValue<readonly number[]>;
  thickness: number;
  rest: number;
  span: number;
  color: string;
}) {
  const animated = useAnimatedStyle(
    () => ({ height: rest + span * (eased.value[index] ?? 0) }),
    [eased, index, rest, span],
  );
  return (
    <Animated.View
      style={[{ width: thickness, borderRadius: thickness / 2, backgroundColor: color }, animated]}
    />
  );
});

/**
 * A row of bars that follow live audio levels, for a voice session. Decorative:
 * hidden from assistive technology, whose view of the session is the status
 * line beside it.
 *
 * `levels` is a plain array or a reanimated shared value (see `AudioLevels`);
 * the bars animate from shared values, so a meter feeding a shared value moves
 * them without rendering React. Under reduced motion the bars stay at rest.
 */
export const AudioWaveVisualizer = memo(function AudioWaveVisualizer({
  levels,
  bars = DEFAULT_WAVE_BARS,
  active = true,
  size = 'md',
  tone = 'neutral',
  className,
  style,
  ref,
  testID,
}: AudioWaveVisualizerProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const count = Math.max(1, Math.floor(bars));
  const eased = useWaveLevels(levels, count, active && !reducedMotion);
  const metrics = WAVE_METRICS[size];
  const color = resolveBloomColors(colors, tone, 'outline').foreground;

  return (
    <StyledView
      ref={ref}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={className}
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: metrics.gap,
          height: metrics.height,
        },
        style,
      ]}
    >
      {Array.from({ length: count }, (_, index) => (
        <WaveBar
          key={index}
          index={index}
          eased={eased}
          thickness={metrics.bar}
          rest={metrics.bar}
          span={metrics.height - metrics.bar}
          color={color}
        />
      ))}
    </StyledView>
  );
});
