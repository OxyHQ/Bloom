/**
 * Bloom's own menu (`DropdownMenu`) for a `Menu` node: the web's menu, and the
 * menu of a native platform whose own cannot run (no lens engine in the
 * binary, an Android before 13, an iOS without `@expo/ui`). Its content mounts
 * only while the menu is open.
 */
import { Fragment, useCallback, useState, type ReactNode } from 'react';
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
} from '@oxy.so/bloom/dropdown-menu';

import { Icon } from '../primitives';
import type { Child, IconComponent } from '../node';
import { pressableTrigger, readMenuRows, setApart, type MenuRowData } from './menu-rows';
import type { MenuHostProps } from './host.types';

const NOOP = () => {};

export function DropdownMenuHost({ trigger, rows, label, testID, render }: MenuHostProps) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild label={label}>
        {render(pressableTrigger(trigger, NOOP))}
      </DropdownMenuTrigger>
      {open ? <DropdownRows rows={rows} label={label} testID={testID} render={render} /> : null}
    </DropdownMenu>
  );
}

function DropdownRows({
  rows,
  label,
  testID,
  render,
}: Pick<MenuHostProps, 'rows' | 'label' | 'testID' | 'render'>) {
  const data = readMenuRows(rows);
  const leading = useCallback(
    (icon: IconComponent | undefined, destructive: boolean): ReactNode =>
      icon ? render(glyph(icon, destructive)) : undefined,
    [render],
  );
  return (
    <DropdownMenuContent label={label} testID={testID}>
      {drawRows(data, leading)}
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

function drawRows(rows: readonly MenuRowData[], leading: Leading): ReactNode[] {
  return rows.map((row, index) => (
    <Fragment key={row.id}>
      {setApart(rows, index) ? <DropdownMenuSeparator /> : null}
      {drawRow(row, leading)}
    </Fragment>
  ));
}

function drawRow(row: MenuRowData, leading: Leading): ReactNode {
  switch (row.kind) {
    case 'divider':
      return <DropdownMenuSeparator />;
    case 'section':
      return (
        <DropdownMenuGroup>
          {row.title ? <DropdownMenuLabel>{row.title}</DropdownMenuLabel> : null}
          {drawRows(row.rows, leading)}
        </DropdownMenuGroup>
      );
    case 'submenu':
      return (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            leading={leading(row.icon, false)}
            disabled={row.disabled}
            testID={row.testID}
          >
            {row.title}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent label={row.title}>
            {drawRows(row.rows, leading)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    case 'item':
      return row.checked === undefined ? (
        <DropdownMenuItem
          leading={leading(row.icon, row.destructive)}
          variant={row.destructive ? 'destructive' : 'default'}
          disabled={row.disabled}
          keepOpen={row.keepOpen}
          onPress={row.onPress}
          testID={row.testID}
        >
          {row.title}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuCheckboxItem
          leading={leading(row.icon, row.destructive)}
          checked={row.checked}
          onCheckedChange={() => row.onPress?.()}
          disabled={row.disabled}
          keepOpen={row.keepOpen}
          testID={row.testID}
        >
          {row.title}
        </DropdownMenuCheckboxItem>
      );
  }
}
