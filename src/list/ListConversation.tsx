import type { ComponentType } from 'react';
import { useMemo } from 'react';
import type React from 'react';
import { View, type TextStyle } from 'react-native';
import { MessageStatus, TypingDots, UnreadBadge } from '../chat-indicators';
import { RiNotificationOffFill } from '../icons/remix/RiNotificationOffFill';
import { RiPushpinFill } from '../icons/remix/RiPushpinFill';
import { ChatAvatar } from '../chat-list/parts';
import {
  CHAT_ATTACHMENT_ICONS,
  CHAT_ROW_GEOMETRY,
  chatMarker,
  composeChatRowName,
  hasUnread,
  resolveChatListPaint,
} from '../chat-list/shared';
import { CHAT_LIST_MESSAGES } from '../chat-list/messages';
import { CHAT_INDICATORS_MESSAGES } from '../chat-indicators/messages';
import { useMessages } from '../locale/messages';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import type { ListCommonProps, ListItemShellProps, ListConversationData } from './types';

/** Content recipe only. The same Shell owns every row's structure and interaction. */
export function ListConversation({
  Shell,
  conversation,
  ...props
}: ListCommonProps & {
  Shell: ComponentType<ListItemShellProps>;
  conversation: ListConversationData;
}) {
  const {
    name,
    avatar,
    faces,
    avatarShape = 'circle',
    status,
    kind = 'direct',
    verified,
    marker,
    preview,
    typingLabel,
    time,
    unreadCount,
    unreadDot,
    muted = false,
    pinned = false,
    outgoingStatus,
    labels,
  } = conversation;
  const { testID, label: accessibilityLabel } = props;
  const density = 'compact' as const;
  const theme = useTheme();
  const { messages } = useMessages(CHAT_LIST_MESSAGES);
  const { messages: indicatorMessages } = useMessages(CHAT_INDICATORS_MESSAGES);
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveChatListPaint(theme, surface), [theme, surface]);
  const text = useMemo(() => ({ ...messages.item, ...labels }), [messages, labels]);
  const geo = CHAT_ROW_GEOMETRY[density];
  const unread = hasUnread(unreadCount, unreadDot);
  const badge = chatMarker(kind, verified, text);

  const rowName =
    accessibilityLabel ??
    composeChatRowName(
      {
        name,
        markerLabel: badge?.label ?? null,
        typingLabel,
        preview,
        time,
        unreadCount,
        unreadDot,
        muted,
        pinned,
        outgoingStatus,
      },
      text,
      // A bare dot has no count to say: it is just "Unread".
      (count) => (count > 0 ? indicatorMessages.unreadCount(count) : indicatorMessages.unread),
      indicatorMessages.status,
    );

  // --- the preview line ----------------------------------------------------
  const previewColor = paint.textMuted;
  const previewType = TYPE_SCALE[geo.previewVariant];
  const prefixStyle: TextStyle = { color: previewColor };
  const draftStyle: TextStyle = { color: paint.negative, fontStyle: 'italic' };

  let previewLine: React.ReactNode = null;
  if (typingLabel !== undefined) {
    previewLine = (
      <TypingDots
        label={typingLabel}
        color={paint.accent}
        size={density === 'compact' ? 5 : 6}
        labelStyle={{ ...previewType, color: paint.accent }}
        testID={testID ? `${testID}-typing` : undefined}
      />
    );
  } else if (preview !== undefined) {
    // The glyph is drawn OUTSIDE the text so it never wraps away from its label
    // when the line truncates. A draft hides it: the draft prefix is the point
    // of the line, and two lead-ins compete.
    const AttachmentIcon =
      preview.attachment && !preview.draft ? CHAT_ATTACHMENT_ICONS[preview.attachment.kind] : null;
    const body = [preview.attachment?.label, preview.text].filter(Boolean).join(' ');
    previewLine = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 }}>
        {AttachmentIcon ? (
          <View testID={testID ? `${testID}-attachment` : undefined}>
            <AttachmentIcon width={geo.glyph} height={geo.glyph} fill={previewColor} />
          </View>
        ) : null}
        <Text
          variant={geo.previewVariant}
          numberOfLines={1}
          style={{ color: previewColor, flexShrink: 1, minWidth: 0 }}
          testID={testID ? `${testID}-preview` : undefined}
        >
          {preview.draft ? <Text style={draftStyle}>{`${text.draft} `}</Text> : null}
          {!preview.draft && preview.sender ? (
            <Text style={prefixStyle}>{`${preview.sender}: `}</Text>
          ) : null}
          {body}
        </Text>
      </View>
    );
  }

  // --- the right column ----------------------------------------------------
  const timeColor = unread && !muted ? paint.accent : paint.textMuted;
  const states = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {muted ? (
        <RiNotificationOffFill
          width={geo.glyph}
          height={geo.glyph}
          fill={paint.textMuted}
          testID={testID ? `${testID}-muted` : undefined}
        />
      ) : null}
      {pinned ? (
        <RiPushpinFill
          width={geo.glyph}
          height={geo.glyph}
          fill={paint.textMuted}
          testID={testID ? `${testID}-pinned` : undefined}
        />
      ) : null}
      {unread ? (
        <UnreadBadge
          count={unreadCount}
          dot={unreadDot}
          muted={muted}
          size={density === 'compact' ? 'sm' : 'md'}
          testID={testID ? `${testID}-unread` : undefined}
        />
      ) : outgoingStatus ? (
        <MessageStatus
          status={outgoingStatus}
          size={density === 'compact' ? 12 : 14}
          testID={testID ? `${testID}-status` : undefined}
        />
      ) : null}
    </View>
  );

  return (
    <Shell
      {...props}
      label={rowName}
      leading={
        props.leading !== undefined ? (
          props.leading
        ) : (
          <View pointerEvents="none" aria-hidden>
            <ChatAvatar
              name={name}
              avatar={avatar}
              faces={faces}
              shape={avatarShape}
              status={status}
              size={36}
              paint={paint}
              testID={testID ? `${testID}-avatar-image` : undefined}
            />
          </View>
        )
      }
      content={
        props.content !== undefined ? (
          props.content
        ) : (
          <View pointerEvents="none" aria-hidden style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <Text
                variant={unread ? 'body-semibold' : 'body-medium'}
                numberOfLines={1}
                style={{ color: paint.text, flexShrink: 1, minWidth: 0 }}
                testID={testID ? `${testID}-name` : undefined}
              >
                {name}
              </Text>
              {marker ??
                (badge ? (
                  <badge.icon
                    width={14}
                    height={14}
                    fill={badge.accent ? paint.accent : paint.textMuted}
                    testID={testID ? `${testID}-marker` : undefined}
                  />
                ) : null)}
            </View>
            {previewLine}
          </View>
        )
      }
      trailingMetadata={props.trailing === undefined}
      trailing={
        props.trailing !== undefined ? (
          props.trailing
        ) : (
          <View pointerEvents="none" aria-hidden style={{ alignItems: 'flex-end', gap: 3 }}>
            {time !== undefined ? (
              <Text
                variant="caption-2-regular"
                numberOfLines={1}
                style={{ color: timeColor }}
                testID={testID ? `${testID}-time` : undefined}
              >
                {time}
              </Text>
            ) : null}
            {states}
          </View>
        )
      }
    />
  );
}
