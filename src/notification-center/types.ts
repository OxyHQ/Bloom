import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ButtonProps } from '../button/types';

export type NotificationCenterTab = 'all' | 'mentions' | 'system';
export type NotificationCenterCategory = Exclude<NotificationCenterTab, 'all'> | 'activity';
export type NotificationCenterStatus = 'neutral' | 'information' | 'success' | 'error';

/** A Remix-style icon: `width` / `height` / `fill`. */
export type NotificationCenterIcon = ComponentType<{ width?: number; height?: number; fill?: string }>;

/**
 * Avatar tints for initials (`neutral`, `blue`, `lime`, `pink`),
 * resolved from the theme: `blue` is the accent ramp, `lime` the success ramp,
 * `pink` the accent's hue rotated to Tailwind pink.
 */
export type NotificationCenterAvatarColor = 'neutral' | 'blue' | 'lime' | 'pink';

export interface NotificationCenterAvatar {
  /** Photo URI. Wins over `initials`. */
  source?: string;
  /** Accessible name of the person, e.g. "Livia Saris". */
  name?: string;
  /** Fallback initials, e.g. "LS". */
  initials?: string;
  color?: NotificationCenterAvatarColor;
}

export interface NotificationCenterAction {
  id: string;
  label: string;
  /** Any `Button` appearance. Defaults to `subtle`. */
  appearance?: ButtonProps['appearance'];
  tone?: ButtonProps['tone'];
}

export interface NotificationCenterItem {
  id: string;
  category: NotificationCenterCategory;
  /** Grouping key ("Today", "Yesterday"); carried for hosts, not drawn. */
  group: string;
  title: string;
  description: string;
  /** Pre-formatted, e.g. "2m", "Mon". */
  timestamp: string;
  unread?: boolean;
  /** Tints the icon disc when there is no avatar. Defaults to `neutral`. */
  status?: NotificationCenterStatus;
  /** Replaces the status's default glyph inside the disc. */
  icon?: NotificationCenterIcon;
  /** A person instead of a disc. */
  avatar?: NotificationCenterAvatar;
  actions?: NotificationCenterAction[];
}

export interface NotificationCenterProps {
  notifications?: NotificationCenterItem[];
  /** Uncontrolled initial tab. Defaults to `all`. */
  defaultTab?: NotificationCenterTab;
  /** Controlled tab. */
  tab?: NotificationCenterTab;
  onTabChange?: (tab: NotificationCenterTab) => void;
  /** An action button was pressed; the notification is marked read locally first. */
  onAction?: (notificationId: string, actionId: string) => void;
  /** "Mark all read" was pressed; every unread item is marked read locally first. */
  onMarkAllRead?: () => void;
  /** Defaults to "Notifications". */
  title?: string;
  /** Empty-state headline. Defaults to "You’re all caught up." */
  emptyMessage?: string;
  /** Empty-state supporting line. Defaults to "New activity will appear here when it arrives." */
  emptyDescription?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
