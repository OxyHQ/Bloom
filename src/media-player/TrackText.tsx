import React, { useEffect, useMemo } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { webDataSet } from '../checkbox/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useImageResolver } from '../image-resolver/context';
import { RiMusic2Line } from '../icons/remix/RiMusic2Line';
import type { TypeScaleVariant } from '../typography/scale';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { isUrl, MEDIA_PLAYER_CSS, MEDIA_PLAYER_STYLE_ID } from './shared';
import type { MediaArtist, MediaPlayerTrack } from './types';

/** The cover: an `Image` for a URL or a resolved id, a neutral well with a note glyph otherwise. */
export function Artwork({
  source,
  size,
  radius,
  style,
  testID,
}: {
  source?: string;
  size: number | '100%';
  radius: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const theme = useTheme();
  const resolver = useImageResolver();
  const { neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const uri = source ? (isUrl(source) ? source : resolver?.(source)) : undefined;
  const box: ViewStyle =
    size === '100%' ? { width: '100%', aspectRatio: 1 } : { width: size, height: size };
  return (
    <View
      style={[
        box,
        {
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: theme.isDark ? neutral[800] : neutral[100],
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      testID={testID}
    >
      {uri ? (
        <Image
          source={{ uri }}
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
        />
      ) : (
        <View pointerEvents="none">
          <RiMusic2Line width={24} height={24} fill={theme.isDark ? neutral[500] : neutral[400]} />
        </View>
      )}
    </View>
  );
}

/**
 * Title over the artist credits, each line ONE text node so it truncates as a
 * whole. The title is a link when `onTitlePress` is given; each credit is a
 * nested link when `onArtistPress` is given (and `artists` is a list). On web
 * a link underlines under the pointer and on keyboard focus through the
 * adopted sheet.
 */
export function TrackText({
  track,
  titleVariant,
  artistVariant,
  titleColor,
  artistColor,
  onTitlePress,
  onArtistPress,
  titleLabel,
  trailingTitle,
  testID,
}: {
  track: MediaPlayerTrack;
  titleVariant: TypeScaleVariant;
  artistVariant: TypeScaleVariant;
  titleColor: string;
  artistColor: string;
  onTitlePress?: () => void;
  onArtistPress?: (artist: MediaArtist, index: number) => void;
  titleLabel?: string;
  trailingTitle?: React.ReactNode;
  testID?: string;
}) {
  useEffect(() => {
    adoptStyleSheet(MEDIA_PLAYER_STYLE_ID, MEDIA_PLAYER_CSS);
  }, []);
  const artists: MediaArtist[] =
    typeof track.artists === 'string' ? [{ name: track.artists }] : track.artists;
  const pressArtists = typeof track.artists !== 'string' && !!onArtistPress;
  return (
    <View style={{ minWidth: 0, flexShrink: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <Text
          variant={titleVariant}
          numberOfLines={1}
          style={{ color: titleColor, flexShrink: 1 }}
          {...(onTitlePress
            ? {
                role: 'link' as const,
                accessibilityLabel: titleLabel ?? track.title,
                onPress: onTitlePress,
                ...webDataSet({ bloomPlayerLink: '' }),
              }
            : null)}
          testID={testID ? `${testID}-title` : undefined}
        >
          {track.title}
        </Text>
        {trailingTitle}
      </View>
      <Text
        variant={artistVariant}
        numberOfLines={1}
        style={{ color: artistColor }}
        testID={testID ? `${testID}-artists` : undefined}
      >
        {artists.map((artist, i) => (
          <React.Fragment key={artist.id ?? `${artist.name}-${i}`}>
            {i > 0 ? ', ' : null}
            {pressArtists ? (
              <Text
                variant={artistVariant}
                role="link"
                accessibilityLabel={artist.name}
                onPress={() => onArtistPress?.(artist, i)}
                style={{ color: artistColor }}
                {...webDataSet({ bloomPlayerLink: '' })}
                testID={testID ? `${testID}-artist-${i}` : undefined}
              >
                {artist.name}
              </Text>
            ) : (
              artist.name
            )}
          </React.Fragment>
        ))}
      </Text>
    </View>
  );
}
