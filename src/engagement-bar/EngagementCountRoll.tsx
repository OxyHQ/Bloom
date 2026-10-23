import { useEffect } from 'react';
import { Text, View, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { EASE_OUT, ROLL_DISTANCE, ROLL_MS } from './constants';
import type { EngagementMotionDone } from './context';

/**
 * The outgoing count sits over the incoming one, which alone sizes the box. Its
 * own width stays intrinsic (no end inset), so a longer old value overflows
 * instead of wrapping.
 */
const OUTGOING: ViewStyle = { position: 'absolute', top: 0, insetInlineStart: 0 };

const ROLL = { duration: ROLL_MS, easing: EASE_OUT, reduceMotion: ReduceMotion.System };

/**
 * A count rolling to its new value: a rising count enters from below while the
 * old one leaves upward, a falling one the other way.
 *
 * Mounted only for the roll, in place of the plain count, so the one shared
 * value and two mappers exist on the pressed action alone. Driven from the
 * effect, never from a mapper, and with the value in both mappers' deps
 * (`docs/motion.mdx`). Reduced motion jumps straight to the new count.
 */
export function EngagementCountRoll({
  from,
  to,
  up,
  style,
  onDone,
}: {
  from: string;
  to: string;
  up: boolean;
  style: TextStyle;
  onDone: EngagementMotionDone;
}) {
  const progress = useSharedValue(0);
  const travel = up ? ROLL_DISTANCE : -ROLL_DISTANCE;

  useEffect(() => {
    progress.value = withTiming(1, ROLL);
  }, [progress]);

  useEffect(() => {
    const timer = setTimeout(() => onDone(null), ROLL_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  const incoming = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ translateY: travel * (1 - progress.value) }],
    }),
    [progress, travel],
  );
  const outgoing = useAnimatedStyle(
    () => ({
      opacity: 1 - progress.value,
      transform: [{ translateY: -travel * progress.value }],
    }),
    [progress, travel],
  );

  return (
    <View>
      <Animated.View style={incoming}>
        <Text style={style} selectable={false}>
          {to}
        </Text>
      </Animated.View>
      <Animated.View style={[OUTGOING, outgoing]} aria-hidden>
        <Text style={style} selectable={false}>
          {from}
        </Text>
      </Animated.View>
    </View>
  );
}
