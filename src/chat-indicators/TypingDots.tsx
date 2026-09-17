import React, { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveChatIndicatorPaint } from './shared';
import type { TypingDotsProps } from './types';

/**
 * Three dots bouncing — someone is writing.
 *
 * Each dot lifts by 55% of its own diameter and fades from 0.45 to 1 over
 * 900ms, staggered 150ms apart, so the group reads as a wave rather than a
 * blink. Under reduced motion the dots stand still — fully opaque, since there
 * is no movement left to explain a faint one: the row still says "typing", it
 * just stops moving.
 *
 * Accessibility: with a `label` the whole thing is one `img` named by it
 * ("Ana is typing…"), and the drawn text is hidden so the name is not read
 * twice. WITHOUT a label it is decorative and hidden outright — three bouncing
 * dots have nothing to announce, and a live region that says nothing is worse
 * than silence.
 */

const PERIOD = 900;
const STAGGER = 150;
const REST_OPACITY = 0.45;

function Dot({
  size,
  color,
  delay,
  animate,
}: {
  size: number;
  color: string;
  delay: number;
  animate: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
    if (!animate) {
      progress.value = 0;
      return;
    }
    const easing = Easing.inOut(Easing.quad);
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: PERIOD / 3, easing }),
          withTiming(0, { duration: PERIOD / 3, easing }),
          withTiming(0, { duration: PERIOD / 3, easing }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [animate, delay, progress]);

  // Standing still at the ANIMATED resting opacity would leave a reduced-motion
  // reader with three very faint dots and no movement to explain them, so the
  // static form is fully opaque.
  const animated = useAnimatedStyle(
    () => ({
      opacity: animate ? REST_OPACITY + progress.value * (1 - REST_OPACITY) : 1,
      transform: [{ translateY: animate ? -progress.value * size * 0.55 : 0 }],
    }),
    [animate, progress, size],
  );

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animated,
      ]}
    />
  );
}

function TypingDotsComponent({
  size = 6,
  color,
  label,
  labelStyle,
  style,
  testID,
}: TypingDotsProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatIndicatorPaint(theme), [theme]);
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;
  const dotColor = color ?? paint.textMuted;
  const named = label != null && label !== '';

  return (
    <View
      accessible={named}
      aria-hidden={named ? undefined : true}
      accessibilityElementsHidden={!named}
      importantForAccessibility={named ? 'yes' : 'no-hide-descendants'}
      role={named ? 'img' : undefined}
      accessibilityLabel={named ? label : undefined}
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: Math.max(4, Math.round(size * 0.9)) },
        style,
      ]}
      testID={testID}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          // The lift needs headroom, or the top of a dot is clipped by a parent
          // with `overflow: hidden`.
          height: Math.ceil(size * 1.55),
          gap: Math.max(2, Math.round(size * 0.5)),
        }}
      >
        {[0, 1, 2].map((index) => (
          <Dot
            key={index}
            size={size}
            color={dotColor}
            delay={index * STAGGER}
            animate={animate}
          />
        ))}
      </View>
      {named ? (
        <Text
          variant="caption-1-regular"
          importantForAccessibility="no"
          accessibilityElementsHidden
          aria-hidden
          numberOfLines={1}
          style={[{ color: paint.textMuted }, labelStyle]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export const TypingDots = memo(TypingDotsComponent);
TypingDots.displayName = 'TypingDots';
