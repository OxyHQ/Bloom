import { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PageHeader } from '../page-header';
import { PlayButton } from '../media-controls/PlayButton';
import { Text } from '../typography';
import { useMediaHeaderPaint } from './parts';
import type { StickyMediaTopBarProps } from './types';
import { clamp01 } from '../styles/clamp';
import { IS_WEB } from '../styles/platform';
import { useSurfacePresence } from '../surface/use-surface-presence';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

/** Built once, at module scope, so the fade, `style` and the a11y props share one node. */
const FadeView = Animated.createAnimatedComponent(View);

/**
 * The compact bar that takes over when the header scrolls away.
 *
 *   height     PageHeader intrinsic height (explicit height override supported)
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
  height,
  style,
  testID,
}: StickyMediaTopBarProps) {
  const paint = useMediaHeaderPaint(artworkColor);
  const reducedMotion = usePrefersReducedMotion();
  const driven = progress !== undefined;
  const target = driven ? clamp01(progress) : visible ? 1 : 0;

  const opacity = useSharedValue(target);
  useEffect(() => {
    opacity.value =
      driven || reducedMotion
        ? target
        : withTiming(target, { duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  }, [driven, reducedMotion, target, opacity]);
  // The bar holds a material play button, so on the web it never fades
  // itself (that would make it the button's backdrop root): its fill and
  // content fade through its presence. Native fades the bar.
  const fadeStyle = useAnimatedStyle(() => (IS_WEB ? {} : { opacity: opacity.value }), [opacity]);
  const presence = useSurfacePresence(target, {
    duration: driven || reducedMotion ? 0 : 200,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  });

  const shown = target >= 0.5;

  return (
    <FadeView
      pointerEvents={shown ? 'box-none' : 'none'}
      aria-hidden={!shown}
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
      style={[{ height, width: '100%' }, style, fadeStyle, IS_WEB ? presence.style : null]}
      ref={presence.ref}
      testID={testID}
    >
      <PageHeader
        onBack={null}
        sticky={false}
        safeArea={false}
        scrim="always"
        scrimColor={paint.bar}
        title={
          <Text variant="title-2-bold" numberOfLines={1} style={{ color: paint.onBar }}>
            {title}
          </Text>
        }
        leading={
          <>
            {leading}
            <PlayButton
              playing={playing}
              onPress={onPlayPress}
              size="md"
              subject={title}
              testID={testID ? `${testID}-play` : undefined}
            />
          </>
        }
        actions={trailing}
        style={height === undefined ? undefined : { flex: 1 }}
        testID={testID ? `${testID}-header` : undefined}
      />
    </FadeView>
  );
}

export const StickyMediaTopBar = memo(StickyMediaTopBarComponent);
StickyMediaTopBar.displayName = 'StickyMediaTopBar';
