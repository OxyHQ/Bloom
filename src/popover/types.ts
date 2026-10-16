import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { OverlayOpenProps, OverlaySurfaceProps, OverlayTriggerProps } from '../floating/types';

export type PopoverProps = React.PropsWithChildren<
  OverlayOpenProps & {
    /**
     * Whether an outside press is CAUGHT or passed through. Defaults to `true`.
     *
     * Modal (the default) lays a transparent backdrop over the app: the press
     * closes the popover and goes no further, so a popover opened inside a
     * dialog cannot dismiss the dialog with the same click.
     *
     * `false` lays down nothing. An outside press still closes the popover (when
     * `dismissible`), AND it reaches what is under it — for a picker beside a
     * field the user keeps typing and clicking in, such as an @-mention list,
     * where a backdrop made the first click anywhere only close the picker.
     * The same option `Menubar` and `HoverCard` use, under Radix's name.
     *
     * Web only: the native popover is a bottom sheet, which is always modal.
     */
    modal?: boolean;
  }
>;
export type PopoverTriggerProps = OverlayTriggerProps;
export type PopoverContentProps = OverlaySurfaceProps & {
  /** Standard optical surface or plain fill. Default surface. */
  material?: 'surface' | 'flat';
};

/** Shared by the panel's layout parts. */
interface PopoverPartProps {
  children?: React.ReactNode;
  /** Utility classes on the part's own node. */
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The panel's heading row — `flex items-center gap-2 px-2 pt-1`:
 * an optional `leading` (avatar, icon) beside a column of
 * `PopoverTitle` / `PopoverDescription`.
 */
export interface PopoverHeaderProps extends PopoverPartProps {
  leading?: React.ReactNode;
}

/** `text-body-medium text-text-primary`, or `text-secondary` for a group label. */
export interface PopoverTitleProps {
  children?: React.ReactNode;
  /**
   * `'secondary'` is the group-label colour panels use above a list
   * ("Users with access", "Local Folders"). Defaults to `'primary'`.
   */
  tone?: 'primary' | 'secondary';
  numberOfLines?: number;
  className?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

/** `text-body-regular text-text-secondary`. */
export interface PopoverDescriptionProps {
  children?: React.ReactNode;
  numberOfLines?: number;
  className?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

/** The panel's closing row — `flex items-center gap-3 px-2 pb-2`. */
export type PopoverFooterProps = PopoverPartProps;

/**
 * The full-bleed rule between a panel's sections —
 * `-mx-2.5 my-2.5 h-px bg-border-button-default`.
 */
export interface PopoverSeparatorProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
