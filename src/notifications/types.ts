import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import type {
  NotificationCenterAvatar,
  NotificationCenterStatus,
} from '../notification-center/types';
import type { BloomStorageAdapter } from '../storage/create-storage';

/** The OS's answer: `denied` is a refusal, `undetermined` has not been asked. */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * The OS permission, as the app already has it (`expo-notifications`,
 * `@react-native-firebase/messaging`, the web `Notification` API). Bloom
 * carries no notification SDK; the adapter is two calls.
 */
export interface NotificationPermissionAdapter {
  getStatus(): Promise<NotificationPermissionStatus>;
  /** Shows the system prompt (a no-op answering `denied` where it cannot be asked again). */
  request(): Promise<NotificationPermissionStatus>;
}

export interface NotificationPermissionCopy {
  title?: string;
  body?: string;
  enableLabel?: string;
  laterLabel?: string;
}

export interface NotificationPermissionGateProps extends NotificationPermissionCopy {
  permission: NotificationPermissionAdapter;
  /**
   * Remembers that the person said "Not now". Default: `localStorage` on web,
   * memory elsewhere — a native app passes its `AsyncStorage`, or it asks again
   * at every launch.
   */
  storage?: BloomStorageAdapter;
  /** The key the dismissal is kept under. Default `notification-permission-prompt`. */
  storageKey?: string;
  /** Wait this long after mounting so the sheet is not the first thing that moves. Default 3000. */
  delayMs?: number;
  /**
   * After "Not now", ask again once this many ms have passed. Default
   * `Infinity`: never, since a person who declined has answered.
   */
  repromptAfterMs?: number;
  /** Also ask when the status is `denied`. Default `false`: most platforms will not show the prompt again. */
  askWhenDenied?: boolean;
  /** Set `false` to hold the prompt back (signed out, onboarding not finished). Default `true`. */
  enabled?: boolean;
  /** The permission was granted from the sheet: register the push token here. */
  onGranted?: () => void;
  /** The permission request came back refused. */
  onDenied?: () => void;
  /** The person chose "Not now". */
  onDismissed?: () => void;
  /** The glyph on the sheet. Default the bell. */
  icon?: BloomIconComponent;
}

/** One notification row. Timestamps are formatted by the caller (`formatRelativeTime`). */
export interface NotificationsScreenItem {
  id: string;
  title: string;
  description?: string;
  /** Pre-formatted, e.g. "2m". */
  timestamp?: string;
  unread?: boolean;
  /** Tints the icon disc when there is no avatar. Default `neutral`. */
  status?: NotificationCenterStatus;
  icon?: BloomIconComponent;
  /** A person instead of a disc. */
  avatar?: NotificationCenterAvatar;
  /** Overrides the row's announced name (default: title, description, time). */
  accessibilityLabel?: string;
}

/** The push row. Omit `push` to draw none (web without push, or an app that asks elsewhere). */
export interface NotificationsScreenPush {
  enabled: boolean;
  /** The switch was flipped. An async handler keeps the row busy until it settles. */
  onChange: (enabled: boolean) => void | Promise<void>;
  /** The OS refused and cannot be asked again: the switch is disabled and says why. */
  blocked?: boolean;
}

export interface NotificationsScreenProps {
  /** `undefined` while the first page has not arrived. */
  notifications: readonly NotificationsScreenItem[] | undefined;
  /** First load: draws a spinner instead of the empty state. */
  loading?: boolean;
  /** The load failed: draws the error state (and `onRetry`) when there is nothing to show. */
  error?: boolean;
  onRetry?: () => void;
  /** Pull-to-refresh (native). */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** The end of the list is near: load the next page. */
  onEndReached?: () => void;
  /** A further page is loading: a spinner under the last row. */
  loadingMore?: boolean;
  /** A row was pressed. Mark it read here (and navigate). */
  onNotificationPress?: (id: string) => void;
  /** "Mark all read" is drawn only when this is set and something is unread. */
  onMarkAllRead?: () => void;
  push?: NotificationsScreenPush;
  /** A heading above the list. Omit when the app's page header already says it. */
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Above the push row, scrolls with the list. */
  header?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
