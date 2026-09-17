import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { NotificationCenterItem, NotificationCenterTab } from '../notification-center/types';
import type { SidebarProps } from '../sidebar/types';

/**
 * How the sidebar reaches a narrow screen (below `lg`):
 *
 * - `overlay`  a drawer over the page with a 40% black backdrop
 * - `reveal`   the sidebar waits beneath the page, which slides 272px right and
 *              rounds its corner to 32 as the rail scales in from 0.94
 */
export type AppShellDrawer = 'overlay' | 'reveal';

export interface AppShellProps {
  /**
   * The rail. Rendered in flow at `lg` and up (`sm` and up with
   * `variant: 'rail'`); below it, the same props drive the drawer (`mobile`,
   * and `flat` for `reveal`), always as the panel.
   */
  sidebar?: Omit<SidebarProps, 'mobile' | 'onClose' | 'flat'>;
  drawer?: AppShellDrawer;
  /** Heading over the content. */
  title?: string;
  /** Breadcrumb trail above the heading (a `Breadcrumb`). */
  breadcrumb?: ReactNode;
  /** Header actions on the right (`NotificationBell`, buttons). */
  actions?: ReactNode;
  /** Replaces the whole header. */
  header?: ReactNode;
  children?: ReactNode;
  /** The content column's max width. Defaults to 1300. */
  contentMaxWidth?: number;
  /** Floating extras rendered last, e.g. a `ProOfferCard`. */
  overlay?: ReactNode;
  /** Controlled drawer state (below `lg`). */
  drawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AppShellHeaderProps {
  title: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  /** Shows the hamburger (below `lg`); omit for no menu button. */
  onMenuPress?: () => void;
  /** Swaps the hamburger for a close glyph while the drawer is open. */
  menuOpen?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface NotificationBellProps {
  notifications?: NotificationCenterItem[];
  /** Overrides the count on the glyph; defaults to the unread items. */
  unreadCount?: number;
  onAction?: (notificationId: string, actionId: string) => void;
  onMarkAllRead?: () => void;
  defaultTab?: NotificationCenterTab;
  /** Popover width. Default 440. */
  width?: number;
  accessibilityLabel?: string;
  testID?: string;
}

export interface ProOfferCardProps {
  title: ReactNode;
  description: ReactNode;
  /** The call to action's label. */
  ctaLabel: string;
  onCtaPress?: () => void;
  /** Called by the close control; persisting the dismissal is the host's call. */
  onDismiss: () => void;
  /** The mark above the copy (an animated Pro logo). */
  logo?: ReactNode;
  /** Light across the top, masked out before it reaches the copy. */
  backdrop?: ReactNode;
  backdropHeight?: number;
  accessibilityLabel?: string;
  dismissLabel?: string;
  /**
   * `fixed` (default) anchors bottom-left of the viewport (web) / the nearest
   * positioned parent (native); `inline` renders in flow.
   */
  placement?: 'fixed' | 'inline';
  /** Delay before the card rises in, ms. Defaults to 1200. */
  enterDelay?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
