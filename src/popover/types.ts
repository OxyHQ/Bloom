import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type {
  OverlayOpenProps,
  OverlaySurfaceProps,
  OverlayTriggerProps,
} from '../floating/types';

export type PopoverProps = React.PropsWithChildren<OverlayOpenProps>;
export type PopoverTriggerProps = OverlayTriggerProps;
export type PopoverContentProps = OverlaySurfaceProps;

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
