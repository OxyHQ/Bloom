/**
 * A `Sidebar` as Bloom's `Sidebar`, on every platform: its `NavItem` rows are
 * its `items` (the `.secondary()` ones its `secondaryItems`), its
 * `TreeSection`s its `tree`, and its modifiers its own props. Every row is the
 * plain data Bloom's sidebar reads; a row's press goes through the
 * environment's navigator when it is a `navigate()`.
 */
import type { ReactNode } from 'react';
import {
  Sidebar,
  type SidebarAccount,
  type SidebarLogo,
  type SidebarNavItem,
  type SidebarProps,
  type SidebarTree,
  type SidebarTreeFolder,
  type SidebarTreeItem,
} from '@oxy.so/bloom/sidebar';

import type { Child, IconComponent, Node, Press } from '../node';
import { nodesOf, valuesOf } from '../platform/values';
import type { NodeHostProps } from '../platform/host.types';
import type { SidebarSize, SidebarSurface, SidebarVariant } from '../tokens';
import { defined } from './defined';

type Draw = NodeHostProps['render'];
type PressOf = NodeHostProps['press'];

function labelOf(node: Node): string {
  return (node.props as { label: string }).label;
}

/** Controls at a row's end, as one element; none when the chain names none. */
function trailingOf(values: Record<string, unknown>, render: Draw): ReactNode | undefined {
  const trailing = values.trailing as readonly Child[] | undefined;
  return trailing && trailing.length > 0 ? render(trailing) : undefined;
}

function navItemOf(node: Node, press: PressOf): SidebarNavItem {
  const values = valuesOf(node);
  const { label, icon } = node.props as { label: string; icon: IconComponent };
  return defined({
    key: (values.id as string | undefined) ?? label,
    label,
    icon,
    activeIcon: values.activeIcon as IconComponent | undefined,
    href: values.link as string | undefined,
    badge: values.badge as string | number | undefined,
    shortcut: values.shortcut as string | undefined,
    onPress: press(values.onPress as Press | undefined),
    onLongPress: values.onLongPress as (() => void) | undefined,
  });
}

function treeItemOf(node: Node, render: Draw, press: PressOf): SidebarTreeItem {
  const values = valuesOf(node);
  const label = labelOf(node);
  const nested = nodesOf(node.children).filter((child) => child.kind === 'treeItem');
  return defined({
    key: (values.id as string | undefined) ?? label,
    label,
    icon: values.icon as IconComponent | undefined,
    description: values.subtitle as string | undefined,
    meta: values.meta as string | undefined,
    href: values.link as string | undefined,
    actions: trailingOf(values, render),
    disabled: values.disabled as boolean | undefined,
    open: values.expanded as boolean | undefined,
    onOpenChange: values.onExpandedChange as ((open: boolean) => void) | undefined,
    emptyLabel: values.emptyLabel as string | undefined,
    onPress: press(values.onPress as Press | undefined),
    onLongPress: values.onLongPress as (() => void) | undefined,
    items: nested.length > 0 ? nested.map((item) => treeItemOf(item, render, press)) : undefined,
  });
}

function folderOf(node: Node, render: Draw, press: PressOf): SidebarTreeFolder {
  const values = valuesOf(node);
  const label = labelOf(node);
  return defined({
    key: (values.id as string | undefined) ?? label,
    label,
    actions: trailingOf(values, render),
    open: values.expanded as boolean | undefined,
    onOpenChange: values.onExpandedChange as ((open: boolean) => void) | undefined,
    items: nodesOf(node.children)
      .filter((child) => child.kind === 'treeItem')
      .map((item) => treeItemOf(item, render, press)),
  });
}

function sectionOf(node: Node, render: Draw, press: PressOf): SidebarTree {
  const values = valuesOf(node);
  const rows = nodesOf(node.children);
  const items = rows.filter((row) => row.kind === 'treeItem');
  const folders = rows.filter((row) => row.kind === 'treeFolder');
  return defined({
    key: values.id as string | undefined,
    label: labelOf(node),
    actions: trailingOf(values, render),
    items: items.length > 0 ? items.map((item) => treeItemOf(item, render, press)) : undefined,
    folders:
      folders.length > 0 ? folders.map((folder) => folderOf(folder, render, press)) : undefined,
    collapsible: values.collapsible as boolean | undefined,
    open: values.expanded as boolean | undefined,
    onOpenChange: values.onExpandedChange as ((open: boolean) => void) | undefined,
    loading: values.loading as boolean | undefined,
    error: values.error as string | undefined,
    emptyLabel: values.emptyLabel as string | undefined,
  });
}

/** Every prop Bloom's sidebar takes from the node, none it left out. */
export function sidebarProps(node: Node, render: Draw, press: PressOf): SidebarProps {
  const values = valuesOf(node);
  const rows = nodesOf(node.children);
  const nav = rows.filter((row) => row.kind === 'navItem');
  const primary = nav.filter((row) => valuesOf(row).secondary !== true);
  const secondary = nav.filter((row) => valuesOf(row).secondary === true);
  const sections = rows.filter((row) => row.kind === 'treeSection');
  const selection = values.selection as string | undefined;
  const onSelect = values.onSelect as ((id: string) => void) | undefined;
  const header = values.header as Node | false | undefined;
  const toolbar = values.toolbar as readonly Child[] | undefined;
  let footer: Child;
  for (const modifier of node.modifiers) if (modifier.kind === 'footer') footer = modifier.content;
  return defined({
    items: primary.length > 0 ? primary.map((row) => navItemOf(row, press)) : undefined,
    secondaryItems:
      secondary.length > 0 ? secondary.map((row) => navItemOf(row, press)) : undefined,
    tree:
      sections.length > 0
        ? sections.map((section) => sectionOf(section, render, press))
        : undefined,
    selected: selection,
    selectedTreeItem: selection,
    onNavigate: onSelect ? (item: SidebarNavItem) => onSelect(item.key) : undefined,
    onTreeItemPress: onSelect ? (item: SidebarTreeItem) => onSelect(item.key) : undefined,
    header: header === undefined ? undefined : header === false ? false : render(header),
    toolbar: toolbar && toolbar.length > 0 ? render(toolbar) : undefined,
    footer: footer ? render(footer) : undefined,
    variant: values.variant as SidebarVariant | undefined,
    surface: values.surface as SidebarSurface | undefined,
    size: values.size as SidebarSize | undefined,
    collapsed: values.collapsed as boolean | undefined,
    onCollapsedChange: values.onCollapsedChange as ((collapsed: boolean) => void) | undefined,
    showSearch: values.searchable as boolean | undefined,
    showThemeToggle: values.themeToggle as boolean | undefined,
    logo: values.logo as SidebarLogo | undefined,
    account: values.account as SidebarAccount | undefined,
    accessibilityLabel: values.label as string | undefined,
    testID: values.testID as string | undefined,
  });
}

export function SidebarHost({ node, render, press }: NodeHostProps) {
  return <Sidebar {...sidebarProps(node, render, press)} />;
}
