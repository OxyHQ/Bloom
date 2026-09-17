import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { ExplicitBadge, LikeButton, NowPlayingIndicator } from '../media-controls';
import { RiMusic2Fill } from '../icons/remix/RiMusic2Fill';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MediaCard, SUBTITLE_VARIANT } from './MediaCard';
import { IS_WEB, resolveMediaCardPaint } from './shared';
import type { SongCardArtist, SongCardProps } from './types';
import { webDataSet } from '../styles/web-data';

export function normaliseArtists(
  artists: SongCardProps['artists'],
): SongCardArtist[] {
  return (artists ?? []).map((artist) => (typeof artist === 'string' ? { name: artist } : artist));
}

/**
 * A track.
 *
 *   tile   square cover; the title with the `ExplicitBadge` after it; the
 *          artists line
 *   row    + the album line, then `LikeButton` and the duration before
 *          "More options"
 *
 * `current` draws `NowPlayingIndicator` before the title (moving while
 * `playing`) and paints the title in the accent. With `onPressArtist` each
 * artist is its own link, drawn over the card's link rather than inside it.
 *
 * Name: "Night Drive, Explicit, Song, Mara Vell, Juno Park".
 */
function SongCardComponent({
  title,
  artists,
  onPressArtist,
  album,
  explicit = false,
  duration,
  liked = false,
  onLikedChange,
  typeLabel = 'Song',
  current = false,
  playing = false,
  layout = 'tile',
  size = 'medium',
  testID,
  ...rest
}: SongCardProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);
  const list = normaliseArtists(artists);
  const names = list.map((artist) => artist.name).join(', ');
  const row = layout === 'row';
  const variant = row ? 'body-2-regular' : SUBTITLE_VARIANT[size];

  const subtitle =
    list.length === 0 ? undefined : onPressArtist ? (
      <Text variant={variant} numberOfLines={1} style={{ color: paint.textSecondary }}>
        {list.map((artist, index) => (
          <React.Fragment key={`${index}-${artist.name}`}>
            {index > 0 ? ', ' : null}
            <Text
              {...webDataSet({ bloomMediaCardArtist: '' })}
              role="link"
              accessibilityLabel={artist.name}
              variant={variant}
              onPress={() => onPressArtist(artist, index)}
              style={{ color: paint.textSecondary }}
              testID={testID ? `${testID}-artist-${index}` : undefined}
            >
              {artist.name}
            </Text>
          </React.Fragment>
        ))}
      </Text>
    ) : (
      names
    );

  const trailing = row ? (
    <>
      {onLikedChange ? (
        <View {...webDataSet(liked ? {} : { bloomMediaCardReveal: IS_WEB ? 'hover' : '' })}>
          <LikeButton liked={liked} onLikedChange={onLikedChange} size="small" accessibilityLabel={`Save ${title} to Your Library`} />
        </View>
      ) : null}
      {duration ? (
        <Text variant="body-2-regular" style={{ color: paint.textSecondary, minWidth: 36, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
          {duration}
        </Text>
      ) : null}
    </>
  ) : undefined;

  return (
    <MediaCard
      {...rest}
      title={title}
      typeLabel={typeLabel}
      subtitle={subtitle}
      interactiveSubtitle={Boolean(onPressArtist)}
      meta={row && album ? [album] : undefined}
      placeholderIcon={RiMusic2Fill}
      titleLeading={current ? <NowPlayingIndicator playing={playing} size={14} /> : undefined}
      titleAccessory={explicit ? <ExplicitBadge size="small" /> : undefined}
      titleAccessoryLabel={explicit ? 'Explicit' : undefined}
      accessibilityDetail={onPressArtist ? names : undefined}
      trailing={trailing}
      current={current}
      playing={playing}
      layout={layout}
      size={size}
      testID={testID}
    />
  );
}

export const SongCard = memo(SongCardComponent);
SongCard.displayName = 'SongCard';
