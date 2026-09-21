import React from 'react';
import { View } from 'react-native';
import { Fab } from '../fab';
import { useSidebarMetrics } from './metrics';
import type { SidebarProps } from './types';

/** The sidebar owns placement; Fab owns the extended/collapsed action. */
export function SidebarPrimaryAction({ action, collapsed = false, rail = false, testID }: {
  action: NonNullable<SidebarProps['primaryAction']>;
  collapsed?: boolean;
  rail?: boolean;
  testID?: string;
}) {
  const metrics = useSidebarMetrics();
  const diameter = rail ? 48 : metrics.row.square;
  return <View style={{ flexShrink: 0, width: '100%', paddingTop: 12 }}>
    <Fab
      testID={testID ?? 'sidebar-primary-action'}
      size={diameter}
      icon={action.icon}
      label={action.label}
      collapsed={rail || collapsed}
      disabled={action.disabled}
      onPress={action.onPress}
      style={{ width: rail ? diameter : '100%', alignSelf: 'center' }}
    />
  </View>;
}
