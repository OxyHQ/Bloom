import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { QueuePanelRow } from './QueuePanelRow';
import { DEFAULT_QUEUE_PANEL_LABELS, resolveQueuePanelPaint } from './shared';
import type { RecentlyPlayedListProps } from './types';

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
  const theme = useTheme();
  const paint = useMemo(() => resolveQueuePanelPaint(theme), [theme]);
  const play = labels?.play ?? DEFAULT_QUEUE_PANEL_LABELS.play;

  if (items.length === 0) {
    return (
      <View style={[{ paddingTop: 24, paddingBottom: 24, alignItems: 'center' }, style]} testID={testID}>
        <Text variant="body-regular" style={{ color: paint.textSecondary }}>
          {labels?.emptyRecent ?? DEFAULT_QUEUE_PANEL_LABELS.emptyRecent}
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
            accessibilityLabel={`${play} ${track.title}`}
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
