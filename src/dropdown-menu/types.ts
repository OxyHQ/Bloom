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
  MenuSurfaceProps,
  OverlayTriggerProps,
} from '../floating/types';

export type DropdownMenuProps = React.PropsWithChildren<
  OverlayOpenProps & {
    /** Hover/focus previews preserve the trigger's primary click; arrows enter the menu. Native uses long press. */
    activation?: 'click' | 'hover';
    openDelay?: number;
    closeDelay?: number;
  }
>;
export type DropdownMenuTriggerProps = OverlayTriggerProps & {
  /** An independent primary press surface, composed around the same control after menu handlers. */
  pressTrigger?: React.ReactElement<OverlayTriggerProps>;
};
export type DropdownMenuContentProps = MenuSurfaceProps;

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
