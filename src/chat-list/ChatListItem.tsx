import React, { memo, useEffect, useMemo, useState } from 'react';
import { View, type TextStyle } from 'react-native';

import { webDataSet } from '../checkbox/shared';
import { MessageStatus, TypingDots, UnreadBadge } from '../chat-indicators';
import { RiNotificationOffFill } from '../icons/remix/RiNotificationOffFill';
import { RiPushpinFill } from '../icons/remix/RiPushpinFill';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { ChatAvatar, ChatGlyphButton, RowLink, actionGlyphColor } from './parts';
import { ChatSwipeRow } from './ChatSwipeRow';
import {
  CHAT_ATTACHMENT_ICONS,
  CHAT_LIST_CSS,
  CHAT_LIST_STYLE_ID,
  CHAT_ROW_GEOMETRY,
  CHAT_ROW_RADIUS,
  DEFAULT_ITEM_LABELS,
  IS_WEB,
  chatMarker,
  composeChatRowName,
  hasUnread,
  resolveChatListPaint,
} from './shared';
import type { ChatAction, ChatListItemProps } from './types';

/**
 * One conversation in the list.
 *
 *   comfortable  72 tall · 16 padding · 48 avatar · 12 · name over preview ·
 *                right column: time, then the states
 *   compact      56 tall · 12 padding · 36 avatar · 10 · the same two lines one
 *                step down the ramp — the 360px desktop pane and search results
 *
 * The NAME turns semibold while anything is unread. The PREVIEW is one line and
 * takes whichever shape applies, in this order: a `draft` (italic "Draft:" in
 * the negative colour), an `attachment` (its glyph and the app's own words —
 * "Photo", "Voice message 0:12"), then the text, optionally led by a muted
 * `"You: "` / sender prefix. A `typingLabel` replaces the whole line with
 * bouncing dots.
 *
 * The RIGHT COLUMN is the time over the states: the mute bell, the pin, and then
 * EITHER an unread badge OR the delivery ticks of your own last message. Those
 * two are mutually exclusive by construction — if their message is the last one,
 * yours has no place in this row — and the badge wins.
 *
 * ACTIONS come from `swipeActions`. On touch a drag uncovers them; on web they
 * appear as icon buttons on hover and keyboard focus, over the right column,
 * because there is no drag gesture to discover there. The buttons are siblings
 * of the row's link, never children of it: a button inside an anchor is invalid
 * HTML and every "Archive" click would open the conversation.
 *
 * ACCESSIBILITY: the row is ONE target with ONE name, and the content is hidden
 * from assistive tech. A pin, a bell, a badge and a pair of ticks are four
 * states no text on the row carries, so the composed name says all of them —
 * "Ana Ferrer, Verified, Draft: see you at eight, 12:41, 3 unread messages,
 * Muted, Pinned". The open conversation is `aria-current` on web and
 * `accessibilityState.selected` on native.
 */

function ChatListItemComponent({
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
  density = 'comfortable',
  selected = false,
  onPress,
  onLongPress,
  href,
  swipeActions,
  onAction,
  swipeEnabled = !IS_WEB,
  accessibilityLabel,
  labels,
  style,
  testID,
}: ChatListItemProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(CHAT_LIST_STYLE_ID, CHAT_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveChatListPaint(theme), [theme]);
  const [pressed, setPressed] = useState(false);

  const text = useMemo(() => ({ ...DEFAULT_ITEM_LABELS, ...labels }), [labels]);
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
      (count) => (count === 1 ? '1 unread message' : `${count} unread messages`),
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
      preview.attachment && !preview.draft
        ? CHAT_ATTACHMENT_ICONS[preview.attachment.kind]
        : null;
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
          size={density === 'compact' ? 'small' : 'medium'}
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

  // --- hover actions (web) -------------------------------------------------
  const hoverActions: ChatAction[] = IS_WEB
    ? [...(swipeActions?.left ?? []), ...(swipeActions?.right ?? [])]
    : [];

  const rowStyle: WebCssStyle = {
    position: 'relative',
    height: geo.height,
    borderRadius: CHAT_ROW_RADIUS,
    justifyContent: 'center',
    '--bloom-chat-hover': paint.hover,
    '--bloom-chat-selected': paint.selected,
    // On web the fill is the adopted sheet's job: an inline `background-color`
    // would outrank the `:hover` rule and the row would never light up.
    ...(IS_WEB
      ? { transitionProperty: 'background-color', transitionDuration: '120ms' }
      : { backgroundColor: selected ? paint.selected : pressed ? paint.hover : 'transparent' }),
  };

  const row = (
    <View
      {...webDataSet({ bloomChatRow: '', selected: String(selected) })}
      style={[rowStyle, style]}
      testID={testID}
    >
      <RowLink
        name={rowName}
        onPress={onPress}
        onLongPress={onLongPress}
        href={href}
        selected={selected}
        paint={paint}
        onPressedChange={setPressed}
        testID={testID ? `${testID}-link` : undefined}
      />
      <View
        pointerEvents="none"
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: geo.height,
          paddingLeft: geo.paddingHorizontal,
          paddingRight: geo.paddingHorizontal,
        }}
      >
        <ChatAvatar
          name={name}
          avatar={avatar}
          faces={faces}
          shape={avatarShape}
          status={status}
          size={geo.avatar}
          paint={paint}
          testID={testID ? `${testID}-avatar` : undefined}
        />
        <View style={{ flex: 1, minWidth: 0, marginLeft: geo.gap, gap: geo.lineGap }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <Text
              variant={unread ? geo.nameUnreadVariant : geo.nameVariant}
              numberOfLines={1}
              style={{ color: paint.text, flexShrink: 1, minWidth: 0 }}
              testID={testID ? `${testID}-name` : undefined}
            >
              {name}
            </Text>
            {marker ?? (badge ? (
              <badge.icon
                width={geo.glyph}
                height={geo.glyph}
                fill={badge.accent ? paint.accent : paint.textMuted}
                testID={testID ? `${testID}-marker` : undefined}
              />
            ) : null)}
          </View>
          {previewLine}
        </View>
        <View style={{ alignItems: 'flex-end', gap: geo.lineGap + 1, marginLeft: geo.gap }}>
          {time !== undefined ? (
            <Text
              variant={geo.timeVariant}
              numberOfLines={1}
              style={{ color: timeColor }}
              testID={testID ? `${testID}-time` : undefined}
            >
              {time}
            </Text>
          ) : null}
          {states}
        </View>
      </View>
      {hoverActions.length > 0 ? (
        <View
          {...webDataSet({ bloomChatActions: '' })}
          style={{
            position: 'absolute',
            right: geo.paddingHorizontal - 4,
            top: 0,
            bottom: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
            paddingLeft: 12,
            borderTopRightRadius: CHAT_ROW_RADIUS,
            borderBottomRightRadius: CHAT_ROW_RADIUS,
            // Matches whatever fill the row shows WHILE the buttons are visible
            // (they only appear on hover/focus, and a selected row keeps its own
            // fill when hovered), so they read as part of the row, not a chip.
            backgroundColor: selected ? paint.selected : paint.hover,
          }}
          testID={testID ? `${testID}-actions` : undefined}
        >
          {hoverActions.map((action) => (
            <ChatGlyphButton
              key={action.key}
              label={action.label}
              icon={action.icon}
              color={actionGlyphColor(action, paint)}
              hoverFill={paint.selected}
              ring={paint.ring}
              size={density === 'compact' ? 28 : 32}
              glyph={density === 'compact' ? 16 : 18}
              onPress={() => {
                action.onPress?.();
                onAction?.(action.key);
              }}
              testID={testID ? `${testID}-action-${action.key}` : undefined}
            />
          ))}
        </View>
      ) : null}
    </View>
  );

  if (swipeActions && swipeEnabled && (swipeActions.left?.length || swipeActions.right?.length)) {
    return (
      <ChatSwipeRow
        actions={swipeActions}
        onAction={onAction}
        height={geo.height}
        paint={paint}
        testID={testID ? `${testID}-swipe` : undefined}
      >
        {row}
      </ChatSwipeRow>
    );
  }
  return row;
}

export const ChatListItem = memo(ChatListItemComponent);
ChatListItem.displayName = 'ChatListItem';
