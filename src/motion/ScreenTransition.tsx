import React from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import type { ScreenTransitionDirection, ScreenTransitionProps } from './types';

/** CSS-smooth deceleration for the native slide. */
const SLIDE_EASING = Easing.out(Easing.exp);
/** Web cross-fade duration (ms) — "totally vibes based", per the Bluesky original. */
const WEB_FADE_DURATION = 90;

/**
 * Wraps `children` in a Reanimated layout-animated view that slides in
 * directionally on native and (optionally) cross-fades on web. Ported from
 * Bluesky's `ScreenTransition`.
 *
 * On web the slide is intentionally dropped: layout animations there are
 * unreliable, so `enabledWeb` gates a simple fade and the default is no
 * transition at all.
 */
export function ScreenTransition({
  direction,
  enabledWeb,
  style,
  children,
}: ScreenTransitionProps) {
  const isWeb = Platform.OS === 'web';

  const entering = isWeb
    ? enabledWeb
      ? FadeIn.duration(WEB_FADE_DURATION)
      : undefined
    : (direction === 'forward' ? SlideInRight : SlideInLeft).easing(SLIDE_EASING);

  const exiting = isWeb
    ? enabledWeb
      ? FadeOut.duration(WEB_FADE_DURATION)
      : undefined
    : FadeOut.duration(WEB_FADE_DURATION);

  return (
    <Animated.View entering={entering} exiting={exiting} style={style}>
      {children}
    </Animated.View>
  );
}

ScreenTransition.displayName = 'ScreenTransition';
