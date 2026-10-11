import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string `Notification` announces, in each Bloom language. A
 * caller's `closeLabel` still wins.
 */
export interface NotificationMessages {
  /** The close button's name. */
  dismiss: string;
}

export const NOTIFICATION_MESSAGES: MessageCatalog<NotificationMessages> =
  defineMessages<NotificationMessages>('NOTIFICATION_MESSAGES', {
    dismiss: 'Dismiss notification',
  });
