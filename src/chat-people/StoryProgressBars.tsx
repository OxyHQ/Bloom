import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import {
  STORY_DURATION_MS,
  STORY_VIEWER_LABELS,
  resolveChatPeoplePaint,
  storyProgressFill,
} from './shared';
import type { StoryProgressBarsProps } from './types';

/**
 * `StoryProgressBars`: the segmented strip at the top of a story.
 *
 * One bar per story, equal width. Everything BEFORE the current one is full,
 * everything after it is empty, and only the current one moves — which is
 * `storyProgressFill(bar, index, progress)`, a pure function of three numbers,
 * so the maths is tested without rendering anything. Writing it per-segment
 * inside the map is how a viewer ends up drawing an empty bar for a story the
 * user has already watched: a segment knows its own position and nothing about
 * the sequence.
 *
 * TWO MODES, and the difference is who owns the clock:
 *   - `progress` given: CONTROLLED. The strip draws what it is told and runs
 *     no timer, for an app already driving a video's playback.
 *   - `progress` omitted: the strip animates 0→1 over `duration` and calls
 *     `onComplete`. `paused` freezes it where it is.
 *
 * REDUCED MOTION stops the ANIMATION, not the story. The bar jumps to full and
 * the `onComplete` timer still runs, so a story set still advances — a viewer
 * that stops advancing under reduced motion strands the user on story one with
 * no indication that anything is meant to happen.
 */

const HEIGHT = 3;

function Bar({
  fill,
  animate,
  duration,
  paused,
  color,
  trackColor,
  height,
  reduced,
  restartKey,
  testID,
}: {
  fill: number;
  animate: boolean;
  duration: number;
  paused: boolean;
  color: string;
  trackColor: string;
  height: number;
  reduced: boolean;
  restartKey: number;
  testID?: string;
}) {
  const value = useSharedValue(animate ? 0 : fill);

  // Rewind FIRST, on the story changing and nothing else. Without it, stepping
  // BACKWARDS hands the animating effect a bar that is already at 1 — remaining
  // duration zero — so the previous story completes the instant it is reopened.
  useEffect(() => {
    if (animate) value.value = 0;
  }, [restartKey, animate, value]);

  useEffect(() => {
    if (!animate) {
      value.value = fill;
      return;
    }
    if (reduced) {
      value.value = 1;
      return;
    }
    if (paused) {
      cancelAnimation(value);
      return;
    }
    const remaining = Math.max(0, duration * (1 - value.value));
    value.value = withTiming(1, { duration: remaining, easing: Easing.linear });
  }, [animate, duration, fill, paused, reduced, restartKey, value]);

  const style = useAnimatedStyle(
    () => ({ width: `${Math.min(100, Math.max(0, value.value * 100))}%` }),
    [value],
  );

  return (
    <View
      style={{
        flex: 1,
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}
      testID={testID}
    >
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: color }, style]} />
    </View>
  );
}

function StoryProgressBarsComponent({
  count,
  index,
  progress,
  duration = STORY_DURATION_MS,
  paused = false,
  onComplete,
  height = HEIGHT,
  gap = 4,
  color,
  trackColor,
  accessibilityLabel,
  style,
  testID,
}: StoryProgressBarsProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatPeoplePaint(theme), [theme]);
  const reduced = useReducedMotion();
  const controlled = progress !== undefined;
  const bars = Math.max(0, Math.floor(count));
  const [restartKey, setRestartKey] = useState(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  // Restarting is keyed on the STORY, not on a render: a parent re-rendering
  // for any reason must not put the current bar back to zero.
  useEffect(() => {
    setRestartKey((n) => n + 1);
  }, [index, count]);

  useEffect(() => {
    if (controlled || paused || bars === 0) return undefined;
    const timer = setTimeout(() => completeRef.current?.(), duration);
    return () => clearTimeout(timer);
  }, [controlled, paused, duration, bars, restartKey]);

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? STORY_VIEWER_LABELS.progress(index, bars)}
      style={[{ flexDirection: 'row', gap }, style]}
      testID={testID}
    >
      {Array.from({ length: bars }, (_, bar) => {
        const fill = storyProgressFill(bar, index, progress ?? 0);
        return (
          <Bar
            key={bar}
            fill={fill}
            animate={!controlled && bar === index}
            duration={duration}
            paused={paused}
            reduced={reduced}
            restartKey={restartKey}
            color={color ?? paint.onStage}
            trackColor={trackColor ?? paint.stageTrack}
            height={height}
            testID={testID ? `${testID}-bar-${bar}` : undefined}
          />
        );
      })}
    </View>
  );
}

export const StoryProgressBars = memo(StoryProgressBarsComponent);
StoryProgressBars.displayName = 'StoryProgressBars';
