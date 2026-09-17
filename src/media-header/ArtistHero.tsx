import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { RiVerifiedBadgeFill } from '../icons/remix/RiVerifiedBadgeFill';
import { Text } from '../typography';
import { Cover, HeaderTitle, MediaHeaderFrame, useImageUri, useMediaHeaderPaint } from './parts';
import { gradientStyle, selectTitleVariant } from './shared';
import type { ArtistHeroProps } from './types';

/**
 * The top of an artist page.
 *
 * With `banner`: the image fills the band (wide 400 tall, narrow 300) under a
 * bottom scrim — transparent to 60% black — and the text is white, because it
 * sits on a photo, not on the theme.
 *
 * Without: the band is tinted from `artworkColor` and a round `avatar` (232 wide,
 * 160 centred on narrow) stands beside the text, which takes the band's text colour.
 *
 *   verified   RiVerifiedBadgeFill (accent disc, white tick) + "Verified artist"
 *   name       large-title … display-4 bold by length and width
 *   listeners  body-medium
 *
 * The `actions` area (Play, Follow pill, shuffle, more) fades into the page under it.
 */

const SCRIM = ['rgba(0, 0, 0, 0) 0%', 'rgba(0, 0, 0, 0.12) 45%', 'rgba(0, 0, 0, 0.62) 100%'];

function ArtistHeroComponent({
  name,
  banner,
  avatar,
  verified = false,
  verifiedLabel = 'Verified artist',
  listeners,
  artworkColor,
  actions,
  headingLevel = 1,
  style,
  testID,
}: ArtistHeroProps) {
  const paint = useMediaHeaderPaint(artworkColor);
  const bannerUri = useImageUri(banner, 'large');
  const onPhoto = !!bannerUri;
  const fg = onPhoto ? '#ffffff' : paint.onBand;
  const fgMuted = onPhoto ? '#ffffff' : paint.onBandMuted;

  return (
    <MediaHeaderFrame
      paint={paint}
      style={style}
      testID={testID}
      actions={actions}
      actionsFade={onPhoto ? [paint.background, paint.background] : undefined}
      centerCoverOnNarrow
      coverWidth={(wide) => (onPhoto ? 0 : wide ? 232 : 160)}
      backdrop={
        onPhoto ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID ? `${testID}-banner` : undefined}>
            <Image source={{ uri: bannerUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={[StyleSheet.absoluteFill, gradientStyle(SCRIM)]} />
          </View>
        ) : undefined
      }
      cover={
        onPhoto
          ? undefined
          : ({ wide }) => (
              <Cover
                source={avatar}
                size={wide ? 232 : 160}
                shape="round"
                paint={paint}
                testID={testID ? `${testID}-avatar` : undefined}
              />
            )
      }
    >
      {({ wide, textWidth }) => (
        <View style={{ gap: 4, minHeight: onPhoto ? (wide ? 304 : 220) : undefined, justifyContent: 'flex-end' }}>
          {verified ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} testID={testID ? `${testID}-verified` : undefined}>
              <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                {/* The tick is a cut-out; a white disc under it keeps it white on any band or photo. */}
                <View style={{ position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#ffffff' }} />
                <View style={{ width: 24, height: 24 }}>
                  <RiVerifiedBadgeFill width={24} height={24} fill={paint.accent} />
                </View>
              </View>
              <Text variant="body-medium" style={{ color: fg }}>
                {verifiedLabel}
              </Text>
            </View>
          ) : null}
          <HeaderTitle
            variant={selectTitleVariant(name, textWidth)}
            color={fg}
            level={headingLevel}
            numberOfLines={2}
            testID={testID ? `${testID}-name` : undefined}
          >
            {name}
          </HeaderTitle>
          {listeners ? (
            <Text variant="body-medium" style={{ color: fgMuted }} testID={testID ? `${testID}-listeners` : undefined}>
              {listeners}
            </Text>
          ) : null}
        </View>
      )}
    </MediaHeaderFrame>
  );
}

export const ArtistHero = memo(ArtistHeroComponent);
ArtistHero.displayName = 'ArtistHero';
