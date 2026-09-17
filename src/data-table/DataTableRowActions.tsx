import React, { useState } from 'react';
import { View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { RiMore2Fill } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { DataTableRowAction } from './DataTable';
import type { DataTableRowActionsProps } from './types';

/** `size-[18px] text-foreground-icon-secondary` — a menu entry's glyph. */
const MENU_ICON_SIZE = 18;
/** `w-[220px]`. */
const MENU_WIDTH = 220;
/** `p-2`. */
const MENU_PADDING = { paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 8 } as const;

/**
 * The actions cell every dashboard table ends a row with:
 *
 *   `flex justify-end gap-2.5` — the row's icon buttons (`RowActionButton`,
 *   each under a 200ms tooltip), then the "⋮" trigger of a `DropdownMenu`:
 *   `placement="bottom end"`, `w-[220px] p-2`, entries `px-2 py-1.5` leading
 *   with an 18px `foreground-icon-secondary` glyph. The trigger paints its
 *   pressed state while the menu is open.
 */
export function DataTableRowActions({
  name,
  actions = [],
  menu = [],
  menuLabel = 'More actions',
  style,
  testID,
}: DataTableRowActionsProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const { neutral } = resolveButtonRamps(theme);
  const menuName = `${menuLabel} for ${name}`;

  return (
    <View
      testID={testID}
      style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, alignSelf: 'stretch' }, style]}
    >
      {actions.map((action) => (
        <DataTableRowAction key={action.label} icon={action.icon} label={action.label} onPress={action.onPress} />
      ))}
      {menu.length > 0 ? (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild label={menuName}>
            <DataTableRowAction icon={RiMore2Fill} label={menuLabel} active={open} />
          </DropdownMenuTrigger>
          <DropdownMenuContent label={menuName} align="end" minWidth={MENU_WIDTH} maxWidth={MENU_WIDTH} style={MENU_PADDING}>
            <DropdownMenuGroup>
              {menu.map(({ icon: Icon, label, onPress }) => (
                <DropdownMenuItem
                  key={label}
                  accessibilityLabel={label}
                  className="px-2 py-1.5"
                  onPress={onPress}
                  leading={<Icon width={MENU_ICON_SIZE} height={MENU_ICON_SIZE} fill={neutral[500]} />}
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
