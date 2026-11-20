/**
 * iOS: the system navigation bar. In a screen of a native stack (expo-router's
 * `Stack`, which the router's `Stack` is on iOS), the header sets the screen's
 * options and its toolbar, so UIKit draws the bar: the large title that folds
 * into the inline one as the page scrolls, the bar items on Liquid Glass on
 * iOS 26, and the system back button (which pops the stack: a custom `onBack`
 * is not called; `null` hides it).
 *
 * Toolbar items are the system's own where they can be:
 * - a `Button` whose glyph has an SF Symbol (`sfSymbols` in the spec), or one
 *   with a text label, is a bar button;
 * - a `Menu` opened from such a button, whose rows are given as they are (not
 *   a `menu()` content), is a bar menu: its rows the system's actions, sections
 *   and submenus, each with its icon's SF Symbol (none when it has none);
 * - anything else is Bloom's own view, in the bar.
 *
 * Outside a native stack (a tab page, a panel), or without expo-router,
 * Bloom's PageHeader.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import { createContext, useContext, type ComponentType, type Context, type ReactNode } from 'react';

import {
  isNode,
  type Child,
  type IconProps,
  type MenuProps,
  type Node,
  type TextProps,
} from '../node';
import { actionsOf, useMenuChoices } from './menu-actions';
import { builtOnOpen, readMenuRows, type MenuRowData } from './menu-rows';
import { PageHeaderHost, readHeader } from './header-page';
import { sfSymbolOf } from './sf-symbol';
import { nodesOf, valuesOf } from './values';
import type { NodeHostProps } from './host.types';

type Item = ComponentType<Record<string, unknown> & { children?: ReactNode }>;

interface StackModule {
  Screen: ComponentType<{ options: Record<string, unknown> }>;
  Toolbar: Item & {
    Button: Item;
    Menu: Item;
    MenuAction: Item;
    View: Item;
  };
}

interface NavigationLike {
  getState?: () => { type?: string } | undefined;
}

let router: { Stack: StackModule; context: Context<NavigationLike | undefined> } | null | undefined;

function loadRouter() {
  if (router !== undefined) return router;
  router = null;
  try {
    const { Stack } = require('expo-router') as { Stack?: StackModule };
    const { NavigationContext } = require('expo-router/react-navigation') as {
      NavigationContext?: Context<NavigationLike | undefined>;
    };
    router =
      Stack?.Screen && Stack.Toolbar && NavigationContext
        ? { Stack, context: NavigationContext }
        : null;
  } catch {
    router = null;
  }
  return router;
}

const NO_NAVIGATION = createContext<NavigationLike | undefined>(undefined);

/** Whether a header here is the system navigation bar: the screen is a native stack's. */
export function useSystemBar(): boolean {
  const loaded = loadRouter();
  // Whether expo-router loaded is fixed for the process, so the hook order never changes.
  const navigation = useContext(loaded ? loaded.context : NO_NAVIGATION);
  return navigation?.getState?.()?.type === 'stack';
}

export function HeaderHost(props: NodeHostProps) {
  const system = useSystemBar();
  const loaded = loadRouter();
  if (!system || !loaded) return <PageHeaderHost {...props} />;
  return <SystemBar {...props} Stack={loaded.Stack} />;
}

function SystemBar({ node, render, press, Stack }: NodeHostProps & { Stack: StackModule }) {
  const header = readHeader(node);
  const { choose, running } = useMenuChoices();
  const item = (child: Node, index: number) =>
    barItem(child, index, { Stack, render, press, choose });
  const trailing = nodesOf(header.toolbar);
  const leading = nodesOf(header.leading);
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: header.title,
          headerLargeTitle: header.display === 'large',
          headerTransparent: true,
          headerShadowVisible: header.scrollEdge !== 'none',
          headerBackVisible: header.onBack !== null,
        }}
      />
      {leading.length > 0 ? (
        <Stack.Toolbar placement="left">{leading.map(item)}</Stack.Toolbar>
      ) : null}
      {trailing.length > 0 ? (
        <Stack.Toolbar placement="right">{trailing.map(item)}</Stack.Toolbar>
      ) : null}
      {running}
    </>
  );
}

interface BarContext {
  Stack: StackModule;
  render: NodeHostProps['render'];
  press: NodeHostProps['press'];
  choose: ReturnType<typeof useMenuChoices>['choose'];
}

/** A button's glyph and its text label, as the system bar reads them. */
function buttonFace(node: Node): { symbol: string | undefined; title: string | undefined } {
  let symbol: string | undefined;
  let title: string | undefined;
  for (const child of nodesOf(node.children)) {
    if (child.kind === 'icon' && symbol === undefined)
      symbol = sfSymbolOf((child.props as IconProps).icon);
    if (child.kind === 'text') {
      title = (child.props as TextProps).runs
        .filter((run) => typeof run === 'string' || typeof run === 'number')
        .join('');
    }
  }
  return { symbol, title };
}

function barItem(node: Node, index: number, bar: BarContext): ReactNode {
  const { Stack } = bar;
  const values = valuesOf(node);
  const label = values.label as string | undefined;
  if (node.kind === 'button') {
    const face = buttonFace(node);
    if (face.symbol !== undefined || face.title !== undefined) {
      return (
        <Stack.Toolbar.Button
          key={index}
          icon={face.symbol}
          accessibilityLabel={label}
          disabled={values.disabled === true || values.loading === true}
          onPress={bar.press(values.onPress as never)}
        >
          {face.symbol === undefined ? face.title : undefined}
        </Stack.Toolbar.Button>
      );
    }
  }
  if (node.kind === 'menu' && !builtOnOpen(node.children)) {
    const trigger = (node.props as MenuProps).trigger;
    const face = isNode(trigger) && trigger.kind === 'button' ? buttonFace(trigger) : undefined;
    if (face?.symbol !== undefined) {
      const actions = actionsOf(values.actions as Child | undefined);
      const rows = readMenuRows(
        node.children,
        actions ? (tag) => bar.choose(actions, tag) : undefined,
      );
      const name =
        label ?? (isNode(trigger) ? (valuesOf(trigger).label as string | undefined) : undefined);
      return (
        <Stack.Toolbar.Menu key={index} icon={face.symbol} accessibilityLabel={name}>
          {menuElements(rows, Stack)}
        </Stack.Toolbar.Menu>
      );
    }
  }
  return <Stack.Toolbar.View key={index}>{bar.render(node)}</Stack.Toolbar.View>;
}

/** Rows as the bar menu's own elements; a divider starts a new inline group. */
function menuElements(rows: readonly MenuRowData[], Stack: StackModule): ReactNode[] {
  const groups: MenuRowData[][] = [[]];
  for (const row of rows) {
    if (row.kind === 'divider') groups.push([]);
    else (groups[groups.length - 1] as MenuRowData[]).push(row);
  }
  if (groups.length === 1)
    return (groups[0] as MenuRowData[]).map((row) => menuElement(row, Stack));
  return groups
    .filter((group) => group.length > 0)
    .map((group, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: a group is its place between dividers
      <Stack.Toolbar.Menu key={`g${index}`} inline>
        {group.map((row) => menuElement(row, Stack))}
      </Stack.Toolbar.Menu>
    ));
}

function menuElement(row: MenuRowData, Stack: StackModule): ReactNode {
  switch (row.kind) {
    case 'divider':
      return null;
    case 'section':
      return (
        <Stack.Toolbar.Menu key={row.id} inline title={row.title}>
          {menuElements(row.rows, Stack)}
        </Stack.Toolbar.Menu>
      );
    case 'submenu':
      return (
        <Stack.Toolbar.Menu
          key={row.id}
          title={row.title}
          icon={sfSymbolOf(row.icon)}
          disabled={row.disabled}
        >
          {menuElements(row.rows, Stack)}
        </Stack.Toolbar.Menu>
      );
    case 'item':
      return (
        <Stack.Toolbar.MenuAction
          key={row.id}
          icon={sfSymbolOf(row.icon)}
          destructive={row.destructive}
          disabled={row.disabled}
          isOn={row.checked}
          unstable_keepPresented={row.keepOpen}
          onPress={row.onPress}
        >
          {row.title}
        </Stack.Toolbar.MenuAction>
      );
  }
}
