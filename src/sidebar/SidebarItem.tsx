import React, { memo } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useSidebarPalette } from './palette';
import { borderRadius } from '../styles/tokens';
import { Collapsible, IS_WEB, useInSidebar, useSidebarWebCss } from './parts';
import type { SidebarItemProps } from './types';

/**
 * A sidebar nav item.
 *
 *   row        p8, full pill, label/badge space-between;
 *              full width expanded, 36px square collapsed
 *   content    icon 20 + 8 gap + body-medium label (no wrap)
 *   rest       icon-secondary / text-secondary; hover background-secondary-hover
 *   selected   solid accent-500 fill with the primary foreground; no
 *              gradient, ring or top highlight
 *
 * The label and badge sit in collapse slots, so the icon stays pinned while the
 * rail morphs. With `href` the row is a link (a real anchor on web).
 */
const SidebarItemComponent: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  href,
  badge,
  selected = false,
  collapsed = false,
  onPress,
  style,
  testID,
}) => {
  const palette = useSidebarPalette();
  useSidebarWebCss();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const inSidebar = useInSidebar();
  const foreground = selected ? palette.selectedForeground : palette.textSecondary;

  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: 8,
    borderRadius: borderRadius.full,
    // In a sidebar the row stretches with the panel, which morphs 260 → 52, so
    // the row's width animates with it; standalone, collapsed is the 36px square.
    alignSelf: collapsed && !inSidebar ? 'flex-start' : 'stretch',
    width: collapsed && !inSidebar ? 36 : undefined,
    backgroundColor: selected ? palette.selected : hovered ? palette.rowHover : 'transparent',
    '--bloom-sidebar-ring': palette.ring,
  };

  const webProps: Record<string, unknown> = IS_WEB
    ? {
        dataSet: { bloomSidebar: 'ring' },
        ...(href ? { href } : null),
        ...(selected ? { 'aria-current': 'page' } : null),
        ...(collapsed ? { title: label } : null),
      }
    : {};

  return (
    <Pressable
      {...webProps}
      role={href ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onPress={(event: GestureResponderEvent) => {
        if (!onPress) return;
        // The host navigates (a router, or an action like opening Settings).
        if (IS_WEB && href) event.preventDefault();
        onPress();
      }}
      style={[rowStyle, style]}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1 }}>
        <View style={{ flexShrink: 0 }}>
          <Icon width={20} height={20} fill={foreground} />
        </View>
        <Collapsible collapsed={collapsed}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: foreground }}>
            {label}
          </Text>
        </Collapsible>
      </View>
      {badge != null ? <Collapsible collapsed={collapsed}>{badge}</Collapsible> : null}
    </Pressable>
  );
};

export const SidebarItem = memo(SidebarItemComponent);
SidebarItem.displayName = 'SidebarItem';
