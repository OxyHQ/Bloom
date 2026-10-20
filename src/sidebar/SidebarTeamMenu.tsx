import type React from 'react';
import { memo } from 'react';
import { View } from 'react-native';

import { borderRadius } from '../styles/tokens';
import { Text } from '../typography';
import { SidebarIdentityHeading, SidebarIdentityMenu } from './SidebarIdentityMenu';
import { SidebarMenuGroups } from './SidebarMenuRows';
import { useSidebarPalette } from './palette';
import type { SidebarTeam, SidebarTeamMenuProps } from './types';
import { useMessages } from '../locale/messages';
import { SIDEBAR_MESSAGES } from './messages';

/**
 * The team menu: by default the card at the foot of the rail
 * (`form="card"`); with `teamPlacement="header"` the switcher at its top
 * (`form="switcher"`). Trigger geometry for both: `SidebarIdentityMenu`.
 *
 *   menu   265 wide, radius 16, 1px border, p10, shadow-dropdown, beside the
 *          rail, below it under `sm`; the identity as a heading, grouped rows
 *          with full-bleed dividers (10px either side) — a `selection:
 *          'single'` group is the workspaces to switch between — and a footer
 *          with a version chip
 */
function TeamMenuContent({ team, close }: { team: SidebarTeam; close: () => void }) {
  const palette = useSidebarPalette();
  return (
    <View style={{ gap: 7 }}>
      <SidebarIdentityHeading name={team.name} description={team.email} avatar={team.avatar} />
      {team.groups?.length ? (
        <SidebarMenuGroups
          groups={team.groups}
          palette={palette}
          idPrefix="sidebar-team-item"
          onSelect={close}
        />
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
              <Text
                variant="body-2-medium"
                numberOfLines={1}
                style={{ color: palette.textTertiary }}
              >
                {team.footer.version}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const SidebarTeamMenuComponent: React.FC<SidebarTeamMenuProps> = ({
  team,
  form = 'card',
  collapsed = false,
  suppressHover,
  onHoverSuppressionEnd,
  avatarBackground,
  style,
  testID,
}) => {
  const { messages } = useMessages(SIDEBAR_MESSAGES);
  return (
    <SidebarIdentityMenu
      form={form}
      name={team.name}
      description={team.email}
      avatar={team.avatar}
      collapsed={collapsed}
      menuLabel={team.menuLabel ?? messages.teamMenu(team.name)}
      style={style}
      suppressHover={suppressHover}
      onHoverSuppressionEnd={onHoverSuppressionEnd}
      avatarBackground={avatarBackground}
      testID={testID}
    >
      {(close) => <TeamMenuContent team={team} close={close} />}
    </SidebarIdentityMenu>
  );
};

export const SidebarTeamMenu = memo(SidebarTeamMenuComponent);
SidebarTeamMenu.displayName = 'SidebarTeamMenu';
