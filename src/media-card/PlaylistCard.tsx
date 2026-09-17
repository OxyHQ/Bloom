import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiMusic2Fill } from '../icons/remix/RiMusic2Fill';
import { RiTeamLine } from '../icons/remix/RiTeamLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MediaCard, SUBTITLE_VARIANT } from './MediaCard';
import { Mosaic } from './parts';
import { joinMeta, resolveMediaCardPaint } from './shared';
import type { PlaylistCardProps } from './types';

/**
 * Which cover a playlist draws: its own `artwork`, else a 2×2 `mosaic` of up
 * to four track covers, else a gradient generated from `artworkColor` (neutral
 * without one) with a music note.
 */
export function playlistCoverKind(
  artwork: string | undefined,
  mosaic: ReadonlyArray<string> | undefined,
): 'artwork' | 'mosaic' | 'generated' {
  if (artwork) return 'artwork';
  if (mosaic && mosaic.filter(Boolean).length > 0) return 'mosaic';
  return 'generated';
}

/**
 * A playlist: square cover (artwork → mosaic → generated), the title, and
 * "By Maya · 42 songs" — with a shared-playlist glyph first when
 * `collaborative`.
 *
 * Name: "Late Hours, Playlist, Collaborative, By Maya · 42 songs".
 */
function PlaylistCardComponent({
  title,
  owner,
  ownerPrefix = 'By',
  trackCount,
  mosaic,
  collaborative = false,
  collaborativeLabel = 'Collaborative',
  typeLabel = 'Playlist',
  artwork,
  artworkColor,
  layout = 'tile',
  size = 'medium',
  testID,
  ...rest
}: PlaylistCardProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);
  const row = layout === 'row';
  const line = joinMeta([row ? typeLabel : undefined, owner ? `${ownerPrefix} ${owner}` : undefined, trackCount]);
  const kind = playlistCoverKind(artwork, mosaic);
  const variant = row ? 'body-2-regular' : SUBTITLE_VARIANT[size];

  const subtitle = collaborative ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View aria-hidden style={{ flexShrink: 0 }}>
        <RiTeamLine width={14} height={14} fill={paint.textSecondary} />
      </View>
      <Text variant={variant} numberOfLines={1} style={{ flexShrink: 1, color: paint.textSecondary }}>
        {line || collaborativeLabel}
      </Text>
    </View>
  ) : (
    line
  );

  return (
    <MediaCard
      {...rest}
      title={title}
      layout={layout}
      size={size}
      testID={testID}
      artwork={artwork}
      artworkColor={artworkColor}
      typeLabel={typeLabel}
      subtitle={subtitle}
      placeholderIcon={RiMusic2Fill}
      accessibilityLabel={
        rest.accessibilityLabel ??
        [title, typeLabel, collaborative ? collaborativeLabel : null, line || null].filter(Boolean).join(', ')
      }
      renderArtwork={
        kind === 'mosaic'
          ? (box) => (
              <Mosaic
                sources={(mosaic ?? []).filter(Boolean)}
                width={box.width}
                height={box.height}
                paint={paint}
                testID={testID ? `${testID}-mosaic` : undefined}
              />
            )
          : undefined
      }
    />
  );
}

export const PlaylistCard = memo(PlaylistCardComponent);
PlaylistCard.displayName = 'PlaylistCard';
