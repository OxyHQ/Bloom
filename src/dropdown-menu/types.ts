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
  OverlayOpenProps,
  OverlaySurfaceProps,
  OverlayTriggerProps,
} from '../floating/types';

export type DropdownMenuProps = React.PropsWithChildren<OverlayOpenProps>;
export type DropdownMenuTriggerProps = OverlayTriggerProps;
export type DropdownMenuContentProps = OverlaySurfaceProps;

// The row props are the SHARED menu-row shapes under this family's part names.
// They are named here rather than only in `floating/` because that is the name
// a consumer imports and the name that appears in an editor's tooltip; the
// shapes are identical across the three menu families because the rows are.
export type DropdownMenuItemProps = MenuRowProps;
export type DropdownMenuCheckboxItemProps = MenuCheckboxRowProps;
export type DropdownMenuRadioGroupProps = MenuRadioGroupProps;
export type DropdownMenuRadioItemProps = MenuRadioRowProps;
export type DropdownMenuLabelProps = MenuLabelProps;
export type DropdownMenuShortcutProps = MenuShortcutProps;
export type DropdownMenuGroupProps = MenuGroupProps;
export type DropdownMenuSubProps = MenuSubProps;
export type DropdownMenuSubTriggerProps = MenuSubTriggerProps;
export type DropdownMenuSubContentProps = MenuSubContentProps;
