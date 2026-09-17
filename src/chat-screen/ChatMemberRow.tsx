import React, { memo } from 'react';
import { Pressable, View } from 'react-native';

import { AvatarPresence } from '../chat-indicators/AvatarPresence';
import { Text } from '../typography';
import { CHAT_SCREEN_LABELS, useChatScreenPaint } from './shared';
import type { ChatMemberRowProps, ChatMemberRole } from './types';

const DEFAULT_ROLE_LABELS: Partial<Record<ChatMemberRole, string>> = {
  owner: CHAT_SCREEN_LABELS.owner,
  admin: CHAT_SCREEN_LABELS.admin,
};

/**
 * One person in a roster: avatar with presence, name, a second line, and a role
 * badge for the two roles that carry authority.
 *
 * `member` draws NO badge. A badge on every row is a badge on nobody — the point
 * of the mark is that owner and admin stand out from the rest, and a third
 * spelling of "ordinary" costs the same width it saves.
 *
 * The accessible name is composed from the name, the role and the second line in
 * that order, so a reader hears "Ana Restrepo, Owner, last seen recently" rather
 * than three separate stops.
 */
function ChatMemberRowComponent({
  member,
  onPress,
  roleLabels,
  avatarSize = 40,
  style,
  testID,
}: ChatMemberRowProps) {
  const paint = useChatScreenPaint();
  const labels = { ...DEFAULT_ROLE_LABELS, ...roleLabels };
  const role = member.role && member.role !== 'member' ? labels[member.role] : undefined;
  const name = [member.name, role, member.subtitle].filter(Boolean).join(', ');

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      <AvatarPresence
        source={member.source ?? undefined}
        name={member.name}
        size={avatarSize}
        status={member.status}
        // The dot's ring separates it from the row's surface, not from the page.
        presenceRingColor={paint.surface}
        presenceLabel=""
      />
      <View style={{ minWidth: 0, flexGrow: 1, flexShrink: 1 }}>
        <Text variant="body-medium" numberOfLines={1} style={{ color: paint.text }}>
          {member.name}
        </Text>
        {member.subtitle ? (
          <Text
            variant="caption-1-regular"
            numberOfLines={1}
            style={{ color: paint.textSecondary }}
          >
            {member.subtitle}
          </Text>
        ) : null}
      </View>
      {role ? (
        <View
          testID={testID ? `${testID}-role` : undefined}
          style={{
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 2,
            paddingBottom: 2,
            borderRadius: 999,
            backgroundColor: paint.accentSubtle,
          }}
        >
          <Text variant="caption-2-medium" style={{ color: paint.accentColor }}>
            {role}
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <View testID={testID} accessibilityRole="none" accessibilityLabel={name} style={style}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => onPress(member)}
      style={style}
    >
      {content}
    </Pressable>
  );
}

export const ChatMemberRow = memo(ChatMemberRowComponent);
ChatMemberRow.displayName = 'ChatMemberRow';
