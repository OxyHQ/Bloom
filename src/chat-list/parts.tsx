import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { webDataSet } from '../styles/web-data';
import { AvatarPresence } from '../chat-indicators';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { GroupAvatar } from './GroupAvatar';
import { CHAT_ROW_RADIUS, IS_WEB, type ChatListPaint } from './shared';
import type { ChatAction, ChatFace, ChatIconComponent } from './types';
import type { AvatarShape } from '../avatar/types';
import type { PresenceStatus } from '../chat-indicators/types';

// ---------------------------------------------------------------------------
//  The link that covers a row
// ---------------------------------------------------------------------------

export interface RowLinkProps {
  /** The whole row, read aloud. */
  name: string;
  onPress?: () => void;
  onLongPress?: () => void;
  href?: string;
  selected?: boolean;
  paint: ChatListPaint;
  /** Fires on press-in/out so the row can paint itself pressed on native. */
  onPressedChange?: (pressed: boolean) => void;
  testID?: string;
}

/**
 * A ROW'S LINK IS A SIBLING LAID UNDER ITS CONTENT, NOT A WRAPPER AROUND IT. It
 * fills the row absolutely and carries the whole composed name; the avatar and
 * the two text lines are drawn over it with `pointerEvents="none"`, so a press
 * anywhere on them falls through, while the hover action buttons are drawn over
 * it as their OWN targets. A button inside an anchor is invalid HTML and would
 * make every "Archive" click open the conversation.
 */
export function RowLink({
  name,
  onPress,
  onLongPress,
  href,
  selected = false,
  paint,
  onPressedChange,
  testID,
}: RowLinkProps) {
  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      if (IS_WEB && href) event.preventDefault();
      onPress();
      return;
    }
    if (!IS_WEB && href) void Linking.openURL(href).catch(() => undefined);
  };
  const interactive = Boolean(onPress || href || onLongPress);
  const style: WebCssStyle = {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CHAT_ROW_RADIUS,
    '--bloom-chat-ring': paint.ring,
  };
  return (
    <Pressable
      {...webDataSet({ bloomChatFocusable: '' })}
      {...(IS_WEB && href ? { href } : null)}
      {...(IS_WEB && selected ? { 'aria-current': 'true' } : null)}
      role={href ? 'link' : interactive ? 'button' : undefined}
      accessibilityLabel={name}
      // `selected` on a link is `aria-current` on web — `aria-selected` is for a
      // tab or an option, and a row is neither. Native reads the state object.
      accessibilityState={{ selected }}
      onPress={onPress || (!IS_WEB && href) ? handlePress : undefined}
      onLongPress={onLongPress}
      onPressIn={onPressedChange ? () => onPressedChange(true) : undefined}
      onPressOut={onPressedChange ? () => onPressedChange(false) : undefined}
      style={style}
      testID={testID}
    />
  );
}

// ---------------------------------------------------------------------------
//  A round glyph button
// ---------------------------------------------------------------------------

export interface ChatGlyphButtonProps {
  label: string;
  icon: ChatIconComponent;
  onPress?: () => void;
  size?: number;
  glyph?: number;
  color: string;
  hoverFill: string;
  ring: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The round icon button the hover actions and the search field's clear use.
 * Hover and press are a COLOUR CHANGE ONLY — nothing in this family scales.
 */
export function ChatGlyphButton({
  label,
  icon: Icon,
  onPress,
  size = 32,
  glyph = 18,
  color,
  hoverFill,
  ring,
  style,
  testID,
}: ChatGlyphButtonProps) {
  const [active, setActive] = useState(false);
  const buttonStyle: WebCssStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: active ? hoverFill : 'transparent',
    '--bloom-chat-ring': ring,
    ...(IS_WEB
      ? { transitionProperty: 'background-color', transitionDuration: '120ms' }
      : null),
  };
  return (
    <Pressable
      {...webDataSet({ bloomChatFocusable: '' })}
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onPressIn={() => setActive(true)}
      onPressOut={() => setActive(false)}
      style={[buttonStyle, style]}
      testID={testID}
    >
      <Icon width={glyph} height={glyph} fill={color} />
    </Pressable>
  );
}

/** The glyph colour an action's tone paints, on the page (not on a filled pane). */
export function actionGlyphColor(action: ChatAction, paint: ChatListPaint): string {
  switch (action.tone) {
    case 'negative':
      return paint.negative;
    case 'accent':
      return paint.accent;
    default:
      return paint.textMuted;
  }
}

/** The pane fill an action's tone paints behind a swipe, and the text on it. */
export function actionPanePaint(
  action: ChatAction,
  paint: ChatListPaint,
): { background: string; foreground: string } {
  switch (action.tone) {
    case 'negative':
      return { background: paint.negativeFill, foreground: paint.onAccent };
    case 'accent':
      return { background: paint.accent, foreground: paint.onAccent };
    default:
      return { background: paint.neutralAction, foreground: paint.onNeutralAction };
  }
}

// ---------------------------------------------------------------------------
//  The avatar slot
// ---------------------------------------------------------------------------

export interface ChatAvatarProps {
  name: string;
  avatar?: string;
  faces?: readonly ChatFace[];
  shape?: AvatarShape;
  status?: PresenceStatus;
  size: number;
  paint: ChatListPaint;
  testID?: string;
}

/**
 * A group's face cluster, or one avatar with its presence dot. A group has no
 * presence: "online" is a property of a person, and a dot on a cluster of four
 * would be claiming it about whichever face it happens to land on.
 */
export function ChatAvatar({
  name,
  avatar,
  faces,
  shape = 'circle',
  status,
  size,
  paint,
  testID,
}: ChatAvatarProps) {
  if (faces && faces.length > 1) {
    return (
      <GroupAvatar
        faces={faces}
        size={size}
        shape={shape}
        ringColor={paint.background}
        testID={testID}
      />
    );
  }
  return (
    <AvatarPresence
      source={avatar ?? faces?.[0]?.source ?? null}
      name={name}
      size={size}
      shape={shape}
      status={status}
      presenceRingColor={paint.background}
      testID={testID}
    />
  );
}

// ---------------------------------------------------------------------------
//  A section heading
// ---------------------------------------------------------------------------

export function SectionHeading({
  title,
  paint,
  paddingHorizontal,
  testID,
}: {
  title: string;
  paint: ChatListPaint;
  paddingHorizontal: number;
  testID?: string;
}) {
  return (
    <View
      role="presentation"
      style={{
        paddingLeft: paddingHorizontal,
        paddingRight: paddingHorizontal,
        paddingTop: 12,
        paddingBottom: 4,
      }}
      testID={testID}
    >
      <Text variant="caption-1-semibold" style={{ color: paint.heading }}>
        {title}
      </Text>
    </View>
  );
}
