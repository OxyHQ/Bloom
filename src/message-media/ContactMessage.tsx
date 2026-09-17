import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../avatar';
import { webDataSet } from '../checkbox/shared';
import { borderRadius, space } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useHovered, useMessageMediaCss } from './parts';
import {
  fileMetaLine,
  MESSAGE_MEDIA_RADIUS,
  MESSAGE_MEDIA_WIDTH,
  resolveMessageMediaPaint,
  type MessageMediaPaint,
} from './shared';
import type { ContactMessageProps } from './types';

/** The first letters of the first two words — the same rule `Avatar` uses. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

function ContactAction({
  label,
  paint,
  onPress,
  emphasis,
  testID,
}: {
  label: string;
  paint: MessageMediaPaint;
  onPress: () => void;
  emphasis: boolean;
  testID?: string;
}) {
  const [hovered, handlers] = useHovered();
  const style: WebCssStyle = {
    flexGrow: 1,
    flexBasis: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: borderRadius.full,
    backgroundColor: hovered ? paint.washStrong : paint.wash,
    '--bloom-message-media-ring': paint.ring,
  };
  return (
    <Pressable
      {...webDataSet({ bloomMessageMediaPressable: '' })}
      {...handlers}
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={style}
      testID={testID}
    >
      <Text
        variant="body-2-medium"
        style={{ color: emphasis ? paint.accent : paint.text }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * A shared contact: who it is, and the two things you can do about it.
 *
 * The actions are a ROW of equal halves rather than a primary button and a text
 * link. "Message" and "Add" are the same size of decision — one starts a chat,
 * the other saves a number — and ranking one of them with a filled button inside
 * a bubble puts a second accent surface on an accent surface.
 *
 * Only the ACTIONS are pressable. The card itself is not: a contact card with no
 * handler that still highlights under the pointer promises something it does not
 * do, and every app that wants "open the contact" already has `onMessage`.
 */
function ContactMessageComponent({
  name,
  detail,
  avatar,
  avatarVariant,
  initials,
  onMessage,
  onAdd,
  messageLabel = 'Message',
  addLabel = 'Add',
  width = MESSAGE_MEDIA_WIDTH,
  radius = MESSAGE_MEDIA_RADIUS,
  accessibilityLabel,
  tone = 'incoming',
  onColor,
  bubbleColor,
  style,
  testID,
}: ContactMessageProps) {
  const theme = useTheme();
  useMessageMediaCss();
  const paint = useMemo(
    () => resolveMessageMediaPaint(theme, tone, onColor, bubbleColor),
    [theme, tone, onColor, bubbleColor],
  );

  return (
    <View
      role="group"
      accessibilityLabel={accessibilityLabel ?? fileMetaLine(['Contact', name, detail])}
      style={[{ width, borderRadius: radius }, style ?? null]}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Avatar
          source={avatar ?? null}
          variant={avatarVariant}
          size={44}
          name={name}
          initials={initials ?? initialsOf(name)}
        />
        <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: paint.text }}>
            {name}
          </Text>
          {detail ? (
            <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textMuted }}>
              {detail}
            </Text>
          ) : null}
        </View>
      </View>

      {onMessage || onAdd ? (
        <View style={{ flexDirection: 'row', gap: space.sm, paddingTop: space.md }}>
          {onMessage ? (
            <ContactAction
              label={messageLabel}
              paint={paint}
              onPress={onMessage}
              emphasis
              testID={testID ? `${testID}-message` : undefined}
            />
          ) : null}
          {onAdd ? (
            <ContactAction
              label={addLabel}
              paint={paint}
              onPress={onAdd}
              emphasis={false}
              testID={testID ? `${testID}-add` : undefined}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export const ContactMessage = memo(ContactMessageComponent);
ContactMessage.displayName = 'ContactMessage';
