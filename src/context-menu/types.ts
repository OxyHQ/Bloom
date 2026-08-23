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
 * A context menu is UNCONTROLLED by construction — the open position comes from
 * the pointer event that opens it, so there is no `open` a caller could set that
 * would mean anything. Radix's `ContextMenu.Root` takes the same view and
 * publishes only `onOpenChange`.
 */
export interface ContextMenuProps {
  children?: React.ReactNode;
  /** Called whenever the menu opens or closes, from any cause. */
  onOpenChange?: (open: boolean) => void;
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
