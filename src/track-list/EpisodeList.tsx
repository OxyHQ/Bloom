import React from 'react';
import { View } from 'react-native';

import { EpisodeRow } from './EpisodeRow';
import type { EpisodeListProps } from './types';

/**
 * A `role="list"` of `EpisodeRow`s with hairlines between them. The row of
 * `currentEpisodeId` is drawn as current (and playing with `isPlaying`).
 */
export function EpisodeList({
  episodes,
  currentEpisodeId,
  isPlaying = false,
  accessibilityLabel = 'Episodes',
  style,
  testID,
  ...rowProps
}: EpisodeListProps) {
  return (
    <View role="list" accessibilityLabel={accessibilityLabel} style={style} testID={testID}>
      {episodes.map((episode, index) => (
        <View key={episode.id} role="listitem">
          <EpisodeRow
            {...rowProps}
            episode={episode}
            index={index}
            current={currentEpisodeId === episode.id}
            playing={currentEpisodeId === episode.id && isPlaying}
            divider={index < episodes.length - 1}
            testID={testID ? `${testID}-row-${index}` : undefined}
          />
        </View>
      ))}
    </View>
  );
}
