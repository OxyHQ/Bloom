import React, { memo } from 'react';
import { Pressable, View, type StyleProp, type TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { MessageStatus } from '../chat-indicators';
import type { MessageDeliveryStatus } from '../chat-indicators';
import { webDataSet } from '../checkbox/shared';
import { RiAddLine, RiEyeLine, RiRefreshLine, RiShareForwardLine } from '../icons/remix';
import { Text } from '../typography';
import {
  BUBBLE_TAIL_RADIUS,
  QUOTE_BAR_WIDTH,
  TAIL_HEIGHT,
  TAIL_WIDTH,
  reactionLabel,
  splitMessageText,
  type BubbleSidePaint,
  type MessageBubblePaint,
} from './shared';
import type {
  MessageDirection,
  MessageEntity,
  MessageReaction,
  MessageReplyPreview,
} from './types';

// ---------------------------------------------------------------------------
//  The tail
// ---------------------------------------------------------------------------

/**
 * The notch on the cut corner. It is a SHAPE, not a rotated square: a square
 * would show its own two edges where it meets the bubble, and on a translucent
 * or bordered incoming bubble that seam is visible. This path starts flush with
 * the bubble's straight edge, sweeps out and curls back, so the bubble and the
 * notch share one silhouette.
 *
 * Drawn OUTSIDE the bubble box (`position: absolute`, negative offset) so
 * turning the tail on never re-lays-out the transcript.
 */
function BubbleTailComponent({
  direction,
  color,
  border,
}: {
  direction: MessageDirection;
  color: string;
  border: string | undefined;
}) {
  const outgoing = direction === 'outgoing';
  // A 8 x 13 box whose left edge is the bubble's edge.
  const d = outgoing
    ? `M0 0 L0 ${TAIL_HEIGHT} C${TAIL_WIDTH * 0.2} ${TAIL_HEIGHT} ${TAIL_WIDTH} ${TAIL_HEIGHT - 2} ${TAIL_WIDTH} ${TAIL_HEIGHT - 5} C${TAIL_WIDTH - 1} ${TAIL_HEIGHT - 7} ${BUBBLE_TAIL_RADIUS} ${TAIL_HEIGHT - 6} ${BUBBLE_TAIL_RADIUS} ${TAIL_HEIGHT - 9} L${BUBBLE_TAIL_RADIUS} 0 Z`
    : `M${TAIL_WIDTH} 0 L${TAIL_WIDTH} ${TAIL_HEIGHT} C${TAIL_WIDTH * 0.8} ${TAIL_HEIGHT} 0 ${TAIL_HEIGHT - 2} 0 ${TAIL_HEIGHT - 5} C1 ${TAIL_HEIGHT - 7} ${TAIL_WIDTH - BUBBLE_TAIL_RADIUS} ${TAIL_HEIGHT - 6} ${TAIL_WIDTH - BUBBLE_TAIL_RADIUS} ${TAIL_HEIGHT - 9} L${TAIL_WIDTH - BUBBLE_TAIL_RADIUS} 0 Z`;
  return (
    <View
      aria-hidden
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 0,
        width: TAIL_WIDTH,
        height: TAIL_HEIGHT,
        ...(outgoing ? { right: -TAIL_WIDTH + 1 } : { left: -TAIL_WIDTH + 1 }),
      }}
    >
      <Svg width={TAIL_WIDTH} height={TAIL_HEIGHT} viewBox={`0 0 ${TAIL_WIDTH} ${TAIL_HEIGHT}`}>
        <Path d={d} fill={color} stroke={border} strokeWidth={border === undefined ? 0 : 1} />
      </Svg>
    </View>
  );
}

export const BubbleTail = memo(BubbleTailComponent);
BubbleTail.displayName = 'BubbleTail';

// ---------------------------------------------------------------------------
//  Message text
// ---------------------------------------------------------------------------

/**
 * The message body. Selectable on web (`userSelect: 'text'` — a transcript you
 * cannot copy out of is a transcript people screenshot), and split into
 * entities so a caller can make a mention pressable without re-implementing
 * text layout: the spans are returned INSIDE one `Text`, so the line breaking
 * stays the platform's.
 */
function MessageTextComponent({
  text,
  side,
  renderEntity,
  style,
}: {
  text: string;
  side: BubbleSidePaint;
  renderEntity?: (entity: MessageEntity) => React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const parts = splitMessageText(text);
  return (
    <Text
      variant="body-regular"
      selectable
      style={[{ color: side.text, userSelect: 'text' }, style]}
    >
      {parts.map((part, index) => {
        if (part.entity === undefined) return part.text;
        const key = `${part.entity.type}-${part.entity.start}`;
        const custom = renderEntity?.(part.entity);
        if (custom !== undefined && custom !== null) {
          return <React.Fragment key={key}>{custom}</React.Fragment>;
        }
        return (
          <Text key={key} variant="body-regular" style={{ color: side.accent }}>
            {part.text}
          </Text>
        );
      })}
    </Text>
  );
}

export const MessageText = memo(MessageTextComponent);
MessageText.displayName = 'MessageText';

// ---------------------------------------------------------------------------
//  Forwarded line
// ---------------------------------------------------------------------------

export function ForwardedLine({
  name,
  prefix,
  side,
}: {
  name: string;
  prefix: string;
  side: BubbleSidePaint;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <RiShareForwardLine width={12} height={12} fill={side.meta} />
      <Text variant="caption-1-regular" style={{ color: side.meta, fontStyle: 'italic' }}>
        {`${prefix} ${name}`}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Reply quote
// ---------------------------------------------------------------------------

/**
 * The quoted message above a reply: a 3px bar in the quoted sender's colour,
 * their name, and one line of what they said. Pressable when the transcript can
 * jump to the original — and only then, so a quote that goes nowhere is not a
 * control that does nothing.
 */
export function ReplyQuote({
  quote,
  side,
  onPress,
  label,
}: {
  quote: MessageReplyPreview;
  side: BubbleSidePaint;
  onPress?: () => void;
  label: string;
}) {
  const color = quote.color ?? side.accent;
  const body = (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: side.quoteFill,
        paddingVertical: 4,
        paddingRight: 8,
      }}
    >
      <View style={{ width: QUOTE_BAR_WIDTH, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ flexShrink: 1, gap: 1 }}>
        <Text variant="body-2-medium" numberOfLines={1} style={{ color }}>
          {quote.senderName}
        </Text>
        <Text variant="body-2-regular" numberOfLines={1} style={{ color: side.meta }}>
          {quote.preview}
        </Text>
      </View>
    </View>
  );
  if (onPress === undefined) return body;
  return (
    <Pressable
      role="button"
      accessibilityLabel={`${label}: ${quote.senderName}, ${quote.preview}`}
      onPress={onPress}
      style={{ borderRadius: 6 }}
    >
      {body}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  Meta row
// ---------------------------------------------------------------------------

/**
 * Time, "edited", channel views and the delivery ticks — the row that tucks
 * itself after the last word of the message.
 *
 * Every glyph in it is `aria-hidden`: the bubble's own accessible name already
 * carries the time and the delivery state in words, and a screen reader reading
 * "Read" twice per message is the cost of announcing both.
 */
export function MetaRow({
  time,
  status,
  direction,
  editedLabel,
  channelViews,
  authorSignature,
  color,
  size = 12,
}: {
  time?: string;
  status?: MessageDeliveryStatus;
  direction: MessageDirection;
  editedLabel?: string;
  channelViews?: string;
  authorSignature?: string;
  color: string;
  size?: 12 | 14;
}) {
  const showStatus = direction === 'outgoing' && status !== undefined;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {authorSignature === undefined ? null : (
        <Text variant="caption-2-regular" style={{ color, fontStyle: 'italic' }}>
          {authorSignature}
        </Text>
      )}
      {channelViews === undefined ? null : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <RiEyeLine width={size} height={size} fill={color} />
          <Text variant="caption-2-regular" style={{ color }}>
            {channelViews}
          </Text>
        </View>
      )}
      {editedLabel === undefined || editedLabel === '' ? null : (
        <Text variant="caption-2-regular" style={{ color, fontStyle: 'italic' }}>
          {editedLabel}
        </Text>
      )}
      {time === undefined ? null : (
        <Text variant="caption-2-regular" style={{ color }}>
          {time}
        </Text>
      )}
      {showStatus ? <MessageStatus status={status} size={size} color={color} label="" /> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Reactions
// ---------------------------------------------------------------------------

/**
 * The pills under a bubble. They OVERLAP it by 8px, which is what makes them
 * read as attached to the message rather than as a row of their own, and they
 * wrap — a message with nine reactions is a real message.
 *
 * Each pill is a toggle: `aria-pressed` for web and `accessibilityState.selected`
 * for native, because React Native has no pressed state and react-native-web
 * ignores `accessibilityState`. Missing either half is silent on one platform.
 */
export function ReactionRow({
  reactions,
  paint,
  direction,
  onToggle,
  onAdd,
  addLabel,
}: {
  reactions: readonly MessageReaction[];
  paint: MessageBubblePaint;
  direction: MessageDirection;
  onToggle?: (emoji: string) => void;
  onAdd?: () => void;
  addLabel: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: -8,
        justifyContent: direction === 'outgoing' ? 'flex-end' : 'flex-start',
      }}
    >
      {reactions.map((reaction) => {
        const mine = reaction.mine === true;
        return (
          <Pressable
            key={reaction.emoji}
            role="button"
            accessibilityLabel={reaction.label ?? reactionLabel(reaction.emoji, reaction.count, mine)}
            aria-pressed={mine}
            accessibilityState={{ selected: mine }}
            onPress={onToggle === undefined ? undefined : () => onToggle(reaction.emoji)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              height: 24,
              paddingHorizontal: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: mine ? paint.reactionMineBorder : paint.reactionRing,
              backgroundColor: mine ? paint.reactionMineFill : paint.reactionFill,
            }}
          >
            <Text variant="caption-1-regular" style={{ color: mine ? paint.reactionMineText : paint.reactionText }}>
              {reaction.emoji}
            </Text>
            <Text
              variant="caption-1-medium"
              style={{ color: mine ? paint.reactionMineText : paint.reactionText }}
            >
              {String(reaction.count)}
            </Text>
          </Pressable>
        );
      })}
      {onAdd === undefined ? null : (
        <Pressable
          role="button"
          accessibilityLabel={addLabel}
          onPress={onAdd}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: 24,
            width: 28,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: paint.reactionRing,
            backgroundColor: paint.reactionFill,
          }}
        >
          <RiAddLine width={14} height={14} fill={paint.reactionText} />
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Retry
// ---------------------------------------------------------------------------

/** The affordance beside a failed message. Outside the bubble, on the row. */
export function RetryButton({
  onPress,
  label,
  color,
}: {
  onPress: () => void;
  label: string;
  color: string;
}) {
  return (
    <Pressable
      {...webDataSet({ bloomMessageRetry: '' })}
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RiRefreshLine width={16} height={16} fill={color} />
    </Pressable>
  );
}
