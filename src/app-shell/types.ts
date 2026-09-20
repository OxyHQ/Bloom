import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { NotificationCenterItem, NotificationCenterTab } from '../notification-center/types';
import type { SidebarProps } from '../sidebar/types';

export type AppShellNavigationPlacement = 'auto' | 'bottom' | 'rail' | 'sidebar';
export interface AppShellNavigationItem {
  value: string;
  label: string;
  icon: ReactNode;
}
export interface AppShellProps {
  active?: boolean;
  navigation?: AppShellNavigationItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  navigationPlacement?: AppShellNavigationPlacement;
  navigationMaterial?: 'solid' | 'translucent';
  /** Bottom action follows scroll collapse by hiding (default), or remains visible. */
  bottomActionBehavior?: 'hide' | 'visible';
  /** external: the child list owns scrolling; avoids nested virtualized lists. */
  scroll?: 'auto' | 'external';
  /** Sidebar configuration, including card (detached, default) or docked surface. Also applies with navigation. */
  sidebar?: Omit<SidebarProps, 'mobile' | 'onClose'>;
  primaryAction?: import('../fab/types').FabProps;
  title?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  header?: ReactNode;
  children?: ReactNode;
  contentMaxWidth?: number;
  overlay?: ReactNode;
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
