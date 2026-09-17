import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Avatar } from '../avatar';
import { useTheme } from '../theme/use-theme';
import { resolveChatListPaint } from './shared';
import type { ChatFace, GroupAvatarProps } from './types';

/**
 * Two to four faces packed into one avatar-sized cluster, for a group chat.
 *
 *   2   diagonal, 62% faces — the two people, with the second overlapping
 *   3   one above two, 55%
 *   4   a 2×2 rosette, 48%
 *
 * Every face carries a hairline ring in the SURFACE colour, which is what makes
 * the overlap read as two discs rather than one silhouette; pass `ringColor`
 * when the cluster sits on a card rather than the page. One face renders as a
 * plain avatar at the full size, so a group that lost a member does not suddenly
 * draw a lone 62% disc floating in the corner.
 *
 * The cluster is DECORATIVE by default. Inside a `ChatListItem` the row's own
 * accessible name already says which group this is, and a second announcement of
 * four unnamed faces is noise; pass `accessibilityLabel` to name it when it
 * stands alone.
 */

interface ClusterLayout {
  /** Face diameter as a fraction of the cluster. */
  ratio: number;
  /** Top-left of each face BOX, as a fraction of the free space (`size - box`). */
  positions: readonly (readonly [x: number, y: number])[];
}

const LAYOUTS: Record<2 | 3 | 4, ClusterLayout> = {
  2: { ratio: 0.62, positions: [[0, 0], [1, 1]] },
  3: { ratio: 0.55, positions: [[0.5, 0], [0, 1], [1, 1]] },
  4: { ratio: 0.48, positions: [[0, 0], [1, 0], [0, 1], [1, 1]] },
};

export const GROUP_AVATAR_MAX_FACES = 4;

function GroupAvatarComponent({
  faces,
  size = 48,
  shape = 'circle',
  ringColor,
  accessibilityLabel,
  style,
  testID,
}: GroupAvatarProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatListPaint(theme), [theme]);
  const ring = ringColor ?? paint.background;

  const shown = faces.slice(0, GROUP_AVATAR_MAX_FACES);
  const named = accessibilityLabel !== undefined && accessibilityLabel !== '';
  const a11y = named
    ? { accessibilityLabel, role: 'img' as const }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

  const face = (entry: ChatFace, key: number, diameter: number) => (
    <Avatar
      key={key}
      source={entry.source ?? null}
      name={entry.name}
      initials={entry.initials}
      size={diameter}
      shape={shape}
      testID={testID ? `${testID}-face-${key}` : undefined}
    />
  );

  if (shown.length <= 1) {
    const only = shown[0] ?? {};
    return (
      <View
        {...a11y}
        {...(named ? null : { 'aria-hidden': true })}
        style={[{ width: size, height: size }, style]}
        testID={testID}
      >
        {face(only, 0, size)}
      </View>
    );
  }

  const layout = LAYOUTS[shown.length as 2 | 3 | 4];
  const ringWidth = size >= 40 ? 2 : 1.5;
  const diameter = Math.round(size * layout.ratio);
  const box = diameter + ringWidth * 2;
  const free = size - box;

  return (
    <View
      {...a11y}
      {...(named ? null : { 'aria-hidden': true })}
      style={[{ width: size, height: size }, style]}
      testID={testID}
    >
      {shown.map((entry, index) => {
        const spot = layout.positions[index] as readonly [number, number];
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: Math.round(free * spot[0]),
              top: Math.round(free * spot[1]),
              padding: ringWidth,
              borderRadius: box / 2,
              backgroundColor: ring,
            }}
          >
            {face(entry, index, diameter)}
          </View>
        );
      })}
    </View>
  );
}

export const GroupAvatar = memo(GroupAvatarComponent);
GroupAvatar.displayName = 'GroupAvatar';
