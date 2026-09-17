import React, { memo } from 'react';
import { View } from 'react-native';

import { Text } from '../typography';
import { useMediaHeaderPaint } from './parts';
import type { ArtistStatsProps } from './types';

/**
 * A row of figures: the value title-1-bold over its label body-regular muted,
 * 32 apart, wrapping. Each figure is one accessible element ("1,204,331 Followers").
 */

function ArtistStatsComponent({ stats, style, testID }: ArtistStatsProps) {
  const paint = useMediaHeaderPaint();
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 32, rowGap: 16 }, style]} testID={testID}>
      {stats.map((stat, i) => (
        <View
          key={`${stat.label}-${i}`}
          accessible
          accessibilityLabel={`${stat.value} ${stat.label}`}
          style={{ gap: 2 }}
          testID={testID ? `${testID}-${i}` : undefined}
        >
          <Text variant="title-1-bold" style={{ color: paint.text }}>
            {stat.value}
          </Text>
          <Text variant="body-regular" style={{ color: paint.textMuted }}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const ArtistStats = memo(ArtistStatsComponent);
ArtistStats.displayName = 'ArtistStats';
