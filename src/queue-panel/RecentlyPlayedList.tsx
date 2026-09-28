import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { QueuePanelRow } from './QueuePanelRow';
import { queuePlayName, resolveQueuePanelPaint } from './shared';
import type { RecentlyPlayedListProps } from './types';
import { useMessages } from '../locale/messages';
import { MEDIA_CONTROLS_MESSAGES } from '../media-controls/messages';
import { QUEUE_PANEL_MESSAGES } from './messages';

/**
 * The listening history: plain `QueuePanelRow`s, newest first, each pressable to
 * play again, with the app's "when" string (`meta`) at the trailing edge. The
 * loaded track (`currentId`) takes the accent title and the now-playing bars.
 * An empty list draws one secondary line.
 */
function RecentlyPlayedListComponent({
  items,
  onPlay,
  currentId,
  playing = true,
  labels,
  style,
  testID,
}: RecentlyPlayedListProps) {
  const { messages } = useMessages(QUEUE_PANEL_MESSAGES);
  const { messages: controls } = useMessages(MEDIA_CONTROLS_MESSAGES);
  const theme = useTheme();
  const paint = useMemo(() => resolveQueuePanelPaint(theme), [theme]);
  const play = labels?.play ?? controls.play;

  if (items.length === 0) {
    return (
      <View style={[{ paddingTop: 24, paddingBottom: 24, alignItems: 'center' }, style]} testID={testID}>
        <Text variant="body-regular" style={{ color: paint.textSecondary }}>
          {labels?.emptyRecent ?? messages.emptyRecent}
        </Text>
      </View>
    );
  }

  return (
    <View role="list" style={style} testID={testID}>
      {items.map((track, index) => (
        <View key={`${track.id}-${index}`} role="listitem">
          <QueuePanelRow
            track={track}
            current={track.id === currentId}
            playing={playing}
            accessibilityLabel={queuePlayName(play, track.title, controls)}
            onPress={onPlay ? () => onPlay(index, track) : undefined}
            testID={testID ? `${testID}-row-${index}` : undefined}
          />
        </View>
      ))}
    </View>
  );
}

export const RecentlyPlayedList = memo(RecentlyPlayedListComponent);
RecentlyPlayedList.displayName = 'RecentlyPlayedList';
