import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { AvatarPresence } from '../chat-indicators/AvatarPresence';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiForbidLine } from '../icons/remix/RiForbidLine';
import { RiMore2Line } from '../icons/remix/RiMore2Line';
import { RiShieldUserLine } from '../icons/remix/RiShieldUserLine';
import { RiUserMinusLine } from '../icons/remix/RiUserMinusLine';
import { RiVipCrownLine } from '../icons/remix/RiVipCrownLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MEMBER_LABELS, memberBadgeLabel, resolveChatPeoplePaint } from './shared';
import type { MemberRowProps } from './types';

/**
 * `MemberRow`: one person inside a group.
 *
 *   avatar with presence · name + role badge · "last seen recently"
 *   · a more menu (promote · restrict · remove)
 *
 * THE BADGE IS A WORD, NOT A COLOUR. `owner` is amber and `admin` is the
 * accent, but each also carries a glyph and its own text, because a role told
 * apart by hue alone is a role one reader in twelve cannot read at all — and
 * "who can remove me from this group" is not a detail to encode in a tint.
 *
 * The menu appears only when at least one of `onPromote` / `onRestrict` /
 * `onRemove` is given, and lists only the actions that exist. `trailingSlot`
 * replaces it entirely for a caller who wants their own.
 */

function MemberRowComponent({
  name,
  avatar,
  avatarVariant,
  subtitle,
  status,
  role = 'member',
  roleLabel,
  onPress,
  onPromote,
  onRestrict,
  onRemove,
  trailingSlot,
  labels,
  style,
  testID,
}: MemberRowProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatPeoplePaint(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const l = { ...MEMBER_LABELS, ...labels };
  const badge = memberBadgeLabel(role, l, roleLabel);
  const owner = role === 'owner';
  const BadgeGlyph = owner ? RiVipCrownLine : RiShieldUserLine;
  const badgeColor = owner ? paint.owner : paint.onAccentSubtle;
  const badgeFill = owner ? paint.ownerSubtle : paint.accentSubtle;

  const actions = [
    onPromote === undefined
      ? undefined
      : { key: 'promote', label: l.promote, icon: RiShieldUserLine, onPress: onPromote, destructive: false },
    onRestrict === undefined
      ? undefined
      : { key: 'restrict', label: l.restrict, icon: RiForbidLine, onPress: onRestrict, destructive: false },
    onRemove === undefined
      ? undefined
      : { key: 'remove', label: l.remove, icon: RiUserMinusLine, onPress: onRemove, destructive: true },
  ].filter((action): action is NonNullable<typeof action> => action !== undefined);

  const body = (
    <>
      <AvatarPresence
        source={avatar}
        variant={avatarVariant}
        name={name}
        size={40}
        status={status}
        presenceRingColor={paint.surface}
        presenceLabel=""
      />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            variant="body-medium"
            numberOfLines={1}
            style={{ color: paint.text, flexShrink: 1 }}
            testID={testID ? `${testID}-name` : undefined}
          >
            {name}
          </Text>
          {badge === undefined ? null : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                borderRadius: 999,
                backgroundColor: badgeFill,
                paddingTop: 1,
                paddingRight: 7,
                paddingBottom: 1,
                paddingLeft: 5,
              }}
              testID={testID ? `${testID}-role` : undefined}
            >
              <BadgeGlyph width={11} height={11} fill={badgeColor} />
              <Text variant="caption-2-semibold" style={{ color: badgeColor }}>
                {badge}
              </Text>
            </View>
          )}
        </View>
        {subtitle === undefined ? null : (
          <Text
            variant="caption-1-regular"
            numberOfLines={1}
            style={{ color: paint.textSecondary }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </>
  );

  const shell = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    backgroundColor: hovered && onPress !== undefined ? paint.rowHighlight : 'transparent',
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 10,
  };

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }, style]} testID={testID}>
      {onPress === undefined ? (
        <View style={shell}>{body}</View>
      ) : (
        <Pressable
          role="button"
          accessibilityLabel={badge === undefined ? name : `${name}, ${badge}`}
          onPress={onPress}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={shell}
          testID={testID ? `${testID}-open` : undefined}
        >
          {body}
        </Pressable>
      )}

      {trailingSlot !== undefined ? (
        trailingSlot
      ) : actions.length === 0 ? null : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild label={l.actions(name)}>
            {/* A plain Pressable rather than a Bloom `Button`: every `variant`
                paints chrome (ghost an accent disc, secondary a bordered pill)
                and a row-level more button is meant to disappear until you look
                for it. `asChild` clones the press handler, the expanded state
                and the name onto whatever element it is given. */}
            <Pressable
              role="button"
              accessibilityLabel={l.actions(name)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              testID={testID ? `${testID}-actions` : undefined}
            >
              <RiMore2Line width={18} height={18} fill={paint.textSecondary} />
            </Pressable>
          </DropdownMenuTrigger>
          <DropdownMenuContent minWidth={200}>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={action.key}
                  onPress={action.onPress}
                  variant={action.destructive ? 'destructive' : 'default'}
                  leading={
                    <Icon
                      width={16}
                      height={16}
                      fill={action.destructive ? paint.negative : paint.textSecondary}
                    />
                  }
                >
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </View>
  );
}

export const MemberRow = memo(MemberRowComponent);
MemberRow.displayName = 'MemberRow';
