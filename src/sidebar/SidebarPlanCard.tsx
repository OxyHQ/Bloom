import React, { memo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { borderRadius } from '../styles/tokens';
import { Text } from '../typography';
import { useSidebarPalette } from './palette';
import { SidebarAvatarView } from './parts';
import type { SidebarPlanCardProps } from './types';

/**
 * The plan card at the foot of the AI chat's rail.
 *
 *   card       radius 12, background-tertiary, py 8 / pr 12 / pl 10,
 *              space-between
 *   identity   gap 8: the 32px avatar (initials 18.8/22.6 medium) and a column
 *              of the name (body-medium text-primary) over the plan
 *              (body-regular text-secondary)
 *   action     a small secondary button ("Upgrade")
 *   collapsed  the avatar alone in a 36px box
 */
function SidebarPlanCardComponent({ plan, collapsed = false, style, testID }: SidebarPlanCardProps) {
  const palette = useSidebarPalette();
  const avatar = plan.avatar ?? { initials: plan.name.slice(0, 1).toUpperCase(), color: 'blue' as const };

  const avatarNode = avatar.source ? (
    <SidebarAvatarView avatar={avatar} size="md" palette={palette} />
  ) : (
    <View
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: borderRadius.full,
        backgroundColor: palette.avatar[avatar.color ?? 'neutral'].background,
      }}>
      <Text
        style={{
          fontSize: 18.824,
          lineHeight: 22.588,
          fontWeight: '500',
          textAlign: 'center',
          color: palette.avatar[avatar.color ?? 'neutral'].foreground,
        }}>
        {avatar.initials ?? ''}
      </Text>
    </View>
  );

  if (collapsed) {
    return (
      <View testID={testID} accessibilityLabel={`${plan.name}, ${plan.plan}`} style={[{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, style]}>
        {avatarNode}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 12,
          backgroundColor: palette.tertiary,
          paddingTop: 8,
          paddingBottom: 8,
          paddingRight: 12,
          paddingLeft: 10,
        },
        style,
      ]}>
      <View style={{ minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {avatarNode}
        <View style={{ minWidth: 0, flexShrink: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
            {plan.name}
          </Text>
          <Text variant="body-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {plan.plan}
          </Text>
        </View>
      </View>
      <Button variant="secondary" size="small" onPress={plan.onAction}>
        {plan.actionLabel ?? 'Upgrade'}
      </Button>
    </View>
  );
}

export const SidebarPlanCard = memo(SidebarPlanCardComponent);
SidebarPlanCard.displayName = 'SidebarPlanCard';
