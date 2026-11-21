import { useCallback, type ReactElement, type ReactNode } from 'react';
import {
  ContextMenu as BloomContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  type ContextMenuAnchor,
} from '@oxy.so/bloom/context-menu';

import type { Binding } from '../binding';
import {
  Node,
  type Child,
  type IconComponent,
  type MenuActionsView,
  type MenuChild,
  type MenuContentView,
  type ViewModifiers,
} from '../node';
import { useMenuChoice } from '../platform/menu-actions';
import { drawMenuRows, glyph, type MenuParts } from '../platform/menu-dropdown';
import { readMenuRows } from '../platform/menu-rows';
import type { ControlRenderer } from './draw';

/** The menu a right-click or a long press opens on a view (Bloom `context-menu`). */
export type ContextMenuKind = 'contextMenu';

/**
 * Bloom `ContextMenu`: the view it is about, and its rows. A long press opens
 * it on native (the lens menu on Android and OxyOS, morphing out of the press),
 * the secondary button on the web; its rows are a `Menu`'s.
 */
export interface ContextMenuView extends ViewModifiers<ContextMenuView> {
  /** What its tagged rows do: an `actions()` view, as a `Menu`'s. */
  actions(value: MenuActionsView): ContextMenuView;
  /**
   * Where it is open, when the screen owns it: a point (or a box) while open,
   * `null` while closed. Opening it at a point of the screen's choosing is
   * setting it; every dismissal sets it back to `null`.
   */
  presentedAt(value: Binding<ContextMenuAnchor | null>): ContextMenuView;
  /** Nothing opens it. */
  disabled(value?: boolean): ContextMenuView;
}

/**
 * Bloom `ContextMenu` on `content`: `rows` are what it presents (`Item`,
 * `Submenu`, `Section`, `Divider`, or one `menu()` content). Its box and its
 * `.label()` are the view's: the area that opens it.
 */
export function ContextMenu(content: Child, ...rows: MenuChild[]): ContextMenuView;
export function ContextMenu(content: Child, rows: MenuContentView): ContextMenuView;
export function ContextMenu(content: Child, ...rows: readonly unknown[]): ContextMenuView {
  return new Node('contextMenu', { content }, rows as Child[]);
}

const PARTS: MenuParts = {
  Item: ContextMenuItem,
  CheckboxItem: ContextMenuCheckboxItem,
  Label: ContextMenuLabel,
  Separator: ContextMenuSeparator,
  Group: ContextMenuGroup,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
};

interface ContextMenuHostProps {
  trigger: ReactElement;
  rows: readonly Child[];
  actions: Child | undefined;
  presentedAt: Binding<ContextMenuAnchor | null> | undefined;
  label: string | undefined;
  render: (child: Child) => ReactNode;
}

/**
 * The menu around its trigger, its rows read as a `Menu`'s. They are read with
 * the view, a `menu()` content's included: the lens menu takes its rows before
 * the press that opens it.
 */
function ContextMenuHost({
  trigger,
  rows,
  actions,
  presentedAt,
  label,
  render,
}: ContextMenuHostProps) {
  const { choose, running } = useMenuChoice(actions);
  const leading = useCallback(
    (icon: IconComponent | undefined, destructive: boolean): ReactNode =>
      icon ? render(glyph(icon, destructive)) : undefined,
    [render],
  );
  return (
    <>
      <BloomContextMenu anchor={presentedAt?.[0]} onAnchorChange={presentedAt?.[1]}>
        {trigger}
        <ContextMenuContent label={label}>
          {drawMenuRows(readMenuRows(rows, choose), leading, PARTS)}
        </ContextMenuContent>
      </BloomContextMenu>
      {running}
    </>
  );
}

export const CONTEXT_MENUS: Record<ContextMenuKind, ControlRenderer> = {
  contextMenu: (d) => {
    const { content } = d.node.props as { content: Child };
    const trigger = d.component(
      ContextMenuTrigger,
      { label: d.label, disabled: d.own('disabled')?.value, testID: d.testID },
      d.render(content),
    );
    return (
      <ContextMenuHost
        key={d.key}
        trigger={trigger}
        rows={d.node.children}
        actions={d.own('actions')?.value}
        presentedAt={d.own('presentedAt')?.value}
        label={d.label}
        render={d.render}
      />
    );
  },
};
