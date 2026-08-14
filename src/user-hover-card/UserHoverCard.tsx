import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { Avatar } from '../avatar';
import { Card } from '../card';
import { VerifiedCheck } from '../icons/VerifiedCheck';
import { useTheme } from '../theme/use-theme';
import { fontSize, space } from '../styles/tokens';
import type { UserHoverCardProps } from './types';

const AVATAR_SIZE = 48;
const VERIFIED_SIZE = 16;

const UserHoverCardComponent: React.FC<UserHoverCardProps> = ({
  avatar,
  variant,
  displayName,
  username,
  bio,
  stats,
  verified = false,
  onPressProfile,
  action,
  style,
  testID,
}) => {
  const theme = useTheme();

  // Layout only — the chrome (card background, hairline border, `shadow-m`, the
  // `radius-16` rung) is `Card`'s. `overflow: 'visible'` restores the RN default
  // that `Card` overrides: this card clips nothing, and leaving it hidden would
  // change what an Android elevation draws under a rounded, clipped view.
  const layoutStyle: ViewStyle = {
    padding: space.lg,
    width: 280,
    overflow: 'visible',
  };

  const identity = (
    <View style={styles.identityRow}>
      <Avatar source={avatar ?? undefined} variant={variant} name={displayName} size={AVATAR_SIZE} />
      <View style={styles.identityText}>
        <View style={styles.nameRow}>
          <Text
            numberOfLines={1}
            style={[styles.displayName, { color: theme.colors.text }]}
          >
            {displayName}
          </Text>
          {verified && (
            <VerifiedCheck
              size="sm"
              fill={theme.colors.primary}
              width={VERIFIED_SIZE}
              height={VERIFIED_SIZE}
              style={styles.verifiedBadge}
            />
          )}
        </View>
        {username ? (
          <Text
            numberOfLines={1}
            style={[styles.username, { color: theme.colors.textSecondary }]}
          >
            @{username}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <Card
      variant="outlined"
      radius="radius-16"
      border="hairline"
      // `shadow-m` is the overlay role — menus, popovers, dialogs, and this card,
      // which is one.
      elevation="m"
      style={[layoutStyle, style]}
      testID={testID}
    >
      <View style={styles.header}>
        {onPressProfile ? (
          <Pressable
            onPress={onPressProfile}
            accessibilityRole="button"
            accessibilityLabel={
              username ? `${displayName} (@${username})` : displayName
            }
            style={styles.identityPressable}
          >
            {identity}
          </Pressable>
        ) : (
          <View style={styles.identityPressable}>{identity}</View>
        )}
        {action != null ? <View style={styles.action}>{action}</View> : null}
      </View>

      {bio ? (
        <Text
          numberOfLines={3}
          style={[styles.bio, { color: theme.colors.text }]}
        >
          {bio}
        </Text>
      ) : null}

      {stats && stats.length > 0 ? (
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stat.value}
              </Text>
              <Text
                style={[styles.statLabel, { color: theme.colors.textSecondary }]}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  identityPressable: {
    flexShrink: 1,
    flexGrow: 1,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  identityText: {
    flexShrink: 1,
    flexGrow: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  displayName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    flexShrink: 1,
  },
  verifiedBadge: {
    flexShrink: 0,
  },
  username: {
    fontSize: fontSize.sm,
    marginTop: space._2xs,
  },
  action: {
    flexShrink: 0,
  },
  bio: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
    marginTop: space.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: space.lg,
    marginTop: space.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.xs,
  },
  statValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.sm,
  },
});

export const UserHoverCard = memo(UserHoverCardComponent);
UserHoverCard.displayName = 'UserHoverCard';
