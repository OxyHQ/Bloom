import { useCallback } from 'react';
import type { TextStyle } from 'react-native';

import { RollingText } from '../motion/RollingText';
import { MOTION } from '../motion/tokens';
import { ROLL_DISTANCE } from './constants';
import type { EngagementMotionDone } from './context';

/**
 * A count rolling to its new value: a rising count enters from below while the
 * old one leaves upward, a falling one the other way — `RollingText` from
 * `from` to `to`, over the engagement bar's `roll` motion.
 *
 * Mounted only for the roll, in place of the plain count, so its views exist
 * on the pressed action alone. Reduced motion jumps straight to the new count.
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
  const done = useCallback(() => onDone(null), [onDone]);
  return (
    <RollingText
      value={to}
      from={from}
      direction={up ? 'up' : 'down'}
      distance={ROLL_DISTANCE}
      duration={MOTION.roll.duration}
      easing={MOTION.roll.easing}
      style={style}
      onRollEnd={done}
    />
  );
}
