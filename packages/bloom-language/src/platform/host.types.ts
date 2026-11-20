import type { ReactNode } from 'react';

import type { Child, Node } from '../node';

export interface NodeHostProps {
  node: Node;
  /** Draws a node in the environment where the node is placed. */
  render: (child: Child) => ReactNode;
}

/** What every platform's menu host takes from a `Menu` node. */
export interface MenuHostProps {
  trigger: Child;
  /** The rows, as nodes: read only while the menu is open (see `menu-rows.ts`). */
  rows: readonly Child[];
  /** The menu's accessible name (the node's `.label()`). */
  label: string | undefined;
  testID: string | undefined;
  /** Draws a node in the environment where the menu is placed. */
  render: (child: Child) => ReactNode;
}
