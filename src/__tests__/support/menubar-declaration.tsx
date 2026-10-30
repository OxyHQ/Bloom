import React from 'react';

import type * as MenubarParts from '../../menubar';

type Parts = typeof MenubarParts;

export interface DeclarationHandlers {
  onNew?: () => void;
  onOpen?: () => void;
  onEmail?: () => void;
  onUndo?: () => void;
  onDense?: (checked: boolean) => void;
  onLayout?: (value: string) => void;
}

/**
 * One application's menus as it declares them today: items, a shortcut hint,
 * a separator, a submenu, a disabled item, a label, a check item and a radio
 * group. The same declaration is drawn in the window without the `menu-bar`
 * capability and described to the platform with it.
 */
export function declaration(
  parts: Parts,
  handlers: DeclarationHandlers = {},
  state: { dense?: boolean; layout?: string } = {},
  props: Partial<React.ComponentProps<Parts['Menubar']>> = {},
) {
  const {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarItem,
    MenubarLabel,
    MenubarMenu,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
  } = parts;
  return (
    <Menubar testID="bar" {...props}>
      <MenubarMenu value="file">
        <MenubarTrigger testID="file-trigger">File</MenubarTrigger>
        <MenubarContent testID="file-panel">
          <MenubarItem
            testID="new"
            onPress={handlers.onNew}
            trailing={<MenubarShortcut>⌘N</MenubarShortcut>}
          >
            New tab
          </MenubarItem>
          <MenubarItem onPress={handlers.onOpen}>Open…</MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Share</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onPress={handlers.onEmail}>Email link</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem disabled>Print</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <MenubarTrigger testID="edit-trigger">Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onPress={handlers.onUndo}>Undo</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="view">
        <MenubarTrigger testID="view-trigger">View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem
            checked={state.dense ?? false}
            onCheckedChange={handlers.onDense ?? (() => undefined)}
          >
            Dense rows
          </MenubarCheckboxItem>
          <MenubarLabel>Layout</MenubarLabel>
          <MenubarRadioGroup
            value={state.layout ?? 'comfortable'}
            onValueChange={handlers.onLayout ?? (() => undefined)}
          >
            <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
            <MenubarRadioItem value="compact">Compact</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
