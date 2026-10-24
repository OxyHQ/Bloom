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
  OverlaySurfaceProps,
} from '../floating/types';

/**
 * Where a context menu opens, in viewport (CSS client) coordinates.
 *
 * A POINT is what a pointer gives — the menu's corner sits on it, exactly as a
 * right-click places it. A RECT anchors to a box instead (a button the menu
 * should open beside), with the same fit / flip / clamp against the viewport.
 * Native ignores the position: a context menu is a bottom sheet there.
 */
export type ContextMenuAnchor =
  | { x: number; y: number }
  | { top: number; right: number; bottom: number; left: number };

/**
 * A context menu has ONE fact: where it is anchored. Open means "anchored
 * somewhere", so there is no separate `open` that could disagree with it.
 *
 * Uncontrolled (the default): the trigger's right-click (web) or long press
 * (native) supplies the anchor, and `onOpenChange` reports it.
 *
 * Controlled: pass `anchor`, and the menu is open exactly while it is non-null
 * — positioned at it on web, presented as the bottom sheet on native. Every
 * dismissal (outside press, Escape, Tab, a row that closes the menu, a sheet
 * swipe) calls `onOpenChange(false)` and `onAnchorChange(null)`; clear the
 * anchor in response. A `ContextMenuTrigger` is optional in this form.
 */
export interface ContextMenuProps {
  children?: React.ReactNode;
  /**
   * Controlled anchor. `null` is closed; a point or rect is open there. Omit
   * (leave `undefined`) for the uncontrolled, trigger-driven menu.
   */
  anchor?: ContextMenuAnchor | null;
  /** Called whenever the menu opens or closes, from any cause. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Called with the anchor the menu asks for: the pointer point when a trigger
   * opens it, `null` when it is dismissed. What a controlled caller stores.
   */
  onAnchorChange?: (anchor: ContextMenuAnchor | null) => void;
}

export interface ContextMenuTriggerProps {
  children?: React.ReactNode;
  /**
   * Render the single element child AS the trigger, merging the open handler
   * and a11y props into it. Without it the children render inside Bloom's own
   * `Pressable`.
   */
  asChild?: boolean;
  disabled?: boolean;
  /** Accessible name. Ignored when the `asChild` child carries its own. */
  label?: string;
  /** Applied to the measured anchor wrapper; the context trigger draws no chrome. */
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export type ContextMenuContentProps = OverlaySurfaceProps;

export type ContextMenuItemProps = MenuRowProps;
export type ContextMenuCheckboxItemProps = MenuCheckboxRowProps;
export type ContextMenuRadioGroupProps = MenuRadioGroupProps;
export type ContextMenuRadioItemProps = MenuRadioRowProps;
export type ContextMenuLabelProps = MenuLabelProps;
export type ContextMenuShortcutProps = MenuShortcutProps;
export type ContextMenuGroupProps = MenuGroupProps;
export type ContextMenuSubProps = MenuSubProps;
export type ContextMenuSubTriggerProps = MenuSubTriggerProps;
export type ContextMenuSubContentProps = MenuSubContentProps;
