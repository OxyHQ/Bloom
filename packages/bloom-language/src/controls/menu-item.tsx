import {
  type MenuItemOptionGroup,
  MenuItemOptions as BloomMenuItemOptions,
  type MenuItemOptionsProps,
  MenuItemRow as BloomMenuItemRow,
  type MenuItemRowProps,
} from '@oxy.so/bloom/menu-item';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlDensity } from '../tokens';
import type { ControlRenderer } from './draw';
import { product, rowDensity } from './product';

/** A dish in a menu, and the choices made before it goes in the basket. */
export type MenuItemKind = 'menuItemRow' | 'menuItemOptions';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/** Bloom `MenuItemRow`'s data (its price, photo, diets, heat, quantity and handlers). */
export type MenuItemRowOptions = Omit<MenuItemRowProps, Drawn | 'name' | 'density' | 'onPress'>;
/**
 * Bloom `MenuItemOptions`'s data (the chosen options and their handler, the
 * quantity, total and submit); its header is a language child.
 */
export type MenuItemOptionsOptions = Omit<
  MenuItemOptionsProps,
  Drawn | 'groups' | 'disabled' | 'header'
> & { readonly header?: Child };

/** Bloom `MenuItemRow`; `.onPress()` is its own (it opens the dish). */
export interface MenuItemRowView extends ViewModifiers<MenuItemRowView> {
  /** `default` (comfortable) or `compact`. */
  density(value: ControlDensity): MenuItemRowView;
}
export interface MenuItemOptionsView extends ViewModifiers<MenuItemOptionsView> {
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
    press: true,
    own: (d) => ({ density: rowDensity(d) }),
  }),
  menuItemOptions: product(BloomMenuItemOptions, {
    slots: ['header'],
    own: (d) => ({ disabled: d.own('disabled')?.value }),
  }),
};
