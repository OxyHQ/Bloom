/**
 * Reads a menu's rows as data for the native glass menu.
 *
 * The native overlay draws its own rows, so it takes a CLOSED vocabulary: a
 * title, an icon, a check, destructive, disabled, a separator or a heading. The
 * parse is therefore all-or-nothing: one part outside the vocabulary (a body
 * that is not a string, a sub-menu, a swatch row, a wrapper component) and it
 * returns `null`, and the menu keeps its sheet, which draws anything.
 */
import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';

import type { GlassMenuNativeItem } from './native-glass-menu';
import type {
  MenuCheckboxRowProps,
  MenuGroupProps,
  MenuLabelProps,
  MenuRadioGroupProps,
  MenuRadioRowProps,
  MenuRowProps,
  MenuSubContentProps,
  MenuSubProps,
  MenuSubTriggerProps,
} from '../types';

/** The part components of one menu family, by role. */
export interface GlassMenuParts {
  Item: unknown;
  CheckboxItem: unknown;
  RadioGroup: unknown;
  RadioItem: unknown;
  Label: unknown;
  Separator: unknown;
  Group: unknown;
  Sub: unknown;
  SubTrigger: unknown;
  SubContent: unknown;
}

export interface ParsedGlassMenu {
  items: GlassMenuNativeItem[];
  /** Leading nodes, in the order of the items' `iconSlot`s. */
  icons: ReactNode[];
  /** What each row does when chosen, by item id. */
  handlers: Record<string, () => void>;
}

function walk(children: ReactNode, visit: (element: ReactElement) => boolean): boolean {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) {
      if (typeof child === 'string' && child.trim() === '') continue;
      return false;
    }
    if (child.type === Fragment) {
      if (!walk((child.props as { children?: ReactNode }).children, visit)) return false;
    } else if (!visit(child)) {
      return false;
    }
  }
  return true;
}

export function parseGlassMenu(children: ReactNode, parts: GlassMenuParts): ParsedGlassMenu | null {
  const items: GlassMenuNativeItem[] = [];
  const icons: ReactNode[] = [];
  const handlers: Record<string, () => void> = {};
  // Where the rows being read go: the menu, or the sub-menu being read (the native menu nests one level).
  let out = items;
  let next = 0;

  const row = (
    id: string,
    title: unknown,
    leading: ReactNode,
    flags: Pick<GlassMenuNativeItem, 'checked' | 'destructive' | 'disabled' | 'keepOpen'>,
    run: () => void,
  ): boolean => {
    if (typeof title !== 'string') return false;
    const item: GlassMenuNativeItem = { id, title, ...flags };
    if (leading != null && leading !== false) {
      icons.push(leading);
      item.iconSlot = icons.length - 1;
    }
    out.push(item);
    handlers[id] = run;
    return true;
  };

  const visitRows = (group: { value?: string; onValueChange?: (value: string) => void }) =>
    function visit(element: ReactElement): boolean {
      const id = `row-${next++}`;
      if (element.type === parts.Item) {
        const p = element.props as MenuRowProps;
        if (p.href != null || p.trailing != null) return false;
        return row(
          id,
          p.children,
          p.leading,
          {
            destructive:
              p.tone === 'danger' || (p.tone === undefined && p.variant === 'destructive'),
            disabled: p.disabled,
            keepOpen: p.keepOpen,
          },
          () => p.onPress?.(),
        );
      }
      if (element.type === parts.CheckboxItem) {
        const p = element.props as MenuCheckboxRowProps;
        if (p.trailing != null || p.indicator !== undefined) return false;
        return row(
          id,
          p.children,
          p.leading,
          { checked: p.checked, disabled: p.disabled, keepOpen: p.keepOpen },
          () => p.onCheckedChange(!p.checked),
        );
      }
      if (element.type === parts.RadioItem) {
        const p = element.props as MenuRadioRowProps;
        if (p.trailing != null || p.indicator !== undefined) return false;
        return row(
          id,
          p.children,
          p.leading,
          { checked: group.value === p.value, disabled: p.disabled, keepOpen: p.keepOpen },
          () => group.onValueChange?.(p.value),
        );
      }
      if (element.type === parts.RadioGroup) {
        const p = element.props as MenuRadioGroupProps;
        return walk(p.children, visitRows({ value: p.value, onValueChange: p.onValueChange }));
      }
      if (element.type === parts.Group) {
        return walk((element.props as MenuGroupProps).children, visitRows(group));
      }
      if (element.type === parts.Label) {
        const title = (element.props as MenuLabelProps).children;
        if (typeof title !== 'string') return false;
        out.push({ id, title, heading: true });
        return true;
      }
      if (element.type === parts.Separator) {
        out.push({ id, title: '', separator: true });
        return true;
      }
      if (element.type === parts.Sub) return readSub(element, group, id);
      return false;
    };

  // A sub-menu: its trigger row (a string title, an optional leading icon) and its rows, one level deep.
  const readSub = (
    element: ReactElement,
    group: { value?: string; onValueChange?: (value: string) => void },
    id: string,
  ): boolean => {
    if (out !== items) return false;
    const read: { trigger?: MenuSubTriggerProps; content?: ReactNode } = {};
    const found = walk((element.props as MenuSubProps).children, (part) => {
      if (part.type === parts.SubTrigger) read.trigger = part.props as MenuSubTriggerProps;
      else if (part.type === parts.SubContent)
        read.content = (part.props as MenuSubContentProps).children;
      else return false;
      return true;
    });
    const trigger = read.trigger;
    if (!found || !trigger || typeof trigger.children !== 'string') return false;
    const children: GlassMenuNativeItem[] = [];
    out = children;
    const ok = walk(read.content, visitRows(group));
    out = items;
    if (!ok || children.length === 0) return false;
    const sub: GlassMenuNativeItem = { id, title: trigger.children, items: children };
    if (trigger.leading != null && trigger.leading !== false) {
      icons.push(trigger.leading);
      sub.iconSlot = icons.length - 1;
    }
    if (trigger.disabled) sub.disabled = true;
    items.push(sub);
    return true;
  };

  if (!walk(children, visitRows({}))) return null;
  return items.length > 0 ? { items, icons, handlers } : null;
}
