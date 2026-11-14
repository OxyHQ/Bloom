/**
 * A closed menu's DESCRIPTION, read from its declaration's elements without
 * mounting them (OxyOS ADR 0021).
 *
 * A closed menu's rows are known to its bar so that their shortcuts work while
 * it is closed. Mounting them headless did that by rendering every row, which
 * cost every bar render a render of every closed menu's rows (OxyOS's shell has
 * a Window menu of some 27). A menu's content is a declaration: Bloom's own
 * parts (an item, a check item, a radio group and its items, a label, a
 * separator, a group, a submenu), with their props. So a closed menu's entries
 * are read from those elements here, as a Mac's bar keeps a menu's items as
 * data and builds its rows as it opens: the label, the shortcut, the state, and
 * what choosing it runs, the element's own handler.
 *
 * POSITIONS are the ones `DeclaredChildren` gives the mounted rows (arrays and
 * fragments flattened, every child, `null` included, taking a place), so the
 * order a description sorts by is the same open or closed.
 *
 * What is not one of Bloom's parts (an application's own component that
 * renders rows) cannot be read without rendering it: it is returned as
 * `unread`, with its place, for the caller to mount headless as before.
 */
import { Fragment, isValidElement, type ReactNode } from 'react';

import { openHref } from '../hooks/link-activation';
import { type Chord, modifiersText, parseChord, parseModifiers } from '../kbd/chord';
import type { PlatformEditAction, PlatformMenuAction } from '../platform-surface/types';
import type { MenuEntryKind } from './registry';
import { actionShortcut, isMenuAction } from './use-edit-action';

/** Which of Bloom's menubar parts a component is (`createMenubarRows` marks each). */
export type MenubarPart =
  | 'item'
  | 'checkbox'
  | 'radioGroup'
  | 'radio'
  | 'label'
  | 'separator'
  | 'group'
  | 'sub'
  | 'subTrigger'
  | 'subContent';

const PART = Symbol.for('bloom.menubarPart');
const HINTS = new WeakSet<object>();

/** Marks `component` as one of Bloom's menubar parts, so a description can read its elements. */
export function markMenubarPart<T extends object>(component: T, part: MenubarPart): T {
  (component as Record<symbol, MenubarPart>)[PART] = part;
  return component;
}

/** Marks a row's shortcut hint, which a label's text leaves out. */
export function markMenubarHint(component: unknown): void {
  if ((typeof component === 'function' || typeof component === 'object') && component !== null) {
    HINTS.add(component);
  }
}

function partOf(type: unknown): MenubarPart | undefined {
  if ((typeof type !== 'function' && typeof type !== 'object') || type === null) return undefined;
  return (type as Record<symbol, MenubarPart | undefined>)[PART];
}

const isMarkedHint = (type: unknown) =>
  (typeof type === 'function' || typeof type === 'object') && type !== null && HINTS.has(type);

/**
 * The text of a part's children, as the platform's bar shows it: every string
 * and number under it, element children included, except a shortcut hint
 * (`isHint`), which is not part of the name.
 */
export function textOf(children: ReactNode, isHint: (type: unknown) => boolean): string {
  const parts: string[] = [];
  const visit = (node: ReactNode) => {
    if (typeof node === 'string' || typeof node === 'number') parts.push(String(node));
    else if (Array.isArray(node)) node.forEach(visit);
    else if (isValidElement<{ children?: ReactNode }>(node) && !isHint(node.type)) {
      visit(node.props.children);
    }
  };
  visit(children);
  return parts.join('').replace(/\s+/g, ' ').trim();
}

const labelOf = (children: ReactNode) => textOf(children, isMarkedHint);

/** A radio group's selection, as its items read it. */
export interface RadioSelection {
  readonly value: string | undefined;
  readonly onValueChange: (value: string) => void;
}

/** One entry of a closed menu, read from its element. */
export interface DescribedEntry {
  /** Stable while the element keeps its place: its kind and its path. */
  readonly key: string;
  readonly kind: MenuEntryKind;
  /** The key of the submenu it is in; null for the menu's own content. */
  readonly parentKey: string | null;
  /** Its position under the content's own path. */
  readonly path: readonly number[];
  readonly label: string;
  readonly enabled: boolean;
  readonly shortcut: Chord | null;
  readonly checked?: boolean;
  readonly keepOpen?: boolean;
  readonly action?: PlatformMenuAction;
  /** The modifiers that show it in place of the item before it (`MenuEntry.alternate`). */
  readonly alternate?: string;
  /** An editing action: its state and what choosing it does are the focused field's while one is. */
  readonly editAction?: PlatformEditAction;
  /** The element's own handler, as a press on its row would run it; undefined for none. */
  readonly run?: () => void;
  /** Whether choosing it runs something: every item does, a label and a submenu's trigger do not. */
  readonly runs: boolean;
}

/** What a description could not read: an element to mount headless at its place. */
export interface UnreadElement {
  readonly node: ReactNode;
  readonly parentKey: string | null;
  readonly path: readonly number[];
  readonly radio: RadioSelection | null;
  /**
   * Set for an element placed directly in a submenu (beside its trigger and
   * content): the submenu (`parentKey`) is its owner, and this is the key of
   * the menu or submenu the submenu is in.
   */
  readonly owner: { readonly parentKey: string | null } | null;
}

export interface MenuDescription {
  readonly entries: DescribedEntry[];
  readonly unread: UnreadElement[];
}

interface ItemProps {
  children?: ReactNode;
  accessibilityLabel?: string;
  disabled?: boolean;
  keepOpen?: boolean;
  shortcut?: string;
  action?: PlatformEditAction | PlatformMenuAction;
  alternate?: string;
  onPress?: () => void;
  href?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  value?: string;
  onValueChange?: (value: string) => void;
}

/** The children of a container as `DeclaredChildren` places them: one per place. */
export function places(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  const visit = (node: ReactNode) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
      visit(node.props.children);
      return;
    }
    out.push(node);
  };
  visit(children);
  return out;
}

/** The chord a `shortcut` declares; null when it is none (the mounted row warns once). */
function chordOf(shortcut: string | undefined): Chord | null {
  return shortcut === undefined ? null : parseChord(shortcut);
}

const keyOf = (path: readonly number[]) => `d${path.join('.')}`;

const isItem = (node: ReactNode) => isValidElement(node) && partOf(node.type) === 'item';

/**
 * For each of a container's places (`places`), whether it is an ALTERNATE
 * (`MenubarItemProps.alternate`): an item declaring modifiers that is placed
 * right after an item (or after another alternate of one). The first item of
 * the run is the one they are shown in place of. An empty place, a separator,
 * a label or anything else breaks the run: an alternate after one is an
 * ordinary item.
 */
export function alternatePlaces(nodes: readonly ReactNode[]): boolean[] {
  let afterItem = false;
  return nodes.map((node) => {
    const alternate =
      afterItem &&
      isValidElement<ItemProps>(node) &&
      isItem(node) &&
      alternateOf(node.props.alternate).alternate !== undefined;
    afterItem = isItem(node);
    return alternate;
  });
}

/**
 * An item's `alternate` as an entry carries it: its modifiers in their canonical spelling; nothing
 * when it has none, or declares none that are modifiers (the mounted row warns once).
 */
export function alternateOf(alternate: string | undefined): { alternate?: string } {
  if (alternate === undefined) return {};
  const modifiers = parseModifiers(alternate);
  return modifiers ? { alternate: modifiersText(modifiers) } : {};
}

/**
 * `children`'s description: its entries, each at `[...path, place]` under
 * `parentKey`, and what it could not read.
 */
export function describeMenu(children: ReactNode): MenuDescription {
  const entries: DescribedEntry[] = [];
  const unread: UnreadElement[] = [];

  const visit = (
    nodes: ReactNode,
    path: readonly number[],
    parentKey: string | null,
    radio: RadioSelection | null,
  ) => {
    const placed = places(nodes);
    const alternates = alternatePlaces(placed);
    placed.forEach((node, place) => {
      const at = [...path, place];
      if (node === null || node === undefined || typeof node === 'boolean') return;
      if (!isValidElement<ItemProps>(node)) {
        // Text placed in a menu draws nowhere in a description.
        return;
      }
      const part = partOf(node.type);
      const props = node.props;
      const label = labelOf(props.children) || (props.accessibilityLabel ?? '');
      switch (part) {
        case 'item': {
          const { action } = props;
          const handler =
            props.onPress ??
            (props.href != null ? () => openHref(props.href as string) : undefined);
          const menuAction = isMenuAction(action) ? action : undefined;
          const editAction = isMenuAction(action) ? undefined : action;
          entries.push({
            key: keyOf(at),
            kind: 'item',
            parentKey,
            path: at,
            label,
            // An item with an action needs its own handler when no field takes the action (an
            // application's own command never is a field's); while a field takes an editing
            // action, its state is the field's (`DescribedEntry.editAction`).
            enabled: !props.disabled && (action === undefined || handler !== undefined),
            shortcut: chordOf(props.shortcut ?? actionShortcut(action)),
            keepOpen: props.keepOpen ?? false,
            ...(menuAction ? { action: menuAction } : null),
            ...(editAction ? { editAction } : null),
            ...(alternates[place] ? alternateOf(props.alternate) : null),
            run: handler,
            runs: true,
          });
          return;
        }
        case 'checkbox': {
          const { checked = false, onCheckedChange } = props;
          entries.push({
            key: keyOf(at),
            kind: 'item',
            parentKey,
            path: at,
            label,
            enabled: !props.disabled,
            shortcut: chordOf(props.shortcut),
            checked,
            keepOpen: props.keepOpen ?? false,
            run: onCheckedChange ? () => onCheckedChange(!checked) : undefined,
            runs: true,
          });
          return;
        }
        case 'radioGroup': {
          const { value, onValueChange } = props;
          visit(props.children, at, parentKey, onValueChange ? { value, onValueChange } : null);
          return;
        }
        case 'radio': {
          const { value } = props;
          entries.push({
            key: keyOf(at),
            kind: 'item',
            parentKey,
            path: at,
            label,
            enabled: !props.disabled,
            shortcut: chordOf(props.shortcut),
            checked: radio !== null && radio.value === value,
            keepOpen: props.keepOpen ?? false,
            run: radio && value !== undefined ? () => radio.onValueChange(value) : undefined,
            runs: true,
          });
          return;
        }
        case 'label':
          // A group's label is shown, never chosen: an item that is never enabled.
          entries.push({
            key: keyOf(at),
            kind: 'item',
            parentKey,
            path: at,
            label: labelOf(props.children),
            enabled: false,
            shortcut: null,
            runs: false,
          });
          return;
        case 'separator':
          entries.push({
            key: keyOf(at),
            kind: 'separator',
            parentKey,
            path: at,
            label: '',
            enabled: true,
            shortcut: null,
            runs: false,
          });
          return;
        case 'group':
          visit(props.children, at, parentKey, radio);
          return;
        case 'sub': {
          // A submenu: its trigger names it, its content is its entries, at the submenu's place.
          const key = keyOf(at);
          for (const child of places(props.children)) {
            if (!isValidElement<ItemProps>(child)) continue;
            const childPart = partOf(child.type);
            if (childPart === 'subTrigger') {
              entries.push({
                key,
                kind: 'submenu',
                parentKey,
                path: at,
                label: labelOf(child.props.children) || (child.props.accessibilityLabel ?? ''),
                enabled: !child.props.disabled,
                shortcut: null,
                runs: false,
              });
            } else if (childPart === 'subContent') {
              visit(child.props.children, at, key, null);
            } else {
              unread.push({
                node: child,
                parentKey: key,
                path: at,
                radio: null,
                owner: { parentKey },
              });
            }
          }
          return;
        }
        case 'subTrigger':
        case 'subContent':
          // Outside a submenu they declare nothing, mounted or not.
          return;
        default:
          unread.push({ node, parentKey, path: at, radio, owner: null });
      }
    });
  };

  visit(children, [], null, null);
  return { entries, unread };
}
