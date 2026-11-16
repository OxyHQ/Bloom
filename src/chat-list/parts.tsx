import { AvatarGroup } from '../avatar-group';
import { useState } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { webDataSet } from '../styles/web-data';
import { AvatarPresence } from '../chat-indicators';
import type { WebCssStyle } from '../styles/web-view-style';
import type { ChatListPaint } from './shared';
import type { ChatFace, ChatIconComponent } from './types';
import type { Shape } from '../shapes';
import type { PresenceStatus } from '../chat-indicators/types';
import { IS_WEB } from '../styles/platform';

// ---------------------------------------------------------------------------
//  The link that covers a row
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
      <AvatarGroup
        layout="conversation"
        showInitials
        items={faces.map((face) => ({
          uri: 'source' in face ? face.source : undefined,
          name: face.name,
          initials: 'initials' in face ? face.initials : undefined,
        }))}
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
