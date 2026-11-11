import type { StyleProp, ViewStyle } from 'react-native';

import type { PlatformEditAction, PlatformMenuAction } from '../platform-surface/types';

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
  /**
   * Whether a closed menu's content is mounted headless, so its rows' `shortcut`s work while the
   * menu is closed (the default, `true`). A bar whose rows run no chords of their own (an OS
   * shell's, whose rows only show the chord another part runs) passes `false`: a closed menu then
   * mounts nothing but its title, as a Mac's menu bar draws titles and builds a menu as it opens,
   * and its rows render again only while it is open or the popup is changing from it. Ignored
   * where the platform draws the bar (`menu-bar`), which needs every menu declared.
   */
  declareClosedMenus?: boolean;
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

export interface MenubarItemProps extends MenuRowProps, MenubarShortcutProp {
  /**
   * A standard editing action (`copy`, `paste`, `undo`, …), sent to the
   * focused text field first, as a Mac's Edit menu sends `copy:` to the first
   * responder and Android's `EditText` takes `onTextContextMenuItem`. While a
   * text field has focus (the platform's `editing` says so), the item acts on
   * that field, whatever component it is, and is enabled exactly when the
   * field can do it now (Copy with a selection, Paste with text on the
   * clipboard, Undo with an edit to undo); the item's own `onPress` and
   * `disabled` are not used then. With no text field focused, or on a
   * platform that does not say, it is an ordinary item: its `onPress` (the
   * application's own Copy of its selection, say) and `disabled`, and
   * disabled when it has neither `onPress` nor `href`.
   *
   * It gives the item its standard shortcut unless `shortcut` says otherwise:
   * `Mod+Z`, `Mod+Shift+Z`, `Mod+X`, `Mod+C`, `Mod+V`, `Mod+Alt+Shift+V`
   * (Paste and Match Style) and `Mod+A`; Delete has none.
   *
   * Or one of the application's own standard commands, which no text field
   * takes (`PlatformMenuAction`): `about`, its About *App*, and `settings`,
   * its Settings… (standard shortcut `Mod+,`: ⌘, on a Mac, Ctrl+, elsewhere).
   * The item is the application's (its `onPress` or `href`, and `disabled`;
   * disabled with neither). Drawn in the window it stays where it is
   * declared; with the `menu-bar` capability the platform is told which
   * command it is, and a platform with an application menu (a Mac's, OxyOS's)
   * shows it there instead, as AppKit puts Settings… in the application menu.
   * Its shortcut runs it on every platform, as any item's does.
   */
  action?: PlatformEditAction | PlatformMenuAction;
}
export interface MenubarCheckboxItemProps extends MenuCheckboxRowProps, MenubarShortcutProp {}
export type MenubarRadioGroupProps = MenuRadioGroupProps;
export interface MenubarRadioItemProps extends MenuRadioRowProps, MenubarShortcutProp {}
export type MenubarLabelProps = MenuLabelProps;
export type MenubarShortcutProps = MenuShortcutProps;
export type MenubarGroupProps = MenuGroupProps;
export type MenubarSubProps = MenuSubProps;
export type MenubarSubTriggerProps = MenuSubTriggerProps;
export type MenubarSubContentProps = MenuSubContentProps;
