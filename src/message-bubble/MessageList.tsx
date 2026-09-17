import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { CallSummaryRow } from './CallSummaryRow';
import { DateSeparator } from './DateSeparator';
import { MessageBubble } from './MessageBubble';
import { MessageGroup } from './MessageGroup';
import { SystemMessage } from './SystemMessage';
import { UnreadSeparator } from './UnreadSeparator';
import { groupMessages } from './shared';
import type { MessageListItem, MessageListProps, MessagePosition } from './types';

/**
 * The transcript as a plain vertical stack: date separators, the unread rule,
 * service rows and runs of bubbles, from one `items` array.
 *
 * NOT VIRTUALISED, and that is the whole contract. It renders every item, which
 * is right for a thread you have just opened (a screen or two of messages) and
 * wrong for a year of history. For a long history, render the parts yourself
 * inside a `FlatList`/`FlashList`: call {@link groupMessages} once on your data,
 * key the resulting entries, and render `MessageGroup` / `DateSeparator` /
 * `SystemMessage` / `CallSummaryRow` as the list's rows — every one of them is
 * a standalone export that takes props and holds no list state.
 *
 * The grouping is `groupMessages`, which is pure and exported: a run breaks on a
 * change of sender, of direction, or on anything between two messages (a day, a
 * read marker, a service line). So "who is this from" and "where does it sit in
 * a run" are decided once, from the data, rather than by each row guessing at
 * its neighbours.
 */
function MessageListComponent({
  items,
  showAvatars = true,
  showSenderNames = true,
  avatarSize = 28,
  unreadLabel,
  labels,
  contentStyle,
  style,
  testID,
}: MessageListProps) {
  const entries = useMemo(() => groupMessages(items), [items]);

  const renderBubble = (item: MessageListItem, position: MessagePosition) => {
    const {
      id,
      senderId: _senderId,
      dateKey: _dateKey,
      dateLabel: _dateLabel,
      unreadBefore: _unreadBefore,
      system: _system,
      call: _call,
      avatarSource: _avatarSource,
      onPressAvatar: _onPressAvatar,
      senderName: _senderName,
      ...bubble
    } = item;
    return <MessageBubble key={id} {...bubble} position={position} labels={labels} />;
  };

  return (
    <View style={style} testID={testID}>
      <View
        style={[
          { paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12 },
          contentStyle,
        ]}
      >
        {entries.map((entry) => {
          switch (entry.kind) {
            case 'date':
              return <DateSeparator key={entry.key} label={entry.label} />;
            case 'unread':
              return <UnreadSeparator key={entry.key} label={unreadLabel} />;
            case 'system':
              return <SystemMessage key={entry.key} text={entry.item.system} />;
            case 'call':
              return (
                <CallSummaryRow
                  key={entry.key}
                  direction={entry.item.direction}
                  outcome={entry.item.call?.outcome ?? 'incoming'}
                  title={entry.item.call?.title ?? ''}
                  duration={entry.item.call?.duration}
                  time={entry.item.call?.time}
                  video={entry.item.call?.video}
                  onPress={entry.item.call?.onPress}
                />
              );
            default: {
              const first = entry.messages[0]?.item;
              return (
                <MessageGroup
                  key={entry.key}
                  direction={entry.direction}
                  senderName={first?.senderName}
                  senderColorSeed={first?.senderColorSeed ?? first?.senderId}
                  senderColor={first?.senderColor}
                  avatarSource={first?.avatarSource}
                  onPressAvatar={first?.onPressAvatar}
                  showAvatar={showAvatars}
                  showSenderName={showSenderNames && entry.direction === 'incoming'}
                  avatarSize={avatarSize}
                >
                  {entry.messages.map(({ item, position }) => renderBubble(item, position))}
                </MessageGroup>
              );
            }
          }
        })}
      </View>
    </View>
  );
}

export const MessageList = memo(MessageListComponent);
MessageList.displayName = 'MessageList';
