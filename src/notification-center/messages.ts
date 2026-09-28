import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { NotificationCenterTab } from './types';

/**
 * Every fixed string the notification center draws or announces, in each
 * Bloom language. `title`, `emptyMessage` and `emptyDescription` props still
 * win over their entries here.
 */
export interface NotificationCenterMessages {
  title: string;
  emptyMessage: string;
  emptyDescription: string;
  /** The header's count line at zero. */
  noUnread: string;
  /** The header's count line above zero. */
  unread: (count: number) => string;
  markAllRead: string;
  /** The tab strip's name. */
  category: string;
  tabs: Record<NotificationCenterTab, string>;
  /** Names a row's unread dot. */
  unreadDot: string;
}

export const NOTIFICATION_CENTER_MESSAGES: MessageCatalog<NotificationCenterMessages> = defineMessages<NotificationCenterMessages>('NOTIFICATION_CENTER_MESSAGES', {
  title: 'Notifications',
  emptyMessage: 'You’re all caught up.',
  emptyDescription: 'New activity will appear here when it arrives.',
  noUnread: 'No unread notifications',
  unread: (n) => plural('en', n, { other: '{n} unread' }),
  markAllRead: 'Mark all read',
  category: 'Notification category',
  tabs: { all: 'All', mentions: 'Mentions', system: 'System' },
  unreadDot: 'Unread',
});
