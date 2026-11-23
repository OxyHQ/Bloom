import { useCallback, type ReactNode } from 'react';
import {
  Menubar as BloomMenubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu as BloomMenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@oxy.so/bloom/menubar';

import type { Binding } from '../binding';
import {
  Node,
  type Child,
  type IconComponent,
  type MenuActionsView,
  type MenuChild,
  type MenuContentView,
  type ViewModifiers,
  type ViewNode,
} from '../node';
import { useMenuChoice } from '../platform/menu-actions';
import { drawMenuRows, glyph, type MenuParts } from '../platform/menu-dropdown';
import { readMenuRows } from '../platform/menu-rows';
import { nodesOf, valuesOf } from '../platform/values';
import type { ControlRenderer } from './draw';

/** A horizontal bar of menus, at most one open at a time (Bloom `menubar`). */
export type MenubarKind = 'menubar' | 'menubarMenu';

/** Bloom `Menubar`: its menus. */
export interface MenubarView extends ViewModifiers<MenubarView> {
  /** The open menu's id (its title unless `.id()` says otherwise), `undefined` while none is. */
  openMenu(value: Binding<string | undefined>): MenubarView;
  /** What its menus' tagged rows do: an `actions()` view, as a `Menu`'s. */
  actions(value: MenuActionsView): MenubarView;
}

/** Bloom `MenubarMenu`: a title in the bar, and the rows it opens. */
export interface MenubarMenuView extends ViewNode {
  /** What names it in the bar's `.openMenu()` (its title by default). */
  id(value: string): MenubarMenuView;
  /** Its title cannot open it. */
  disabled(value?: boolean): MenubarMenuView;
  /** Its title's test id. */
  testID(value: string): MenubarMenuView;
}

/** Bloom `Menubar`: `menus` in a row; one opens at a time. `.label()` names the bar. */
export function Menubar(...menus: (MenubarMenuView | false | null | undefined)[]): MenubarView {
  return new Node('menubar', null, menus as Child[]);
}

/** Bloom `MenubarMenu`: `title` in the bar; `rows` are a `Menu`'s (or one `menu()` content). */
export function MenubarMenu(title: string, ...rows: MenuChild[]): MenubarMenuView;
export function MenubarMenu(title: string, rows: MenuContentView): MenubarMenuView;
export function MenubarMenu(title: string, ...rows: readonly unknown[]): MenubarMenuView {
  return new Node('menubarMenu', { title }, rows as Child[]);
}

const PARTS: MenuParts = {
  Item: MenubarItem,
  CheckboxItem: MenubarCheckboxItem,
  Label: MenubarLabel,
  Separator: MenubarSeparator,
  Group: MenubarGroup,
  Sub: MenubarSub,
  SubTrigger: MenubarSubTrigger,
  SubContent: MenubarSubContent,
};

interface MenubarHostProps {
  menus: readonly Child[];
  actions: Child | undefined;
  openMenu: Binding<string | undefined> | undefined;
  render: (child: Child) => ReactNode;
  [prop: string]: unknown;
}

/** The bar, each menu a trigger and its rows, read as a `Menu`'s. */
function MenubarHost({ menus, actions, openMenu, render, ...props }: MenubarHostProps) {
  const { choose, running } = useMenuChoice(actions);
  const leading = useCallback(
    (icon: IconComponent | undefined, destructive: boolean): ReactNode =>
      icon ? render(glyph(icon, destructive)) : undefined,
    [render],
  );
  return (
    <>
      <BloomMenubar {...props} value={openMenu?.[0]} onValueChange={openMenu?.[1]}>
        {nodesOf(menus).map((menu) => {
          const { title } = menu.props as { title: string };
          const values = valuesOf(menu);
          const value = (values.id as string | undefined) ?? title;
          return (
            <BloomMenubarMenu key={value} value={value}>
              <MenubarTrigger
                disabled={values.disabled as boolean | undefined}
                testID={values.testID as string | undefined}
              >
                {title}
              </MenubarTrigger>
              <MenubarContent>
                {drawMenuRows(readMenuRows(menu.children, choose), leading, PARTS)}
              </MenubarContent>
            </BloomMenubarMenu>
          );
        })}
      </BloomMenubar>
      {running}
    </>
  );
}

export const MENUBARS: Record<MenubarKind, ControlRenderer> = {
  menubar: (d) =>
    d.component(MenubarHost, {
      key: d.key,
      menus: d.node.children,
      actions: d.own('actions')?.value,
      openMenu: d.own('openMenu')?.value,
      render: d.render,
      label: d.label,
      testID: d.testID,
    }),
  // A menu is read by the bar that holds it; on its own it draws nothing.
  menubarMenu: () => null as unknown as ReturnType<ControlRenderer>,
};
