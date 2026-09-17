import React, { memo, useEffect, useState } from 'react';
import { Pressable, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Badge } from '../badge';
import { useInteractionState } from '../hooks/use-interaction-state';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { BREAKPOINTS } from '../styles/breakpoints';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useSidebarPalette, type SidebarPalette } from './palette';
import {
  ChevronDownSmall,
  Collapsible,
  IS_WEB,
  MenuDivider,
  menuPanelStyle,
  SidebarAvatarView,
  useSidebarWebCss,
} from './parts';
import type { SidebarMenuGroup, SidebarMenuItem, SidebarTeamMenuProps } from './types';

/**
 * The team card at the foot of the rail and the
 * menu it opens beside the sidebar.
 *
 *   card (expanded)   full width, radius 12, background-tertiary, py8 pr16
 *                     pl10, 2px transparent border → border-button-hover on
 *                     hover; 32px avatar + name (body-medium) / email
 *                     (body-regular secondary); 16px chevron chip (radius 3,
 *                     tertiary-hover) that turns over while open (200ms)
 *   card (collapsed)  36px circle, transparent, just the avatar
 *   menu              265 wide, radius 16, 1px border, p10, shadow-dropdown,
 *                     beside the rail (right, bottom-aligned), below it under
 *                     `sm`; header, grouped rows with full-bleed dividers
 *                     (10px either side), footer with a version chip
 *   row               p8 radius 10 gap 10, icon 20 secondary, body-medium
 *                     primary (truncating), count badge; hover primary-hover
 */
function TeamMenuRow({
  item,
  palette,
  onSelect,
}: {
  item: SidebarMenuItem;
  palette: SidebarPalette;
  onSelect: () => void;
}) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const Icon = item.icon;
  const style: WebCssStyle = {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 10,
    backgroundColor: item.selected || hovered ? palette.menu.rowHover : 'transparent',
    '--bloom-sidebar-ring': palette.ring,
  };
  return (
    <Pressable
      {...(IS_WEB
        ? {
            dataSet: { bloomSidebar: 'inset' },
            ...(item.href ? { href: item.href } : null),
            ...(item.selected ? { 'aria-current': 'page' } : null),
          }
        : {})}
      role={item.href ? 'link' : 'button'}
      accessibilityLabel={item.label}
      accessibilityState={{ selected: item.selected === true }}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onPress={(event: GestureResponderEvent) => {
        if (item.onPress) {
          if (IS_WEB && item.href) event.preventDefault();
          item.onPress();
        }
        onSelect();
      }}
      style={style}
      testID={`sidebar-team-item-${item.key}`}
    >
      <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon width={20} height={20} fill={palette.textSecondary} />
        <Text variant="body-medium" numberOfLines={1} style={{ flexShrink: 1, color: palette.text }}>
          {item.label}
        </Text>
      </View>
      {item.badge != null ? (
        <Badge
          content={item.badge}
          style={{ backgroundColor: palette.menu.countBackground }}
          textStyle={{ color: palette.menu.countForeground }}
        />
      ) : null}
    </Pressable>
  );
}

function Group({
  group,
  divider,
  palette,
  onSelect,
}: {
  group: SidebarMenuGroup;
  divider: boolean;
  palette: SidebarPalette;
  onSelect: () => void;
}) {
  return (
    <>
      {divider ? <MenuDivider palette={palette} spacing={10} /> : null}
      <View style={{ width: '100%', gap: group.label ? 6 : 4, paddingTop: group.label ? 4 : 0 }}>
        {group.label ? (
          <Text variant="body-medium" style={{ paddingLeft: 8, paddingRight: 8, color: palette.textSecondary }}>
            {group.label}
          </Text>
        ) : null}
        <View style={{ width: '100%', gap: 4 }}>
          {group.items.map((item) => (
            <TeamMenuRow key={item.key} item={item} palette={palette} onSelect={onSelect} />
          ))}
        </View>
      </View>
    </>
  );
}

const SidebarTeamMenuComponent: React.FC<SidebarTeamMenuProps> = ({ team, collapsed = false, style, testID }) => {
  const palette = useSidebarPalette();
  useSidebarWebCss();
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const narrow = width < BREAKPOINTS.sm;
  const { state: hovered, onIn, onOut } = useInteractionState();
  const reducedMotion = useReducedMotion();

  const turn = useSharedValue(0);
  useEffect(() => {
    const target = open ? 180 : 0;
    turn.value = reducedMotion ? target : withTiming(target, { duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  }, [open, reducedMotion, turn]);
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }), [turn]);

  const cardStyle: WebCssStyle = collapsed
    ? {
        width: 36,
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        borderRadius: borderRadius.full,
        borderWidth: 2,
        borderColor: hovered ? palette.teamHoverBorder : 'transparent',
        backgroundColor: 'transparent',
        '--bloom-sidebar-ring': palette.ring,
        '--bloom-sidebar-ring-offset': palette.panel,
      }
    : {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: hovered ? palette.teamHoverBorder : 'transparent',
        backgroundColor: palette.tertiary,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 10,
        paddingRight: 16,
        '--bloom-sidebar-ring': palette.ring,
        '--bloom-sidebar-ring-offset': palette.panel,
      };

  const identity = (
    <>
      <SidebarAvatarView avatar={team.avatar} size="md" palette={palette} />
      <View style={{ minWidth: 0, justifyContent: 'center', alignItems: 'flex-start' }}>
        <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
          {team.name}
        </Text>
        {team.email ? (
          <Text variant="body-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {team.email}
          </Text>
        ) : null}
      </View>
    </>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild label={team.name} style={collapsed ? undefined : { alignSelf: 'stretch' }}>
        <Pressable
          {...(IS_WEB ? { dataSet: { bloomSidebar: 'offset' } } : {})}
          accessibilityLabel={team.name}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={[cardStyle, style]}
          testID={testID}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1 }}>
            <SidebarAvatarView avatar={team.avatar} size="md" palette={palette} />
            <Collapsible collapsed={collapsed}>
              <View style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
                <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
                  {team.name}
                </Text>
                {team.email ? (
                  <Text variant="body-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
                    {team.email}
                  </Text>
                ) : null}
              </View>
            </Collapsible>
          </View>
          <Collapsible collapsed={collapsed}>
            <View
              style={{
                width: 16,
                height: 16,
                flexShrink: 0,
                borderRadius: 3,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: palette.tertiaryHover,
              }}
            >
              <Animated.View style={chevronStyle}>
                <ChevronDownSmall color={palette.textSecondary} />
              </Animated.View>
            </View>
          </Collapsible>
        </Pressable>
      </PopoverTrigger>
      <PopoverContent
        label={`${team.name} menu`}
        side={narrow ? 'bottom' : 'right'}
        align={narrow ? 'start' : 'end'}
        sideOffset={8}
        maxWidth={width - 32}
        style={menuPanelStyle(palette)}
        testID={testID ? `${testID}-menu` : undefined}
      >
        <View style={{ gap: 7 }}>
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 8, paddingTop: 4 }}>
            {identity}
          </View>
          {team.groups?.length ? (
            <View style={{ width: '100%' }}>
              {team.groups.map((group, index) => (
                <Group
                  key={group.id}
                  group={group}
                  divider={index > 0}
                  palette={palette}
                  onSelect={() => setOpen(false)}
                />
              ))}
            </View>
          ) : null}
          {team.footer ? (
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 4,
                paddingBottom: 8,
              }}
            >
              <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.textTertiary }}>
                {team.footer.label}
              </Text>
              {team.footer.version ? (
                <View
                  style={{
                    paddingLeft: 4,
                    paddingRight: 4,
                    paddingTop: 1,
                    paddingBottom: 1,
                    borderRadius: borderRadius.full,
                    backgroundColor: palette.tertiary,
                  }}
                >
                  <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.textTertiary }}>
                    {team.footer.version}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </PopoverContent>
    </Popover>
  );
};

export const SidebarTeamMenu = memo(SidebarTeamMenuComponent);
SidebarTeamMenu.displayName = 'SidebarTeamMenu';
