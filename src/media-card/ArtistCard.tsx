import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiUser3Fill } from '../icons/remix/RiUser3Fill';
import { RiVerifiedBadgeFill } from '../icons/remix/RiVerifiedBadgeFill';
import { useTheme } from '../theme/use-theme';
import { MediaCard } from './MediaCard';
import { joinMeta, resolveMediaCardPaint } from './shared';
import type { ArtistCardProps } from './types';

/**
 * An artist: a ROUND photo (the only round cover besides a profile), the name
 * with an accent verified mark, "Artist" and an optional follower count. A row
 * draws a 56 round photo (48 at small) and "Artist · 1.2M followers".
 *
 * Name: "Mara Vell, Verified, Artist, 1.2M followers".
 */
function ArtistCardComponent({
  name,
  verified = false,
  followers,
  typeLabel = 'Artist',
  verifiedLabel = 'Verified',
  layout = 'tile',
  ...rest
}: ArtistCardProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);
  const row = layout === 'row';
  return (
    <MediaCard
      {...rest}
      layout={layout}
      title={name}
      artworkShape="round"
      placeholderIcon={RiUser3Fill}
      subtitle={row ? joinMeta([typeLabel, followers]) : typeLabel}
      meta={!row && followers ? [followers] : undefined}
      accessibilityLabel={
        rest.accessibilityLabel ??
        [name, verified ? verifiedLabel : null, typeLabel, followers].filter(Boolean).join(', ')
      }
      titleAccessory={
        verified ? (
          <View style={{ flexShrink: 0 }}>
            <RiVerifiedBadgeFill width={16} height={16} fill={paint.accent} />
          </View>
        ) : undefined
      }
    />
  );
}

export const ArtistCard = memo(ArtistCardComponent);
ArtistCard.displayName = 'ArtistCard';
