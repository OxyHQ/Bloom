import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { RiArrowGoBackLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { IS_WEB, resolveMessageBubblePaint } from './shared';
import type { MessageDirection } from './types';

/**
 * Swipe a bubble towards the centre to reply.
 *
 * NATIVE ONLY, deliberately. On web the same gesture is the browser's own text
 * selection and horizontal scroll, and a pan handler that wins that race takes
 * away the ability to select a message — which is the one thing people do with
 * a transcript in a browser. The web affordance is the context menu
 * (`onContextMenu`), which is already a prop on the bubble.
 *
 * Geometry: the bubble follows the finger up to `TRAVEL`, resisted past it, and
 * the reply glyph fades in once the gesture passes `THRESHOLD`. Release past
 * the threshold fires `onSwipeReply`; release short of it springs back. Both
 * releases animate home, so the row never stays displaced.
 *
 * The pan activates only after `activeOffsetX`, so a vertical flick through the
 * transcript is still a scroll and a tap is still a tap.
 */

const TRAVEL = 64;
const THRESHOLD = 44;
const ACTIVATE_X = 12;

export function SwipeToReply({
  direction,
  onSwipeReply,
  children,
  style,
}: {
  direction: MessageDirection;
  onSwipeReply?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const paint = resolveMessageBubblePaint(theme);
  const reducedMotion = useReducedMotion();
  // Incoming bubbles are dragged right, outgoing left — towards the centre in
  // both cases, so the gesture always means "pull this one out to answer it".
  const sign = direction === 'outgoing' ? -1 : 1;
  const translate = useSharedValue(0);
  const enabled = onSwipeReply !== undefined && !IS_WEB;

  const fire = (): void => onSwipeReply?.();

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX(sign > 0 ? [-9999, -ACTIVATE_X] : [ACTIVATE_X, 9999])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      const raw = event.translationX * sign;
      const clamped = raw <= 0 ? 0 : raw <= TRAVEL ? raw : TRAVEL + (raw - TRAVEL) * 0.2;
      translate.value = clamped * sign;
    })
    .onEnd(() => {
      if (Math.abs(translate.value) >= THRESHOLD) runOnJS(fire)();
      translate.value = reducedMotion ? 0 : withTiming(0, { duration: 180 });
    });

  const rowStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: translate.value }] }),
    [translate],
  );
  const glyphStyle = useAnimatedStyle(
    () => ({
      opacity: Math.min(1, Math.abs(translate.value) / THRESHOLD),
    }),
    [translate],
  );

  if (!enabled) return <View style={style}>{children}</View>;

  return (
    <View style={style}>
      <Animated.View
        aria-hidden
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            ...(sign > 0 ? { left: -28 } : { right: -28 }),
          },
          glyphStyle,
        ]}
      >
        <RiArrowGoBackLine width={18} height={18} fill={paint.muted} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}
