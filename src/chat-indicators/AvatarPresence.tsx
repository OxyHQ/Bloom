import React, { memo } from 'react';
import { View } from 'react-native';

import { Avatar } from '../avatar/Avatar';
import { AVATAR_SIZES } from '../avatar/initials';
import { PresenceDot } from './PresenceDot';
import { PRESENCE_DOT_SIZES, presenceSizeForAvatar } from './shared';
import type { AvatarPresenceProps } from './types';

/**
 * An `Avatar` with a {@link PresenceDot} in its bottom-right corner — the piece
 * every list row, chat header and member sheet repeats.
 *
 * Every `Avatar` prop passes through. The dot rung is picked from the avatar's
 * own size (`small` to 28, `medium` to 44, `large` above) and can be overridden
 * with `presenceSize`. The dot's ringed box sits inside the avatar's footprint,
 * so a row's geometry does not change when someone comes online.
 *
 * Accessibility: the avatar and the dot are two elements. The dot carries the
 * status name; pass `presenceLabel=""` when the row's text already says it.
 */

function AvatarPresenceComponent({
  status,
  presenceSize,
  presenceRingColor,
  presenceLabel,
  containerStyle,
  ...avatarProps
}: AvatarPresenceProps) {
  const { size } = avatarProps;
  const px = typeof size === 'number' ? size : size ? AVATAR_SIZES[size] : 40;
  const rung = presenceSize ?? presenceSizeForAvatar(px);
  // The dot is drawn on the circle's 45° edge: at `right: 0, bottom: 0` its own
  // ring straddles the outline, which is what makes it read as attached rather
  // than floating beside the face.
  const box = PRESENCE_DOT_SIZES[rung] + 4;

  return (
    <View style={[{ position: 'relative', width: px, height: px }, containerStyle]}>
      <Avatar {...avatarProps} />
      {status ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: box,
            height: box,
          }}
        >
          <PresenceDot
            status={status}
            size={rung}
            ringColor={presenceRingColor}
            accessibilityLabel={presenceLabel}
          />
        </View>
      ) : null}
    </View>
  );
}

export const AvatarPresence = memo(AvatarPresenceComponent);
AvatarPresence.displayName = 'AvatarPresence';
