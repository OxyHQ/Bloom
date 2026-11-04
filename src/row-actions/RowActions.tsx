import React, { useState } from 'react';
import { View } from 'react-native';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { RiMore2Fill } from '../icons/remix/RiMore2Fill';
import { useCommonMessages } from '../locale/common-messages';
import { useTheme } from '../theme/use-theme';
import { RowActionButton } from './RowActionButton';
import type { RowActionsProps } from './types';

/** A menu entry's glyph. */
const MENU_ICON_SIZE = 18;
const DEFAULT_MENU_WIDTH = 220;
const MENU_PADDING = { paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 8 } as const;

/**
 * The actions a row ends with: its icon buttons (`RowActionButton`, each under a 200ms tooltip),
 * then the "⋮" trigger of a `DropdownMenu` — end-aligned under the trigger, 220px wide with 8px
 * padding, entries `px-2 py-1.5` leading with an 18px secondary glyph. The trigger paints its
 * pressed state while the menu is open and is named `` `${menuLabel} for ${name}` ``.
 */
export function RowActions({
  name,
  actions = [],
  menu = [],
  menuLabel: menuLabelProp,
  menuAppearance = 'plain',
  menuWidth = DEFAULT_MENU_WIDTH,
  style,
  testID,
}: RowActionsProps) {
  const common = useCommonMessages();
  const menuLabel = menuLabelProp ?? common.moreActions;
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const menuName = common.labelFor(menuLabel, name);

  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
          alignSelf: 'stretch',
        },
        style,
      ]}
    >
      {actions.map((action) => (
        <RowActionButton
          key={action.label}
          icon={action.icon}
          label={action.label}
          accessibilityLabel={action.accessibilityLabel}
          onPress={action.onPress}
        />
      ))}
      {menu.length > 0 ? (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild label={menuName}>
            <RowActionButton
              icon={RiMore2Fill}
              label={menuLabel}
              appearance={menuAppearance}
              active={open}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            label={menuName}
            align="end"
            minWidth={menuWidth}
            maxWidth={menuWidth}
            style={MENU_PADDING}
          >
            <DropdownMenuGroup>
              {menu.map(({ icon: Icon, label, accessibilityLabel, onPress }) => (
                <DropdownMenuItem
                  key={label}
                  accessibilityLabel={accessibilityLabel ?? label}
                  className="px-2 py-1.5"
                  onPress={onPress}
                  leading={
                    Icon ? (
                      <Icon
                        width={MENU_ICON_SIZE}
                        height={MENU_ICON_SIZE}
                        fill={theme.colors.textSecondary}
                      />
                    ) : undefined
                  }
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </View>
  );
}
