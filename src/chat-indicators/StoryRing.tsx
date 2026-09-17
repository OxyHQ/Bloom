import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { resolveChatIndicatorPaint } from './shared';
import type { StoryRingProps } from './types';

/**
 * The ring around an avatar that says there is a story to open.
 *
 *   unseen   an accent gradient sweep (accent-400 → accent-600/700)
 *   seen     a quiet neutral hairline
 *   none     no ring, SAME footprint
 *
 * `none` keeping the footprint is the point: a row of avatars where one person
 * has no story must not shift by 8px, and a list that re-lays-out as stories
 * are read is worse than a ring nobody needed.
 *
 * Geometry: the ring is drawn OUTSIDE the avatar, so the component measures
 * `size + 2 * (thickness + gap)`. `children` are centred in a `size` box.
 *
 * A solid ring is a bordered `View`; only the gradient needs `react-native-svg`
 * (which `Avatar` already pulls in). Both platforms draw the same thing.
 *
 * Accessibility: decorative by default — the avatar inside carries the name.
 * With `onPress` it becomes one `button` named by `accessibilityLabel`, which
 * is then required: "Ana's story" is the whole affordance, and the ring itself
 * draws no text to be named by.
 */

// Deterministic ids, matching `avatar/AvatarRing.tsx` — `Math.random()` in a
// gradient id makes two renders of the same tree disagree.
let storyGradientIdCounter = 0;

function StoryRingComponent({
  state = 'unseen',
  size,
  thickness = 2,
  gap = 2,
  colors,
  children,
  badge,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: StoryRingProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatIndicatorPaint(theme), [theme]);
  const gradientId = useMemo(() => `bloom-story-ring-${storyGradientIdCounter++}`, []);

  const outer = size + 2 * (thickness + gap);
  const ringColors = useMemo<string[]>(() => {
    if (colors) return Array.isArray(colors) ? colors : [colors];
    return state === 'unseen' ? [...paint.ringUnseen] : [paint.ringSeen];
  }, [colors, state, paint.ringSeen, paint.ringUnseen]);
  const gradient = ringColors.length >= 2;

  const ring =
    state === 'none' ? null : gradient ? (
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0 }}>
        <Svg width={outer} height={outer} viewBox={`0 0 ${outer} ${outer}`}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              {ringColors.map((color, index) => (
                <Stop
                  key={`${gradientId}-${index}`}
                  offset={index / (ringColors.length - 1)}
                  stopColor={color}
                />
              ))}
            </LinearGradient>
          </Defs>
          <Circle
            cx={outer / 2}
            cy={outer / 2}
            r={(outer - thickness) / 2}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={thickness}
          />
        </Svg>
      </View>
    ) : (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          borderWidth: thickness,
          borderColor: ringColors[0],
        }}
      />
    );

  const body = (
    <View
      style={[
        { width: outer, height: outer, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
      testID={onPress ? undefined : testID}
    >
      {ring}
      <View style={{ width: size, height: size }}>{children}</View>
      {badge ? (
        <View style={{ position: 'absolute', right: 0, bottom: 0 }}>{badge}</View>
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      role="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      style={{ width: outer, height: outer }}
    >
      {body}
    </Pressable>
  );
}

export const StoryRing = memo(StoryRingComponent);
StoryRing.displayName = 'StoryRing';
