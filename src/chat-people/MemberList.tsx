import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiUserAddLine } from '../icons/remix/RiUserAddLine';
import { TextField, TextFieldIcon, TextFieldInput } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MemberRow } from './MemberRow';
import { MEMBER_LABELS, resolveChatPeoplePaint } from './shared';
import type { MemberListProps } from './types';

/**
 * `MemberList`: a group's people, with a search field and an "Add members" row.
 *
 * The search field is CONTROLLED and filters nothing here. Which members match
 * "an" depends on how the app normalises accents, whether it searches handles
 * and phone numbers, and whether the list is paged from a server — none of
 * which a component can guess, and all of which it would get wrong silently.
 * Pass the filtered `members`; `emptyState` covers the search that found
 * nobody.
 */

function MemberListComponent({
  members,
  search,
  onSearchChange,
  searchPlaceholder = 'Search members',
  onAddMembers,
  addMembersLabel,
  onMemberPress,
  onPromote,
  onRestrict,
  onRemove,
  title,
  emptyState,
  labels,
  style,
  testID,
}: MemberListProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatPeoplePaint(theme), [theme]);
  const l = { ...MEMBER_LABELS, ...labels };
  const addLabel = addMembersLabel ?? 'Add members';

  return (
    <View style={[{ gap: 6 }, style]} testID={testID}>
      {onSearchChange === undefined ? null : (
        <TextField>
          <TextFieldIcon icon={RiSearchLine} />
          <TextFieldInput
            label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={search ?? ''}
            onChangeText={onSearchChange}
            testID={testID ? `${testID}-search` : undefined}
          />
        </TextField>
      )}

      {onAddMembers === undefined ? null : (
        <Pressable
          role="button"
          accessibilityLabel={addLabel}
          onPress={onAddMembers}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderRadius: 12,
            paddingTop: 10,
            paddingRight: 10,
            paddingBottom: 10,
            paddingLeft: 10,
          }}
          testID={testID ? `${testID}-add` : undefined}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: paint.accentSubtle,
            }}
          >
            <RiUserAddLine width={20} height={20} fill={paint.onAccentSubtle} />
          </View>
          <Text variant="body-medium" style={{ color: paint.accent }}>
            {addLabel}
          </Text>
        </Pressable>
      )}

      {title === undefined ? null : (
        <Text
          variant="caption-1-semibold"
          style={{
            color: paint.textSecondary,
            paddingTop: 8,
            paddingRight: 10,
            paddingBottom: 2,
            paddingLeft: 10,
          }}
          testID={testID ? `${testID}-title` : undefined}
        >
          {title}
        </Text>
      )}

      {members.length === 0
        ? emptyState
        : members.map((member) => (
            <MemberRow
              key={member.id}
              {...member}
              labels={member.labels ?? l}
              onPress={onMemberPress === undefined ? undefined : () => onMemberPress(member.id)}
              onPromote={onPromote === undefined ? undefined : () => onPromote(member.id)}
              onRestrict={onRestrict === undefined ? undefined : () => onRestrict(member.id)}
              onRemove={onRemove === undefined ? undefined : () => onRemove(member.id)}
              testID={testID ? `${testID}-member-${member.id}` : undefined}
            />
          ))}
    </View>
  );
}

export const MemberList = memo(MemberListComponent);
MemberList.displayName = 'MemberList';
