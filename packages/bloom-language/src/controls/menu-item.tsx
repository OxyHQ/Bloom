import {
  type MenuItemOptionGroup,
  MenuItemOptions as BloomMenuItemOptions,
  type MenuItemOptionsProps,
  MenuItemRow as BloomMenuItemRow,
  type MenuItemRowProps,
} from '@oxy.so/bloom/menu-item';

import type { Bound } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { Density } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** A dish in a menu, and the choices made before it goes in the basket. */
export type MenuItemKind = 'menuItemRow' | 'menuItemOptions';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/** Bloom `MenuItemRow`'s data (its price, photo, diets, heat and handlers); its quantity a binding. */
export type MenuItemRowOptions = Omit<
  MenuItemRowProps,
  Drawn | 'name' | 'density' | 'onPress' | 'quantity' | 'onQuantityChange'
>;
/**
 * Bloom `MenuItemOptions`'s data (its total and submit); its header is a
 * language child, the choices and the quantity bindings.
 */
export type MenuItemOptionsOptions = Omit<
  MenuItemOptionsProps,
  | Drawn
  | 'groups'
  | 'disabled'
  | 'header'
  | 'value'
  | 'onValueChange'
  | 'quantity'
  | 'onQuantityChange'
> & { readonly header?: Child };

/** Bloom `MenuItemRow`; `.onPress()` is its own (it opens the dish). */
export interface MenuItemRowView extends ViewModifiers<MenuItemRowView> {
  quantity(value: Bound<MenuItemRowProps, 'quantity'>): MenuItemRowView;
  /** `comfortable` or `compact`. */
  density(value: Density<'menuItemRow'>): MenuItemRowView;
}
export interface MenuItemOptionsView extends ViewModifiers<MenuItemOptionsView> {
  value(value: Bound<MenuItemOptionsProps, 'value'>): MenuItemOptionsView;
  quantity(value: Bound<MenuItemOptionsProps, 'quantity'>): MenuItemOptionsView;
  disabled(value?: boolean): MenuItemOptionsView;
}

export function MenuItemRow(name: string, options: MenuItemRowOptions): MenuItemRowView {
  return new Node('menuItemRow', { name, options }, []);
}
export function MenuItemOptions(
  groups: readonly MenuItemOptionGroup[],
  options: MenuItemOptionsOptions,
): MenuItemOptionsView {
  return new Node('menuItemOptions', { groups, options }, []);
}

export const MENU_ITEMS: Record<MenuItemKind, ControlRenderer> = {
  menuItemRow: product(BloomMenuItemRow, {
    bindings: { quantity: ['quantity', 'onQuantityChange'] },
    press: true,
    own: (d) => ({ density: d.own('density')?.value }),
  }),
  menuItemOptions: product(BloomMenuItemOptions, {
    slots: ['header'],
    bindings: { quantity: ['quantity', 'onQuantityChange'] },
    own: (d) => {
      // Bloom tells a group's new choice; the binding holds every group's.
      const chosen = d.own('value')?.value as Bound<MenuItemOptionsProps, 'value'> | undefined;
      return {
        disabled: d.own('disabled')?.value,
        ...(chosen === undefined
          ? null
          : {
              value: chosen[0],
              onValueChange: (group: string, ids: readonly string[]) =>
                chosen[1]({ ...chosen[0], [group]: ids }),
            }),
      };
    },
  }),
};
