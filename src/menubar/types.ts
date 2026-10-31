import type { StyleProp, ViewStyle } from 'react-native';

import type {
  MenuCheckboxRowProps,
  MenuGroupProps,
  MenuLabelProps,
  MenuRadioGroupProps,
  MenuRadioRowProps,
  MenuRowProps,
  MenuShortcutProps,
  MenuSubContentProps,
  MenuSubProps,
  MenuSubTriggerProps,
  MenuSurfaceProps,
  OverlayTriggerProps,
} from '../floating/types';

export interface MenubarProps {
  children?: React.ReactNode;
  /**
   * The `value` of the open menu. Controlled when supplied; `undefined` closes
   * every menu. shadcn spells the same state the same way.
   */
  value?: string;
  /** Initial open menu when uncontrolled. Defaults to none open. */
  defaultValue?: string;
  onValueChange?: (value: string | undefined) => void;
  /**
   * The `value` of the menu whose title has the keyboard, the bar driven from
   * it as a Mac's after Control-F2 (OxyOS's Super+F2); `undefined` when the
   * keyboard is elsewhere. Controlled when supplied: the owner puts the keyboard
   * on the bar by setting it (to the first menu's value, as a Mac does).
   *
   * While it is set: ← and → move across the menus (an open one giving way to
   * the next, on its first row), ↓ / Return / Space open the focused menu on
   * its first row and ↑ on its last, a letter moves to the menu whose title
   * starts with it, and Escape leaves the bar. A row chosen leaves it too;
   * Escape in an open menu closes the menu back to its title. The keys come
   * from the platform's `keyboard` before anything else sees them (a native
   * host), or from the document (the web).
   */
  focusValue?: string;
  /** The keyboard moved across the bar, or left it (`undefined`). */
  onFocusValueChange?: (value: string | undefined) => void;
  /** Accessible name for the bar. */
  label?: string;
  /** Appended to the bar's own classes — never substituted for them. */
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MenubarMenuProps {
  children?: React.ReactNode;
  /** Identifies this menu within the bar. Required — it IS the open state. */
  value: string;
  /**
   * Where the menu starts when it opens: its first or last enabled row active,
   * as a Mac's menu opened from the keyboard does (`DropdownMenu`'s
   * `openFocus`). Omitted, an open by a press starts with none. The bar's own
   * keys (`focusValue`) ask for the first row themselves.
   */
  openFocus?: 'first' | 'last';
}

export type MenubarTriggerProps = OverlayTriggerProps;
export type MenubarContentProps = MenuSurfaceProps;

/**
 * A command's shortcut, as a key chord: `Mod+N`, `Mod+Shift+Z`, `Alt+F4`.
 * `Mod` is the platform's command modifier: ⌘ on Apple platforms, Ctrl
 * elsewhere (OxyOS included). The other modifiers are `Ctrl`, `Alt`, `Shift`
 * and `Meta`; the key is one character or a key name (`Enter`, `ArrowUp`,
 * `F5`, `Space`, `Plus`).
 */
export interface MenubarShortcutProp {
  /**
   * The item's key chord. Pressing it runs the item, on every platform, with or
   * without the menu open or a bar showing it; the row draws it for the
   * platform (`⌘N` on a Mac, `Ctrl+N` elsewhere) as its trailing hint, unless
   * the row has a `trailing` of its own. A focused text field keeps the keys it
   * edits with (`Mod+C`, `Mod+V`, …).
   */
  shortcut?: string;
}

export interface MenubarItemProps extends MenuRowProps, MenubarShortcutProp {}
export interface MenubarCheckboxItemProps extends MenuCheckboxRowProps, MenubarShortcutProp {}
export type MenubarRadioGroupProps = MenuRadioGroupProps;
export interface MenubarRadioItemProps extends MenuRadioRowProps, MenubarShortcutProp {}
export type MenubarLabelProps = MenuLabelProps;
export type MenubarShortcutProps = MenuShortcutProps;
export type MenubarGroupProps = MenuGroupProps;
export type MenubarSubProps = MenuSubProps;
export type MenubarSubTriggerProps = MenuSubTriggerProps;
export type MenubarSubContentProps = MenuSubContentProps;
