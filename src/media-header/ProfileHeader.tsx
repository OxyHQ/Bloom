import React, { memo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { Text } from '../typography';
import { FollowButton, MediaMoreButton } from './MediaActionBar';
import {
  Cover,
  Dot,
  HeaderTitle,
  InlineLink,
  MediaHeaderFrame,
  useMediaHeaderPaint,
} from './parts';
import { selectTitleVariant } from './shared';
import type { ProfileHeaderProps } from './types';
import { useMessages } from '../locale/messages';
import { MEDIA_HEADER_MESSAGES } from './messages';

/**
 * A listener's profile.
 *
 *   band     round avatar 232 (narrow 160 centred) · "Profile" · name (display
 *            steps) · counts: "12 public playlists • 48 followers • 30 following",
 *            each a link when it has `onPress`
 *   row      Follow pill (another listener) or "Edit profile" (your own) · more
 */

function ProfileHeaderComponent({
  name,
  avatar,
  typeLabel: typeLabelProp,
  stats,
  following = false,
  onFollowChange,
  onEditPress,
  editLabel: editLabelProp,
  onMorePress,
  artworkColor,
  actions,
  headingLevel = 1,
  style,
  testID,
}: ProfileHeaderProps) {
  const { messages } = useMessages(MEDIA_HEADER_MESSAGES);
  const typeLabel = typeLabelProp ?? messages.profile;
  const editLabel = editLabelProp ?? messages.editProfile;
  const paint = useMediaHeaderPaint(artworkColor);
  const hasRow = onFollowChange || onEditPress || onMorePress || actions;
  const row = hasRow ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {onFollowChange ? (
        <FollowButton
          following={following}
          onFollowChange={onFollowChange}
          size="md"
          testID={testID ? `${testID}-follow` : undefined}
        />
      ) : null}
      {onEditPress ? (
        <Button
          size="md"
          onPress={onEditPress}
          testID={testID ? `${testID}-edit` : undefined}
          tone="neutral"
          appearance="outline"
        >
          {editLabel}
        </Button>
      ) : null}
      {onMorePress ? (
        <MediaMoreButton onPress={onMorePress} testID={testID ? `${testID}-more` : undefined} />
      ) : null}
      {actions}
    </View>
  ) : undefined;

  return (
    <MediaHeaderFrame
      paint={paint}
      style={style}
      testID={testID}
      actions={row}
      coverWidth={(wide) => (wide ? 232 : 160)}
      cover={({ wide }) => (
        <Cover
          source={avatar}
          size={wide ? 232 : 160}
          shape="round"
          paint={paint}
          testID={testID ? `${testID}-avatar` : undefined}
        />
      )}
    >
      {({ textWidth }) => (
        <>
          <Text variant="body-medium" style={{ color: paint.onBand }}>
            {typeLabel}
          </Text>
          <HeaderTitle
            variant={selectTitleVariant(name, textWidth)}
            color={paint.onBand}
            level={headingLevel}
            numberOfLines={2}
            testID={testID ? `${testID}-name` : undefined}
          >
            {name}
          </HeaderTitle>
          {stats && stats.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                columnGap: 4,
                marginTop: 4,
              }}
              testID={testID ? `${testID}-stats` : undefined}
            >
              {stats.map((stat, i) => (
                <React.Fragment key={`${stat.label}-${i}`}>
                  {i > 0 ? <Dot color={paint.onBandMuted} /> : null}
                  <InlineLink
                    label={stat.label}
                    onPress={stat.onPress}
                    color={stat.onPress ? paint.onBand : paint.onBandMuted}
                    variant="body-medium"
                    ring={paint.ring}
                  />
                </React.Fragment>
              ))}
            </View>
          ) : null}
        </>
      )}
    </MediaHeaderFrame>
  );
}

export const ProfileHeader = memo(ProfileHeaderComponent);
ProfileHeader.displayName = 'ProfileHeader';
