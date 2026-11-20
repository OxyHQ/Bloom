import { View, type ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import { defineKeyframes } from '../motion/keyframes';
import { MotionView } from '../motion/MotionView';
import type { Play } from '../motion/play';
import { timingOf } from '../motion/timing';
import { MOTION, SCALE } from '../motion/tokens';
import { ENGAGEMENT_ICON_SIZE } from './constants';
import type { EngagementMotionDone } from './context';

const RING_WIDTH = 2;

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
  borderWidth: RING_WIDTH,
};

/**
 * The glyph dips (a plain timing, Reanimated's default curve), swells past
 * full size and settles (the pop's ease-out); its stretches are 1/10, 3/10
 * and 6/10 of the pop.
 */
const GLYPH = defineKeyframes(
  [
    { at: 0, scale: SCALE.full, easing: 'inOutQuad' },
    { at: 0.1, scale: SCALE.dip },
    { at: 0.4, scale: SCALE.swell },
    { at: 1, scale: SCALE.full },
  ],
  MOTION.pop,
);

/** The ring bursts outward from 0.4 to 1.6 and fades from 0.6. */
const RING_BURST = defineKeyframes(
  [
    { at: 0, opacity: 0.6, scale: 0.4 },
    { at: 1, opacity: 0, scale: 1.6 },
  ],
  MOTION.pop,
);

const POP = timingOf(MOTION.pop);

/**
 * The glyph as a press turns an action on: it dips, swells past full size and
 * settles while a ring in the same colour bursts outward and fades.
 *
 * Mounted only while it plays, in place of the plain glyph, so its views exist
 * on the one action that was pressed and never on an action at rest. Both play
 * as keyframes on Bloom's motion engine (Reanimated's CSS animations on native,
 * the Web Animations API on the web): no shared value, no mapper, no JS frame.
 * It is done when the glyph's keyframes end. Reduced motion never mounts it.
 */
export function EngagementPop({
  icon: Icon,
  color,
  size = ENGAGEMENT_ICON_SIZE,
  onDone,
}: {
  icon: BloomIconComponent;
  color: string;
  size?: number;
  onDone?: EngagementMotionDone;
}) {
  const glyph: Play = {
    id: 1,
    keyframes: GLYPH,
    timing: POP,
    fill: 'none',
    material: false,
    onEnd: onDone ? () => onDone(null) : undefined,
  };
  const ring: Play = {
    id: 1,
    keyframes: RING_BURST,
    timing: POP,
    fill: 'forwards',
    material: false,
    onEnd: undefined,
  };
  return (
    <View style={[BOX, { width: size, height: size }]}>
      <MotionView
        play={ring}
        pointerEvents="none"
        style={[RING, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}
      />
      <MotionView play={glyph}>
        <Icon width={size} height={size} fill={color} />
      </MotionView>
    </View>
  );
}
