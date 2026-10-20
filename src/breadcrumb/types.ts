import type { BloomSize } from '../appearance/types';
import type { ReactElement, ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { ButtonIconComponent, ButtonProps } from '../button/types';
import type { OverlayTriggerProps } from '../floating/types';

export interface BreadcrumbProps {
  /** Explicit size, nearest BloomScope, then normal md. */
  size?: BloomSize;
  /** Scroll by default. Collapse keeps the final item visible and menus hidden ancestors. Custom-node labels fall back to scroll. */
  overflow?: 'scroll' | 'collapse';
  /** Accessible name for the hidden-ancestor menu. Defaults to localized "Show more". */
  overflowLabel?: string;
  /** `BreadcrumbItem` children. Chevron separators are inserted between them. */
  children: ReactNode;
  /**
   * Replaces the chevron between items — e.g. `"/"` directly, a `Text`, or an icon.
   * Hidden from assistive technology. The default chevron points the reading
   * direction (it mirrors in a right-to-left layout); a custom separator is
   * rendered as given.
   */
  separator?: ReactNode;
  /** Names the navigation landmark; `"Breadcrumb"` in English. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface BreadcrumbHoverMenu {
  /** Render callback receives the real menu state so data queries can remain lazy. */
  content: ReactNode | ((state: { open: boolean }) => ReactNode);
  label?: string;
  /** Preferred menu width, fitted to its viewport. Default 240. */
  width?: number;
  openDelay?: number;
  closeDelay?: number;
}

export interface BreadcrumbItemProps
  extends Pick<ButtonProps, 'disabled' | 'aria-expanded' | 'aria-haspopup'> {
  /** Wraps the existing Button, e.g. <PopoverTrigger asChild />. Keep this item a direct child for collapse fitting. */
  trigger?: ReactElement<OverlayTriggerProps>;
  /** Related navigation on hover/focus or native long press, without replacing the primary action. */
  hoverMenu?: BreadcrumbHoverMenu;
  /** Explicit size overrides the enclosing Breadcrumb/BloomScope. */
  size?: BloomSize;
  /** The label. */
  children?: ReactNode;
  /** Leading icon component (14/16/16/20px at xs/sm/md/lg), coloured with the item. */
  icon?: ButtonIconComponent;
  /**
   * A node before the icon and label, 6px from them — e.g. a 20px `Avatar` for
   * a workspace or member crumb. Not recoloured on hover.
   */
  leading?: ReactNode;
  /**
   * Makes the item a link. On web it renders a real `<a href>`; with `onPress`
   * as well, ordinary unmodified navigation is prevented and `onPress` runs instead
   * (router links). On native, pressing opens the URL unless `onPress` is set.
   */
  href?: string;
  /** Makes the item a button. */
  onPress?: () => void;
  /** The active page: darker text and aria-current. A label unless onPress, href or trigger supplies an action. */
  current?: boolean;
  /** Accessible name; defaults to a string `children`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}
