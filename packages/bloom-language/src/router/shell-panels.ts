/**
 * What an `AppLayout` hands Bloom's shell and pager besides the navigator:
 * its semantic layout, its panels (a `Panel` without content holds the
 * navigator) and its destinations, as the plain data `AppShell` and
 * `TabPagerProvider` read. Pure, so the parity suite draws the shell from it.
 */
import type { Binding } from '../binding';
import type { ReactNode } from 'react';
import type { AppShellPanelDefinition, AppShellProps } from '@oxy.so/bloom/app-shell';
import type { AppDestination } from '@oxy.so/bloom/tab-pager';

import { defined } from '../chrome/defined';
import type { Child, IconComponent, Node } from '../node';
import { nodesOf, valuesOf } from '../platform/values';
import { toElement } from '../render';
import {
  resolveSpace,
  type PanelRole,
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
  return defined({
    id,
    role: values.panelRole as PanelRole | undefined,
    label: values.label as string | undefined,
    content: content === undefined ? navigator : toElement(content),
    width: space(values.width),
    minWidth: space(values.minWidth),
    maxWidth: space(values.maxWidth),
    resizable: values.resizable as boolean | undefined,
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
  return defined({
    layout: values.shellLayout as ShellLayout | undefined,
    presentation: values.shellPresentation as ShellPresentation | undefined,
    panelLayout:
      panels.length > 0
        ? { ...options?.panelLayout, panels: panels.map((panel) => panelOf(panel, navigator)) }
        : undefined,
  });
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
