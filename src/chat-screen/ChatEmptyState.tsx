import React, { memo } from 'react';
import { View } from 'react-native';

import { RiLock2Line } from '../icons/remix/RiLock2Line';
import { Text } from '../typography';
import { CHAT_SCREEN_LABELS, useChatScreenPaint } from './shared';
import type { ChatEmptyStateProps } from './types';

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
 */
function ChatEmptyStateComponent({
  title = CHAT_SCREEN_LABELS.emptyTitle,
  description,
  illustration,
  notice,
  noticeIcon,
  action,
  style,
  testID,
}: ChatEmptyStateProps) {
  const paint = useChatScreenPaint();
  const NoticeIcon = noticeIcon === false ? null : (noticeIcon ?? RiLock2Line);

  return (
    <View
      testID={testID}
      style={[
        {
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 32,
          paddingBottom: 32,
        },
        style,
      ]}
    >
      {illustration ? (
        <View testID={testID ? `${testID}-illustration` : undefined}>{illustration}</View>
      ) : null}

      <View style={{ alignItems: 'center', gap: 6, maxWidth: 360 }}>
        <Text
          variant="headline-semibold"
          accessibilityRole="header"
          style={{ color: paint.text, textAlign: 'center' }}
        >
          {title}
        </Text>
        {description ? (
          <Text
            variant="body-regular"
            style={{ color: paint.textSecondary, textAlign: 'center' }}
          >
            {description}
          </Text>
        ) : null}
      </View>

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
          <Text
            variant="caption-1-regular"
            style={{ flexShrink: 1, color: paint.textSecondary }}
          >
            {notice}
          </Text>
        </View>
      ) : null}

      {action}
    </View>
  );
}

export const ChatEmptyState = memo(ChatEmptyStateComponent);
ChatEmptyState.displayName = 'ChatEmptyState';
