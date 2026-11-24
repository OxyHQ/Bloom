import type { Palette } from '../paint';
import type { ReactNode } from 'react';

import type { Binding } from '../binding';

import type { Child, Node, Press } from '../node';

export interface NodeHostProps {
  node: Node;
  /** Draws a node in the environment where the node is placed. */
  render: (child: Child) => ReactNode;
  /** A press modifier's value as a handler, in that environment (a `navigate()` goes through its navigator). */
  press: (value: Press | undefined) => (() => void) | undefined;
  /** What the node's tree paints from (`usePalette`), for a colour the host paints itself. */
  palette: Palette;
}

/** What every platform's menu host takes from a `Menu` node. */
export interface MenuHostProps {
  trigger: Child;
  /** The rows, as nodes: read only while the menu is open (see `menu-rows.ts`). */
  rows: readonly Child[];
  /** What its tagged rows do: an `actions()` view (see `menu-actions.tsx`). */
  actions: Child | undefined;
  /** The menu's accessible name (the node's `.label()`). */
  label: string | undefined;
  /** Open through a binding (`.presented()`); the menu's own state without one. */
  presented: Binding<boolean> | undefined;
  testID: string | undefined;
  /** Draws a node in the environment where the menu is placed. */
  render: (child: Child) => ReactNode;
}
