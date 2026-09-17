import React, { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PlayButton } from '../media-controls/PlayButton';
import { Text } from '../typography';
import { useMediaHeaderPaint } from './parts';
import type { StickyMediaTopBarProps } from './types';
import { clamp01 } from '../styles/clamp';

/** Built once, at module scope, so the fade, `style` and the a11y props share one node. */
const FadeView = Animated.createAnimatedComponent(View);

/**
 * The compact bar that takes over when the header scrolls away.
 *
 *   height     64 (default)
 *   fill       the band's top colour (the tinted artwork colour)
 *   content    leading · PlayButton small accent · title (title-2-bold,
 *              one line, the band's text colour) · trailing
 *
 * Two ways to drive it:
 *   - `progress` 0..1 — the fill and content take that opacity directly. Feed
 *     it from `useMediaHeaderScroll` (a `ScrollView`'s `onScroll`, or the
 *     document scroll on web).
 *   - `visible` — fades in and out over 200ms; instant under reduced motion.
 *
 * The bar does not position itself: put it in an absolutely positioned (or, on
 * web, `position: sticky` / `fixed`) container over the page. While it is less
 * than half shown it is hidden from assistive tech and takes no pointer
 * events, so the header under it stays reachable.
 */

function StickyMediaTopBarComponent({
  title,
  playing,
  onPlayPress,
  artworkColor,
  visible = false,
  progress,
  leading,
  trailing,
  height = 64,
  style,
  testID,
}: StickyMediaTopBarProps) {
  const paint = useMediaHeaderPaint(artworkColor);
  const reducedMotion = useReducedMotion();
  const driven = progress !== undefined;
  const target = driven ? clamp01(progress) : visible ? 1 : 0;

  const opacity = useSharedValue(target);
  useEffect(() => {
    opacity.value =
      driven || reducedMotion
        ? target
        : withTiming(target, { duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  }, [driven, reducedMotion, target, opacity]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);

  const shown = target >= 0.5;

  return (
    <FadeView
      pointerEvents={shown ? 'box-none' : 'none'}
      aria-hidden={!shown}
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
      style={[{ height, width: '100%' }, style, fadeStyle]}
      testID={testID}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingLeft: 16,
          paddingRight: 16,
          backgroundColor: paint.bar,
        }}
      >
        {leading}
        <PlayButton
          playing={playing}
          onPress={onPlayPress}
          size="medium"
          subject={title}
          testID={testID ? `${testID}-play` : undefined}
        />
        <Text variant="title-2-bold" numberOfLines={1} style={{ flex: 1, color: paint.onBar }}>
          {title}
        </Text>
        {trailing}
      </View>
    </FadeView>
  );
}

export const StickyMediaTopBar = memo(StickyMediaTopBarComponent);
StickyMediaTopBar.displayName = 'StickyMediaTopBar';
