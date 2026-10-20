import type React from 'react';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '../button';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiAddFill } from '../icons/remix/RiAddFill';
import { RiEqualizer3Line } from '../icons/remix/RiEqualizer3Line';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { SidebarIdentityHeading, SidebarIdentityMenu } from './SidebarIdentityMenu';
import { SidebarMenuGroups } from './SidebarMenuRows';
import { useSidebarPalette, type SidebarPalette } from './palette';
import { MenuDivider, SidebarAvatarView } from './parts';
import type { SidebarAccount, SidebarAccountUser, SidebarUserMenuProps } from './types';
import { useMessages } from '../locale/messages';
import { SIDEBAR_MESSAGES } from './messages';
import { IS_WEB } from '../styles/platform';

/**
 * The account menu: by default the switcher at the top of the rail
 * (`form="switcher"`); with `teamPlacement="header"` the card at its foot
 * (`form="card"`). Trigger geometry for both: `SidebarIdentityMenu`.
 *
 *   menu       265 wide, radius 16, border, p10, shadow-dropdown, beside the
 *              rail, below it under `sm`: in the card form the account as a
 *              heading; "Users with access" (pt5, gap 6), rows px8 py6 radius
 *              10 (20px avatar + body-medium); the account's `groups` (team
 *              menu rows, dividers between); a full-bleed divider 14px either
 *              side (10 after groups), then two small secondary buttons 12
 *              apart, pb8 so the inset reads 18 on every side.
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
  heading = false,
  onSelect,
}: {
  account: SidebarAccount;
  /** Head the menu with the account itself — the card form, far from the menu's top. */
  heading?: boolean;
  onSelect: () => void;
}) {
  const palette = useSidebarPalette();
  const { messages } = useMessages(SIDEBAR_MESSAGES);
  const hasActions = account.onAddUser != null || account.onManage != null;
  const hasUsers = Boolean(account.users?.length);
  const groups = account.groups ?? [];
  return (
    <View>
      {heading ? (
        <View style={{ paddingBottom: hasUsers || groups.length || hasActions ? 7 : 0 }}>
          <SidebarIdentityHeading
            name={account.name}
            description={account.email}
            avatar={account.avatar}
          />
        </View>
      ) : null}
      {account.users?.length ? (
        <View style={{ width: '100%', gap: 6, paddingTop: 5 }}>
          <Text
            variant="body-medium"
            style={{ paddingLeft: 8, paddingRight: 8, color: palette.textSecondary }}
          >
            {account.usersLabel ?? messages.usersWithAccess}
          </Text>
          <View style={{ width: '100%', gap: 4 }}>
            {account.users.map((user) => (
              <UserRow key={user.id} user={user} palette={palette} onSelect={onSelect} />
            ))}
          </View>
        </View>
      ) : null}
      <SidebarMenuGroups
        groups={groups}
        palette={palette}
        // Under the users the groups are their own block; under the heading they start the menu.
        leadingDivider={hasUsers}
        idPrefix="sidebar-account-item"
        onSelect={onSelect}
      />
      {(hasUsers || groups.length > 0) && hasActions ? (
        <MenuDivider palette={palette} spacing={groups.length > 0 ? 10 : 14} />
      ) : null}
      {hasActions ? (
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingLeft: 8,
            paddingRight: 8,
            paddingBottom: 8,
          }}
        >
          {account.onAddUser ? (
            <View style={{ flex: 1 }}>
              <Button
                size="sm"
                leadingIcon={RiAddFill}
                style={{ width: '100%' }}
                onPress={() => {
                  account.onAddUser?.();
                  onSelect();
                }}
                appearance="subtle"
                tone="neutral"
              >
                {account.addUserLabel ?? messages.addUser}
              </Button>
            </View>
          ) : null}
          {account.onManage ? (
            <View style={{ flex: 1 }}>
              <Button
                size="sm"
                leadingIcon={RiEqualizer3Line}
                style={{ width: '100%' }}
                onPress={() => {
                  account.onManage?.();
                  onSelect();
                }}
                appearance="subtle"
                tone="neutral"
              >
                {account.manageLabel ?? messages.manage}
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
  form = 'switcher',
  collapsed = false,
  suppressHover = false,
  onHoverSuppressionEnd,
  avatarBackground,
  style,
  testID,
}) => {
  const { messages } = useMessages(SIDEBAR_MESSAGES);
  return (
    <SidebarIdentityMenu
      form={form}
      name={account.name}
      description={account.email}
      avatar={account.avatar}
      collapsed={collapsed}
      menuLabel={account.menuLabel ?? messages.accountMenu}
      style={style}
      avatarBackground={avatarBackground}
      suppressHover={suppressHover}
      onHoverSuppressionEnd={onHoverSuppressionEnd}
      testID={testID}
    >
      {(close) => (
        <SidebarAccountMenuContent account={account} heading={form === 'card'} onSelect={close} />
      )}
    </SidebarIdentityMenu>
  );
};

export const SidebarUserMenu = memo(SidebarUserMenuComponent);
SidebarUserMenu.displayName = 'SidebarUserMenu';
