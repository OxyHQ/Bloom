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
  MenuSwatch,
  MenuSwatchRowProps,
  MenuSwatchState,
  OverlayTriggerProps,
} from '../floating/types';

export type DropdownMenuProps = React.PropsWithChildren<
  OverlayOpenProps & {
    /** Hover/focus previews preserve the trigger's primary click; arrows enter the menu. Native uses long press. */
    activation?: 'click' | 'hover';
    openDelay?: number;
    closeDelay?: number;
    /**
     * Where an open the OWNER makes from its own keys lands, as a desktop menu opened from the
     * keyboard does: `'first'` (or `'last'`) makes that enabled row active (web: focuses it).
     * Read on each open; omit it for an open by a pointer, which starts with no row active. The
     * menu's own trigger keys (web) need none: they ask for it themselves.
     */
    openFocus?: 'first' | 'last';
  }
>;
export type DropdownMenuTriggerProps = OverlayTriggerProps & {
  /** An independent primary press surface, composed around the same control after menu handlers. */
  pressTrigger?: React.ReactElement<OverlayTriggerProps>;
  /**
   * Whether the screen reader's focus comes back to the trigger as the menu closes (default
   * `true`). Read as it closes. `false` for a trigger that hands focus elsewhere itself: a system
   * menu opened with the pointer, whose choice gives the keyboard back to the window that had it,
   * as a Mac's menu bar extras do. Native only: on web the browser owns focus.
   */
  restoreFocus?: boolean;
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
export type DropdownMenuSwatchRowProps = MenuSwatchRowProps;
export type DropdownMenuSwatch = MenuSwatch;
export type DropdownMenuSwatchState = MenuSwatchState;
export type DropdownMenuSubProps = MenuSubProps;
export type DropdownMenuSubTriggerProps = MenuSubTriggerProps;
export type DropdownMenuSubContentProps = MenuSubContentProps;
