import { useCallback } from 'react';
import type { TextStyle } from 'react-native';

import { RollingText } from '../motion/RollingText';
import { EASE_OUT, ROLL_DISTANCE, ROLL_MS } from './constants';
import type { EngagementMotionDone } from './context';

/**
 * A count rolling to its new value: a rising count enters from below while the
 * old one leaves upward, a falling one the other way — `RollingText` from
 * `from` to `to`.
 *
 * Mounted only for the roll, in place of the plain count, so its shared value
 * and mappers exist on the pressed action alone. Reduced motion jumps straight
 * to the new count.
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
      duration={ROLL_MS}
      easing={EASE_OUT}
      style={style}
      onRollEnd={done}
    />
  );
}
