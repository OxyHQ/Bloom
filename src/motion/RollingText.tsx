import { memo, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { Text, TYPE_SCALE } from '../typography';
import type { RollingTextProps } from './types';

/** CSS `ease-out`, `cubic-bezier(0, 0, 0.58, 1)`: the whole-text roll's default curve. */
const WHOLE_EASING = Easing.bezier(0, 0, 0.58, 1);
const DIGIT_EASING = Easing.out(Easing.cubic);
const WHOLE_MS = 220;
const DIGIT_MS = 350;
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
/** A digit wheel's width as a share of the font size: one tabular figure. */
const DIGIT_WIDTH = 0.65;

const HIDDEN = {
  'aria-hidden': true,
  importantForAccessibility: 'no-hide-descendants',
  accessibilityElementsHidden: true,
} as const;

/** The outgoing text, over the incoming one, which alone sizes the box. */
const OUTGOING_START: ViewStyle = { position: 'absolute', top: 0, insetInlineStart: 0 };
const OUTGOING_CENTER: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  alignItems: 'center',
};

interface RollState {
  /** The text on screen once the current roll lands. */
  shown: string;
  /** The text leaving, while a roll runs. */
  outgoing: string | null;
  /** Bumped by every roll, so each one restarts the motion. */
  id: number;
}

/** The whole text rolls: the old one leaves while the new one arrives. */
function WholeRoll({
  value,
  from,
  direction = 'up',
  distance = 10,
  duration = WHOLE_MS,
  easing = WHOLE_EASING,
  align = 'start',
  clip = false,
  variant,
  numberOfLines,
  style,
  containerStyle,
  onRollEnd,
  testID,
}: RollingTextProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [roll, setRoll] = useState<RollState>(() => ({
    shown: value,
    outgoing: from !== undefined && from !== value && !reducedMotion ? from : null,
    id: from !== undefined && from !== value ? 1 : 0,
  }));
  if (roll.shown !== value) {
    setRoll({ shown: value, outgoing: reducedMotion ? null : roll.shown, id: roll.id + 1 });
  }

  const progress = useSharedValue(roll.outgoing === null ? 1 : 0);
  const onRollEndRef = useRef(onRollEnd);
  onRollEndRef.current = onRollEnd;

  // A roll is one `id`; a new duration or curve applies from the next one.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the roll
  useLayoutEffect(() => {
    if (roll.id === 0) return undefined;
    const id = roll.id;
    cancelAnimation(progress);
    if (reducedMotion) {
      progress.value = 1;
    } else {
      progress.value = 0;
      progress.value = withTiming(1, { duration, easing });
    }
    const timer = setTimeout(
      () => {
        setRoll((current) => (current.id === id ? { ...current, outgoing: null } : current));
        onRollEndRef.current?.();
      },
      reducedMotion ? 0 : duration,
    );
    return () => clearTimeout(timer);
  }, [roll.id]);

  const travel = direction === 'up' ? distance : -distance;
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

  const centered = align === 'center';
  return (
    <View
      testID={testID}
      style={[
        { alignItems: centered ? 'center' : 'flex-start' },
        clip ? { overflow: 'hidden' } : null,
        containerStyle,
      ]}
    >
      <Animated.View style={incoming}>
        <Text
          variant={variant}
          numberOfLines={numberOfLines}
          selectable={false}
          style={[centered ? { textAlign: 'center' } : null, style]}
        >
          {value}
        </Text>
      </Animated.View>
      {roll.outgoing !== null ? (
        <Animated.View
          {...HIDDEN}
          pointerEvents="none"
          style={[centered ? OUTGOING_CENTER : OUTGOING_START, outgoing]}
        >
          <Text
            variant={variant}
            numberOfLines={numberOfLines}
            selectable={false}
            style={[centered ? { textAlign: 'center' } : null, style]}
          >
            {roll.outgoing}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

/** One figure on a 0–9 wheel that turns to its new value. */
function DigitWheel({
  digit,
  lineHeight,
  width,
  duration,
  easing,
  textStyle,
  variant,
}: {
  digit: number;
  lineHeight: number;
  width: number;
  duration: number;
  easing: NonNullable<RollingTextProps['easing']>;
  textStyle: RollingTextProps['style'];
  variant: RollingTextProps['variant'];
}) {
  const reducedMotion = usePrefersReducedMotion();
  const offset = useSharedValue(-digit * lineHeight);
  useLayoutEffect(() => {
    cancelAnimation(offset);
    const target = -digit * lineHeight;
    offset.value = reducedMotion ? target : withTiming(target, { duration, easing });
  }, [digit, lineHeight, duration, easing, reducedMotion, offset]);
  const wheel = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }), [offset]);
  return (
    <View style={{ height: lineHeight, width, overflow: 'hidden' }}>
      <Animated.View style={wheel}>
        {DIGITS.map((figure) => (
          <Text
            key={figure}
            variant={variant}
            style={[textStyle, styles.figure, { lineHeight, height: lineHeight }]}
          >
            {figure}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

/** Every digit rolls on its own wheel; everything else stays put. */
function DigitsRoll({
  value,
  duration = DIGIT_MS,
  easing = DIGIT_EASING,
  variant,
  style,
  containerStyle,
  accessibilityLabel,
  testID,
}: RollingTextProps) {
  const metrics: TextStyle = {
    ...(variant ? TYPE_SCALE[variant] : null),
    ...StyleSheet.flatten(style),
  };
  const fontSize = metrics.fontSize ?? 13;
  const lineHeight = metrics.lineHeight ?? Math.round(fontSize * 1.3);
  const chars = Array.from(value);
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? value}
      testID={testID}
      style={[styles.digits, containerStyle]}
    >
      <View {...HIDDEN} style={styles.digits}>
        {chars.map((char, index) =>
          /[0-9]/.test(char) ? (
            // Keyed from the END, so "9.99" → "29.99" keeps its cents on the same wheels.
            <DigitWheel
              key={`${chars.length - index}-digit`}
              digit={Number(char)}
              lineHeight={lineHeight}
              width={fontSize * DIGIT_WIDTH}
              duration={duration}
              easing={easing}
              textStyle={style}
              variant={variant}
            />
          ) : (
            <Text key={`${chars.length - index}-literal`} variant={variant} style={style}>
              {char}
            </Text>
          ),
        )}
      </View>
    </View>
  );
}

/**
 * `RollingText`: text that ROLLS when it changes — a count ticking, a range
 * label stepping, a price switching plans.
 *
 * - `mode="whole"` (the default): the old text lifts `distance` (10) px and
 *   fades out while the new one rises into place and fades in, over
 *   `duration` (220ms, CSS `ease-out`). `direction="down"` reverses both, for
 *   a count going down. `from` rolls from that text on mount — a roll mounted
 *   for one change — and `onRollEnd` says when it has landed. The incoming text
 *   sizes the box; the outgoing one is hidden from assistive technology.
 * - `mode="digits"`: every figure turns on its own 0–9 wheel to its new value
 *   (350ms, ease-out cubic) while the other characters stay put, keyed from the
 *   end so a price gaining a digit keeps its cents on the same wheels. The
 *   wheels' line box is the `variant`'s or `style`'s `lineHeight`. The wheels
 *   are hidden and the whole is one element named by `value` (or
 *   `accessibilityLabel`), since ten stacked figures per digit read as noise.
 *
 * Both snap under reduced motion (`usePrefersReducedMotion`), including a
 * change while mounted. Motion runs on Reanimated shared values driven from an
 * effect, never a mapper, with every shared value in the mappers' deps
 * (docs/motion.mdx).
 */
export const RollingText = memo(function RollingText(props: RollingTextProps) {
  return props.mode === 'digits' ? <DigitsRoll {...props} /> : <WholeRoll {...props} />;
});

const styles = StyleSheet.create({
  digits: { flexDirection: 'row', alignItems: 'flex-start' },
  figure: { textAlign: 'center', fontVariant: ['tabular-nums'] },
});
