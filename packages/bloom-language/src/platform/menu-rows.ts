/**
 * A menu's rows as data, read from its nodes: what every platform's menu
 * presents. A `menu()` content among them is built here, by calling its body,
 * so this runs only in the component that presents an OPEN menu (on iOS, where
 * the system menu needs its rows before it opens, in the component that holds
 * it).
 */
import type { GlassValue } from '../glass';
import {
  isNode,
  Node,
  type Child,
  type IconComponent,
  type MenuContentProps,
  type Modifier,
} from '../node';
import { valuesOf } from './values';

export interface MenuItemRow {
  kind: 'item';
  id: string;
  title: string;
  icon: IconComponent | undefined;
  destructive: boolean;
  disabled: boolean;
  /** A toggle's state; `undefined` for an action. */
  checked: boolean | undefined;
  keepOpen: boolean;
  onPress: (() => void) | undefined;
  testID: string | undefined;
}
export interface MenuDividerRow {
  kind: 'divider';
  id: string;
}
export interface MenuSectionRow {
  kind: 'section';
  id: string;
  title: string | undefined;
  rows: MenuRowData[];
}
export interface MenuSubmenuRow {
  kind: 'submenu';
  id: string;
  title: string;
  icon: IconComponent | undefined;
  disabled: boolean;
  testID: string | undefined;
  rows: MenuRowData[];
}
export type MenuRowData = MenuItemRow | MenuDividerRow | MenuSectionRow | MenuSubmenuRow;

function flatten(children: readonly Child[], out: Node[] = []): Node[] {
  for (const child of children) {
    if (Array.isArray(child)) flatten(child, out);
    else if (isNode(child)) {
      if (child.kind === 'menuContent') {
        const { body, props } = child.props as MenuContentProps;
        flatten([body(props)], out);
      } else out.push(child);
    }
  }
  return out;
}

/** Reads rows; ids are positional (`r0`, `r0.1`…), stable while the rows are. */
export function readMenuRows(children: readonly Child[], prefix = 'r'): MenuRowData[] {
  const rows: MenuRowData[] = [];
  flatten(children).forEach((node, index) => {
    const id = `${prefix}${index}`;
    const values = valuesOf(node);
    switch (node.kind) {
      case 'menuItem':
        rows.push({
          kind: 'item',
          id,
          title: (node.props as { title: string }).title,
          icon: values.icon as IconComponent | undefined,
          destructive: values.destructive === true,
          disabled: values.disabled === true,
          checked: values.checked as boolean | undefined,
          keepOpen: values.keepOpen === true,
          onPress: values.onPress as (() => void) | undefined,
          testID: values.testID as string | undefined,
        });
        break;
      case 'menuDivider':
        rows.push({ kind: 'divider', id });
        break;
      case 'menuSection':
        rows.push({
          kind: 'section',
          id,
          title: values.title as string | undefined,
          rows: readMenuRows(node.children, `${id}.`),
        });
        break;
      case 'menuSubmenu':
        rows.push({
          kind: 'submenu',
          id,
          title: (node.props as { title: string }).title,
          icon: values.icon as IconComponent | undefined,
          disabled: values.disabled === true,
          testID: values.testID as string | undefined,
          rows: readMenuRows(node.children, `${id}.`),
        });
        break;
      default:
        break;
    }
  });
  return rows;
}

/** Whether a separator goes before `rows[index]`: a section is set apart from the rows beside it. */
export function setApart(rows: readonly MenuRowData[], index: number): boolean {
  const row = rows[index];
  const previous = rows[index - 1];
  if (row === undefined || previous === undefined) return false;
  if (row.kind === 'divider' || previous.kind === 'divider') return false;
  return row.kind === 'section' || previous.kind === 'section';
}

/** Every item's action by id, through sections and submenus. */
export function menuHandlers(
  rows: readonly MenuRowData[],
  out: Record<string, () => void> = {},
): Record<string, () => void> {
  for (const row of rows) {
    if (row.kind === 'item' && row.onPress) out[row.id] = row.onPress;
    else if (row.kind === 'section' || row.kind === 'submenu') menuHandlers(row.rows, out);
  }
  return out;
}

/** The last modifier of a kind on a node. */
function lastOf<K extends Modifier['kind']>(
  node: Node,
  kind: K,
): Extract<Modifier, { kind: K }> | undefined {
  for (let i = node.modifiers.length - 1; i >= 0; i--) {
    const modifier = node.modifiers[i] as Modifier;
    if (modifier.kind === kind) return modifier as Extract<Modifier, { kind: K }>;
  }
  return undefined;
}

/** The trigger, pressable: `open` runs on its press, after any press handler of its own. */
export function pressableTrigger(trigger: Child, open: () => void): Child {
  if (!isNode(trigger)) return trigger;
  const handler = lastOf(trigger, 'onPress')?.value;
  return trigger.onPress((event) => {
    handler?.(event);
    open();
  });
}

/** The trigger without its glass, and that glass: a menu that draws its trigger's glass itself takes it off. */
export function splitTriggerGlass(trigger: Child): {
  trigger: Child;
  glass: GlassValue | undefined;
} {
  if (!isNode(trigger)) return { trigger, glass: undefined };
  const glass = lastOf(trigger, 'glass')?.value;
  if (glass === undefined) return { trigger, glass: undefined };
  const modifiers = trigger.modifiers.filter((modifier) => modifier.kind !== 'glass');
  return {
    trigger: new Node(trigger.kind, trigger.props, trigger.children, modifiers),
    glass,
  };
}
