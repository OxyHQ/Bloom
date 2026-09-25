import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { ButtonIconComponent } from '../button/types';

export interface BreadcrumbProps {
  /** `BreadcrumbItem` children. Chevron separators are inserted between them. */
  children: ReactNode;
  /**
   * Replaces the chevron between items — e.g. `"/"` as a `Text`, or an icon.
   * Hidden from assistive technology. The default chevron points the reading
   * direction (it mirrors in a right-to-left layout); a custom separator is
   * rendered as given.
   */
  separator?: ReactNode;
  /** Names the navigation landmark. Default `"Breadcrumb"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface BreadcrumbItemProps {
  /** The label. */
  children?: ReactNode;
  /** Leading icon component (16px), coloured with the item. */
  icon?: ButtonIconComponent;
  /**
   * A node before the icon and label, 6px from them — e.g. a 20px `Avatar` for
   * a workspace or member crumb. Not recoloured on hover.
   */
  leading?: ReactNode;
  /**
   * Makes the item a link. On web it renders a real `<a href>`; with `onPress`
   * as well, the default navigation is prevented and `onPress` runs instead
   * (router links). On native, pressing opens the URL unless `onPress` is set.
   */
  href?: string;
  /** Makes the item a button. */
  onPress?: () => void;
  /** The active page: not interactive, darker text, `aria-current="page"`. */
  current?: boolean;
  /** Accessible name; defaults to a string `children`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}
