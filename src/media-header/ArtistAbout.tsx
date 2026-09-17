import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '../typography';
import { ArtistStats } from './ArtistStats';
import { ClampedText, useImageUri, useMediaHeaderPaint } from './parts';
import { gradientStyle } from './shared';
import type { ArtistAboutProps } from './types';

/**
 * The "About" section of an artist page.
 *
 *   heading    title-1-bold
 *   card       radius 16, `card` fill; with `image` a 16:9 photo on top of it
 *   bio        body-regular, clamped to `bioLines` with "Show more"
 *   stats      `ArtistStats` (followers, monthly listeners)
 *   cities     "Where people listen": city headline-semibold · count body-regular muted
 */

function ArtistAboutComponent({
  image,
  bio,
  bioLines = 3,
  stats,
  cities,
  title = 'About',
  showMoreLabel,
  showLessLabel,
  style,
  testID,
}: ArtistAboutProps) {
  const paint = useMediaHeaderPaint();
  const uri = useImageUri(image, 'large');
  return (
    <View style={[{ gap: 12 }, style]} testID={testID}>
      <Text variant="title-1-bold" role="heading" aria-level={2} style={{ color: paint.text }}>
        {title}
      </Text>
      <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: paint.card }}>
        {uri ? (
          <View style={{ width: '100%', aspectRatio: 16 / 9 }}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, gradientStyle(['rgba(0, 0, 0, 0) 60%', 'rgba(0, 0, 0, 0.35) 100%'])]}
            />
          </View>
        ) : null}
        <View style={{ padding: 16, gap: 20 }}>
          <ClampedText
            lines={bioLines}
            color={paint.text}
            linkColor={paint.text}
            ring={paint.ring}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
            testID={testID ? `${testID}-bio` : undefined}
          >
            {bio}
          </ClampedText>
          {stats && stats.length > 0 ? (
            <ArtistStats stats={stats} testID={testID ? `${testID}-stats` : undefined} />
          ) : null}
          {cities && cities.length > 0 ? (
            <View role="list" style={{ gap: 12 }} testID={testID ? `${testID}-cities` : undefined}>
              {cities.map((city, i) => (
                <View
                  role="listitem"
                  key={`${city.city}-${i}`}
                  accessible
                  accessibilityLabel={`${city.city}, ${city.count}`}
                  style={{ gap: 0 }}
                >
                  <Text variant="headline-semibold" style={{ color: paint.text }}>
                    {city.city}
                  </Text>
                  <Text variant="body-regular" style={{ color: paint.textMuted }}>
                    {city.count}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export const ArtistAbout = memo(ArtistAboutComponent);
ArtistAbout.displayName = 'ArtistAbout';
