import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Button } from '../button';
import { borderRadius } from '../styles/tokens';
import { Text } from '../typography';
import { useSidebarPalette } from './palette';
import { Collapsible, IS_WEB, SidebarAvatarView, useSidebarCollapseProgress, useInSidebar } from './parts';
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
  const progress = useSidebarCollapseProgress(collapsed);
  const inSidebar = useInSidebar();
  const naturalWidth = useSharedValue(0);
  const geometry = useAnimatedStyle(() => ({
    width: inSidebar ? '100%' : naturalWidth.value > 0 ? naturalWidth.value + (36 - naturalWidth.value) * progress.value : progress.value === 1 ? 36 : '100%',
    height: 56 - 20 * progress.value,
    paddingLeft: 10 - 8 * progress.value,
    paddingRight: 12 - 10 * progress.value,
  }), [progress, inSidebar, naturalWidth]);
  const fill = useAnimatedStyle(() => ({ opacity: 1 - progress.value }), [progress]);
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


  return (
    <Animated.View
      accessibilityLabel={collapsed ? `${plan.name}, ${plan.plan}` : undefined}
      testID={testID}
      onLayout={(event) => { if (progress.value === 0) naturalWidth.value = event.nativeEvent.layout.width; }}
      style={[
        {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 12,
          overflow: 'hidden',
        },
        style,
        { backgroundColor: 'transparent' },
        geometry,
      ]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 12, backgroundColor: StyleSheet.flatten(style)?.backgroundColor ?? palette.tertiary }, fill]} />
      <View style={{ minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center' }}>
        {avatarNode}
        <Collapsible collapsed={collapsed}>
        <View style={{ paddingLeft: 8, minWidth: 0, flexShrink: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
            {plan.name}
          </Text>
          <Text variant="body-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {plan.plan}
          </Text>
        </View>
        </Collapsible>
      </View>
      <View pointerEvents={collapsed ? 'none' : 'auto'} aria-hidden={collapsed} accessibilityElementsHidden={collapsed} importantForAccessibility={collapsed ? 'no-hide-descendants' : 'auto'} {...(IS_WEB && collapsed ? { inert: true } : {})}>
      <Collapsible collapsed={collapsed}>
      <Button size="sm" onPress={plan.onAction} appearance="subtle" tone="neutral">
        {plan.actionLabel ?? 'Upgrade'}
      </Button>
      </Collapsible>
      </View>
    </Animated.View>
  );
}

export const SidebarPlanCard = memo(SidebarPlanCardComponent);
SidebarPlanCard.displayName = 'SidebarPlanCard';
