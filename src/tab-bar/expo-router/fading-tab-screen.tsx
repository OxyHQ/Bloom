/**
 * Ported from expo-glass-tabs v0.1.1 — src/fading-tab-slot.tsx
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
 */
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Screen } from 'react-native-screens';
import type { TabsDescriptor, TabsSlotRenderOptions } from 'expo-router/ui';

/** Strong ease-out — entering content should feel instant, then settle. */
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ENTER_DURATION = 220;
/** Never enter from nothing: a whisper of depth, no zoom. */
const ENTER_SCALE = 0.985;

function FadeIn({ focused, children }: PropsWithChildren<{ focused: boolean }>) {
  const progress = useSharedValue(1);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Don't animate the very first screen on app launch.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (focused) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: ENTER_DURATION, easing: EASE_OUT });
    } else {
      // Outgoing screen hides instantly (display: none) — only entries animate.
      progress.value = 0;
    }
  }, [focused, progress]);

  // `progress` must stay in the deps array — see the CRITICAL note in
  // `TabBarBase`: without the worklets babel plugin (web) an omitted array
  // freezes the mapper at the first frame, and every tab would enter invisible.
  const style = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ scale: interpolate(progress.value, [0, 1], [ENTER_SCALE, 1]) }],
    }),
    [progress],
  );

  return <Animated.View style={[styles.fade, style]}>{children}</Animated.View>;
}

/**
 * Drop-in for `TabSlot`'s `renderFn`: identical to expo-router's default render,
 * plus a subtle fade + micro-scale on the screen becoming focused.
 *
 * ```tsx
 * <TabSlot style={{ height: '100%' }} renderFn={renderFadingTabScreen} />
 * ```
 */
export function renderFadingTabScreen(
  descriptor: TabsDescriptor,
  { isFocused, loaded, detachInactiveScreens }: TabsSlotRenderOptions,
) {
  const { lazy = true, unmountOnBlur, freezeOnBlur } = descriptor.options;
  if (unmountOnBlur && !isFocused) {
    return null;
  }
  if (lazy && !loaded && !isFocused) {
    return null;
  }
  return (
    <Screen
      key={descriptor.route.key}
      enabled={detachInactiveScreens}
      activityState={isFocused ? 2 : 0}
      freezeOnBlur={freezeOnBlur}
      style={[styles.screen, isFocused ? styles.focused : styles.unfocused]}
    >
      <FadeIn focused={isFocused}>{descriptor.render()}</FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fade: {
    flex: 1,
  },
  screen: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  focused: {
    zIndex: 1,
    display: 'flex',
    flexShrink: 0,
    flexGrow: 1,
  },
  unfocused: {
    zIndex: -1,
    display: 'none',
    flexShrink: 1,
    flexGrow: 0,
  },
});
