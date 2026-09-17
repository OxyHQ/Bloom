import React, { Children, cloneElement, isValidElement, memo, useMemo } from 'react';
import { View } from 'react-native';

import { Avatar } from '../avatar';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  BUBBLE_PADDING_X,
  GROUP_GAP,
  RUN_GAP,
  bubblePositions,
  resolveMessageBubblePaint,
  senderNameColor,
} from './shared';
import type { MessageGroupProps, MessagePosition } from './types';

/**
 * A run of consecutive messages from one sender.
 *
 * It owns three things a single bubble cannot know:
 *
 *   - the GEOMETRY. `bubblePositions(count)` is applied to the children, so a
 *     caller never hand-assigns `'first' | 'middle' | 'last'` and a run cannot
 *     end up with two cut corners or none. The helper is exported for lists
 *     that render their own rows.
 *   - the AVATAR, at the run's BOTTOM edge for incoming runs — beside the last
 *     bubble, which is the one the tail hangs off. A 1:1 chat passes
 *     `showAvatar={false}`: an avatar repeated beside every message of a
 *     two-person conversation is noise.
 *   - the SENDER NAME, once, above the first bubble, in the per-sender hue from
 *     `senderNameColor`. The bubbles themselves then draw none.
 *
 * Spacing: 2px inside a run, 8px between runs (the run owns its own top
 * margin), so the block reads as one utterance and the gap between speakers
 * reads as a turn.
 *
 * A child that is not an element is passed through untouched, so a `{cond &&
 * …}` false, a string, or a caller's own row does not shift the positions of
 * the bubbles around it.
 */
function MessageGroupComponent({
  direction,
  children,
  senderName,
  senderColorSeed,
  senderColor,
  avatarSource,
  showAvatar,
  avatarSize = 28,
  onPressAvatar,
  showSenderName,
  style,
  testID,
}: MessageGroupProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMessageBubblePaint(theme), [theme]);
  const outgoing = direction === 'outgoing';

  const items = Children.toArray(children);
  const elements = items.filter(isValidElement);
  const positions = bubblePositions(elements.length);
  let cursor = 0;
  const positioned = items.map((child) => {
    if (!isValidElement<{ position?: MessagePosition }>(child)) return child;
    const position = positions[cursor++] ?? 'single';
    return cloneElement(child, { position });
  });

  const withAvatar = !outgoing && showAvatar !== false;
  const nameColor =
    senderColor ?? (senderName === undefined ? paint.muted : senderNameColor(senderColorSeed ?? senderName, theme));
  const drawName = (showSenderName ?? (senderName !== undefined && !outgoing)) && senderName !== undefined;

  return (
    <View style={[{ marginTop: GROUP_GAP }, style]} testID={testID}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 6,
          justifyContent: outgoing ? 'flex-end' : 'flex-start',
        }}
      >
        {withAvatar ? (
          <Avatar
            size={avatarSize}
            source={avatarSource}
            name={senderName}
            alt={senderName}
            onPress={onPressAvatar}
          />
        ) : null}
        {/*
          The run column GROWS, and its children STRETCH. Both halves matter,
          and both were wrong: a bubble's `maxWidth` is a PERCENTAGE, so a
          shrink-to-fit ancestor resolves it against that ancestor's own content
          width and every bubble gets clamped to 78% of its natural width and
          wraps for no reason. A column that grows but aligns its children to
          one edge re-introduces the same shrink one level down — which is why
          the side alignment is left to each row's own `justifyContent`, not
          taken here.
        */}
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, gap: RUN_GAP }}>
          {drawName ? (
            <Text
              variant="body-2-medium"
              numberOfLines={1}
              style={{
                color: nameColor,
                paddingLeft: BUBBLE_PADDING_X,
                paddingRight: BUBBLE_PADDING_X,
                textAlign: outgoing ? 'right' : 'left',
              }}
            >
              {senderName}
            </Text>
          ) : null}
          {positioned}
        </View>
      </View>
    </View>
  );
}

export const MessageGroup = memo(MessageGroupComponent);
MessageGroup.displayName = 'MessageGroup';
