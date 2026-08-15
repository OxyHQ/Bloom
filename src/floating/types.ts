/**
 * The shared internals of Bloom's ANCHORED families — `dropdown-menu`,
 * `context-menu`, `menubar` and `popover`.
 *
 * Nothing here is public API: `floating/` has no barrel and no subpath export,
 * for the same reason `overlay/dropdown-placement` and `dialog/SheetShell` have
 * none. The four families import it directly.
 *
 * What it holds, and why each piece is here rather than copied four times:
 *
 *  - `TriggerSlot` — Radix's `asChild` composition, plus the anchor wrapper the
 *    web forks measure.
 *  - `FloatingPanel` — the WEB anchored surface: portal, overlay rank, dismiss
 *    layer and placement, in one place.
 *  - `use-sheet-open-bridge` — the NATIVE half, bridging a Radix-shaped
 *    `open`/`onOpenChange` pair onto `Dialog`'s imperative control.
 *  - `menu-rows` — the row vocabulary all THREE menu families render.
 *  - `context` — the contexts those rows read.
 */
import type { GestureResponderEvent, StyleProp, TextStyle, View, ViewStyle } from 'react-native';

/**
 * What a family's ROOT publishes to its own trigger and surface: the open
 * state, and the box the surface anchors to. Each of the four families owns its
 * OWN context object built on this shape — one shared context would make a
 * menu nested inside a popover drive the popover.
 */
export interface OverlayShellContextValue {
  open: boolean;
  setOpen: (next: boolean) => void;
  /** The trigger wrapper. Measured by the web forks, unused on native. */
  anchorRef: React.RefObject<View | null>;
}

/**
 * Which side of its anchor a floating surface PREFERS. It is a preference:
 * `overlay/dropdown-placement` flips to the other side when the named one does
 * not fit and clamps when neither does.
 */
export type FloatingSide = 'top' | 'bottom';

/**
 * How the surface lines up with its anchor horizontally — Radix/shadcn's
 * `align`, mapped straight onto `resolveDropdownPlacement`'s own axis.
 */
export type FloatingAlign = 'start' | 'center' | 'end';

/** A viewport-relative anchor box. A right-click point is a zero-area anchor. */
export interface FloatingAnchor {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * The positioning props every anchored Bloom surface takes, spelled the way
 * Radix/shadcn spells them so a call site ports across unchanged.
 */
export interface FloatingPositionProps {
  /** Preferred side of the anchor. Defaults to `'bottom'`. */
  side?: FloatingSide;
  /** Horizontal alignment against the anchor. Defaults per component. */
  align?: FloatingAlign;
  /** Gap between the anchor and the surface, on the `side` axis. */
  sideOffset?: number;
  /** Shift along the `align` axis, applied before the viewport clamp. */
  alignOffset?: number;
}

export interface FloatingPanelProps extends FloatingPositionProps {
  /** Rendered only while true — `OverlayRoot` takes its stack rank on mount. */
  open: boolean;
  /**
   * Viewport-relative box to anchor against, or `null` while it is still being
   * measured (the panel renders nothing until it has one).
   */
  anchor: FloatingAnchor | null;
  /** Dismiss on an outside press and on Escape. Defaults to `true`. */
  dismissible?: boolean;
  /**
   * Whether the outside press is CAUGHT or merely observed. Defaults to `true`.
   *
   * A modal surface lays a full-screen `Backdrop` over the app: the press
   * dismisses the surface and goes no further, which is what a dropdown menu, a
   * context menu and a popover all want — the click that closes a menu should
   * not also activate whatever was behind it.
   *
   * A NON-modal surface lays down nothing and listens for the press instead, so
   * it dismisses AND the press reaches the app. `Menubar` needs this and it is
   * the reason the option exists: with a backdrop in the way, clicking a sibling
   * trigger while one menu is open only closed the first one, and switching
   * menus took two clicks. Radix draws the same distinction under the same name.
   */
  modal?: boolean;
  /** Called for a user-initiated dismissal (outside press or Escape). */
  onDismiss: () => void;
  /** Accessible name of the panel. */
  label?: string;
  /**
   * ARIA role of the panel itself. `'menu'` for the three menu families,
   * `'dialog'` for a popover.
   */
  role: 'menu' | 'dialog';
  /** Floor for the panel width. A menu passes its anchor's width. */
  minWidth?: number;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

/**
 * The props a trigger hands to whatever it renders — either Bloom's own
 * `Pressable`, or the caller's single child under `asChild`.
 *
 * `aria-expanded` is the one state prop here, and it is deliberately the only
 * one: React Native types exactly four boolean `aria-*` props (`busy`,
 * `checked`, `disabled`, `expanded`, `selected`) and folds them back into
 * `accessibilityState`, so it is the spelling that reaches BOTH platforms.
 * `aria-haspopup` is read by react-native-web but has no React Native type at
 * all, so setting it would need a cast on a prop native never sees — the
 * trigger states that it is expanded and leaves the popup kind to the surface's
 * own `role`.
 */
export interface TriggerHandleProps {
  onPress: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button';
  'aria-expanded'?: boolean;
}

/**
 * The open-state contract every anchored ROOT takes, spelled the way
 * Radix/shadcn spells it: uncontrolled by default, controlled the moment `open`
 * is passed, and `onOpenChange` fires either way.
 */
export interface OverlayOpenProps {
  /** Controlled open state. Omit for an uncontrolled surface. */
  open?: boolean;
  /** Initial open state when uncontrolled. Defaults to `false`. */
  defaultOpen?: boolean;
  /** Called whenever the surface opens or closes, from any cause. */
  onOpenChange?: (open: boolean) => void;
}

/** Props shared by every trigger in the four families. */
export interface OverlayTriggerProps {
  children?: React.ReactNode;
  /**
   * Render the single element child AS the trigger, merging the open handler
   * and a11y props into it (Radix's composition escape hatch). Without it the
   * children render inside Bloom's own `Pressable`.
   */
  asChild?: boolean;
  disabled?: boolean;
  /** Accessible name. Ignored when the `asChild` child carries its own. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Props shared by the anchored surfaces of the three menus and the popover. */
export interface OverlaySurfaceProps extends FloatingPositionProps {
  children?: React.ReactNode;
  /** Accessible name of the surface. */
  label?: string;
  /** Dismiss on outside press and Escape. Defaults to `true`. */
  dismissible?: boolean;
  minWidth?: number;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  The menu ROW vocabulary
//
//  One set of prop shapes for the rows `dropdown-menu`, `context-menu` and
//  `menubar` all render. Each family re-exports these under its own part names
//  (`DropdownMenuItemProps`, `ContextMenuItemProps`, `MenubarItemProps`), which
//  is shadcn's vocabulary — the props themselves are identical because the rows
//  are identical.
// ---------------------------------------------------------------------------

export interface MenuRowProps {
  /**
   * Row content. A plain string is rendered as the row's own title — so it
   * picks up the destructive and disabled colours — while element children are
   * rendered verbatim, which is the shadcn composition (`<Icon /><Text>…`).
   */
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Leading slot (icon, avatar). A Bloom addition over shadcn's children-only row. */
  leading?: React.ReactNode;
  /** Trailing slot (shortcut, badge). */
  trailing?: React.ReactNode;
  /** Indent to line up with the rows that carry a checkbox or radio indicator. */
  inset?: boolean;
  /** `'destructive'` paints the row in the theme's negative colour. */
  variant?: 'default' | 'destructive';
  /**
   * Keep the menu open after activation. Defaults to `false` — every menu row
   * dismisses, which is what both shadcn and Bloom's previous menus did.
   */
  keepOpen?: boolean;
  /**
   * The row's accessible name.
   *
   * Only needed when `children` is not a plain string: a row composed as
   * `<Icon /><Text>Profile</Text>` has no name a screen reader can announce,
   * because the name is derived from a string child and there isn't one. A
   * string child names itself and needs nothing here.
   *
   * This is where the upstream primitive's `textValue` lands. It is spelled
   * `accessibilityLabel` because in Bloom that is all it does — `textValue`'s
   * other job upstream is matching keystrokes for type-ahead, and Bloom has no
   * type-ahead for it to feed.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MenuCheckboxRowProps
  extends Omit<MenuRowProps, 'onPress' | 'variant' | 'leading' | 'inset'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface MenuRadioGroupProps {
  children?: React.ReactNode;
  value?: string;
  onValueChange: (value: string) => void;
}

export interface MenuRadioRowProps
  extends Omit<MenuRowProps, 'onPress' | 'variant' | 'leading' | 'inset'> {
  value: string;
}

export interface MenuLabelProps {
  children?: React.ReactNode;
  inset?: boolean;
  style?: StyleProp<TextStyle>;
}

export interface MenuShortcutProps {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export interface MenuGroupProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export type MenuSubProps = React.PropsWithChildren<OverlayOpenProps>;

export interface MenuSubTriggerProps {
  children?: React.ReactNode;
  disabled?: boolean;
  inset?: boolean;
  leading?: React.ReactNode;
  /** The row's accessible name, when `children` is not a plain string. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MenuSubContentProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * The row parts one call of `createMenuRows` produces. Each menu family binds
 * one set and publishes it under its own prefix.
 */
export interface MenuRowParts {
  Item: React.ComponentType<MenuRowProps>;
  CheckboxItem: React.ComponentType<MenuCheckboxRowProps>;
  RadioGroup: React.ComponentType<MenuRadioGroupProps>;
  RadioItem: React.ComponentType<MenuRadioRowProps>;
  Label: React.ComponentType<MenuLabelProps>;
  Separator: React.ComponentType<Record<string, never>>;
  Shortcut: React.ComponentType<MenuShortcutProps>;
  Group: React.ComponentType<MenuGroupProps>;
  Sub: React.ComponentType<MenuSubProps>;
  SubTrigger: React.ComponentType<MenuSubTriggerProps>;
  SubContent: React.ComponentType<MenuSubContentProps>;
}
