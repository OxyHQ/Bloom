import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { BloomIconComponent } from '../icons/icon-component';
import { EASE_OUT, ENGAGEMENT_ICON_SIZE, POP_MS } from './constants';
import type { EngagementMotionDone } from './context';

const BOX: ViewStyle = {
  width: ENGAGEMENT_ICON_SIZE,
  height: ENGAGEMENT_ICON_SIZE,
  alignItems: 'center',
  justifyContent: 'center',
};

const RING: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: ENGAGEMENT_ICON_SIZE,
  height: ENGAGEMENT_ICON_SIZE,
  borderRadius: ENGAGEMENT_ICON_SIZE / 2,
  borderWidth: 2,
};

const QUICK = { duration: POP_MS / 10, reduceMotion: ReduceMotion.System };
const SWELL = { duration: (POP_MS * 3) / 10, easing: EASE_OUT, reduceMotion: ReduceMotion.System };
const SETTLE = { duration: (POP_MS * 6) / 10, easing: EASE_OUT, reduceMotion: ReduceMotion.System };
const BURST = { duration: POP_MS, easing: EASE_OUT, reduceMotion: ReduceMotion.System };

/**
 * The glyph as a press turns an action on: it dips, swells past full size and
 * settles while a ring in the same colour bursts outward and fades.
 *
 * Mounted only while it plays, in place of the plain glyph, so its two shared
 * values and two mappers exist on the one action that was pressed and never on
 * an action at rest. Both values are driven imperatively from the effect and
 * both are in their mapper's deps — the two rules `docs/motion.mdx` gives for
 * motion that silently does nothing on web. Reduced motion jumps to the end.
 */
export function EngagementPop({
  icon: Icon,
  color,
  onDone,
}: {
  icon: BloomIconComponent;
  color: string;
  onDone?: EngagementMotionDone;
}) {
  const scale = useSharedValue(1);
  const burst = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(0.7, QUICK),
      withTiming(1.2, SWELL),
      withTiming(1, SETTLE),
    );
    burst.value = withTiming(1, BURST);
  }, [scale, burst]);

  useEffect(() => {
    if (!onDone) return;
    const timer = setTimeout(() => onDone(null), POP_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  const glyphStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale]);
  const ringStyle = useAnimatedStyle(
    () => ({
      opacity: 0.6 * (1 - burst.value),
      transform: [{ scale: 0.4 + 1.2 * burst.value }],
    }),
    [burst],
  );

  return (
    <View style={BOX}>
      <Animated.View style={[RING, { borderColor: color }, ringStyle]} />
      <Animated.View style={glyphStyle}>
        <Icon width={ENGAGEMENT_ICON_SIZE} height={ENGAGEMENT_ICON_SIZE} fill={color} />
      </Animated.View>
    </View>
  );
}
