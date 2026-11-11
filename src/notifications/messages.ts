import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * What the notifications family says that the notification center and the
 * common catalog do not: the permission prompt, the push row and the load
 * failure. The screen's heading, "Mark all read" and empty state come from
 * `NOTIFICATION_CENTER_MESSAGES`, "Try again" from the common catalog; props
 * still win over all of these.
 */
export interface NotificationsMessages {
  permissionTitle: string;
  permissionBody: string;
  /** The prompt's primary button. */
  enable: string;
  /** The prompt's dismissal. */
  later: string;
  /** The push toggle row's name. */
  pushTitle: string;
  pushDescription: string;
  /** Under the toggle when the system has denied permission and cannot be asked again. */
  pushBlocked: string;
  loadError: string;
}

export const NOTIFICATIONS_MESSAGES: MessageCatalog<NotificationsMessages> =
  defineMessages<NotificationsMessages>('NOTIFICATIONS_MESSAGES', {
    permissionTitle: 'Turn on notifications',
    permissionBody: 'Get notified about new activity, even when the app is closed.',
    enable: 'Enable notifications',
    later: 'Not now',
    pushTitle: 'Push notifications',
    pushDescription: 'Get alerts on this device.',
    pushBlocked: 'Notifications are turned off in system settings.',
    loadError: 'Couldn’t load notifications',
  });
