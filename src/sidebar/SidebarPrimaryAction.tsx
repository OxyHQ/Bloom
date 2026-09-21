import React from 'react';
import { Fab } from '../fab';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { SIDEBAR_ACTION_DIAMETER, useSidebarGeometry } from './geometry';
import { useSidebarCollapseProgress } from './parts';
import type { SidebarProps } from './types';

/** The sidebar owns placement; Fab owns the extended/collapsed action. */
export function SidebarPrimaryAction({ action, collapsed = false, rail = false, testID }: {
  action: NonNullable<SidebarProps['primaryAction']>;
  collapsed?: boolean;
  rail?: boolean;
  testID?: string;
}) {
  const geometry = useSidebarGeometry();
  const progress = useSidebarCollapseProgress(collapsed);
  const expandedInset = geometry?.expandedInset ?? 0;
  const inset = useAnimatedStyle(() => ({ paddingLeft: expandedInset * (1 - progress.value), paddingRight: expandedInset * (1 - progress.value) }), [progress, expandedInset]);
  const diameter = SIDEBAR_ACTION_DIAMETER;
  return <Animated.View style={[{ flexShrink: 0, width: '100%', paddingTop: 12 }, inset]}>
    <Fab
      testID={testID ?? 'sidebar-primary-action'}
      size="md"
      icon={action.icon}
      label={action.label}
      collapsed={rail || collapsed}
      disabled={action.disabled}
      onPress={action.onPress}
      style={{ width: rail ? diameter : '100%', alignSelf: 'center' }}
    />
  </Animated.View>;
}
