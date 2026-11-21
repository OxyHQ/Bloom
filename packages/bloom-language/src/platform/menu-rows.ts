/**
 * A menu's rows as data, read from its nodes: what every platform's menu
 * presents. A `menu()` content among them is built here, by calling its body,
 * so a menu that has one reads its rows only while it is open. Rows given as
 * they are (tagged, or with their own handlers) can be read before it opens,
 * which is what the system menu on iOS needs.
 */
import type { GlassValue } from '../glass';
import {
  isNode,
  Navigation,
  Node,
  type Child,
  type IconComponent,
  type MenuContentProps,
  type Modifier,
} from '../node';
import { resolveCorner } from '../tokens';
import { valuesOf } from './values';

export interface MenuItemRow {
  kind: 'item';
  id: string;
  title: string;
  /** A second line under the title, where the platform's menu draws one. */
  subtitle: string | undefined;
  icon: IconComponent | undefined;
  destructive: boolean;
  disabled: boolean;
  /** A toggle's state; `undefined` for an action. */
  checked: boolean | undefined;
  keepOpen: boolean;
  /** What choosing the row runs: its own handler, or its tag's action through `choose`. */
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

/** Whether the rows are built only while the menu is open (a `menu()` content among them). */
export function builtOnOpen(children: readonly Child[]): boolean {
  return children.some(
    (child) =>
      (isNode(child) && child.kind === 'menuContent') ||
      (Array.isArray(child) && builtOnOpen(child)),
  );
}

/**
 * Reads rows; ids are positional (`r0`, `r0.1`…), stable while the rows are. A
 * tagged row's action is `choose(tag)` (see menu-actions.tsx).
 */
export function readMenuRows(
  children: readonly Child[],
  choose?: (tag: string) => void,
  prefix = 'r',
): MenuRowData[] {
  const rows: MenuRowData[] = [];
  flatten(children).forEach((node, index) => {
    const id = `${prefix}${index}`;
    const values = valuesOf(node);
    switch (node.kind) {
      case 'menuItem': {
        const tag = values.tag as string | undefined;
        rows.push({
          kind: 'item',
          id,
          title: (node.props as { title: string }).title,
          subtitle: values.subtitle as string | undefined,
          icon: values.icon as IconComponent | undefined,
          destructive: values.destructive === true,
          disabled: values.disabled === true,
          checked: values.checked as boolean | undefined,
          keepOpen: values.keepOpen === true,
          onPress:
            tag !== undefined && choose
              ? () => choose(tag)
              : (values.onPress as (() => void) | undefined),
          testID: values.testID as string | undefined,
        });
        break;
      }
      case 'divider':
        rows.push({ kind: 'divider', id });
        break;
      case 'menuSection':
        rows.push({
          kind: 'section',
          id,
          title: values.title as string | undefined,
          rows: readMenuRows(node.children, choose, `${id}.`),
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
          rows: readMenuRows(node.children, choose, `${id}.`),
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
  // A trigger opens its menu: a press that goes somewhere is not a trigger's.
  const own = handler instanceof Navigation ? undefined : handler;
  return trigger.onPress((event) => {
    own?.(event);
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

/**
 * The trigger's corner radius in points, as its glass would draw it: its last
 * corner of all sides; `undefined` (a capsule) without one, or with a
 * concentric one, which has no radius of its own.
 */
export function triggerCorner(trigger: Child): number | undefined {
  if (!isNode(trigger)) return undefined;
  for (let i = trigger.modifiers.length - 1; i >= 0; i--) {
    const modifier = trigger.modifiers[i] as Modifier;
    if (modifier.kind !== 'corner' || modifier.side !== 'all') continue;
    return modifier.value === 'concentric' ? undefined : resolveCorner(modifier.value);
  }
  return undefined;
}
