import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { DIRECTIONS_MANEUVER_ICON } from '../directions/maneuvers';
import { borderRadius } from '../styles/tokens';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { NAVIGATION_BANNER_GEOMETRY } from './constants';
import { describeLanes, resolveNavigationPaint } from './shared';
import type { LaneGuidanceProps, NavigationLane } from './types';

/**
 * THE LANES ACROSS, and which of them take you where you are going.
 *
 *   cell      38 tall, 12 radius, one per lane, left to right as the driver
 *             sees them. A lane painted with several arrows grows sideways
 *             rather than stacking them — a driver reads a lane by counting
 *             across, so a cell that is taller than its neighbours breaks the
 *             count.
 *   allowed   the accent's own tint with the arrow in that tint's accent
 *   quiet     no fill, and the arrow at the GRAPHICAL rung — the one that is
 *             floored for a glyph rather than for text, which is what an arrow
 *             is
 *   preferred within an allowed lane, the one arrow to take stays at full
 *             strength while its siblings drop to the quiet rung: a lane that
 *             also goes straight on is still the lane you want
 *
 * The arrows are `DIRECTIONS_MANEUVER_ICON`, keyed by a SUBSET of the maneuver
 * vocabulary. A lane arrow is a maneuver drawn small; a second glyph map would
 * be a second opinion about what "slight right" looks like.
 *
 * The row is one `img` named by `describeLanes` — four arrows in a row say
 * nothing aloud, and a reader who cannot see them still has to be told which
 * lane to be in.
 */
function laneArrowColor(
  lane: NavigationLane,
  direction: LaneDirectionLocal,
  colors: { accent: string; quiet: string },
): string {
  if (!lane.allowed) return colors.quiet;
  if (lane.preferred === undefined) return colors.accent;
  return lane.preferred === direction ? colors.accent : colors.quiet;
}

type LaneDirectionLocal = NavigationLane['directions'][number];

function LaneGuidanceComponent({
  lanes,
  labels,
  accessibilityLabel,
  style,
  testID,
}: LaneGuidanceProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveNavigationPaint(theme), [theme]);
  const accent = resolveAccentColors(theme.colors, 'primary', 'subtle');
  const g = NAVIGATION_BANNER_GEOMETRY;
  const colors = { accent: accent.foreground, quiet: paint.textGraphical };

  return (
    <View
      role="img"
      accessibilityLabel={accessibilityLabel ?? describeLanes(lanes, labels)}
      testID={testID}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }, style]}
    >
      {lanes.map((lane, index) => (
        <View
          key={lane.id ?? index}
          testID={testID ? `${testID}-lane-${index}` : undefined}
          style={{
            minWidth: g.laneWidth,
            height: g.lane,
            paddingLeft: 4,
            paddingRight: 4,
            borderRadius: borderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            backgroundColor: lane.allowed ? accent.background : 'transparent',
          }}
        >
          {lane.directions.map((direction, arrow) => {
            const Arrow = DIRECTIONS_MANEUVER_ICON[direction];
            return (
              <Arrow
                key={`${direction}-${arrow}`}
                width={g.smallGlyph}
                height={g.smallGlyph}
                fill={laneArrowColor(lane, direction, colors)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export const LaneGuidance = memo(LaneGuidanceComponent);
LaneGuidance.displayName = 'LaneGuidance';
