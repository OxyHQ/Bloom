import React, { memo } from 'react';
import { View } from 'react-native';

import { EmptyState } from '../empty-state';
import { RiLock2Line } from '../icons/remix/RiLock2Line';
import { Text } from '../typography';
import { useChatScreenPaint } from './shared';
import type { ChatEmptyStateProps } from './types';
import { useMessages } from '../locale/messages';
import { CHAT_SCREEN_MESSAGES } from './messages';

/**
 * What a conversation with nothing in it shows.
 *
 * THE NOTICE HAS NO DEFAULT, and that is the point. "Messages are end-to-end
 * encrypted" is a claim about an app's transport, not about a component — a
 * default would make it on behalf of every app that mounts this, including the
 * ones that cannot keep it. Pass the wording you can stand behind, or pass
 * nothing and the line is not drawn.
 *
 * The title DOES default ("No messages yet"), because an empty transcript is a
 * fact this component can see for itself.
 *
 * It is `EmptyState` with the notice pill as its content and the caller's
 * action as its footer.
 */
function ChatEmptyStateComponent({
  title: titleProp,
  description,
  illustration,
  notice,
  noticeIcon,
  action,
  style,
  testID,
}: ChatEmptyStateProps) {
  const paint = useChatScreenPaint();
  const { messages } = useMessages(CHAT_SCREEN_MESSAGES);
  const title = titleProp ?? messages.emptyTitle;
  const NoticeIcon = noticeIcon === false ? null : (noticeIcon ?? RiLock2Line);

  return (
    <EmptyState
      illustration={
        illustration ? (
          <View testID={testID ? `${testID}-illustration` : undefined}>{illustration}</View>
        ) : null
      }
      title={title}
      description={description}
      footer={action}
      style={[
        { flexGrow: 1, paddingLeft: 24, paddingRight: 24, paddingTop: 32, paddingBottom: 32 },
        style,
      ]}
      testID={testID}
    >
      {notice ? (
        <View
          testID={testID ? `${testID}-notice` : undefined}
          style={{
            flexDirection: 'row',
            // `alignSelf` so the pill hugs its text; `flex-start` on the cross
            // axis so a wrapped second line still sits under the first rather
            // than the glyph drifting to the middle of two lines.
            alignSelf: 'center',
            alignItems: 'flex-start',
            gap: 6,
            maxWidth: 340,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: 12,
            backgroundColor: paint.surfaceSubtle,
          }}
        >
          {NoticeIcon ? (
            <View style={{ paddingTop: 1 }}>
              <NoticeIcon width={14} height={14} fill={paint.textSecondary} />
            </View>
          ) : null}
          <Text variant="caption-1-regular" style={{ flexShrink: 1, color: paint.textSecondary }}>
            {notice}
          </Text>
        </View>
      ) : null}
    </EmptyState>
  );
}

export const ChatEmptyState = memo(ChatEmptyStateComponent);
ChatEmptyState.displayName = 'ChatEmptyState';
