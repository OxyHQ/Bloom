import React, { memo, useMemo } from 'react';
import { Image, View } from 'react-native';

import { useImageResolver } from '../image-resolver/context';
import { Box as SkeletonBox } from '../skeleton';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import { mixColor } from '../button/shared';
import { CardLink, useMediaCardCss } from './parts';
import {
  GENRE_ARTWORK_ROTATION,
  GENRE_RADIUS,
  resolveArtworkUri,
  resolveCoverTint,
  resolveMediaCardPaint,
  TILE_ARTWORK,
} from './shared';
import type { GenreCardProps, MediaCardSize } from './types';

const TITLE: Record<MediaCardSize, TypeScaleVariant> = {
  large: 'title-2-bold',
  medium: 'title-3-bold',
  small: 'headline-bold',
};
/** The peeking cover's side. */
export const GENRE_PEEK: Record<MediaCardSize, number> = { large: 96, medium: 80, small: 60 };

/**
 * A browse category: a solid tile (radius 8) in `color` — stepped down its own
 * ramp until the bold light title clears 4.5:1, neutral without a colour — the
 * title top-left, and a cover rotated 25° peeking out of the bottom-right
 * corner, clipped by the tile. Square at 200 / 160 / 120; pass
 * `style={{ width: '100%' }}` in a grid (the tile keeps its 1:1 ratio).
 * Hover (web) mixes 12% black-side of the ramp in — colour only.
 *
 * Name: the title.
 */
function GenreCardComponent({
  title,
  color,
  artwork,
  artworkVariant,
  size = 'medium',
  onPress,
  href,
  skeleton = false,
  accessibilityLabel,
  style,
  testID,
}: GenreCardProps) {
  const theme = useTheme();
  useMediaCardCss();
  const resolver = useImageResolver();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);
  const tint = useMemo(() => resolveCoverTint(theme, color), [theme, color]);
  const side = TILE_ARTWORK[size];
  const peek = GENRE_PEEK[size];
  const pad = size === 'small' ? 12 : 16;

  if (skeleton) {
    return (
      <View aria-busy accessibilityLabel="Loading" style={[{ width: side, aspectRatio: 1 }, style]} testID={testID}>
        <SkeletonBox width="100%" height="100%" borderRadius={GENRE_RADIUS} />
      </View>
    );
  }

  const uri = resolveArtworkUri(artwork, resolver, artworkVariant);
  const rootStyle: WebCssStyle = {
    position: 'relative',
    width: side,
    aspectRatio: 1,
    borderRadius: GENRE_RADIUS,
    overflow: 'hidden',
    backgroundColor: tint.top,
    '--bloom-media-card-hover': mixColor(tint.top, tint.bottom, 0.5),
  };

  return (
    <View
      {...webDataSet({ bloomMediaCard: 'genre', ...(onPress || href ? { bloomMediaCardHover: '' } : null) })}
      style={[rootStyle, style]}
      testID={testID}
    >
      <CardLink name={accessibilityLabel ?? title} onPress={onPress} href={href} radius={GENRE_RADIUS} paint={paint} testID={testID} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Text
          variant={TITLE[size]}
          numberOfLines={2}
          style={{ position: 'absolute', top: pad, left: pad, right: pad, color: tint.text }}
        >
          {title}
        </Text>
        {uri ? (
          <Image
            source={{ uri }}
            resizeMode="cover"
            testID={testID ? `${testID}-artwork` : undefined}
            style={{
              position: 'absolute',
              width: peek,
              height: peek,
              right: -Math.round(peek * 0.18),
              bottom: -Math.round(peek * 0.06),
              borderRadius: 4,
              transform: [{ rotate: `${GENRE_ARTWORK_ROTATION}deg` }],
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

export const GenreCard = memo(GenreCardComponent);
GenreCard.displayName = 'GenreCard';
