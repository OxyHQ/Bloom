import React, { memo } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useInteractionState } from '../hooks/use-interaction-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useSidebarGeometry } from './geometry';
import { useSidebarMetrics } from './metrics';
import { useSidebarPalette } from './palette';
import { borderRadius } from '../styles/tokens';
import { Collapsible, IS_WEB, useInSidebar, useSidebarCollapseProgress, useSidebarWebCss } from './parts';
import type { SidebarItemProps } from './types';

/**
 * A sidebar nav item.
 *
 *   row        the size's inset, full pill, label/badge space-between;
 *              full width expanded, the size's square collapsed
 *   content    the size's glyph + 8 gap + its label step (no wrap) —
 *              `md` is 20 and `body-medium` (`metrics.ts`)
 *   rest       icon-secondary / text-secondary; hover background-secondary-hover
 *   selected   solid accent-500 fill with the primary foreground; no
 *              gradient, ring or top highlight
 *
 * The label and badge sit in collapse slots, so the icon stays pinned while the
 * rail morphs. With `href` the row is a link (a real anchor on web).
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SidebarItemComponent: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  size,
  href,
  badge,
  selected = false,
  collapsed = false,
  onPress,
  onLongPress,
  style,
  testID,
}) => {
  const palette = useSidebarPalette();
  const metrics = useSidebarMetrics(size);
  useSidebarWebCss();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const inSidebar = useInSidebar();
  const progress = useSidebarCollapseProgress(collapsed);
  const lane = useSidebarGeometry()?.collapsedLane ?? metrics.row.square;
  const horizontalInset = useAnimatedStyle(() => {
    const margin = (lane - metrics.row.square) / 2 * progress.value;
    return { marginLeft: margin, marginRight: margin };
  }, [progress, lane, metrics.row.square]);
  const itemGap = metrics.row.gap;
  const contentStyle = useAnimatedStyle(() => ({ gap: itemGap * (1 - progress.value) }), [progress, itemGap]);
  const foreground = selected ? palette.selectedForeground : palette.textSecondary;

  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    height: metrics.row.square,
    paddingLeft: metrics.row.padding,
    paddingRight: metrics.row.padding,
    paddingTop: metrics.row.padding,
    paddingBottom: metrics.row.padding,
    borderRadius: borderRadius.full,
    // In a sidebar the row stretches with the panel, which morphs between the
    // size's two widths, so the row's width animates with it; standalone,
    // collapsed is the size's own square.
    alignSelf: collapsed && !inSidebar ? 'flex-start' : 'stretch',
    width: collapsed && !inSidebar ? metrics.row.square : undefined,
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
    <AnimatedPressable
      {...webProps}
      role={href ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onLongPress={onLongPress}
      onPress={(event: GestureResponderEvent) => {
        if (!onPress) return;
        // The host navigates (a router, or an action like opening Settings).
        if (IS_WEB && href) event.preventDefault();
        onPress();
      }}
      style={[rowStyle, horizontalInset, style]}
      testID={testID}
    >
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', minWidth: 0, flexShrink: 1 }, contentStyle]}>
        <View style={{ flexShrink: 0 }}>
          <Icon width={metrics.row.icon} height={metrics.row.icon} fill={foreground} />
        </View>
        <Collapsible collapsed={collapsed}>
          <Text variant={metrics.row.label} numberOfLines={1} style={{ color: foreground }}>
            {label}
          </Text>
        </Collapsible>
      </Animated.View>
      {badge != null ? <Collapsible collapsed={collapsed}>{badge}</Collapsible> : null}
    </AnimatedPressable>
  );
};

export const SidebarItem = memo(SidebarItemComponent);
SidebarItem.displayName = 'SidebarItem';
