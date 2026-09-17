import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Avatar } from '../avatar';
import { TypingDots } from '../chat-indicators';
import { useTheme } from '../theme/use-theme';
import {
  BUBBLE_PADDING_X,
  bubbleRadii,
  resolveMessageBubblePaint,
  sidePaint,
} from './shared';
import type { TypingBubbleProps } from './types';

/**
 * A bubble with three dots in it, in the run's own geometry — the cut corner
 * and the avatar included, so it sits where the next message will appear
 * instead of arriving somewhere else and pushing the transcript.
 *
 * It draws NO text, which means nothing can name it by contents: `label`
 * (default "Typing…") is the accessible name and an empty string is not one.
 * `TypingDots` itself is hidden, because the bubble already says it.
 */
function TypingBubbleComponent({
  direction = 'incoming',
  senderName,
  avatarSource,
  showAvatar,
  avatarSize = 28,
  label = 'Typing…',
  style,
  testID,
}: TypingBubbleProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMessageBubblePaint(theme), [theme]);
  const side = sidePaint(paint, direction);
  const outgoing = direction === 'outgoing';
  const withAvatar = !outgoing && showAvatar !== false;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 6,
          paddingTop: 1,
          paddingBottom: 1,
          paddingLeft: 2,
          paddingRight: 2,
          justifyContent: outgoing ? 'flex-end' : 'flex-start',
        },
        style,
      ]}
      testID={testID}
    >
      {withAvatar ? (
        <Avatar size={avatarSize} source={avatarSource} name={senderName} alt={senderName} />
      ) : null}
      <View
        accessible
        accessibilityLabel={label}
        style={{
          ...bubbleRadii(direction, 'single'),
          backgroundColor: side.fill,
          borderWidth: side.border === undefined ? 0 : 1,
          borderColor: side.border,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: BUBBLE_PADDING_X,
          paddingRight: BUBBLE_PADDING_X,
        }}
      >
        <TypingDots color={side.meta} label="" />
      </View>
    </View>
  );
}

export const TypingBubble = memo(TypingBubbleComponent);
TypingBubble.displayName = 'TypingBubble';
