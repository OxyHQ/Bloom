import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../avatar/Avatar';
import { Button } from '../button';
import { RiCameraLine } from '../icons/remix/RiCameraLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiUserAddLine } from '../icons/remix/RiUserAddLine';
import { TextFieldInput } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { NEW_GROUP_LABELS, nameCounterTone, resolveChatPeoplePaint } from './shared';
import type { NewGroupFormProps } from './types';

/**
 * `NewGroupForm`: the sheet that turns a pile of selected people into a group.
 *
 *   photo   a 72px round picker — the picked image, or a camera glyph on the
 *           accent-tinted fill
 *   name    a field with a live `12/64` counter, the input's own `maxLength`
 *           set to the same number
 *   about   an optional multi-line field
 *   members the chosen people, each removable, over an "Add members" row
 *
 * The COUNTER and the LIMIT are one number. Setting `maxLength` on the input
 * and drawing a denominator from a different constant is how a counter ends up
 * saying 64 while the field stops at 50, and nothing catches it: both halves
 * look right on their own.
 *
 * The counter goes amber at 90%, not at 100%. The input has already stopped
 * accepting characters by then, so a warning that arrives at the limit is
 * telling the user about something that has already happened.
 */

const PHOTO = 72;

function NewGroupFormComponent({
  photo,
  photoVariant,
  onPickPhoto,
  name,
  onNameChange,
  nameMaxLength = 64,
  description,
  onDescriptionChange,
  descriptionMaxLength = 255,
  members = [],
  onRemoveMember,
  onAddMembers,
  labels,
  children,
  style,
  testID,
}: NewGroupFormProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatPeoplePaint(theme), [theme]);
  const l = { ...NEW_GROUP_LABELS, ...labels };
  const tone = nameCounterTone(name.length, nameMaxLength);
  const counterColor =
    tone === 'over' ? paint.negative : tone === 'warn' ? paint.owner : paint.textTertiary;

  return (
    <View style={[{ gap: 20 }, style]} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
        {onPickPhoto === undefined ? null : (
          <Pressable
            role="button"
            accessibilityLabel={l.photo}
            onPress={onPickPhoto}
            style={{
              width: PHOTO,
              height: PHOTO,
              borderRadius: PHOTO / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: paint.accentSubtle,
              overflow: 'hidden',
            }}
            testID={testID ? `${testID}-photo` : undefined}
          >
            {photo === undefined || photo === null ? (
              <RiCameraLine width={26} height={26} fill={paint.onAccentSubtle} />
            ) : (
              <Avatar source={photo} variant={photoVariant} name="" size={PHOTO} />
            )}
          </Pressable>
        )}

        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <TextFieldInput
            label={l.name}
            placeholder={l.namePlaceholder}
            value={name}
            onChangeText={onNameChange}
            maxLength={nameMaxLength}
            testID={testID ? `${testID}-name` : undefined}
          />
          <Text
            variant="caption-1-regular"
            style={{ color: counterColor, alignSelf: 'flex-end', fontVariant: ['tabular-nums'] }}
            testID={testID ? `${testID}-counter` : undefined}
          >
            {`${name.length}/${nameMaxLength}`}
          </Text>
        </View>
      </View>

      {onDescriptionChange === undefined ? null : (
        <TextFieldInput
          label={l.description}
          placeholder={l.descriptionPlaceholder}
          value={description ?? ''}
          onChangeText={onDescriptionChange}
          maxLength={descriptionMaxLength}
          multiline
          numberOfLines={3}
          testID={testID ? `${testID}-description` : undefined}
        />
      )}

      {children}

      {members.length === 0 && onAddMembers === undefined ? null : (
        <View style={{ gap: 6 }}>
          <Text
            variant="caption-1-semibold"
            style={{ color: paint.textSecondary, paddingLeft: 4 }}
            testID={testID ? `${testID}-members-title` : undefined}
          >
            {l.members(members.length)}
          </Text>

          {onAddMembers === undefined ? null : (
            <View style={{ alignItems: 'flex-start' }}>
              <Button
                variant="text"
                size="small"
                leadingIcon={RiUserAddLine}
                onPress={onAddMembers}
                testID={testID ? `${testID}-add` : undefined}
              >
                {l.addMembers}
              </Button>
            </View>
          )}

          {members.map((member) => (
            <View
              key={member.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingTop: 6,
                paddingRight: 8,
                paddingBottom: 6,
                paddingLeft: 4,
              }}
              testID={testID ? `${testID}-member-${member.id}` : undefined}
            >
              <Avatar
                source={member.avatar}
                variant={member.avatarVariant}
                name={member.name}
                size={36}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="body-medium" numberOfLines={1} style={{ color: paint.text }}>
                  {member.name}
                </Text>
                {member.subtitle === undefined ? null : (
                  <Text
                    variant="caption-1-regular"
                    numberOfLines={1}
                    style={{ color: paint.textSecondary }}
                  >
                    {member.subtitle}
                  </Text>
                )}
              </View>
              {onRemoveMember === undefined ? null : (
                <Pressable
                  role="button"
                  accessibilityLabel={l.remove(member.name)}
                  onPress={() => onRemoveMember(member.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  testID={testID ? `${testID}-remove-${member.id}` : undefined}
                >
                  <RiCloseLine width={16} height={16} fill={paint.textSecondary} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export const NewGroupForm = memo(NewGroupFormComponent);
NewGroupForm.displayName = 'NewGroupForm';
