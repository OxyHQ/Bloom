import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { FloatingPositionProps } from '../floating/types';

/**
 * The open-state contract every Bloom overlay ROOT takes, spelled the way
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

export type DropdownMenuProps = React.PropsWithChildren<OverlayOpenProps>;
export type DropdownMenuTriggerProps = OverlayTriggerProps;
export type DropdownMenuContentProps = OverlaySurfaceProps;

export interface MenuItemProps {
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
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MenuCheckboxItemProps
  extends Omit<MenuItemProps, 'onPress' | 'variant' | 'leading' | 'inset'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface MenuRadioGroupProps {
  children?: React.ReactNode;
  value?: string;
  onValueChange: (value: string) => void;
}

export interface MenuRadioItemProps
  extends Omit<MenuItemProps, 'onPress' | 'variant' | 'leading' | 'inset'> {
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
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MenuSubContentProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
