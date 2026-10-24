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
import { CHAT_ROW_RADIUS, type ChatListPaint } from './shared';
import type { ChatAction, ChatFace, ChatIconComponent } from './types';
import type { Shape } from '../shapes';
import type { PresenceStatus } from '../chat-indicators/types';
import { IS_WEB } from '../styles/platform';

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
  /**
   * The fill the link paints over the row WHILE Pressable reports it pressed;
   * omit for none. Native only: on web the adopted sheet owns the fill.
   */
  pressedFill?: string;
  testID?: string;
}

/**
 * A ROW'S LINK IS A SIBLING LAID UNDER ITS CONTENT, NOT A WRAPPER AROUND IT. It
 * fills the row absolutely and carries the whole composed name; the avatar and
 * the two text lines are drawn over it with `pointerEvents="none"`, so a press
 * anywhere on them falls through, while the hover action buttons are drawn over
 * it as their OWN targets. A button inside an anchor is invalid HTML and would
 * make every "Archive" click open the conversation.
 *
 * THE PRESSED FILL IS PRESSABLE'S OWN `pressed`, read in a style function and
 * painted on the link itself (it fills the row and sits under the content). It
 * used to be MIRRORED into the row's state from `onPressIn`/`onPressOut`, and a
 * mirror is only as good as the last press-out it heard: on Android a tap that
 * pushes a screen can lose it (the delayed press-out is a timer the Pressable
 * cancels when it unmounts or resets), and the row came back still painted
 * pressed. A fill derived from the Pressable has no second copy to go stale.
 */
export function RowLink({
  name,
  onPress,
  onLongPress,
  href,
  selected = false,
  paint,
  pressedFill,
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
    ...StyleSheet.absoluteFill,
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
      style={
        pressedFill === undefined
          ? style
          : ({ pressed }) => (pressed ? [style, { backgroundColor: pressedFill }] : style)
      }
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
  // Hover is mirrored (Pressable reports no hover on native); PRESS is read from
  // Pressable itself, so a lost press-out cannot leave the button lit (RowLink).
  const [hovered, setHovered] = useState(false);
  const buttonStyle = (active: boolean): WebCssStyle => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: active ? hoverFill : 'transparent',
    '--bloom-chat-ring': ring,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '120ms' } : null),
  });
  return (
    <Pressable
      {...webDataSet({ bloomChatFocusable: '' })}
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [buttonStyle(hovered || pressed), style]}
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

// ---------------------------------------------------------------------------
//  The avatar slot
// ---------------------------------------------------------------------------

export interface ChatAvatarProps {
  name: string;
  avatar?: string;
  faces?: readonly ChatFace[];
  shape?: Shape;
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
