/**
 * What an `AppLayout` hands Bloom's shell and pager besides the navigator:
 * its semantic layout, its panels (a `Panel` without content holds the
 * navigator), its sidebar, its widths and its destinations, as the plain data `AppShell` and
 * `TabPagerProvider` read. Pure, so the parity suite draws the shell from it.
 */
import type { Binding } from '../binding';
import type { ReactNode } from 'react';
import type {
  AppShellPanelDefinition,
  AppShellProps,
  AppShellSidebarProps,
} from '@oxy.so/bloom/app-shell';
import type { AppDestination } from '@oxy.so/bloom/tab-pager';

import { defined } from '../chrome/defined';
import { sidebarProps } from '../chrome/sidebar-host';
import { isNode, type Child, type IconComponent, type Node, type Press } from '../node';
import { nodesOf, valuesOf } from '../platform/values';
import { toElement } from '../render';
import {
  resolveSpace,
  type PanelAppearance,
  type PanelRole,
  type ShellBreakpoint,
  type ShellLayout,
  type ShellPresentation,
  type SpaceToken,
} from '../tokens';

function space(value: unknown): number | undefined {
  return value === undefined ? undefined : resolveSpace(value as SpaceToken);
}

function panelOf(node: Node, navigator: ReactNode): AppShellPanelDefinition {
  const values = valuesOf(node);
  const { id, content } = node.props as { id: string; content: Child | undefined };
  const hidden = values.hidden as boolean | undefined;
  // A resizable panel's width as the app's state: where it rests, and what a drag settles on.
  const resizable = values.resizable as boolean | Binding<number> | undefined;
  const width = Array.isArray(resizable) ? resizable : undefined;
  return defined({
    id,
    role: values.panelRole as PanelRole | undefined,
    label: values.label as string | undefined,
    content: content === undefined ? navigator : toElement(content),
    width: width ? width[0] : space(values.width),
    onWidthChange: width?.[1],
    minWidth: space(values.minWidth),
    maxWidth: space(values.maxWidth),
    resizable: width ? true : (resizable as boolean | undefined),
    resizeLabel: values.resizeLabel as string | undefined,
    visible: hidden === undefined ? undefined : !hidden,
    keepMounted: values.keepMounted as boolean | undefined,
    open: (values.presented as Binding<boolean> | undefined)?.[0],
    onOpenChange: (values.presented as Binding<boolean> | undefined)?.[1],
    testID: values.testID as string | undefined,
  });
}

/** The shell's semantic layout and its panels, over the app's own shell options. */
export function shellLayoutOf(
  node: Node,
  navigator: ReactNode,
  options: Partial<AppShellProps> | undefined,
): Partial<AppShellProps> {
  const values = valuesOf(node);
  const panels = nodesOf((values.panels as readonly Child[] | undefined) ?? []).filter(
    (panel) => panel.kind === 'panel',
  );
  const appearance = values.panelAppearance as PanelAppearance | undefined;
  const contentMaxWidth = values.contentMaxWidth as SpaceToken | undefined;
  return defined({
    layout: values.shellLayout as ShellLayout | undefined,
    presentation: values.shellPresentation as ShellPresentation | undefined,
    navFrom: values.navFrom as ShellBreakpoint | undefined,
    contentMaxWidth: contentMaxWidth === 'none' ? 'none' : space(contentMaxWidth),
    reserveBottomBarSpace: values.reserveBottomBarSpace as boolean | undefined,
    panelLayout:
      panels.length > 0
        ? defined({
            ...options?.panelLayout,
            appearance: appearance ?? options?.panelLayout?.appearance,
            panels: panels.map((panel) => panelOf(panel, navigator)),
          })
        : undefined,
  });
}

/**
 * The shell's sidebar: the layout's `Sidebar` as Bloom's sidebar props (the
 * shell draws the destinations as its rows), its selection the destination
 * the route in front belongs to. `press` is what a row's press does (through
 * the layout's navigator).
 */
export function sidebarOf(
  node: Node,
  press: (value: Press | undefined) => (() => void) | undefined,
): AppShellSidebarProps | undefined {
  const values = valuesOf(node);
  const sidebar = values.sidebar;
  const active = values.activeDestination as string | undefined;
  if (!isNode(sidebar)) return active === undefined ? undefined : { selected: active };
  const props = sidebarProps(sidebar, toElement, press);
  return active === undefined ? props : { ...props, selected: active };
}

/** The pager's destinations, in order. */
export function destinationsOf(node: Node): AppDestination[] {
  const rows = nodesOf((valuesOf(node).destinations as readonly Child[] | undefined) ?? []);
  return rows
    .filter((row) => row.kind === 'destination')
    .map((row) => {
      const values = valuesOf(row);
      const { name, href } = row.props as { name: string; href: string };
      return defined({
        name,
        href,
        label: values.label as string | undefined,
        icon: values.icon as IconComponent | undefined,
        activeIcon: values.activeIcon as IconComponent | undefined,
        badge: values.badge as number | undefined,
        page: values.page as boolean | undefined,
        preload: values.preload as boolean | undefined,
        bar: values.bar as boolean | undefined,
        sidebar: values.sidebar as boolean | undefined,
        sidebarAfter: values.sidebarAfter as string | undefined,
        onPress: values.onPress as (() => void) | undefined,
        onLongPress: values.onLongPress as (() => void) | undefined,
      }) as AppDestination;
    });
}
