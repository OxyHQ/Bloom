import React, { memo, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';

import { Button } from '../button';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiAddFill, RiEqualizer3Line } from '../icons/remix';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { BREAKPOINTS } from '../styles/breakpoints';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useSidebarPalette, type SidebarPalette } from './palette';
import {
  ChevronUpDownSmall,
  Collapsible,
  IS_WEB,
  MenuDivider,
  menuPanelStyle,
  SidebarAvatarView,
  useSidebarWebCss,
} from './parts';
import type { SidebarAccount, SidebarAccountUser, SidebarUserMenuProps } from './types';

/**
 * The account switcher at the top of the rail.
 *
 *   trigger    32px avatar + body-medium name + 16px up/down chevron
 *              (icon-tertiary), gap 8 / 2; hover draws a 2px full-radius pill
 *              that reaches 6px past the sides and 5px past top and bottom
 *              without moving layout. Collapsed: the rail's 36px column, the
 *              pill squared to 42×42 (3px sides).
 *   menu       265 wide, radius 16, border, p10, shadow-dropdown, beside the
 *              rail (right, top-aligned), below it under `sm`: "Users with
 *              access" (pt5, gap 6), rows px8 py6 radius 10 (20px avatar +
 *              body-medium), a full-bleed divider 14px either side, then two
 *              small secondary buttons 12 apart, pb8 so the inset reads 18
 *              on every side.
 */
function UserRow({
  user,
  palette,
  onSelect,
}: {
  user: SidebarAccountUser;
  palette: SidebarPalette;
  onSelect: () => void;
}) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const style: WebCssStyle = {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 6,
    paddingBottom: 6,
    borderRadius: 10,
    backgroundColor: user.selected || hovered ? palette.menu.rowHover : 'transparent',
    '--bloom-sidebar-ring': palette.ring,
  };
  return (
    <Pressable
      {...(IS_WEB ? { dataSet: { bloomSidebar: 'inset' } } : {})}
      role="button"
      accessibilityLabel={user.name}
      accessibilityState={{ selected: user.selected === true }}
      aria-pressed={user.selected === true}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onPress={() => {
        user.onPress?.();
        onSelect();
      }}
      style={style}
      testID={`sidebar-user-${user.id}`}
    >
      <SidebarAvatarView avatar={user.avatar} size="xs" palette={palette} />
      <Text variant="body-medium" numberOfLines={1} style={{ flexShrink: 1, color: palette.text }}>
        {user.name}
      </Text>
    </Pressable>
  );
}

/**
 * The menu's contents on their own, so another trigger can open the same
 * panel.
 */
export function SidebarAccountMenuContent({
  account,
  onSelect,
}: {
  account: SidebarAccount;
  onSelect: () => void;
}) {
  const palette = useSidebarPalette();
  const hasActions = account.onAddUser != null || account.onManage != null;
  return (
    <View>
      {account.users?.length ? (
        <View style={{ width: '100%', gap: 6, paddingTop: 5 }}>
          <Text variant="body-medium" style={{ paddingLeft: 8, paddingRight: 8, color: palette.textSecondary }}>
            {account.usersLabel ?? 'Users with access'}
          </Text>
          <View style={{ width: '100%', gap: 4 }}>
            {account.users.map((user) => (
              <UserRow key={user.id} user={user} palette={palette} onSelect={onSelect} />
            ))}
          </View>
        </View>
      ) : null}
      {account.users?.length && hasActions ? <MenuDivider palette={palette} spacing={14} /> : null}
      {hasActions ? (
        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 8, paddingRight: 8, paddingBottom: 8 }}>
          {account.onAddUser ? (
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                size="small"
                leadingIcon={RiAddFill}
                fullWidth
                style={{ width: '100%' }}
                onPress={() => {
                  account.onAddUser?.();
                  onSelect();
                }}
              >
                {account.addUserLabel ?? 'Add user'}
              </Button>
            </View>
          ) : null}
          {account.onManage ? (
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                size="small"
                leadingIcon={RiEqualizer3Line}
                fullWidth
                style={{ width: '100%' }}
                onPress={() => {
                  account.onManage?.();
                  onSelect();
                }}
              >
                {account.manageLabel ?? 'Manage'}
              </Button>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const SidebarUserMenuComponent: React.FC<SidebarUserMenuProps> = ({
  account,
  collapsed = false,
  suppressHover = false,
  onHoverSuppressionEnd,
  avatarBackground,
  testID,
}) => {
  const palette = useSidebarPalette();
  useSidebarWebCss();
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const narrow = width < BREAKPOINTS.sm;
  const { state: hovered, onIn, onOut } = useInteractionState();

  const triggerStyle: WebCssStyle = {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    width: collapsed ? 36 : undefined,
    minWidth: 0,
    borderRadius: borderRadius.full,
    '--bloom-sidebar-ring': palette.ring,
    '--bloom-sidebar-ring-offset': palette.panel,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild label={account.name}>
        <Pressable
          {...(IS_WEB ? { dataSet: { bloomSidebar: 'offset' } } : {})}
          accessibilityLabel={account.name}
          onHoverIn={onIn}
          onHoverOut={() => {
            onOut();
            if (suppressHover) onHoverSuppressionEnd?.();
          }}
          style={triggerStyle}
          testID={testID}
        >
          {/* The hover pill: a 2px outline drawn outside the box, so it never shifts layout. */}
          <View
            pointerEvents="none"
            testID={testID ? `${testID}-pill` : undefined}
            style={{
              position: 'absolute',
              top: -5,
              bottom: -5,
              left: collapsed ? -3 : -6,
              right: collapsed ? -3 : -6,
              borderRadius: borderRadius.full,
              borderWidth: 2,
              borderColor: hovered && !suppressHover ? palette.profileHoverBorder : 'transparent',
            }}
          />
          <SidebarAvatarView avatar={account.avatar} size="md" palette={palette} background={avatarBackground} />
          <Collapsible collapsed={collapsed}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 8 }}>
              <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
                {account.name}
              </Text>
              <ChevronUpDownSmall color={palette.textTertiary} />
            </View>
          </Collapsible>
        </Pressable>
      </PopoverTrigger>
      <PopoverContent
        label="Account menu"
        side={narrow ? 'bottom' : 'right'}
        align="start"
        sideOffset={8}
        maxWidth={width - 32}
        style={menuPanelStyle(palette)}
        testID={testID ? `${testID}-menu` : undefined}
      >
        <SidebarAccountMenuContent account={account} onSelect={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export const SidebarUserMenu = memo(SidebarUserMenuComponent);
SidebarUserMenu.displayName = 'SidebarUserMenu';
