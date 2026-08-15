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
}

export type MenubarTriggerProps = OverlayTriggerProps;
export type MenubarContentProps = OverlaySurfaceProps;

export type MenubarItemProps = MenuRowProps;
export type MenubarCheckboxItemProps = MenuCheckboxRowProps;
export type MenubarRadioGroupProps = MenuRadioGroupProps;
export type MenubarRadioItemProps = MenuRadioRowProps;
export type MenubarLabelProps = MenuLabelProps;
export type MenubarShortcutProps = MenuShortcutProps;
export type MenubarGroupProps = MenuGroupProps;
export type MenubarSubProps = MenuSubProps;
export type MenubarSubTriggerProps = MenuSubTriggerProps;
export type MenubarSubContentProps = MenuSubContentProps;
