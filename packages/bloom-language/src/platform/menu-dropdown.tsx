/**
 * Bloom's own menu (`DropdownMenu`) for a `Menu` node: the web's menu, and the
 * menu of a native platform whose own cannot run (no lens engine in the
 * binary, an Android before 13, an iOS without `@expo/ui`). Its content mounts
 * only while the menu is open.
 */
import { Fragment, useCallback, useState, type ComponentType, type ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type DropdownMenuCheckboxItemProps,
  type DropdownMenuItemProps,
  type DropdownMenuSubContentProps,
  type DropdownMenuSubTriggerProps,
} from '@oxy.so/bloom/dropdown-menu';

import { Icon } from '../primitives';
import type { Child, IconComponent } from '../node';
import { useMenuChoice } from './menu-actions';
import { pressableTrigger, readMenuRows, setApart, type MenuRowData } from './menu-rows';
import type { MenuHostProps } from './host.types';

const NOOP = () => {};

export function DropdownMenuHost({ trigger, rows, actions, label, testID, render }: MenuHostProps) {
  const [open, setOpen] = useState(false);
  const { choose, running } = useMenuChoice(actions);
  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild label={label}>
          {render(pressableTrigger(trigger, NOOP))}
        </DropdownMenuTrigger>
        {open ? (
          <DropdownRows rows={rows} choose={choose} label={label} testID={testID} render={render} />
        ) : null}
      </DropdownMenu>
      {running}
    </>
  );
}

function DropdownRows({
  rows,
  choose,
  label,
  testID,
  render,
}: Pick<MenuHostProps, 'rows' | 'label' | 'testID' | 'render'> & {
  choose: ((tag: string) => void) | undefined;
}) {
  const data = readMenuRows(rows, choose);
  const leading = useCallback(
    (icon: IconComponent | undefined, destructive: boolean): ReactNode =>
      icon ? render(glyph(icon, destructive)) : undefined,
    [render],
  );
  return (
    <DropdownMenuContent label={label} testID={testID}>
      {drawMenuRows(data, leading, DROPDOWN_PARTS)}
    </DropdownMenuContent>
  );
}

/** A row's glyph: Bloom's 20pt icon in the menu's quiet ink, or its negative one. */
export function glyph(icon: IconComponent, destructive: boolean): Child {
  return Icon(icon)
    .size('md')
    .foreground(destructive ? 'error' : 'muted');
}

type Leading = (icon: IconComponent | undefined, destructive: boolean) => ReactNode;

/**
 * The row parts of one of Bloom's menus. Its dropdown, context and menubar menus
 * draw the same rows, with the same props, each under its own part names.
 */
export interface MenuParts {
  Item: ComponentType<DropdownMenuItemProps>;
  CheckboxItem: ComponentType<DropdownMenuCheckboxItemProps>;
  Label: ComponentType<{ children?: ReactNode }>;
  Separator: ComponentType<Record<string, never>>;
  Group: ComponentType<{ children?: ReactNode }>;
  Sub: ComponentType<{ children?: ReactNode }>;
  SubTrigger: ComponentType<DropdownMenuSubTriggerProps>;
  SubContent: ComponentType<DropdownMenuSubContentProps>;
}

const DROPDOWN_PARTS: MenuParts = {
  Item: DropdownMenuItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  Label: DropdownMenuLabel,
  Separator: DropdownMenuSeparator,
  Group: DropdownMenuGroup,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
};

/** Rows as the parts of one of Bloom's menus; a section is set apart from the rows beside it. */
export function drawMenuRows(
  rows: readonly MenuRowData[],
  leading: Leading,
  parts: MenuParts,
): ReactNode[] {
  return rows.map((row, index) => (
    <Fragment key={row.id}>
      {setApart(rows, index) ? <parts.Separator /> : null}
      {drawRow(row, leading, parts)}
    </Fragment>
  ));
}

function drawRow(row: MenuRowData, leading: Leading, parts: MenuParts): ReactNode {
  const { Item, CheckboxItem, Label, Separator, Group, Sub, SubTrigger, SubContent } = parts;
  switch (row.kind) {
    case 'divider':
      return <Separator />;
    case 'section':
      return (
        <Group>
          {row.title ? <Label>{row.title}</Label> : null}
          {drawMenuRows(row.rows, leading, parts)}
        </Group>
      );
    case 'submenu':
      return (
        <Sub>
          <SubTrigger
            leading={leading(row.icon, false)}
            disabled={row.disabled}
            testID={row.testID}
          >
            {row.title}
          </SubTrigger>
          <SubContent label={row.title}>{drawMenuRows(row.rows, leading, parts)}</SubContent>
        </Sub>
      );
    case 'item':
      return row.checked === undefined ? (
        <Item
          leading={leading(row.icon, row.destructive)}
          variant={row.destructive ? 'destructive' : 'default'}
          disabled={row.disabled}
          keepOpen={row.keepOpen}
          onPress={row.onPress}
          testID={row.testID}
        >
          {row.title}
        </Item>
      ) : (
        <CheckboxItem
          leading={leading(row.icon, row.destructive)}
          checked={row.checked}
          onCheckedChange={() => row.onPress?.()}
          disabled={row.disabled}
          keepOpen={row.keepOpen}
          testID={row.testID}
        >
          {row.title}
        </CheckboxItem>
      );
  }
}
