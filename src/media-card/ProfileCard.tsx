import React, { memo } from 'react';
import { View } from 'react-native';

import { RiUser3Fill } from '../icons/remix/RiUser3Fill';
import { MediaCard } from './MediaCard';
import { joinMeta } from './shared';
import type { ProfileCardProps } from './types';

/**
 * A listener's profile (a follower, a friend): a round avatar, the name,
 * "Profile · Follows you", an optional follower count, and `action` (the
 * follow button) — under the text in a tile, trailing in a row.
 *
 * Name: "Maya Ortiz, Profile, Follows you, 214 followers".
 */
function ProfileCardComponent({
  name,
  followsYou = false,
  typeLabel = 'Profile',
  followsYouLabel = 'Follows you',
  followers,
  action,
  layout = 'tile',
  ...rest
}: ProfileCardProps) {
  const row = layout === 'row';
  const line = joinMeta([typeLabel, followsYou ? followsYouLabel : undefined]);
  return (
    <MediaCard
      {...rest}
      layout={layout}
      title={name}
      artworkShape="round"
      placeholderIcon={RiUser3Fill}
      subtitle={line}
      meta={followers ? [followers] : undefined}
      accessibilityLabel={
        rest.accessibilityLabel ??
        [name, typeLabel, followsYou ? followsYouLabel : null, followers].filter(Boolean).join(', ')
      }
      trailing={row ? action : undefined}
      footer={!row && action ? <View style={{ alignItems: 'flex-start' }} pointerEvents="box-none">{action}</View> : undefined}
    />
  );
}

export const ProfileCard = memo(ProfileCardComponent);
ProfileCard.displayName = 'ProfileCard';
