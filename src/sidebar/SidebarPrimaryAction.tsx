import React from 'react';
import { View } from 'react-native';
import { Button } from '../button';
import { resolveButtonPalette } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useSidebarMetrics } from './metrics';
import { Collapsible } from './parts';
import type { SidebarProps } from './types';

/** One persistent control; only its visual label follows the panel's clock. */
export function SidebarPrimaryAction({ action, collapsed = false, rail = false, testID }: {
  action: NonNullable<SidebarProps['primaryAction']>;
  collapsed?: boolean;
  rail?: boolean;
  testID?: string;
}) {
  const theme = useTheme();
  const metrics = useSidebarMetrics();
  const palette = resolveButtonPalette('solid', theme, 'action');
  const foreground = action.disabled ? palette.disabled.foreground : palette.rest.foreground;
  const square = rail ? 44 : metrics.row.square;
  return <View style={{ flexShrink: 0, width: '100%', paddingTop: 12 }}>
    <Button
      testID={testID ?? 'sidebar-primary-action'}
      tone="action" appearance="solid" size={square >= 44 ? 'lg' : square <= 32 ? 'sm' : 'md'}
      icon={action.icon}
      accessibilityLabel={action.label}
      disabled={action.disabled}
      onPress={action.onPress}
      trailing={rail ? undefined : <Collapsible collapsed={collapsed}>
        <Text aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          variant="body-semibold" numberOfLines={1} style={{ marginLeft: 8, color: foreground }}>
          {action.label}
        </Text>
      </Collapsible>}
      style={{ width: rail ? square : '100%', height: square, minHeight: square, alignSelf: 'center', paddingLeft: 0, paddingRight: 0, gap: 0 }}
    />
  </View>;
}
