import React from 'react';
import { View } from 'react-native';

import { EpisodeRow } from './EpisodeRow';
import type { EpisodeListProps } from './types';
import { useMessages } from '../locale/messages';
import { TRACK_LIST_MESSAGES } from './messages';

/**
 * A `role="list"` of `EpisodeRow`s with hairlines between them. The row of
 * `currentEpisodeId` is drawn as current (and playing with `isPlaying`).
 */
export function EpisodeList({
  episodes,
  currentEpisodeId,
  isPlaying = false,
  accessibilityLabel: accessibilityLabelProp,
  style,
  testID,
  ...rowProps
}: EpisodeListProps) {
  const { messages } = useMessages(TRACK_LIST_MESSAGES);
  const accessibilityLabel = accessibilityLabelProp ?? messages.episodes;
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
